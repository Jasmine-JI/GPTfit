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
  advancedSportsTarget = 'ast', // 群組與個人運動目標進階選項開關
}
