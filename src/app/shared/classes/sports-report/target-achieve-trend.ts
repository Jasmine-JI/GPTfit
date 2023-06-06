import { DateRange } from '../date-range';
import { trendChartColor } from '../../../core/models/represent-color';

/**
 * 用於個人目標達成率圖表
 */
export class TargetAchieveTrendData {
  private _trendData = [
    {
      name: '',
      data: [],
      custom: <any>{
        baseDateRange: [],
      },
    },
  ];

  /**
   * 報告基準日期範圍
   */
  private _baseEndTime: number;

  /**
   * 報告比較日期範圍
   */
  private _compareEndTime: number;

  constructor(baseTime: DateRange, compareTime: DateRange) {
    // 將報告截止時間紀錄下來供後續日期比對用
    this._baseEndTime = baseTime.endTimestamp;
    this._compareEndTime = compareTime?.endTimestamp;
  }

  /**
   * 將單筆數據與日期範圍加至圖表數據陣列中
   * @param data {number}-數據
   * @param dateRange {Array<number>}-該筆數據所屬時間
   */
  addBaseData(data: number, dateRange: Array<number>) {
    const currentDataIndex = this._trendData[0].custom.baseDateRange.length;
    this._trendData[0].data.push({
      x: currentDataIndex,
      y: 0,
      ...this.getChartValue(data, dateRange[0], this._baseEndTime),
    });

    this._trendData[0].custom.baseDateRange.push(dateRange);
  }

  /**
   * 將基準與比較的單筆數據與日期範圍加至圖表數據陣列中
   * @param baseData {Array<number>}-基準數據
   * @param baseDateRange {Array<number>}-該筆數據所屬時間
   * @param baseData {Array<number>}-比較數據
   * @param compareDateRange {Array<number>}-該筆數據所屬時間
   */
  addMixData(
    baseData: number,
    baseDateRange: Array<number>,
    compareData: number,
    compareDateRange: Array<number>
  ) {
    if (!this._trendData[0].custom.compareDateRange)
      this._trendData[0].custom.compareDateRange = [];
    const currentDataIndex = this._trendData[0].custom.baseDateRange.length;
    const baseValue = {
      x: currentDataIndex,
      y: 0,
      ...this.getChartValue(baseData, baseDateRange[0], this._baseEndTime),
    };
    this._trendData[0].data.push(baseValue);
    this._trendData[0].custom.baseDateRange.push(baseDateRange);

    const compareValue = {
      x: currentDataIndex,
      y: 1,
      ...this.getChartValue(compareData, compareDateRange[0], this._compareEndTime),
    };
    this._trendData[0].data.push(compareValue);
    this._trendData[0].custom.compareDateRange.push(compareDateRange);
  }

  // 取得該時間範圍之數值與顏色
  getChartValue(data: number, dataStartDate: number, reportEndDate: number) {
    const { notAchieve, nodata, achieve } = trendChartColor.personalAchieve;
    const value = data ? 1 : 0;
    let color = data ? achieve : notAchieve;
    if (dataStartDate > reportEndDate) color = nodata;
    return { value, color };
  }

  /**
   * 取得圖表數據與設定值
   */
  get chartData() {
    return this._trendData;
  }
}
