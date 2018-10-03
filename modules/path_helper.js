const path = require('path');

function rootPath() {
  if (process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'test') {
    return path.join(path.dirname(process.execPath));
  }
  return path.join(__dirname, '../');
}

function join(filePath) {
  return path.join(rootPath(), filePath);
}

module.exports = { rootPath, join };
