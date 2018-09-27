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
    // 一般交易 //
    case 'sale':
      checkParams();
      logger.log(`${params.type} 交易`)
      transaction.sale(params.amount, params.storeId);
      break;
    case 'refund':
      checkParams();
      logger.log(`${params.type} 交易`)
      transaction.refund(params.amount, params.approvalCode, params.referenceNo, params.storeId);
      break;
    // 銀聯卡交易 //
    case 'CUPSale':
      checkParams();
      logger.log(`${params.type} 交易`)
      transaction.CUPSale(params.amount, params.storeId);
      break;
    case 'CUPRefund':
      checkParams();
      logger.log(`${params.type} 交易`)
      transaction.CUPRefund(params.amount, params.approvalCode, params.referenceNo, params.storeId);
      break;
    // 票卡交易 //
    // 悠遊卡 //
    case 'easyCardSale':
      checkParams();
      logger.log(`${params.type} 交易`)
      transaction.easyCardSale(params.amount)
      break;
    case 'easyCardRefund':
      checkParams();
      logger.log(`${params.type} 交易`)
      transaction.easyCardRefund(params.amount, params.referenceNo);
      break;
    // 一卡通 //
    case 'iPassSale':
      checkParams();
      logger.log(`${params.type} 交易`)
      transaction.iPassSale(params.amount)
      break;
    case 'iPassRefund':
      checkParams();
      logger.log(`${params.type} 交易`)
      transaction.iPassRefund(params.amount, params.referenceNo, params.ticketReferenceNumber);
      break;
    // icash //
    case 'iCashSale':
      checkParams();
      logger.log(`${params.type} 交易`)
      transaction.iCashSale(params.amount)
      break;
    case 'iCashRefund':
      checkParams();
      logger.log(`${params.type} 交易`)
      transaction.iCashRefund(params.amount, params.referenceNo);
      break;
    // HappyCash //
    case 'happyCashSale':
      checkParams();
      logger.log(`${params.type} 交易`)
      transaction.happyCashSale(params.amount)
      break;
    case 'happyCashRefund':
      checkParams();
      logger.log(`${params.type} 交易`)
      transaction.happyCashRefund(params.amount, params.referenceNo);
      break;

    default:
      logger.log(`終止交易`)
      transaction.terminate();
  }
  return transaction;
}

// TODO 檢查需要的參數是否都有

function checkParams() {
  // throw "Error";
  return
}

module.exports = transactionHandler;
