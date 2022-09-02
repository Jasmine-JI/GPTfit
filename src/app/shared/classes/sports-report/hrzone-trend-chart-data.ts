import { zoneColor } from '../../models/chart-data';
import { COLUMN_BORDER_COLOR, COMPARE_COLUMN_BORDER_COLOR } from '../../models/chart-data';

/**
 * 處理心率趨勢數據
 */
export class HrZoneTrendChartData {
  private _hrZoneTrend: Array<any>;

  constructor(isCompareMode: boolean) {
    isCompareMode ? this.createCompareOption() : this.createNormalOption();
  }

  /**
   * 變數進行格式化成非比較模式之圖表
   */
  createNormalOption() {
    this._hrZoneTrend = new Array(6).fill(null).map((_arr, _index) => {
      const _reverseIndex = this.getReverseIndex(_index);
      return {
        name: `Zone${_reverseIndex}`,
        data: [],
        showInLegend: false,
        color: zoneColor[_reverseIndex],
        borderColor: COLUMN_BORDER_COLOR,
        custom: {
          dateRange: [],
        },
      };
    });
  }

  /**
   * 變數進行格式化成比較模式之圖表
   */
  createCompareOption() {
    this._hrZoneTrend = new Array(12).fill(null).map((_arr, _index) => {
      // 陣列依序為[baseZ5, baseZ4, ..., baseZ0, compareZ5, compareZ4, ..., compareZ0]
      const isCompare = _index > 5;
      const _zoneIndex = isCompare ? _index - 6 : _index;
      const _reverseIndex = this.getReverseIndex(_zoneIndex);
      return {
        name: `Zone${_reverseIndex}`,
        data: [],
        stack: isCompare ? 'compare' : 'base',
        borderColor: isCompare ? COMPARE_COLUMN_BORDER_COLOR : COLUMN_BORDER_COLOR,
        color: zoneColor[_reverseIndex],
        showInLegend: false,
        custom: {
          dateRange: [],
        },
      };
    });
  }

  /**
   * 將單筆心率數據與日期範圍加至圖表數據陣列中
   * @param baseData {Array<number>}-基準心率區間
   * @param dateRange {Array<number>}-該筆數據所屬時間
   */
  addBaseData(baseData: Array<number>, dateRange: Array<number>) {
    // highchart 堆疊柱狀圖堆疊順序由上到下為數據陣列前到後，故z5要放陣列最前面
    baseData.forEach((_hrZone, _index) => {
      const reverseIndex = this.getReverseIndex(_index);
      this._hrZoneTrend[reverseIndex].data.push([dateRange[0], _hrZone || 0]); // [startTimestamp, hrZone]
      this._hrZoneTrend[reverseIndex].custom.dateRange.push(dateRange); // [startTimestamp, endTimestamp]
    });
  }

  /**
   * 將基準與比較的單筆心率數據與日期範圍加至圖表數據陣列中
   * @param baseData {Array<number>}-基準心率區間
   * @param baseDateRange {Array<number>}-該筆數據所屬時間
   * @param baseData {Array<number>}-比較心率區間
   * @param compareDateRange {Array<number>}-該筆數據所屬時間
   */
  addMixData(
    baseData: Array<number>,
    baseDateRange: Array<number>,
    compareData: Array<number>,
    compareDateRange: Array<number>
  ) {
    baseData.forEach((_baseHrZone, _index) => {
      const _compareHrZone = compareData[_index];
      const _baseReverseIndex = this.getReverseIndex(_index);
      const _compareReverseIndex = _baseReverseIndex + 6;
      this._hrZoneTrend[_baseReverseIndex].data.push(_baseHrZone);
      this._hrZoneTrend[_baseReverseIndex].custom.dateRange.push(baseDateRange);
      this._hrZoneTrend[_compareReverseIndex].data.push(_compareHrZone);
      this._hrZoneTrend[_compareReverseIndex].custom.dateRange.push(compareDateRange);
    });
  }

  /**
   * highchart 堆疊柱狀圖堆疊順序由上到下為數據陣列前到後，故需將序列反過來
   * @param index {number}-原序列
   */
  getReverseIndex(index: number) {
    return Math.abs(index - 5);
  }

  /**
   * 取得圖表數據
   */
  get chartData() {
    return this._hrZoneTrend;
  }
}
