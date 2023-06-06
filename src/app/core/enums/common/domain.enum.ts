/**
 * 測試環境與新舊正式環境domain
 */
export enum Domain {
  uat = 'app.alatech.com.tw',
  oldProd = 'cloud.alatech.com.tw',
  newProd = 'www.gptfit.com',
}

/**
 * 開發環境、測試環境與正式環境ip
 */
export enum WebIp {
  develop = '192.168.1.235',
  uat = '192.168.1.234',
  prod = '152.101.90.130',
}

/**
 * 各環境新舊domain適用的port
 */
export enum WebPort {
  develop = '8080',
  common = '5443', // 測試或舊domain使用的port
  prod = '6443', // 新domain使用的port
}
