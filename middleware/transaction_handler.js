const { Transaction } = require('../ECR-js/EcrData');
const logger = require('../modules/logger');

function transactionHandler(req, res, next) {
  // params = req.params
  params = req.query;
  logger.log(JSON.stringify(params));
  let transaction = generateTrasaction(params);
  req.transaction = transaction;
  next();
}

function generateTrasaction(params) {
  let transaction = new Transaction();
  switch(params.type) {
    case 'sale':
      checkParams();
      logger.log(`${params.type} 交易`)
      transaction.sale(params.amount);
      break;
    case 'refund':
      checkParams();
      logger.log(`${params.type} 交易`)
      transaction.refund('000000002100', '123451', 'reference012');
      break;
    default:
      logger.log(`未知交易`)
      transaction.sale();
  }
  return transaction;
}

// TODO 檢查需要的參數是否都有

function checkParams() {
  // throw "Error";
  return
}

module.exports = transactionHandler;
