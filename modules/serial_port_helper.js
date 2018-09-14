const SerialPort = require("serialport");

function printPortList() {
  SerialPort.list(function(err, result) {
    if(err) {
      throw err;
    }
    console.log(result);
  })
}

module.exports = { printPortList }
