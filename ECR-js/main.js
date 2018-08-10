const SerialPort = require("serialport");
const EcrData = require('./EcrData');

let port = new SerialPort('/dev/tty.usbserial-FT0KF2AH', {
  autoOpen: false,
  baudRate: 9600,
  dataBits: 7,
  stopBits: 1,
  parity: 'even',

});

port.on('error', function(err, callback) {
  console.log(err);
  closePort();
  callback && callback();
})

async function call() {
  try {
    let data = EcrData.PackTransactionData();
    await sendData(port, data);
    let response = await ReceiveData();
    console.log(response.toString());
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
        console.log(`send request data: ${data}`);
        console.log('Waiting ACK response...');

        // timeout60秒
        timeout = setTimeout(() => {
          reject('操作逾時');
        }, 60000)

      });
    });

    // check EDC 是否回傳ACK
    let receivArray = []

    let ackHandler = (data) => {
      receivArray.push(data)
      if (Buffer.concat(receivArray).length === 2) {
        if (EcrData.checkACK(data)) {
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
      receivArray.push(data)
      if (data[data.length - 2] === 3) {
        sendAck();
        receivBuffer = Buffer.concat(receivArray)
        console.log(receivBuffer.length);
        port.removeListener('data', responseHandler)
        clearTimeout(timeout);
        return resolve(receivBuffer)
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

test().then(() => {
  test();
}).catch((err) => console.log(err))


// console.log(Buffer.from([6]).readUIntBE(0, 1))
