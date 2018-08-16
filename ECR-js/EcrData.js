const path = require('path');
const fs = require('fs');

const STX = Buffer.from([2]);

const ETX = Buffer.from([3]);

const ACK = Buffer.from([6]);

const NAK = Buffer.from([21]);

let TransactionData = {
  // 交易別(Transaction Type), length:2
  transType: buildEmptyString(2),
  // 銀行別(Host ID), length:2
  hostId: buildEmptyString(2),
  // 端末機簽單序號(Receipt No)：由端末機產生, length:6
  receiptNo: buildEmptyString(6),
  // 信用卡卡號(Card Number)：由端末機回傳,左靠右補空白,除前6 碼及後4 碼顯示外,其餘用*隱藏, length:19
  cardNumber: buildEmptyString(19),
  // 信用卡有效期(Expiration Date)：由端末機回傳0000, length:4
  expirationDate: buildEmptyString(4),
  // 交易金額(Transaction Amount)：包括兩位小數,但不包括小數點, length:12
  transAmount: buildEmptyString(12),
  // 交易日期(Transaction Date)：格式為西元年(YYMMDD), length:6
  transDate: buildEmptyString(6),
  // 交易時間(Transaction Time)：格式為二十四小時制(hhmmss), length:6
  transTime: buildEmptyString(6),
  // 授權碼(Approval Code)：一般交易由端末機回傳，退貨須由收銀機傳過來, length:6
  approvalCode: buildEmptyString(6),
  // 通訊回應碼(Response Code)：由端末機回傳, length:4
  ecrResponseCode: buildEmptyString(4),
  // 端末機代號(Terminal ID)：由端末機回傳, length:8
  terminalId: buildEmptyString(8),
  // 銀行交易序號(Reference No)：一般交易由端末機回傳，退貨須由收銀機傳過來, length:12
  referenceNo: buildEmptyString(12),
  // 分期產品代號(Product Code)：7 碼數字，不傳送時必須填滿空白, length:7
  productCode: buildEmptyString(7),
  // 分期期數(Installment Period)：由端末機回傳(期數由主機帶下來，非使用者輸入), length:2
  installmentPeriod: buildEmptyString(2),
  // 首期金額(Down Payment)：右靠左補0,無小數位, length:8
  downPayment: buildEmptyString(8),
  // 每期金額(Installment Payment)：右靠左補0,無小數位, length:8
  installmentPayment: buildEmptyString(8),
  // 折抵金額(Redeem Amt)：右靠左補0,無小數位, length:10
  redeemAmt: buildEmptyString(10),
  // 櫃號(Store ID)：20 碼任意，不傳送時必須填滿空白, length:20
  storeId: buildEmptyString(20),
  // 讀取卡號的交易別 (SALE 01, REFUND02)(讀取卡號資料須送此欄位)
  startTransType: buildEmptyString(2),
  // 電子發票加密卡號(左靠右補空白)
  invoiceEncryptionCardNo: buildEmptyString(60),
  // 訂單編號(Order Number): 20 碼文數字，掃碼付交易統一由 EDC 產生 唯一值
  orderNumber: buildEmptyString(20),
  // 訂單資訊(Order Information):150 碼文數字，當掃碼槍接在POS 端，則交易需由POS 傳給EDC，否則值放空白, length:150
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

// 測試假資料
function generateTestData() {
  TransactionData.transType = '01';
  TransactionData.transAmount = '000000000100';
  let DataArray = Object.values(TransactionData);
  let str = ''
  for(let value of DataArray) {
    str += value
  }
  return str;
}

function readIn() {
  return new Promise((resolve, reject) => {
    filePath = path.resolve(__dirname, '../in.dat');
    fs.readFile(filePath, (err, data) => {
      console.log(data)
      resolve(data);
    })
  });
}

// 打包交易資料
async function PackTransactionData() {
  console.log('Preparing transaction data...')
  const data = Buffer.from(generateTestData(), 'ascii');
  // const data = await readIn()

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
  return (response.readUIntBE(0,1) === 6 && response.readUIntBE(1,1) === 6)
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

// for test
exports.generateTestData = generateTestData;