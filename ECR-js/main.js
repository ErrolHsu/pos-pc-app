const SerialPort = require("serialport");
const { Transaction } = require('./EcrData');
const ECR_CONFIG = require('./EcrConfig');
const logger = require('../modules/logger');

let port = new SerialPort('/dev/tty.usbserial-FT0KF2AH', ECR_CONFIG.PORT_SETTING);
let wait = ms => new Promise(resolve => setTimeout(resolve, ms));

port.on('error', function(err, callback) {
  closePort();
  callback && callback();
})

async function call(data) {
  try {
    await openPort();
    await sendTransactionData(port, data);
    let responseObject = await ReceiveData();
    closePort();
    return Promise.resolve(responseObject);
  } catch(err) {
    port.emit('error', err);
    return Promise.reject(err);
  }
}

// Promise
// 將交易資料發送到端末機(EDC)
async function sendTransactionData(port, data) {
  await send(data);

  return new Promise((resolve, reject) => {
    let ack_timeout;

    function ackTimeout() {
      // 如果一秒內沒收到ACK/NAK先繼續往下做
      ack_timeout = setTimeout(() => {
        // 移除 ackHandler
        port.removeListener('data', ackHandler);
        logger.warn('ackTimeout' , '未收到端末機ACK');
        return resolve();
      }, 1000);
    }

    ackTimeout();

    // check EDC 是否回傳ACK
    let receiveArray = [];
    let retry = 0;

    async function ackHandler(data) {
      receiveArray.push(data)
      if (Buffer.concat(receiveArray).length === 2) {
        // 收到ACK
        if (checkAck(Buffer.concat(receiveArray))) {
          // 移除監聽與timeout
          port.removeListener('data', ackHandler);
          clearTimeout(ack_timeout);
          console.log('EDC回傳ACK');
          return resolve('Receive ACK');
        // 收到NAK
        } else {
          if (retry === 3) {
            // 移除監聽與timeout
            port.removeListener('data', ackHandler);
            clearTimeout(ack_timeout);
            logger.warn('ackHandler' , '端末機拒絕交易');
            return reject('EDC拒絕交易。');
          } else {
            logger.warn('ackHandler' , '端末機回傳NAK');
            retry += 1;
            receiveArray = [];
            clearTimeout(ack_timeout);
            await wait(1000);
            await send(data);
            ackTimeout();
          }
        }
      }
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
    let timeout = setTimeout(() => {
      port.removeListener('data', responseHandler);
      logger.warn('ReceiveData' , '交易逾時');
      return reject('交易逾時');
    }, 60000);

    let receiveArray = [];
    let retry = 0;

    async function responseHandler(data) {
      try {
        receiveArray.push(data);
        console.log(data);
        // receive data until ETX
        if (data[data.length - 2] === 3) {
          receiveBuffer = Buffer.concat(receiveArray);
          // 送NAK給EDC時會一次收到1206byte，不知道為何..
          if (receiveBuffer.length > 603) {
            retry += (receiveBuffer.length / 603) - 1
            receiveBuffer = receiveBuffer.slice(0, 603);
            console.log('=================================')
            console.log(receiveBuffer)
            console.log('=================================')
          }
          logger.log('EDC回傳response');
          logger.log('Check LRC ....');
          // check LRC & check 資料長度
          if (checkLrc(receiveBuffer) && checkDataLength(receiveBuffer)) {
            logger.log('LRC correct');
            logger.log('Data length correct');
            let responseStr = receiveBuffer.slice(1, -2).toString('ascii');
            // 移除監聽與timeout
            port.removeListener('data', responseHandler);
            clearTimeout(timeout);
            await sendAck();
            // 解析 response
            transaction_response = new Transaction();
            transaction_response.parseResponse(responseStr);
            return resolve(transaction_response);
          // LRC或資料長度錯誤
          } else {
            if (retry === 3) {
              await sendNak();
              port.removeListener('data', responseHandler);
              clearTimeout(timeout);
              logger.warn('responseHandler' , 'LRC或資料長度錯誤，交易取消');
              return reject('LRC或資料長度錯誤，交易取消');
            } else {
              logger.warn('responseHandler' , 'LRC或資料長度錯誤，重新接收資料...');
              retry += 1;
              receiveArray = [];
              await sendNak();
            }
          }
        };
      } catch(err) {
        return reject(err);
      }
    };
    port.on('data', responseHandler);
  });
}

// Promise
// write data to EDC
function send(data) {
  return new Promise((resolve, reject) => {
    port.write(data, (err) => {
      if (err) {
        logger.error('send' , err.message);
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
    let ack = Buffer.from([6]);
    data = Buffer.concat([ack, ack]);
    port.write(data, (err) => {
      if (err) {
        logger.error('sendAck' , err.message);
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
    let nak = Buffer.from([21]);
    data = Buffer.concat([nak, nak]);
    port.write(data, (err) => {
      if (err) {
        logger.error('sendNak' , err.message);
        return reject(err);
      }
      logger.log('send NAK to EDC')
      return resolve();
    });
  });
}

// 確認回傳的LRC正確
function checkLrc(receiveBuffer) {
  let receiveLrc = receiveBuffer.readUIntBE(receiveBuffer.length - 1, 1);
  let data = receiveBuffer.slice(1, -1);
  let lrc = 0;

  logger.log(`EDC回傳Lrc ${receiveLrc}`);

  for(byte of data) {
    lrc ^= byte;
  }
  logger.log(`Lrc should be ${lrc}`)
  return (lrc === receiveLrc);
}

// 確認資料長度正確
function checkDataLength(data) {
  logger.log(`Data length is ${data.length}`);
  return data.length === 603;
}

// 確認收到ACK
function checkAck(response) {
  return (response.readUIntBE(0,1) === 6 && response.readUIntBE(1,1) === 6);
}

// Promise
function openPort() {
  return new Promise((resolve, reject) => {
    // open port
    port.open(function(err) {
      if (err) {
        logger.error('openPort' , err.message);
        return reject(err);
      }
      logger.log('port opening ...');
      return resolve();
    });
  });
}

function closePort() {
  if (port.isOpen) {
    port.close();
    logger.log('port closed');
  }
}

exports.call = call;
