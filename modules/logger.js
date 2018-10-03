const fs = require('fs');
const moment = require('moment-timezone');
const config = require('../configs/config');
const pathHelper = require('./path_helper');

const logPath = pathHelper.join(`logs/process-logs/${config.get('env')}-${currentDate()}.txt`);
const errorLogPath = pathHelper.join(`logs/error-logs/${config.get('env')}-${currentDate()}.txt`);

// error logs

function error(action, message) {
  console.log(message);
  fs.appendFileSync(logPath, processMessage(message));
  fs.appendFileSync(errorLogPath, errorMessage('ERROR', action, message));
}

function warn(action, message) {
  console.log(message);
  fs.appendFileSync(logPath, processMessage(message));
  fs.appendFileSync(errorLogPath, errorMessage('WARN ', action, message));
}

// process logs

function log(message) {
  console.log(message);
  fs.appendFileSync(logPath, processMessage(message));
}

// help methods

function processMessage(message) {
  const fullMessage = `[${currentDateTime()}] ${message} \r\n`;
  return fullMessage;
}

function errorMessage(level, action, message) {
  const fullMessage = `${level} [${currentDateTime()}][${action}] ${message} \r\n`;
  return fullMessage;
}

// datetime

function currentDateTime() {
  return moment().tz('Asia/Taipei').format('YYYY-MM-DD HH:mm:ss ZZ');
  // return (new Date()).toISOString().replace(/T/, ' ').replace(/\..+/, '')
}

function currentDate() {
  return moment().tz('Asia/Taipei').format('YYYY-MM-DD');
}

module.exports = { log, error, warn };
