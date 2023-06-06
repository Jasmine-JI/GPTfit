/**
 * 檔案類別
 */
export enum FileType {
  trainingProgram = 1, // 訓練程序
  activityTracking, // 運動檔案
  lifeTracking, // 生活追蹤檔案
  exchangeProfile, // 資料交換格式
}

/**
 * 隱私權開放對象
 */
export enum PrivacyObj {
  self = 1,
  myFriend,
  myGroup,
  onlyGroupAdmin,
  anyone = 99,
}

/**
 * 隱私權設定對象
 */
export enum PrivacyEditObj {
  file = 1,
  sportsReport,
  lifeTracking,
}

/**
 * 排序類別(升冪為1)
 */
export enum SortDirection {
  asc = 1,
  desc,
}

/**
 * 排序類別(降冪為1)
 */
export enum DescFirstSortDirection {
  desc = 1,
  asc,
}
