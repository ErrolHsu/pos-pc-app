const { Transaction } = require('../ECR-js/EcrData');

function transactionHandler(req, res, next) {
  // params = req.params
  params = req.query;
  console.log(params);
  let transaction = generateTrasaction(params);
  req.transaction = transaction;
  next();
}

function generateTrasaction(params) {
  let transaction = new Transaction();
  switch(params.type) {
    case 'sale':
      checkParams();
      console.log(`${params.type} 交易`)
      transaction.sale();
      break;
    case 'refund':
      checkParams();
      console.log(`${params.type} 交易`)
      transaction.refund('000000000100', '123451', 'reference012');
      break;
    default:
      console.log(`未知交易`)
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
