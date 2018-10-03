const fs = require('fs');
const SerialPort = require('serialport');
const { Transaction } = require('./EcrData');
const ECR_CONFIG = require('./EcrConfig');
const logger = require('../modules/logger');
const config = require('../configs/config');

const ECR_TIMEOUT = config.get('ecr.timeout');
const pathHelper = require('../modules/path_helper');

const port = new SerialPort(ECR_CONFIG.portName, ECR_CONFIG.PORT_SETTING);
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

port.on('error', async (err, callback) => {
  await wait(5000);
  port.flush(() => {
    closePort();
  });
  callback && callback();
});

async function call(transaction) {
  // 開卡機測試模式時直接回假資料
  if (config.get('ecr.mode') === 'test' || config.get('env') === 'test') {
    const responseObject = await getMockResponse(transaction);
    return responseObject;
  }

  if (port.isOpen) {
    throw new Error('上筆交易尚未完成...');
  }

  try {
    const data = transaction.PackTransactionData();
    await openPort();
    await sendTransactionData(data);
    const responseObject = await ReceiveData();
    closePort();
    return responseObject;
  } catch (err) {
    port.emit('error', err);
    throw err;
  }
}

// Promise
// 將交易資料發送到端末機(EDC)
async function sendTransactionData(transactionData) {
  await send(transactionData);

  return new Promise((resolve, reject) => {
    let timeout;

    function ackTimeout() {
      // 如果一秒內沒收到ACK/NAK先繼續往下做
      timeout = setTimeout(() => {
        // 移除 ackHandler
        port.removeListener('data', ackHandler);
        logger.warn('ackTimeout', '未收到端末機ACK');
        return resolve();
      }, 1000);
    }

    ackTimeout();

    // check EDC 是否回傳ACK
    let receiveArray = [];
    let retry = 0;

    async function ackHandler(data) {
      receiveArray.push(data);

      if (Buffer.concat(receiveArray).length !== 2) {
        return;
      }

      // 收到ACK
      if (checkAck(Buffer.concat(receiveArray))) {
        // 移除監聽與timeout
        port.removeListener('data', ackHandler);
        clearTimeout(timeout);
        console.log('EDC回傳ACK');
        return resolve('Receive ACK');
      // 收到NAK
      }
      if (retry === 3) {
        // 移除監聽與timeout
        port.removeListener('data', ackHandler);
        clearTimeout(timeout);
        logger.warn('ackHandler', '端末機拒絕交易');
        return reject(new Error('EDC拒絕交易。'));
      }
      logger.warn('ackHandler', '端末機回傳NAK');
      retry += 1;
      receiveArray = [];
      clearTimeout(timeout);
      await wait(1000);
      console.log('retry');
      await send(transactionData);
      ackTimeout();
    }

    port.on('data', ackHandler);
  });
}

// Promise
// 接收端末機(EDC) response
function ReceiveData() {
  return new Promise((resolve, reject) => {
    console.log('等待交易結果...');
    // timeout60秒
    const timeout = setTimeout(() => {
      port.removeListener('data', responseHandler);
      logger.warn('ReceiveData', '交易逾時');
      return reject(new Error('交易逾時'));
    }, ECR_TIMEOUT);

    let receiveArray = [];
    let retry = 0;

    async function responseHandler(data) {
      try {
        receiveArray.push(data);
        console.log(data);

        let receiveBuffer = Buffer.concat(receiveArray);

        // receive data until ETX
        if (receiveBuffer[receiveBuffer.length - 2] !== 3) {
          return;
        }

        // 送NAK給EDC測試機時 會一次收到1206byte，不知道為何
        if (receiveBuffer.length === 1206) {
          retry += (receiveBuffer.length / 603) - 1;
          console.log(`retry is ${retry}`);
          receiveBuffer = receiveBuffer.slice(603, 1206);
        }

        console.log(receiveBuffer.length);
        logger.log('EDC回傳response');
        logger.log('Check LRC ....');

        // check LRC & check 資料長度
        // 資料正確
        if (checkLrc(receiveBuffer) && checkDataLength(receiveBuffer)) {
        // if (retry === 2) {
          logger.log('LRC correct');
          logger.log('Data length correct');
          logger.log(`response data: ${receiveBuffer.toString('ascii')}`);
          const responseStr = receiveBuffer.slice(1, -2).toString('ascii');
          // 移除監聽與timeout
          port.removeListener('data', responseHandler);
          clearTimeout(timeout);
          await sendAck();
          // 解析 response
          const transactionResponse = new Transaction();
          transactionResponse.parseResponse(responseStr);
          logger.log(JSON.stringify(transactionResponse, null, 4));
          return resolve(transactionResponse);
        // LRC或資料長度錯誤
        }
        if (retry === 2) {
          await sendNak();
          port.removeListener('data', responseHandler);
          clearTimeout(timeout);
          logger.warn('responseHandler', 'LRC或資料長度錯誤，無法確認交易結果。');
          return reject(new Error('LRC或資料長度錯誤，無法確認交易結果。'));
        }
        logger.warn('responseHandler', 'LRC或資料長度錯誤，重新接收資料...');
        retry += 1;
        receiveArray = [];
        await sendNak();
      } catch (err) {
        return reject(err);
      }
    }
    port.on('data', responseHandler);
  });
}

