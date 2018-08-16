const SerialPort = require("serialport");
const EcrData = require('./EcrData');
const ECR_CONFIG = require('./EcrConfig');

let port = new SerialPort('/dev/tty.usbserial-FT0KF2AH', ECR_CONFIG.PORT_SETTING);

port.on('error', function(err, callback) {
  console.log(err);
  closePort();
  callback && callback();
})

async function call() {
  try {
    let data = await EcrData.PackTransactionData();
    await sendData(port, data);
    await ReceiveData();
    closePort();
  } catch(err) {
    port.emit('error', err)
    return Promise.reject(err);
  }
}

// 將交易資料發送到端末機(EDC)
function sendData(port, data) {
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
    let receivArray = []

    let ackHandler = (data) => {
      receivArray.push(data)
      if (Buffer.concat(receivArray).length === 2) {
        if (EcrData.checkACK(Buffer.concat(receivArray))) {
          port.removeListener('data', ackHandler);
          clearTimeout(timeout);
          console.log('EDC回傳ACK');
          return resolve('Receive ACK');
        } else {
          port.removeListener('data', ackHandler);
          clearTimeout(timeout);
          console.log(receivArray);
          return reject('ACK WRONG');
        }
      }
    }

    port.on('data', ackHandler)
  })
}

// 接收端末機(EDC) responce
function ReceiveData() {
  return new Promise((resolve, reject) => {
    console.log('等待交易結果...')
    // timeout60秒
    let timeout = setTimeout(() => {
      return reject('操作逾時');
    }, 60000)

    let receivArray = []

    let responseHandler = (data) => {
      receivArray.push(data);
      console.log('=================')
      console.log(data)
      if (data[data.length - 2] === 3) {
        receivBuffer = Buffer.concat(receivArray);
        console.log('EDC回傳response');
        console.log(receivBuffer.slice(1, -2).toString());
        console.log(receivBuffer.slice(1, -2).toString().length);
        // check LRC
        console.log('Check LRC ....')
        if (checkLrc(receivBuffer.slice(1, -1), receivBuffer[receivBuffer.length - 1])) {
          // 移除監聽與timeout
          port.removeListener('data', responseHandler)
          clearTimeout(timeout);
          sendAck();
          console.log('LRC correct');
          return resolve();
        } else {
          // TODO retry 3次
          sendNak();
          console.log('LRC wrong!');
          receivArray = []
          // return reject('LRC wrong!')
        }
      }
    }
    port.on('data', responseHandler);
  })
}

// 回傳ACK
function sendAck() {
  let ack = Buffer.from([6]);
  data = Buffer.concat([ack, ack])
  port.write(data, (err) => {

  })
}

// 回傳NAK
function sendNak() {
  let nak = Buffer.from([21]);
  data = Buffer.concat([nak, nak])
  port.write(data, (err) => {

  })
}

function checkLrc(buffer, receiveLrc) {
  let lrc = 0;
  for(byte of buffer) {
    lrc ^= byte
  }
  return (lrc == receiveLrc);
}

function closePort() {
  if (port.isOpen) {
    port.close();
    console.log('port closed');
  }
}

////////////////////////////
async function test() {
  try {
    await call();
    console.log('End')
    return Promise.resolve();
  } catch(err) {
    return Promise.reject(`ERROR!!!!! ${err}`);
  }
  
}

test().catch((err) => console.log(err))


// console.log(Buffer.from([6]).readUIntBE(0, 1))
