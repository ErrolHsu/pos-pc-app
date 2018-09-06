const fs = require('fs');
const path = require('path');
const log_path = path.join(__dirname, 'log.txt')

function error(action, message) {
  fs.appendFileSync(log_path, full_message('ERROR', action, message));
}

function warning(action, message) {
  fs.appendFileSync(log_path, full_message('WARNING', action, message));
}

function full_message(level, action, message) {
  let full_message = `${level} [${currentTime()}][${action}] ${message} \r\n`
  return full_message;
}

function currentTime() {
 return new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '')
}

module.exports = { error, warning };
