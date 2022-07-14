import { deepCopy } from '../../utils/index';

/**
 * 比較趨勢圖
 */
 export class CompareTrendData {

  /**
   * 用來標註目標線(yAxis.plotLines)
   */
  private _target: number;

  /**
   * 顏色設定
   */
  private _colorOption: any;

  /**
   * 圖表所需數據與設定
   */
  private _trendData = [{
    color: {
      linearGradient: {
        x1: 0,
        x2: 0,
        y1: 0,
        y2: 1
      },
      stops: <Array<any>>[]
    },
    showInLegend: false,
    custom: {
      dateRange: <Array<any>>[]
    },
    data: <Array<any>>[]
  }];

  constructor(isCompareMode: boolean, colorOption: any) {
    this._colorOption = colorOption;
    isCompareMode ? this.initCompareOption(colorOption) : this.initNormalOption(colorOption);
  }

  /**
   * 非比較模式的圖表設定值
   * @param colorOption {any}-柱狀圖顏色設定
   */
  initNormalOption(colorOption: any) {
    const { top, bottom } = colorOption.base;
    this._trendData[0].color.stops = [
      [0, top],
      [1, bottom]
    ];

  }

  /**
   * 比較模式的圖表設定值
   * @param colorOption {any}-柱狀圖顏色設定
   */
  initCompareOption(colorOption: any) {
    const { base, compare } = colorOption;
    const optionModel = deepCopy(this._trendData[0]);
    this._trendData.push(optionModel);
    this._trendData[0].color.stops = [[0, base.top], [1, base.bottom]];
    this._trendData[1].color.stops = [[0, compare.top], [1, compare.bottom]];
  }

  /**
   * 將單筆數據與日期範圍加至圖表數據陣列中
   * @param data {number}-數據
   * @param dateRange {Array<number>}-該筆數據所屬時間
   */
  addBaseData(data: number, dateRange: Array<number>) {
    this._trendData[0].data.push([dateRange[0], data || 0]);
    this._trendData[0].custom.dateRange.push(dateRange);
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
    this._trendData[0].data.push(baseData || 0);
    this._trendData[0].custom.dateRange.push(baseDateRange);
    this._trendData[1].data.push(compareData || 0);
    this._trendData[1].custom.dateRange.push(compareDateRange);
  }

  /**
   * 儲存目標值
   * @param value {number}-目標值
   */
  set target(value: number) {
    this._target = value;
  }

  /**
   * 取得目標值
   */
  get target() {
    return this._target;
  }

  /**
   * 取得顏色設定
   */
  get colorOption() {
    return this._colorOption;
  }

  /**
   * 取得圖表數據與設定值
   */
  get chartData() {
    return this._trendData;
  }

  /**
   * 取得基準數據長度
   */
  get baseDataLength() {
    return this._trendData[0]?.data?.length;
  }

  /**
   * 取得比較數據長度
   */
  get compareDataLength() {
    return this._trendData[1]?.data?.length;
  }

}

