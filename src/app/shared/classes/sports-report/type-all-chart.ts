import { SportType } from '../../../core/enums/sports';
import { mathRounding } from '../../../core/utils';

/**
 * 不分運動類別時處理佔比圖表數據與成效分佈圖
 */
export class TypeAllChart {
  /**
   * 成效分佈圖用數據
   */
  private _dotList = [];

  /**
   * 數量佔比圖數據
   */
  private _activitiesStatistics = [0, 0, 0, 0, 0, 0, 0];

  /**
   * 時間佔比圖數據
   */
  private _totalSecondStatistics = [0, 0, 0, 0, 0, 0, 0];

  /**
   * 統計各圖表所需數據
   * @param data {{ type: SportType; totalSecond: number; totalActivities: number; avgHeartRateBpm: number; }}
   */
  count(data: {
    type: SportType;
    totalSecond: number;
    totalActivities: number;
    avgHeartRateBpm: number;
  }) {
    const { type, totalSecond, totalActivities, avgHeartRateBpm } = data;
    const index = +type - 1;
    this._activitiesStatistics[index] += +totalActivities;
    this._totalSecondStatistics[index] += +totalSecond;
    this._dotList.push({
      sportType: +type,
      avgSecond: mathRounding(+totalSecond / +totalActivities, 0),
      avgHeartRateBpm,
    });
  }

  /**
   * 取得統計數據
   */
  get activitiesStatistics() {
    return this._activitiesStatistics;
  }

  /**
   * 取得統計數據
   */
  get totalSecondStatistics() {
    return this._totalSecondStatistics;
  }

  /**
   * 取得分佈圖數據
   */
  get dotList() {
    return this._dotList;
  }
}