// Promise
// write data to EDC
function send(data) {
  return new Promise((resolve, reject) => {
    port.write(data, (err) => {
      if (err) {
        logger.error('send', err.message);
        return reject(err);
      }
      logger.log(`send request data: ${data.toString('ascii')}`);
      logger.log('Waiting ACK response...');
      return resolve();
    });
  });
}

// Promise
// 回傳ACK
function sendAck() {
  return new Promise((resolve, reject) => {
    const ack = Buffer.from([6]);
    const data = Buffer.concat([ack, ack]);
    port.write(data, (err) => {
      if (err) {
        logger.error('sendAck', err.message);
        return reject(err);
      }
      return resolve();
    });
  });
}

// Promise
// 回傳NAK
function sendNak() {
  return new Promise((resolve, reject) => {
    const nak = Buffer.from([21]);
    const data = Buffer.concat([nak, nak]);
    port.write(data, (err) => {
      if (err) {
        logger.error('sendNak', err.message);
        return reject(err);
      }
      logger.log('send NAK to EDC');
      return resolve();
    });
  });
}

// 確認回傳的LRC正確
function checkLrc(receiveBuffer) {
  const receiveLrc = receiveBuffer.readUIntBE(receiveBuffer.length - 1, 1);
  const data = receiveBuffer.slice(1, -1);
  let lrc = 0;

  logger.log(`EDC回傳Lrc ${receiveLrc}`);

  for (const byte of data) {
    lrc ^= byte;
  }
  logger.log(`Lrc should be ${lrc}`);
  return (lrc === receiveLrc);
}

// 確認資料長度正確
function checkDataLength(data) {
  logger.log(`Data length is ${data.length}`);
  return data.length === 603;
}

// 確認收到ACK
function checkAck(response) {
  return (response.readUIntBE(0, 1) === 6 && response.readUIntBE(1, 1) === 6);
}

// Promise
function openPort() {
  return new Promise((resolve, reject) => {
    // open port
    port.open((err) => {
      if (err) {
        logger.error('openPort', err.message);
        return reject(err);
      }
      logger.log('port opening ...');
      return resolve();
    });
  });
}

function closePort() {
  if (port.isOpen) {
    port.flush(() => {
      port.close();
      logger.log('port closed');
    });
  }
}

// 回傳測試假資料
function getMockResponse(transaction) {
  return new Promise((resolve, reject) => {
    let fileName;
    console.log(transaction.data.transType);
    switch (transaction.data.transType) {
      case '01':
        fileName = 'sale.txt';
        break;
      case '02':
        fileName = 'refund.txt';
        break;
      case '30':
        fileName = 'cancel.txt';
        break;
      case '04':
        fileName = 'installment.txt';
        break;
      default:
        fileName = 'cancel.txt';
        break;
    }

    const filePath = pathHelper.join(`mock_data/${fileName}`);
    console.log(filePath);
    fs.readFile(filePath, 'ascii', (err, responseStr) => {
      const transactionResponse = new Transaction();
      transactionResponse.parseResponse(responseStr);
      logger.log('回傳測試假資料');
      logger.log(JSON.stringify(transactionResponse, null, 4));
      setTimeout(() => resolve(transactionResponse));
    });
  });
}

exports.call = call;
