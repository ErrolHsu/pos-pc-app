const path = require('path');

function root_path() {
  if (process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'test') {
    return path.join(path.dirname(process.execPath))
  } else {
    return path.join(__dirname, "../")
  }
}

function join(file_path) {
  return path.join(root_path(), file_path)
}

module.exports = { root_path, join };
