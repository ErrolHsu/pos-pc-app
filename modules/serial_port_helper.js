const SerialPort = require('serialport');

function printPortList() {
  SerialPort.list((err, result) => {
    if (err) {
      throw err;
    }
    console.log('========================PORT LIST========================');
    console.log(result);
    console.log('=========================================================');
  });
}

module.exports = { printPortList };
