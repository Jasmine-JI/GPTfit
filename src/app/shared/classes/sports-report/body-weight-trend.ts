import { trendChartColor } from '../../models/chart-data';
import { deepCopy } from '../../utils/index';

/**
 * 個人體重相關趨勢圖數據
 */
export class BodyWeightTrend {
  /**
   * 儲存數值以取代0或null之值
   */
  private _filler = {
    baseFatRate: null,
    baseWeight: null,
    compareFatRate: null,
    compareWeight: null,
  };

  /**
   * 圖表所需數據
   */
  private _trendData = [
    {
      name: 'baseFatRate',
      linkedTo: 'baseBodyWeight',
      color: trendChartColor.bodyWeightTrend.base,
      dashStyle: 'longdash',
      data: [],
      yAxis: 1,
      marker: {
        enabled: false,
      },
    },
    {
      name: 'baseBodyWeight',
      id: 'baseBodyWeight',
      showInLegend: false,
      color: trendChartColor.bodyWeightTrend.base,
      data: [],
      marker: {
        enabled: false,
      },
    },
  ];

  constructor(isCompareMode: boolean) {
    if (isCompareMode) this.addCompareModel();
  }

  /**
   * 加入比較模式所需之物件模組
   */
  addCompareModel() {
    const [baseFatRateModel, baseWeightModel] = deepCopy(this._trendData);
    const { compare } = trendChartColor.bodyWeightTrend;
    const compareFatRateModel = {
      ...baseFatRateModel,
      name: 'compareFatRate',
      linkedTo: 'compareBodyWeight',
      color: compare,
    };

    const compareWeightModel = {
      ...baseWeightModel,
      name: 'compareBodyWeight',
      id: 'compareBodyWeight',
      color: compare,
    };

    this._trendData = this._trendData.concat([compareFatRateModel, compareWeightModel]);
  }

  /**
   * 儲存體重、體脂與時間範圍數據，若數據非零或null，則回溯替換前面數值為0之數據
   * @param weight {number}-體重
   * @param fatRate {number}-體脂
   * @param dateRange {Array<number>}-該數據日期範圍
   */
  addBaseData(weight: number, fatRate: number, dateRange: Array<number>) {
    const [fatRateInfo, weightInfo] = this._trendData;
    const { baseFatRate, baseWeight } = this._filler;
    if (weight) {
      // 將之前為0之體重以目前數值進行替代
      if (!baseWeight) {
        weightInfo.data = weightInfo.data.map((_data) => {
          _data.y = weight;
          return _data;
        });
      }

      this._filler.baseWeight = weight;
    }

    if (fatRate) {
      if (!baseFatRate) {
        fatRateInfo.data = fatRateInfo.data.map((_data) => {
          _data.y = fatRate;
          return _data;
        });
      }

      this._filler.baseFatRate = fatRate;
    }

    weightInfo.data.push({
      x: dateRange[0],
      y: weight ? weight : baseWeight ?? 0,
      additionalInfo: dateRange,
    });
    fatRateInfo.data.push({
      x: dateRange[0],
      y: fatRate ? fatRate : baseFatRate ?? 0,
      additionalInfo: dateRange,
    });
  }

  /**
   * 儲存基準與比較之體重、體脂與時間範圍數據，若數據非零或null，則回溯替換前面數值為0之數據
   * @param baseData {any}-基準數據
   * @param compareData {any}-比較數據
   */
  addMixData(baseData: any, compareData: any) {
    const checkValue = (info: any, fillerKey: string, value: number) => {
      if (!value) return info;

      // 若filler該值為0或undefined，則代表之前體重或體脂都無數據
      if (!this._filler[fillerKey]) {
        info.data = info.data.map((_data) => {
          _data.y = value;
          return _data;
        });
      }

      this._filler[fillerKey] = value;
      return info;
    };

    let [baseFatRateInfo, baseWeightInfo, compareFatRateInfo, compareWeightInfo] = this._trendData;
    const {
      fatRate: baseFatRateValue,
      weight: baseWeightValue,
      dateRange: baseDateRange,
    } = baseData;
    const {
      fatRate: compareFatRateValue,
      weight: compareWeightValue,
      dateRange: compareDateRange,
    } = compareData;
    const { baseFatRate, baseWeight, compareFatRate, compareWeight } = this._filler;
    baseWeightInfo = checkValue(baseWeightInfo, 'baseWeight', baseWeightValue);
    baseFatRateInfo = checkValue(baseFatRateInfo, 'baseFatRate', baseFatRateValue);
    compareWeightInfo = checkValue(compareWeightInfo, 'compareWeight', compareWeightValue);
    compareFatRateInfo = checkValue(compareFatRateInfo, 'compareFatRate', compareFatRateValue);

    baseWeightInfo.data.push({
      y: baseWeightValue ? baseWeightValue : baseWeight ?? 0,
      additionalInfo: baseDateRange,
    });
    baseFatRateInfo.data.push({
      y: baseFatRateValue ? baseFatRateValue : baseFatRate ?? 0,
      additionalInfo: baseDateRange,
    });
    compareWeightInfo.data.push({
      y: compareWeightValue ? compareWeightValue : compareWeight ?? 0,
      additionalInfo: compareDateRange,
    });
    compareFatRateInfo.data.push({
      y: compareFatRateValue ? compareFatRateValue : compareFatRate ?? 0,
      additionalInfo: compareDateRange,
    });
  }

  /**
   * 取得圖表數據與設定值
   */
  get chartData() {
    return this._trendData;
  }
}
