/**
 * query string 縮寫
 */
export enum QueryString {
  target = 'tg',  // 目標 user id / group id 等
  baseStartTime = 'bst',  // 基準開始時間
  baseEndTime = 'bet',  // 基準結束時間
  compareStartTime = 'cst',  // 比較開始時間
  compareEndTime = 'cet',  // 比較結束時間
  dateRangeUnit = 'dru', // 時間範圍單位
  sportType = 'st', // 運動類別
  seeMore = 'sm', // 看更多（展開）
  printMode = 'ipm'
}