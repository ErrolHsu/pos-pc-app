const config = require('../configs/config');

const ECR_CONFIG = {
  portName: config.get('ecr.portName'),
  PORT_SETTING: {
    autoOpen: config.get('ecr.autoOpen'),
    baudRate: config.get('ecr.baudRate'),
    dataBits: config.get('ecr.dataBits'),
    stopBits: config.get('ecr.stopBits'),
    parity: config.get('ecr.parity'),
  },
};

module.exports = ECR_CONFIG;
