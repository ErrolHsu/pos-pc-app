const path = require('path');
const fs = require('fs');
const ECR_CONST = require('./EcrConst')
const logger = require('../modules/logger');

const STX = Buffer.from([2]);

const ETX = Buffer.from([3]);

const ACK = Buffer.from([6]);

const NAK = Buffer.from([21]);

class Transaction {
  constructor(object) {
    this.initData();
  }

  // 打包交易資料
  PackTransactionData() {
    logger.log('Preparing transaction data...');
    const data_str = this.dataToString();
    const data_buffer = Buffer.from(data_str, 'ascii');
    // const data_buffer = await this.readIn();

    // 計算LRC
    let lrc = Transaction.calcLrc(Buffer.concat([data_buffer, ETX]));

    // 送出的request為 <STX>[DATA]<ETX><LRC>
    let transaction_Data = Buffer.concat([STX, data_buffer, ETX, lrc]);

    return transaction_Data;
  }

  // 將data組成string
  dataToString() {
    let DataArray = Object.values(this.data);
    let str = '';
    for(let value of DataArray) {
      str += value;
    }
    if (str.length !== 600) {
      throw new Error('交易資料長度不正確。')
    }
    return str;
  }

  // read test file
  readIn() {
    return new Promise((resolve, reject) => {
      let filePath = path.resolve(__dirname, '../in.dat');
      fs.readFile(filePath, (err, data) => {
        logger.log(data);
        resolve(data);
      });
    });
  }

