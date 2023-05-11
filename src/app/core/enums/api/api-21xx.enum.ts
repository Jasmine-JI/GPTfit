/**
 * 運動檔案lap和point顯示與否
 */
export enum DisplayDetailField {
  show = 1,
  hide,
  showByCJson,
}

/**
 * 檔案隱私權更新範圍
 */
export enum RangeType {
  dateRange = 1,
  fileId,
  all = 99,
}
