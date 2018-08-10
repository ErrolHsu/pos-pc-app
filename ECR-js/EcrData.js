const path = require('path');
const fs = require('fs');

const STX = Buffer.from([2]);

const ETX = Buffer.from([3]);

const ACK = Buffer.from([6]);

const NAK = Buffer.from([21]);

let TransactionData = {
  // 交易別
  transType: buildEmptyString(2),
  // 銀行別
  hostId: buildEmptyString(2),
  // 端末機簽單序號
  receiptNo: buildEmptyString(6),
  // 信用卡卡號
  cardNumber: buildEmptyString(19),
  // 信用卡有效期 用”****” 取代
  expirationDate: buildEmptyString(4),
  // 交易金額
  transAmount: buildEmptyString(12),
  // 交易日期
  transDate: buildEmptyString(6),
  // 交易時間
  transTime: buildEmptyString(6),
  // 授權碼(左靠右補空白)
  approvalCode: buildEmptyString(6),
  // 通訊回應碼
  ecrResponseCode: buildEmptyString(4),
  // 端末機代號
  terminalId: buildEmptyString(8),
  // 銀行交易序號
  referenceNo: buildEmptyString(12),
  // 分期產品代號
  productCode: buildEmptyString(7),
  // 分期期數
  installmentPeriod: buildEmptyString(2),
  // 首期金額
  downPayment: buildEmptyString(8),
  // 每期金額
  installmentPayment: buildEmptyString(8),
  // 折抵金額
  redeemAmt: buildEmptyString(10),
  // 櫃號
  storeId: buildEmptyString(20),
  // 讀取卡號的交易別 (SALE 01, REFUND02)(讀取卡號資料須送此欄位)
  startTransType: buildEmptyString(2),
  // 電子發票加密卡號(左靠右補空白)
  invoiceEncryptionCardNo: buildEmptyString(60),
  // 訂單編號
  orderNumber: buildEmptyString(20),
  // 訂單資訊
  orderInformation: buildEmptyString(150),
  // 掃碼付型態
  codeIndex: buildEmptyString(2),
  // 兌換券產品代碼
  eCouponsProductCode: buildEmptyString(25),
  // 兌換有效日期時間
  eCouponsExpireDateTime: buildEmptyString(14),
  // 兌換日期時間
  eCouponsRedeemDateTime: buildEmptyString(14),
  // 可兌換餘額
  eCouponsRedeemBalance: buildEmptyString(3),
  // 電子票證名稱類別 1-ECC, 2-Icash, 3-iPASS, 4-HappyCash
  ticketType: buildEmptyString(1),
  // 電子票證卡號
  ticketCardNumber: buildEmptyString(19),
  // 電子票證交易序號，一卡通退貨時需可輸入。
  ticketReferenceNumber: buildEmptyString(10),
  // 電子票證點數新增
  ticketBonusAdd: buildEmptyString(10),
  // 電子票證點數扣抵
  ticketBonusDeduct: buildEmptyString(10),
  // 電子票證目前累積點數
  ticketBonusAccumulation: buildEmptyString(10),
  // 消費後儲值餘額
  ticketBalance: buildEmptyString(10),
  // 保留
  reserve: buildEmptyString(98),
}

function generateTestData() {
  TransactionData.transType = '02';
  TransactionData.transAmount = '000000000100';
  let DataArray = Object.values(TransactionData);
  let str = ''
  for(let value of DataArray) {
    str += value
  }
  return str;
}

// 打包交易資料
function PackTransactionData() {
  console.log('Preparing transaction data...')
  const data = Buffer.from(generateTestData());

  // 計算LRC
  let lrc = calcLrc(Buffer.concat([data, ETX]));

  // 送出的request為 <STX>[DATA]<ETX><LRC>
  let transactionData = Buffer.concat([STX, data, ETX, lrc]);

  return transactionData;
}

// Exclusive-Or all bytes of data & ETX (不包含 STX)
function calcLrc(buffer) {
  let lrc = 0;
  for(byte of buffer) {
    lrc ^= byte
  }
  console.log(`LRC is ${lrc}`);
  return Buffer.from([lrc]);
}

function buildEmptyString(length) {
  let str = ''
  for(i = 0; i <  length; i++) {
    str += '\xa0'
  }
  return str
}

function checkACK(response) {
  // console.log(response)
  // console.log(Buffer.compare(response.slice(0, 1), ACK), Buffer.compare(response.slice(1, 2), ACK))
  return Buffer.compare(response.slice(0, 1), ACK) === 0 && Buffer.compare(response.slice(1, 2), ACK) === 0;
}

function getData() {
  return new Promise((resolve, reject) => {
    let p = path.resolve(__dirname, '../in.dat')
    fs.readFile(p, (err, data) => {
      if(err) {
        return reject(err);
      } else {
        return resolve(data);
      }
    });
  });
};

exports.PackTransactionData = PackTransactionData;
exports.checkACK = checkACK;

