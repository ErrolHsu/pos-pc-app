const config = require('./configs/config');
const path = require('path');
const express = require('express');
const app = express();
const ecr = require('./ECR-js/main');
const ECR_CONFIG = require('./ECR-js/EcrConfig');
const { Transaction } = require('./ECR-js/EcrData');
const transactionHandler = require('./middleware/transaction_handler');
const logger = require('./modules/logger');
const SerialPortHelper = require('./modules/serial_port_helper');

SerialPortHelper.printPortList();

// parse request body json
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 決定交易種類
app.use(transactionHandler);

// 
app.use(function(err, req, res, next) {
  logger.error('request', err.message);
  res.status(500).send(err);
});

app.get('/', (req, res) => {
  // TODO 之後刪掉
  console.log(config.get('env'));
  // ...........
  let transaction = req.transaction;
  let data = transaction.PackTransactionData();

  ecr.call(data).then((response) => {
    // TODO 根據卡機response code 來回傳response
    res.send(JSON.stringify(response.data));
  }).catch((err) => {
    logger.warn('Transaction Request' , `交易失敗 ${err.message}`);
    res.send(err.message);
  });
});

app.listen(config.get('port'), () => {
  console.log(`listening on port ${config.get('port')}`)
});
