/**
 * 營運分析報告趨勢圖表類別
 */
export enum OperationTrendType {
  singleTrend,
  compareTrend,
}

/**
 * 單一趨勢日期範圍
 */
export enum SingleTrendRange {
  unlimit,
  nearlyFiveYears,
  nearlyTwoYears,
  nearlyOneYear,
  nearlyOneSeason,
}

/**
 * 比較趨勢日期範圍
 */
export enum CompareTrendRange {
  nearlyTwoYears,
  nearlyTwoSeasons,
  nearlyTwoMonths,
  lastTwoYears,
  lastTwoSeasons,
  lastTwoMonths,
}
