const fs = require('fs');
const path = require('path');
const moment = require('moment-timezone');
const config = require('../configs/config');
const path_helper = require('./path_helper');

const log_path = path_helper.join(`logs/process-logs/${config.get('env')}-${currentDate()}.txt`);
const error_log_path = path_helper.join(`logs/error-logs/${config.get('env')}-${currentDate()}.txt`);

// error logs

function error(action, message) {
  console.log(message);
  fs.appendFileSync(log_path, process_message(message));
  fs.appendFileSync(error_log_path, error_message('ERROR', action, message));
}

function warn(action, message) {
  console.log(message);
  fs.appendFileSync(log_path, process_message(message));
  fs.appendFileSync(error_log_path, error_message('WARN ', action, message));
}

// process logs

function log(message) {
  console.log(message);
  fs.appendFileSync(log_path, process_message(message));
}

// help methods

function process_message(message) {
  const full_message = `[${currentDateTime()}] ${message} \r\n`;
  return full_message;
}

function error_message(level, action, message) {
  const full_message = `${level} [${currentDateTime()}][${action}] ${message} \r\n`;
  return full_message;
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
