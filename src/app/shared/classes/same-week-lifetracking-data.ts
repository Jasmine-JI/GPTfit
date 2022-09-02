import { mathRounding } from '../utils/index';
import {
  lastestTypeKey,
  avgTypeKey,
  maxTypeKey,
  miniTypeKey,
  totalTypeKey,
} from '../models/lifetracking-merge-type';

export class SameWeekLifeTrackingData {
  private _data: any = null;

  /**
   * 用來分別針對每個需要平均的數據類別，紀錄總次數以計算平均值
   */
  private _avgDenominator = new Map();

  /**
   * 取得數據起始日期
   */
  get startTime() {
    return this._data.startTime;
  }

  /**
   * 取得合併結果
   */
  get result() {
    return this._data;
  }

  /**
   * 取得是否有合併中數據
   */
  get haveMergingData() {
    return this._data !== null;
  }

  /**
   * 將參數初始化
   */
  init() {
    this._data = null;
    this._avgDenominator.clear();
  }

  /**
   * 開始合併下一個時間範圍的數據
   * @param data {any}-生活追蹤數據
   */
  next(data: any) {
    this._data = data;
    this._avgDenominator.clear();
  }

  /**
   * 依照數據類別依不同方法合併生活追蹤數據
   * @param data {any}-生活追蹤數據
   */
  mergeData(data: any) {
    const prevData = this._data;
    for (const _key in data) {
      const _prevValue = prevData[_key];
      const _currentValue = data[_key];
      if (_currentValue !== null) {
        if (avgTypeKey.includes(_key)) {
          const assignPrevCount = this._avgDenominator.get(_key) ?? 1;
          const numerator = +_prevValue * assignPrevCount + +_currentValue;
          const denominator = (_prevValue !== null ? assignPrevCount : 0) + 1;
          prevData[_key] = mathRounding(numerator / (denominator ? denominator : Infinity), 5);
          this._avgDenominator.set(_key, denominator);
        } else if (maxTypeKey.includes(_key)) {
          this._data[_key] = _currentValue > _prevValue ? _currentValue : _prevValue;
        } else if (miniTypeKey.includes(_key)) {
          this._data[_key] = _currentValue < _prevValue ? _currentValue : _prevValue;
        } else if (totalTypeKey.includes(_key)) {
          this._data[_key] = _currentValue + (_prevValue || 0);
        } else if (lastestTypeKey.includes(_key)) {
          this._data[_key] = _currentValue;
        }
      }
    }
  }
}