  initData() {
    this.data = {
      // 交易別(Transaction Type), length:2
      transType: buildEmptyString(2),
      // 銀行別(Host ID), length:2
      hostID: buildEmptyString(2),
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
      terminalID: buildEmptyString(8),
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
      storeID: buildEmptyString(20),
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
  }

  // parse response
  // data 為 600byte string
  parseResponse(data) {
    this.data.transType = data.substring(0, 2);
    this.data.hostID = data.substring(2, 4);
    this.data.receiptNo = data.substring(4, 10);
    this.data.cardNumber = data.substring(10, 29);
    this.data.expirationDate = data.substring(29, 33);
    this.data.transAmount = data.substring(33, 45);
    this.data.transDate = data.substring(45, 51);
    this.data.transTime = data.substring(51, 57);
    this.data.approvalCode = data.substring(57, 63);
    this.data.ecrResponseCode = data.substring(63, 67);
    this.data.terminalID = data.substring(67, 75);
    this.data.referenceNo = data.substring(75, 87);
    this.data.productCode = data.substring(87, 94);
    this.data.installmentPeriod = data.substring(94, 96);
    this.data.downPayment = data.substring(96, 104);
    this.data.installmentPayment = data.substring(104, 112);
    this.data.redeemAmt = data.substring(112, 122);
    this.data.storeID = data.substring(122, 142);
    this.data.startTransType = data.substring(142, 144);
    this.data.invoiceEncryptionCardNo = data.substring(144, 204);
    this.data.orderNumber = data.substring(204, 224);
    this.data.orderInfo = data.substring(224, 374);
    this.data.codeIndex = data.substring(374, 376);
    this.data.eCouponsProductCode = data.substring(376, 401);
    this.data.eCouponsExpireDateTime = data.substring(401, 415);
    this.data.eCouponsRedeemDateTime = data.substring(415, 429);
    this.data.eCouponsRedeemBalance = data.substring(429, 432);
    this.data.ticketType = data.substring(432, 433);
    this.data.ticketCardNumber = data.substring(433, 452);
    this.data.ticketReferenceNumber = data.substring(452, 462);
    this.data.ticketBonusAdd = data.substring(462, 472);
    this.data.ticketBonusDeduct = data.substring(472, 482);
    this.data.ticketBonusAccumulation = data.substring(482, 492);
    this.data.ticketBalance = data.substring(492, 502);
    this.data.reserve = data.substring(502, 599);
  };

  // Exclusive-Or all bytes of data & ETX (不包含 STX)
  static calcLrc(buffer) {
    let lrc = 0;
    for(let byte of buffer) {
      lrc ^= byte;
    }
    logger.log(`LRC is ${lrc}`);
    return Buffer.from([lrc]);
  }

  /****   Set Transaction Type     ***/

  // 一般交易
  sale(transAmount, storeId) {
    this.data.transType = ECR_CONST.TRANS_TYPE_SALE;
    this.data.transAmount = transAmount;
    // 選填
    if(storeId) {
      this.data.storeId = storeId;
    }
  }

  // 分期
  installment(transAmount, productCode, storeId) {
    this.data.transType = ECR_CONST.TRANS_TYPE_INSTALLMENT;
    this.data.hostID = ECR_CONST.HOST_ID_INSTALL;
    this.data.transAmount = transAmount;
    // 選填
    if(storeId) {
      this.data.storeId = storeId;
    }
    if(productCode) {
      this.data.productCode = productCode;
    }

  }

  // 退貨
  refund(transAmount, approvalCode, referenceNo, storeId) {
    this.data.transType = ECR_CONST.TRANS_TYPE_REFUND;
    this.data.hostID = ECR_CONST.HOST_ID_ESUN;
    this.data.transAmount = transAmount;
    this.data.approvalCode = approvalCode;
    this.data.referenceNo = referenceNo;
    // 選填
    if(storeId) {
      this.data.storeId = storeId;
    }
  }

  // 取消
  void(receiptNo) {
    this.data.transType = ECR_CONST.TRANS_TYPE_VOID;
    this.data.hostID = ECR_CONST.HOST_ID_ESUN;
    this.data.receiptNo = receiptNo;
  }

  // 自動結帳
  settlement() {
    this.data.transType = ECR_CONST.TRANS_TYPE_SETTLEMENT;
  }

  // 終止交易 兩段交易聯名卡用
  terminate() {
    this.data.transType = ECR_CONST.TRANS_TYPE_TERMINATE;
  }

  /****    銀聯卡     ***/

  // CUP一般交易
  CUPSale(transAmount, storeId) {
    this.data.transType = ECR_CONST.TRANS_TYPE_SALE;
    this.data.hostID = ECR_CONST.HOST_ID_ESUN_CUP;
    this.data.transAmount = transAmount;
    // 選填
    if(storeId) {
      this.data.storeId = storeId;
    }
  }

  // CUP退貨
  CUPRefund(transAmount, approvalCode, referenceNo, storeId) {
    this.data.transType = ECR_CONST.TRANS_TYPE_REFUND;
    this.data.hostID = ECR_CONST.HOST_ID_ESUN_CUP;
    this.data.transAmount = transAmount;
    this.data.approvalCode = approvalCode;
    this.data.referenceNo = referenceNo;
    // 選填
    if(storeId) {
      this.data.storeId = storeId;
    }
  }

  // CUP取消
  CUPVoid(receiptNo) {
    this.data.transType = ECR_CONST.TRANS_TYPE_VOID;
    this.data.hostID = ECR_CONST.HOST_ID_ESUN_CUP;
    this.data.receiptNo = receiptNo;
  }

  /****    BarCode     ***/

  // 掃碼交易
  barCodeSale(transAmount, orderInformation) {
    this.data.transType = ECR_CONST.TRANS_TYPE_BARCODE_SALE;
    this.data.hostID = ECR_CONST.HOST_ID_ESUN_BARCODE;
    this.data.transAmount = transAmount;

    if(orderInformation) {
      this.data.orderInformation = orderInformation;
    }
  }

  // 掃碼退貨
  barCodeRefund(transAmount, orderNumber, orderInformation) {
    this.data.transType = ECR_CONST.TRANS_TYPE_BARCODE_REFUND;
    this.data.hostID = ECR_CONST.HOST_ID_ESUN_BARCODE;
    this.data.transAmount = transAmount;

    if(orderInformation) {
      this.data.orderInformation = orderInformation;
    }

    if(orderNumber) {
      this.data.orderNumber = orderNumber;
    }
  }

  // 掃碼取消
  barCodeVoid(orderNumber, orderInformation) {
    this.data.transType = ECR_CONST.TRANS_TYPE_BARCODE_VOID;
    this.data.hostID = ECR_CONST.HOST_ID_ESUN_BARCODE;

    if(orderInformation) {
      this.data.orderInformation = orderInformation;
    }

    if(orderNumber) {
      this.data.orderNumber = orderNumber;
    }
  }

  /****    悠遊卡，一卡通等票卡     ***/

  // 票卡一般交易
  ticketSale(transType, hostID, transAmount) {
    this.data.transType = transType;
    this.data.hostID = hostID;
    this.data.transAmount = transAmount;
  }

  // 票卡退貨
  ticketRefund(transType, hostID, transAmount, referenceNo, ticketReferenceNumber) {
    this.data.transType = transType;
    this.data.hostID = hostID;
    this.data.transAmount = transAmount;
    this.data.referenceNo = referenceNo;
    if(ticketReferenceNumber) {
      this.data.ticketReferenceNumber = ticketReferenceNumber;
    }
  }

  // 悠遊卡一般交易
  easyCardSale(transAmount) {
    this.ticketSale(ECR_CONST.TRANS_TYPE_EASY_CARD_SALE, ECR_CONST.HOST_ID_EASY_CARD, transAmount);
  }

  // 悠遊卡退貨
  easyCardRefund(transAmount, referenceNo) {
    this.ticketRefund(ECR_CONST.TRANS_TYPE_EASY_CARD_REFUND, ECR_CONST.HOST_ID_EASY_CARD, transAmount, referenceNo)
  }

  // 一卡通一般交易
  iPassSale(transAmount) {
    this.ticketSale(ECR_CONST.TRANS_TYPE_IPASS_SALE, ECR_CONST.HOST_ID_IPASS, transAmount);
  }

  // 一卡通退貨
  iPassRefund(transAmount, referenceNo, ticketReferenceNumber) {
    this.ticketRefund(ECR_CONST.TRANS_TYPE_IPASS_REFUND, ECR_CONST.HOST_ID_IPASS, transAmount, referenceNo, ticketReferenceNumber)
  }

  // icash一般交易
  iCashSale(transAmount) {
    this.ticketSale(ECR_CONST.TRANS_TYPE_ICASH_SALE, ECR_CONST.HOST_ID_ICASH, transAmount);
  }

  // icash退貨
  iCashRefund(transAmount, referenceNo) {
    this.ticketRefund(ECR_CONST.TRANS_TYPE_ICASH_REFUND, ECR_CONST.HOST_ID_ICASH, transAmount, referenceNo)
  }

  // HappyCash一般交易
  happyCashSale(transAmount) {
    this.ticketSale(ECR_CONST.TRANS_TYPE_HAPPY_CASH_SALE, ECR_CONST.HOST_ID_HAPPY_CASH, transAmount);
  }

  // HappyCash退貨
  happyCashRefund(transAmount, referenceNo) {
    this.ticketRefund(ECR_CONST.TRANS_TYPE_HAPPY_CASH_REFUND, ECR_CONST.HOST_ID_HAPPY_CASH, transAmount, referenceNo)
  }

} // Transaction class end


function buildEmptyString(length) {
  let str = '';
  for(i = 0; i <  length; i++) {
    str += '\xa0';
  }
  return str;
}

module.exports = { Transaction };
