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
  nearlyOneMonth,
}

/**
 * 比較趨勢日期範圍
 */
export enum CompareTrendRange {
  nearlyTwoYears,
  nearlyTwoSeasons,
  nearlyTwoMonths,
  nearlyTwoWeeks,
  lastTwoYears,
  lastTwoSeasons,
  lastTwoMonths,
  lastTwoWeeks,
}
