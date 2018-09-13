const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: find_env_file() });
const convict = require('convict');
const path_helper = require('../modules/path_helper');

function find_env_file() {
  return fs.existsSync(path.resolve(path.dirname(process.execPath), '.node_env')) ? path.resolve(path.dirname(process.execPath), '.node_env') : path.resolve(__dirname, '../.node_env')
}

// schema
let config = convict({
  env: {
    doc: "The application environment.",
    format: ["production", "development", "test"],
    default: "development",
    env: "NODE_ENV"
  },
  port: {
    doc: "The port to bind.",
    format: "port",
    default: 3000,
    env: "PORT",
    arg: "port"
  },
  ecr: {
    autoOpen: {
      default: false,
      arg: "autoOpen"
    },
    baudRate: {
      default: 9600,
      arg: 'baudRate'
    },
    dataBits: {
      default: 7,
      arg: 'dataBits'
    },
    stopBits: {
      default: 1,
      arg: 'stopBits'
    },
    parity: {
      default: 'even',
      arg: 'parity'
    }
  }
  // db: {
  //   host: {
  //     doc: "Database host name/IP",
  //     format: '*',
  //     default: 'server1.dev.test'
  //   },
  //   name: {
  //     doc: "Database name",
  //     format: String,
  //     default: 'users'
  //   }
  // }
});

// Load environment dependent configuration
const env = config.get('env');
const config_path = path_helper.join(`configs/${env}.json`);

console.log(env)

// load config
config.loadFile(config_path);
config.validate({ allowed: 'strict' });


module.exports = config;
