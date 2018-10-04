const express = require('express');
const config = require('./configs/config');

const app = express();
const ecr = require('./ECR-js/main');
const transactionHandler = require('./middleware/transaction_handler');
const logger = require('./modules/logger');
const SerialPortHelper = require('./modules/serial_port_helper');

logger.log('App start')
logger.log(`environment is ${config.get('env')}`);
SerialPortHelper.printPortList();

// parse request body json
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 允許跨域 AJAX
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  next();
});

// 決定交易種類
app.use(transactionHandler);

// error handling
app.use((err, req, res, next) => {
  logger.error('request', err.message);

  const resObject = {
    message: err.message,
  };

  res.status(400);
  res.send(resObject);
});

app.get('/', (req, res) => {
  const { transaction } = req;

  logger.log('開始交易...')
  ecr.call(transaction).then((response) => {
    const resObject = {
      response_code: response.data.ecrResponseCode,
      transaction_data: response.data,
    };
    logger.log('交易完成');
    res.send(JSON.stringify(resObject));
  }).catch((err) => {
    logger.warn('Transaction Request', `交易失敗 ${err.message}`);

    const resObject = {
      message: err.message,
    };

    res.status(400);
    res.send(JSON.stringify(resObject));
  });
});

app.listen(config.get('port'), () => {
  logger.log(`listening on port ${config.get('port')}`);
});
