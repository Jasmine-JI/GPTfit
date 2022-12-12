import { getAvgCadenceI18nKey, getMaxCadenceI18nKey } from '../../../core/utils/sports';
import { trendChartColor } from '../../models/chart-data';
import { SportType } from '../../enum/sports';
import { deepCopy } from '../../../core/utils/index';

/**
 * 用於個人最大與平均(或反向最大)趨勢圖表
 */
export class ComplexTrend {
  /**
   * [基準時間範圍最大值, 基準時間平均(或反向最大)值, 比較時間範圍最大值, 比較時間範圍平均(或反向最大)值]
   */
  private _trendData: Array<any> = [
    {
      name: '',
      linkedTo: 'base',
      color: 'green',
      pointPlacement: 0.1,
      data: [],
    },
    {
      name: '',
      id: 'base',
      showInLegend: false,
      color: 'blue',
      data: [],
    },
  ];

  constructor(sportType: SportType, chartType: string, isCompareMode: boolean) {
    this.checkDataType(sportType, chartType, isCompareMode);
  }

  /**
   * 根據數據類別處理圖表名稱與顏色
   * @param sportType {SportType}-運動類別
   * @param chartType {string}-數據類別
   * @param isCompareMode {boolean}-是否為比較模式
   */
  checkDataType(sportType: SportType, chartType: string, isCompareMode: boolean) {
    const { complexHrTrend, speedPaceTrend, powerTrend, cadenceTrend, gForceTrend } =
      trendChartColor;
    const [maxInfo, avgOrMinInfo] = this._trendData;
    switch (chartType) {
      case 'hr':
        Object.assign(maxInfo, {
          name: 'universal_userProfile_maxHr',
          color: complexHrTrend.base.max,
        });
        Object.assign(avgOrMinInfo, {
          name: 'universal_activityData_avgHr',
          color: complexHrTrend.base.avg,
        });
        if (isCompareMode) this.addCompareModel(complexHrTrend.compare);
        break;
      case 'speedPace':
        Object.assign(maxInfo, {
          name: 'universal_activityData_maxSpeed',
          color: speedPaceTrend.base.max,
        });
        Object.assign(avgOrMinInfo, {
          name: 'universal_activityData_avgSpeed',
          color: speedPaceTrend.base.avg,
        });
        if (isCompareMode) this.addCompareModel(speedPaceTrend.compare);
        break;
      case 'cadence':
        Object.assign(maxInfo, {
          name: getMaxCadenceI18nKey(sportType),
          color: cadenceTrend.base.max,
        });
        Object.assign(avgOrMinInfo, {
          name: getAvgCadenceI18nKey(sportType),
          color: cadenceTrend.base.avg,
        });
        if (isCompareMode) this.addCompareModel(cadenceTrend.compare);
        break;
      case 'power':
        Object.assign(maxInfo, {
          name: 'universal_activityData_maxPower',
          color: powerTrend.base.max,
        });
        Object.assign(avgOrMinInfo, {
          name: 'universal_activityData_avgPower',
          color: powerTrend.base.avg,
        });
        if (isCompareMode) this.addCompareModel(powerTrend.compare);
        break;
      case 'maxXGForce':
        maxInfo.pointPlacement = 0;
        Object.assign(maxInfo, {
          name: 'universal_activityData_maxRight',
          color: gForceTrend.base.max,
        });
        Object.assign(avgOrMinInfo, {
          name: 'universal_activityData_maxLeft',
          color: gForceTrend.base.min,
        });
        if (isCompareMode) this.addCompareModel(gForceTrend.compare);
        maxInfo.stack = 'base';
        avgOrMinInfo.stack = 'base';
        break;
      case 'maxYGForce':
        maxInfo.pointPlacement = 0;
        Object.assign(maxInfo, {
          name: 'universal_activityData_maxAcceleration',
          color: gForceTrend.base.max,
        });
        Object.assign(avgOrMinInfo, {
          name: 'universal_activityData_maxImpact',
          color: gForceTrend.base.min,
        });
        if (isCompareMode) this.addCompareModel(gForceTrend.compare);
        maxInfo.stack = 'base';
        avgOrMinInfo.stack = 'base';
        break;
      case 'maxZGForce':
        maxInfo.pointPlacement = 0;
        Object.assign(maxInfo, {
          name: 'universal_activityData_maxJump',
          color: gForceTrend.base.max,
        });
        Object.assign(avgOrMinInfo, {
          name: 'universal_activityData_maxFloorImpact',
          color: gForceTrend.base.min,
        });
        if (isCompareMode) this.addCompareModel(gForceTrend.compare);
        maxInfo.stack = 'base';
        avgOrMinInfo.stack = 'base';
        break;
    }
  }

  /**
   * 加入比較模式所需之物件模組
   * @param colorSetting { { max: string; avg?: string; min?: string } }-圖表顏色設定
   */
  addCompareModel(colorSetting: { max: string; avg?: string; min?: string }) {
    const [baseMaxModel, baseAvgModel] = deepCopy(this._trendData);
    const { max: maxColor, avg: avgColor, min: minColor } = colorSetting;
    const compareMaxModel = {
      ...baseMaxModel,
      linkedTo: 'compare',
      color: maxColor,
    };

    const compareAvgModel = {
      ...baseAvgModel,
      id: 'compare',
      color: avgColor ?? minColor,
    };

    this._trendData = this._trendData.concat([compareMaxModel, compareAvgModel]);
  }

  /**
   * 將單筆數據與日期範圍加至圖表數據陣列中
   * @param max {number}-最大值
   * @param avgOrMin {number}-平均值或最小值
   * @param dateRange {Array<number>}-該筆數據所屬時間
   */
  addBaseData(max: number, avgOrMin: number, dateRange: Array<number>) {
    const [maxObj, avgOrMinObj] = this._trendData;
    const startDate = dateRange[0];
    maxObj.data.push({ x: startDate, y: max ?? 0, additionalInfo: dateRange });
    avgOrMinObj.data.push({ x: startDate, y: avgOrMin ?? 0, additionalInfo: dateRange });
  }

  /**
   * 將 基準/比較 數據與日期範圍加至圖表數據陣列中
   * @param baseData {number}-基準數據與日期
   * @param compareData {number}-基準數據與日期
   */
  addMixData(baseData: any, compareData: any) {
    const [baseMaxObj, baseAvgOrMinObj, compareMaxObj, compareAvgOrMinObj] = this._trendData;
    const { max: baseMax, avgOrMin: baseAvgOrMin, dateRange: baseDateRange } = baseData;
    const { max: compareMax, avgOrMin: compareAvgOrMin, dateRange: compareDateRange } = compareData;
    baseMaxObj.data.push({ y: baseMax ?? 0, additionalInfo: baseDateRange });
    baseAvgOrMinObj.data.push({ y: baseAvgOrMin ?? 0, additionalInfo: baseDateRange });
    compareMaxObj.data.push({ y: compareMax ?? 0, additionalInfo: compareDateRange });
    compareAvgOrMinObj.data.push({ y: compareAvgOrMin ?? 0, additionalInfo: compareDateRange });
  }

  /**
   * 取得圖表數據與設定值
   */
  get chartData() {
    return this._trendData;
  }
}
