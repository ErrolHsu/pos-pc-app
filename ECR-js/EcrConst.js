const ECR_CONST = {
  // EDC response code
  RES_CODE_APPROVED: '0000', // 授權
  RES_CODE_ERROR: '0001', // 拒絕
  RES_CODE_CALL_BANK: '0002', // 請查詢銀行
  RES_CODE_TIMEOUT: '0003', // 連線逾時
  RES_CODE＿CARD_TYPE_ERROR: '0004', // 卡別錯誤
  RES_CODE_COMMUNICATION_ERROR: '0005', // 批次號碼不相符
  RES_CODE_CANCEL: '0006', // 取消

  // host id
  HOST_ID_ESUN: '01',
  HOST_ID_INSTALL: '02', // 玉山銀行分期付款
  HOST_ID_ESUN_CUP: '06', // 玉山CUP交易
  HOST_ID_ESUN_BARCODE: '07', // 玉山掃碼付
  HOST_ID_EASY_CARD: '10',
  HOST_ID_ICASH: '11',
  HOST_ID_IPASS: '12',
  HOST_ID_HAPPY_CASH: '13',

  // transaction type
  TRANS_TYPE_SALE: '01',
  TRANS_TYPE_REFUND: '02',
  TRANS_TYPE_INSTALLMENT: '04',
  TRANS_TYPE_REDEEMPTION: '05',
  TRANS_TYPE_VOID: '30',
  TRANS_TYPE_EASY_CARD_SALE: '31',
  TRANS_TYPE_EASY_CARD_REFUND: '32',
  TRANS_TYPE_ICASH_SALE: '41',
  TRANS_TYPE_ICASH_REFUND: '42',
  TRANS_TYPE_SETTLEMENT: '50',
  TRANS_TYPE_IPASS_SALE: '51',
  TRANS_TYPE_IPASS_REFUND: '52',
  TRANS_TYPE_IPASS_REQUEST: '60',
  TRANS_TYPE_HAPPY_CASH_SALE: '61',
  TRANS_TYPE_HAPPY_CASH_REFUND: '62',
  TRANS_TYPE_BARCODE_SALE: '71',
  TRANS_TYPE_BARCODE_REFUND: '75',
  TRANS_TYPE_BARCODE_VOID: '77',
  TRANS_TYPE_TERMINATE: '70',
};

module.exports = ECR_CONST;
