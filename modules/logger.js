const fs = require('fs');
const path = require('path');
const moment = require('moment-timezone');


// error logs

function error(action, message) {
  console.log(message);
  fs.appendFileSync(error_log_path(), error_message('ERROR', action, message));
}

function warn(action, message) {
  console.log(message);
  fs.appendFileSync(error_log_path(), error_message('WARN ', action, message));
}

// process logs

function log(message) {
  console.log(message);
  fs.appendFileSync(log_path(), process_message(message));
}

// help methods

function process_message(message) {
  let full_message = `[${currentDateTime()}] ${message} \r\n`
  return full_message;
}

function error_message(level, action, message) {
  let full_message = `${level} [${currentDateTime()}][${action}] ${message} \r\n`
  return full_message;
}

// datetime

function currentDateTime() {
  return moment().tz("Asia/Taipei").format('YYYY-MM-DD HH:mm:ss ZZ');
  // return (new Date()).toISOString().replace(/T/, ' ').replace(/\..+/, '')
}

function currentDate() {
  return moment().tz("Asia/Taipei").format('YYYY-MM-DD');
}

// log path

function log_path() {
  if(process.env.NODE_ENV === 'development') {
    return path.join(__dirname, `../logs/process-logs/dev-${currentDate()}.txt`)
  } else {
    return path.join(process.execPath, `../logs/process-logs/${currentDate()}.txt`)
  }
}

function error_log_path() {
  if(process.env.NODE_ENV === 'development') {
    return path.join(__dirname, `../logs/error-logs/dev-${currentDate()}.txt`)
  } else {
    return path.join(process.execPath, `../logs/error-logs/${currentDate()}.txt`)
  }
}

module.exports = { log, error, warn };
