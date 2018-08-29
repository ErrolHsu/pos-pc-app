const express = require('express');
const app = express();
const ecr = require('./ECR-js/main');
const ECR_CONFIG = require('./ECR-js/EcrConfig');
const { Transaction } = require('./ECR-js/EcrData');
const transactionHandler = require('./middleware/transaction_handler');

// parse request body json
// app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 決定交易種類
app.use(transactionHandler);

// 
app.use(function(err, req, res, next) {
  console.error(err);
  res.status(500).send(err);
});


app.get('/', (req, res) => {
  console.log('dsd')
  let transaction = req.transaction;
  let data = transaction.PackTransactionData();

  ecr.call(data).then((response) => {
    res.send(response.toString())
  }).catch((err) => {
    res.send(err.toString())
  });
});

app.listen(ECR_CONFIG.port, () => console.log(`listening on port ${ECR_CONFIG.port}`) )
