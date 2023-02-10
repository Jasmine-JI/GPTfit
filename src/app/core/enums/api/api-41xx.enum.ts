/**
 * 營運分析報告類別
 */
export enum SystemAnalysisType {
  group = 1,
  member,
  device,
}

/**
 * api 4107 post 更新類別
 */
export enum AnalysisUpdateType {
  systemInfo = 1,
  systemTrend,
  groupList,
  groupInfo,
  groupTrend,
  coachAndMember,
  all,
}

/**
 * 營運分析更新狀態
 */
export enum AnalysisUpdateStatus {
  updating = 1,
  waitUpdate,
}
