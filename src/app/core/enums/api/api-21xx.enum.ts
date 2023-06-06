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

/**
 * api 2116 post 排序類別用
 */
export enum FileSortType {
  startDate = 1,
  totalSecond,
  distance,
  avgHr,
  avgSpeed,
  totalWeight,
}
