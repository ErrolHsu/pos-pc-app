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
  logger.log(`${params.type} 交易`)
  switch(params.type) {
    // 一般交易 //
    case 'sale':
      checkParams(['amount'], params);
      transaction.sale(params.amount, params.storeId);
      break;
    // 分期付款 //
    case 'installment':
      checkParams(['amount'], params);
      transaction.installment(params.amount, params.productCode, params.storeId);
      break;
    case 'refund':
      checkParams(['amount', 'approvalCode', 'referenceNo'], params);
      transaction.refund(params.amount, params.approvalCode, params.referenceNo, params.storeId);
      break;
    // 銀聯卡交易 //
    case 'CUPSale':
      checkParams(['amount'], params);
      transaction.CUPSale(params.amount, params.storeId);
      break;
    case 'CUPRefund':
      checkParams(['amount', 'approvalCode', 'referenceNo'], params);
      transaction.CUPRefund(params.amount, params.approvalCode, params.referenceNo, params.storeId);
      break;
    // 票卡交易 //
    // 悠遊卡 //
    case 'easyCardSale':
      checkParams(['amount'], params);
      transaction.easyCardSale(params.amount)
      break;
    case 'easyCardRefund':
      checkParams(['amount', 'approvalCode', 'referenceNo'], params);
      transaction.easyCardRefund(params.amount, params.referenceNo);
      break;
    // 一卡通 //
    case 'iPassSale':
      checkParams(['amount'], params);
      transaction.iPassSale(params.amount)
      break;
    case 'iPassRefund':
      checkParams(['amount', 'approvalCode', 'referenceNo'], params);
      transaction.iPassRefund(params.amount, params.referenceNo, params.ticketReferenceNumber);
      break;
    // icash //
    case 'iCashSale':
      checkParams(['amount'], params);
      transaction.iCashSale(params.amount)
      break;
    case 'iCashRefund':
      checkParams(['amount', 'approvalCode', 'referenceNo'], params);
      transaction.iCashRefund(params.amount, params.referenceNo);
      break;
    // HappyCash //
    case 'happyCashSale':
      checkParams(['amount'], params);
      transaction.happyCashSale(params.amount)
      break;
    case 'happyCashRefund':
      checkParams(['amount', 'approvalCode', 'referenceNo'], params);
      transaction.happyCashRefund(params.amount, params.referenceNo);
      break;
    default:
      throw new Error('不支援的交易種類。')
      break;
  }
  logger.log(JSON.stringify(transaction, null, 4))
  return transaction;
}

// 驗證參數

function checkParams (keys, params) {
  let valid = {
    amount: 12,
    approvalCode: 6,
    referenceNo: 12,
  }

  // valid 必填參數
  for (let key of keys) {
    // check參數存在
    if ( !(key in params) ) {
      throw new Error(`${key} 是必須的參數。`)
    }
    // check參數格式正確
    if ( typeof(valid[key]) === 'function' ) {
      valid[key](params[key])
    } else {
      if ( params[key].length !== valid[key]) {
        throw new Error(`${key} length 不正確，length 需為 ${valid[key]}`)
      }
    }

  }

  // valid 選填參數
  if ( 'productCode' in params ) {
    if ( params['productCode'].length !== 7 ) {
      throw new Error("productCode length 不正確，length 需為 7")
    }
  }

  if ( 'storeID' in params ) {
    if ( params['storeID'].length !== 20 ) {
      throw new Error("storeID length 不正確，length 需為 20")
    }
  }

}

module.exports = transactionHandler;
