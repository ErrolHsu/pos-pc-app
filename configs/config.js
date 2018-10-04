const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: findEnvFile() });
const convict = require('convict');
const pathHelper = require('../modules/path_helper');

function findEnvFile() {
  return fs.existsSync(path.resolve(path.dirname(process.execPath), '.node_env')) ? path.resolve(path.dirname(process.execPath), '.node_env') : path.resolve(__dirname, '../.node_env');
}

// configs/env.json schema
const config = convict({
  env: {
    format: ['production', 'development', 'test'],
    default: 'development',
    env: 'NODE_ENV',
  },
  port: {
    format: 'port',
    default: 3000,
    env: 'PORT',
    arg: 'port',
  },
  ecr: {
    timeout: {
      format: 'int',
      default: 60000,
      arg: 'timeout',
    },
    portName: {
      format: String,
      default: 'COM2',
      arg: 'portName',
    },
    autoOpen: {
      format: Boolean,
      default: false,
      arg: 'autoOpen',
    },
    baudRate: {
      format: 'int',
      default: 9600,
      arg: 'baudRate',
    },
    dataBits: {
      format: 'int',
      default: 7,
      arg: 'dataBits',
    },
    stopBits: {
      format: 'int',
      default: 1,
      arg: 'stopBits',
    },
    parity: {
      format: String,
      default: 'even',
      arg: 'parity',
    },
    mode: {
      format: ['normal', 'test'],
      default: 'normal',
      arg: 'ecr_mode',
    },
  },
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

// Load environment dependent env
const env = config.get('env');
const configPath = pathHelper.join(`configs/${env}.json`);

// load & valid config
config.loadFile(configPath);
config.validate({ allowed: 'strict' });

module.exports = config;
