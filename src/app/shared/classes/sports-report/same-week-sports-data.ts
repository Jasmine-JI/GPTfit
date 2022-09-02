import { mathRounding } from '../../utils/index';

export class SameWeekSportsData {
  private _data = new Map();
  private _startTime: string | null = null;
  private _endTime: string | null = null;

  /**
   * 用來分別針對每個需要平均的數據類別，紀錄總次數以計算平均值
   */
  private _avgDenominator = new Map();

  /**
   * 取得數據起始日期
   */
  get startTime() {
    return this._startTime;
  }

  /**
   * 取得此 class 的 map 物件長度
   */
  get size() {
    return this._data.size;
  }

  /**
   * 取得合併結果
   */
  get result() {
    const { _startTime, _endTime, _data } = this;
    return {
      activities: this.getAllMapValue(_data),
      startTime: _startTime,
      endTime: _endTime,
    };
  }

  /**
   * 將參數初始化
   */
  init() {
    this._data.clear();
    this._avgDenominator.clear();
    this._startTime = null;
    this._endTime = null;
  }

  /**
   * 開始合併下一個時間範圍的數據
   * @param data {any}-運動數據
   */
  next(data: any) {
    const { activities, startTime, endTime } = data;
    this._data.clear();
    this._avgDenominator.clear();
    this.mergeData(activities);
    this._startTime = startTime;
    this._endTime = endTime;
  }

  /**
   * 依照數據類別依不同方法合併運動數據
   * @param activities {any}-運動數據
   */
  mergeData(activities: any) {
    const { type } = activities;
    const prevData = this._data.get(type);
    const excludeKey = ['type'];
    if (prevData) {
      const prevData = this._data.get(type);
      const prevTotalActivities = prevData.totalActivities;
      for (const _key in activities) {
        const _prevValue = prevData[_key];
        const _currentValue = activities[_key];
        const _lowerCaseKey = _key.toLowerCase();
        const isAvgKey = _lowerCaseKey.includes('avg');
        const isMaxKey = _lowerCaseKey.includes('max');
        const isMinKey = _lowerCaseKey.includes('mini');
        const isExcludeKey = excludeKey.includes(_key);
        const isWeightTrainInfo = _key === 'weightTrainingInfo';
        if (_currentValue) {
          if (isAvgKey) {
            if (+_currentValue) {
              const assignPrevTotalActivities =
                this._avgDenominator.get(_key) ?? prevTotalActivities;
              const currentTotalActivities = activities.totalActivities;
              const numerator =
                +_prevValue * assignPrevTotalActivities + +_currentValue * currentTotalActivities;
              const denominator =
                (+_prevValue ? assignPrevTotalActivities : 0) + currentTotalActivities;
              prevData[_key] = mathRounding(numerator / (denominator ? denominator : Infinity), 5);
              this._avgDenominator.set(_key, denominator);
            }
          } else if (isMaxKey) {
            prevData[_key] = +_currentValue > +_prevValue ? +_currentValue : +_prevValue;
          } else if (isMinKey) {
            prevData[_key] = +_currentValue < +_prevValue ? +_currentValue : +_prevValue;
          } else if (isWeightTrainInfo) {
            prevData[_key] = this.mergeWeightTrainInfo(prevData[_key], _currentValue);
          } else if (!isExcludeKey) {
            prevData[_key] = +_prevValue + +_currentValue;
          }
        }
      }

      this._data.set(type, prevData);
    } else {
      this._data.set(type, activities);
    }
  }

  /**
   * 合併重訓數據
   * @param prev {Array<any>}-先前已處理的數據
   * @param current {Array<any>}-當前數據
   */
  mergeWeightTrainInfo(prevData: Array<any>, currentData: Array<any>) {
    const mergeMap = new Map();
    prevData.forEach((_prev) => {
      mergeMap.set(_prev.type, _prev);
    });

    currentData.forEach((_currentData) => {
      const { muscle, max1RmWeightKg, totalWeightKg, totalSets, totalReps } = _currentData;
      const samePartData = mergeMap.get(muscle);
      if (samePartData) {
        const {
          max1RmWeightKg: prevMax1RmWeightKg,
          totalWeightKg: prevTotalWeightKg,
          totalSets: prevTotalSets,
          totalReps: prevTotalReps,
        } = samePartData;

        mergeMap.set(muscle, {
          max1RmWeightKg: max1RmWeightKg > prevMax1RmWeightKg ? max1RmWeightKg : prevMax1RmWeightKg,
          totalWeightKg: totalWeightKg + prevTotalWeightKg,
          totalSets: totalSets + prevTotalSets,
          totalReps: totalReps + prevTotalReps,
        });
      } else {
        mergeMap.set(muscle, _currentData);
      }
    });

    return this.getAllMapValue(mergeMap);
  }

  /**
   * 取得 map 物件並轉為 array
   * @param map {Map<string, any>}-map物件
   */
  getAllMapValue(map: Map<string, any>) {
    const result: Array<any> = [];
    map.forEach((_value) => {
      result.push(_value);
    });

    return result;
  }
}
