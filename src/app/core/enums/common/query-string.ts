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
  deviceSN = 'device_sn', // 裝置sn序號，不可變動，避免商品qrcode失效
  btName = 'bt_name', // 裝置bt name，不可變動，避免商品qrcode失效
  CS = 'cs', // 裝置checksum，不可變動，避免商品qrcode失效
  pageNumber = 'pageNumber', // 頁碼
  targetUserId = 'targetUserId', // 目標userId
  pushId = 'push_id', // 推播流水編號
  type = 'type', // 類型(通用)
  createType = 'createType', // 群組建立類別
  searchWords = 'searchWords', // 關鍵字
  groupLevel = 'groupLevel', // 群組階層
  brandType = 'brandType', // 群組品牌類別
  plan = 'plan', // 群組方案類別
  qrSignInFlow = 'qsf', // 圖碼登入流程，變動需與後端一同變動
  guid = 'g', // 唯一識別碼，變動需與後端一同變動
  search = 'search', // 搜尋關鍵字
  enableAccountFlow = 'eaf', // 啟用流程，變動需與後端一同變動
  token = 'tk', // 權杖，變動需與後端一同變動
  userId = 'ui', // user id，變動需與後端一同變動
  verificationCode = 'vc', // 驗證碼，變動需與後端一同變動
  project = 'p', // 專案類別，變動需與後端一同變動
  redirectUrl = 'ru', // 依啟用成功後轉址需求帶上關鍵字，變動需與後端一同變動
  resetPasswordFlow = 'rpf', // 忘記密碼流程，變動需與後端一同變動
  accountType = 'rc', // 會員帳號類型，變動需與後端一同變動
  email = 'e', // email，變動需與後端一同變動
  countryCode = 'cc', // 電話國碼，變動需與後端一同變動
  mobileNumber = 'mn', // 電話號碼，變動需與後端一同變動
  xAxisType = 'xAxisType', // 圖表X軸類別
  segmentMode = 'segmentMode', // 圖表分段模式
  weightTrainLevel = 'weightTrainLevel', // 重訓程度
  segmentRange = 'segmentRange', // 圖表分段範圍類別
  startDate = 'startdate', // 起始日期
  endDate = 'enddate', // 起始日期
  mapId = 'mapid', // 雲跑地圖流水編號
  mapSource = 'source', // 地圖來源
  check = 'check',
  eventId = 'eventId', // 官方活動流水編號
}
