/**
 * 儲存於localstorage用的鍵名
 */
export enum LocalStorageKey {
  stationMailDraft = 'smd', // 站內信草稿
  webTheme = 'theme', // 網頁主題（變更網站色系用）
  locale = 'locale', // 目前使用之多國語系
  actionAfterLogin = 'actionAfterLogin', // 登入後轉導之網址
  cloudRunOpt = 'cloudRunOpt', // 雲跑團體分析設定
  cloudRunOptOfMember = 'cloudRunOpt-mem', // 雲跑個人分析設定
  groupLifeTrackingReport = 'groupLifeTrackingReport', // 群組生活追蹤分析設定
  countryCode = 'countryCode', // 最後登入之手機帳號國碼
  count = 'count', // 用來避免過度使用qrcode登入
  eventDraft = 'eventDraft', // 活動內容草稿
  token = 'ala_token', // 登入權杖
  useIsoWeek = 'uiw', // 使用是否使用isoWeek（週一為一週的第一天）
  sportsReportTableData = 'srtd',
  weightTrainAnalysis = 'wta',
  includeAdmin = 'ica', // 是否包含管理員
  quadrantSettingRun = 'qs_run', // 跑步類別的象限圖設定
  quadrantSettingCycle = 'qs_cycle', // 騎乘類別的象限圖設定
  quadrantSettingSwim = 'qs_swim', // 游泳類別的象限圖設定
  quadrantSettingRow = 'qs_row', // 划船類別的象限圖設定
}
