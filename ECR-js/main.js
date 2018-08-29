const SerialPort = require("serialport");
const { Transaction } = require('./EcrData');
const ECR_CONFIG = require('./EcrConfig');

let port = new SerialPort('/dev/tty.usbserial-FT0KF2AH', ECR_CONFIG.PORT_SETTING);

port.on('error', function(err, callback) {
  console.log(err.stack);
  closePort();
  callback && callback();
})

async function call(data) {
  try {
    await sendData(port, data);
    let responseObject = await ReceiveData();
    closePort();
    return Promise.resolve(responseObject);
  } catch(err) {
    port.emit('error', err);
    return Promise.reject(err);
  }
}

// 將交易資料發送到端末機(EDC)
async function sendData(port, data) {
  return new Promise((resolve, reject) => {
    var timeout;
    port.open(function(err) {
      console.log('port opening ...')
      if (err) {
        return reject(err);
      }

      // send request to EDC
      port.write(data, (err) => {
        if (err) {
          return reject(err);
        }
        console.log(`send request data: ${data.toString('ascii')}`);
        console.log('Waiting ACK response...');

        // timeout60秒
        timeout = setTimeout(() => {
          reject('操作逾時');
        }, 60000)

      });
    });

    // check EDC 是否回傳ACK
    // TODO 如果一秒內沒回回傳先繼續往下做
    let receiveArray = []

    let ackHandler = (data) => {
      receiveArray.push(data)
      if (Buffer.concat(receiveArray).length === 2) {
        if (checkAck(Buffer.concat(receiveArray))) {
          port.removeListener('data', ackHandler);
          clearTimeout(timeout);
          console.log('EDC回傳ACK');
          return resolve('Receive ACK');
        } else {
          port.removeListener('data', ackHandler);
          clearTimeout(timeout);
          console.log(receiveArray);
          return reject('ACK WRONG');
        }
      }
    }

    port.on('data', ackHandler)
  })
}

// 接收端末機(EDC) response
function ReceiveData() {
  return new Promise((resolve, reject) => {
    console.log('等待交易結果...')
    // timeout60秒
    let timeout = setTimeout(() => {
      return reject('操作逾時');
    }, 60000)

    let receiveArray = []
    let retry = 0

    // TODO
    async function responseHandler(data) {
      try {
        receiveArray.push(data);
        console.log(data)
        // receive data until ETX
        if (data[data.length - 2] === 3) {
          receiveBuffer = Buffer.concat(receiveArray);
          console.log('EDC回傳response');
          console.log('Check LRC ....')
          // check LRC & check 資料長度
          if (checkLrc(receiveBuffer) && checkDataLength(receiveBuffer)) {
            console.log('LRC correct');
            console.log('Data length correct');
            let responseStr = receiveBuffer.slice(1, -2).toString('ascii')
            // 移除監聽與timeout
            port.removeListener('data', responseHandler)
            clearTimeout(timeout);
            await sendAck();
            // 解析 response
            transaction_response = new Transaction();
            transaction_response.parseResponse(responseStr)
            return resolve(transaction_response);
          } else {;
            await sendNak();
            console.log('LRC或資料長度錯誤，重新接收資料...')
            retry += 1
            receiveArray = []
            if (retry === 2) {
              await sendNak();
              port.removeListener('data', responseHandler)
              clearTimeout(timeout);
              return reject('LRC或資料長度錯誤');
            }
          }
        };
      } catch(err) {
        reject(err);
      }
    };
    port.on('data', responseHandler);
  })
}

// 回傳ACK
function sendAck() {
  return new Promise((resolve, reject) => {
    let ack = Buffer.from([6]);
    data = Buffer.concat([ack, ack])
    port.write(data, (err) => {
      if (err) {
        return reject(err);
      }
      resolve();
    })
  })
}

// 回傳NAK
function sendNak() {
  return new Promise((resolve, reject) => {
    let nak = Buffer.from([21]);
    data = Buffer.concat([nak, nak])
    port.write(data, (err) => {
      if (err) {
        return reject(err);
      }
      resolve();
    })
  })
}

// 確認回傳的LRC正確
function checkLrc(receiveBuffer) {
  let receiveLrc = receiveBuffer.readUIntBE(receiveBuffer.length - 1, 1);
  let data = receiveBuffer.slice(1, -1);
  let lrc = 0;

  console.log(`EDC回傳Lrc ${receiveLrc}`)

  for(byte of data) {
    lrc ^= byte
  }
  console.log(`Lrc should be ${lrc}`)
  return (lrc === receiveLrc);
}

// 確認資料長度正確
function checkDataLength(data) {
  console.log(`Data length is ${data.length}`)
  return data.length === 603
}

// 確認收到ACK
function checkAck(response) {
  return (response.readUIntBE(0,1) === 6 && response.readUIntBE(1,1) === 6)
}

function closePort() {
  if (port.isOpen) {
    port.close();
    console.log('port closed');
  }
}

////////////////////////////
// async function test() {
//   try {
//     let transaction = new Transaction();
//     transaction.refund('000000110100', '123456', 'reference012');
//     console.log(transaction.data)
//     let data = await transaction.PackTransactionData();
//     let response = await call(data);
//     console.log('End')
//     return Promise.resolve(response);
//   } catch(err) {
//     return Promise.reject(`ERROR!!!!! ${err}`);
//   }
  
// }

// test(

// ).then((response) => {
//   console.log(response.data)
// }).catch((err) => console.log(err))


// console.log(Buffer.from([6]).readUIntBE(0, 1))

exports.call = call;
