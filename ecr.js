const SerialPort = require("serialport");
const fs = require('fs');


const STX = Buffer.from([2]);

const ETX = Buffer.from([3]);

const ACK = Buffer.from([6]);

const NAK = Buffer.from([21]);

async function call() {
  let port = new SerialPort('/dev/tty.usbserial-FT0KF2AH', { 
    autoOpen: false,
  });

  let data = await PackSendBuffer();
  try {
    await sendData(port, data);
    let response = await ReceiveData();
    // TODO 處理 response
  } catch(error) {
    console.log(error);
  }
  port.close();
}

// 將交易資料發送到端末機(EDC)
function sendData(port, data) {
  return new Promise((resolve, reject) => {
    // send request to EDC
    port.open(function(err) {
      console.log('port open ...')

      if (err) {
        return reject(err);
      }

      port.write(data, (err) => {
        if (err) {
          return reject(err);
        }
        console.log(`send request data: ${data}`)
      });
    });

    // TODO 這邊要有timeout

    // listen EDC 是否回傳ACK
    port.once('data', (data) => {
      if (checkACK(data)) {
        return resolve('Receive ACK');
      } else {
        return reject('ACK WRONG'); // TODO 沒收到ACK的處理
      }
    });

  })
}

// 接收端末機(EDC) responce
function ReceiveData() {
  return new Promise((resolve, reject) => {
    // TODO 這邊要有timeout

    port.once('data', (data) => {
      // TODO 收到response ....
    })
  })
}


async function PackSendBuffer() {
  console.log('Preparing transaction data...')
  const data = await getData();

  // 計算LRC
  let lrc = calcLrc(Buffer.concat([data, ETX]));

  // 送出的request為 <STX>[DATA]<ETX><LRC>
  let sendBuffer = Buffer.concat([STX, data, ETX, lrc]);

  return sendBuffer;
}

function getData() {
  return new Promise((resolve, reject) => {
    fs.readFile('./in.dat', (err, data) => {
      if(err) {
        return reject(err);
      } else {
        return resolve(data);
      }
    });
  });
};

// Exclusive-Or all bytes of data & ETX (不包含 STX)
function calcLrc(buffer) {
  let lrc = 0;
  for(byte of buffer) {
    lrc ^= byte
  }
  console.log(`LRC is ${lrc}`);
  return Buffer.from([lrc]);
}

function checkACK(response) {
  return {
    Buffer.compare(response[0], ACK) && Buffer.compare(response[1], ACK);
  }
}


call();
