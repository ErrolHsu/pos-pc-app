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

// 允許跨域 AJAX
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", '*');
  next();
})

// 決定交易種類
app.use(transactionHandler);

// error handling
app.use(function(err, req, res, next) {
  logger.error('request', err.message);

  let res_object = {
    message: err.message
  }

  res.status(400)
  res.send(res_object);
});

app.get('/', (req, res) => {
  let transaction;
  let data;

  try {
    transaction = req.transaction;
    data = transaction.PackTransactionData();
  } catch (err) {
    res.status(400);
    res.send(JSON.stringify({message: err.message}));
    return
  }

  ecr.call(data).then((response) => {

    let res_object = {
      response_code: response.data.ecrResponseCode,
      transaction_data: response.data
    }

    res.send(JSON.stringify(res_object));
  }).catch((err) => {
    logger.warn('Transaction Request' , `交易失敗 ${err.message}`);

    let res_object = {
      message: err.message
    }

    res.status(400);
    res.send(JSON.stringify(res_object));
  });
});

app.listen(config.get('port'), () => {
  console.log(`listening on port ${config.get('port')}`)
});
