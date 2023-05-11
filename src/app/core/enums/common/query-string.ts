/**
 * query string 縮寫
 */
export enum QueryString {
  deviceName = 'dn', // 裝置名稱
  appName = 'an', // app名稱
  appVersionCode = 'avc', // app版本號
  appVersionName = 'avn', // app版本名稱
  equipmentSN = 'sn', // 裝置序號
  target = 'tg', // 目標 user id / group id 等
  baseStartTime = 'bst', // 基準開始時間
  baseEndTime = 'bet', // 基準結束時間
  compareStartTime = 'cst', // 比較開始時間
  compareEndTime = 'cet', // 比較結束時間
  dateRangeUnit = 'dru', // 時間範圍單位
  sportType = 'st', // 運動類別
  seeMore = 'sm', // 看更多（展開）
  printMode = 'ipm', // 列印模式
  debug = 'debug', // debug模式，需連同系統權限一起判斷
  messageId = 'msi', // 站內信id
  messageReceiverId = 'mri', // 信件收件人
  messageReceiverType = 'mrt', // 站內信類別(個人/群組)
  applyGroup = 'apg', // 報名分組
  includeAdmin = 'ia', // 是否包含管理員
}
