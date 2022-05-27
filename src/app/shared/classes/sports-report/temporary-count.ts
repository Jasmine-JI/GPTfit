import { mathRounding } from '../../utils/index';
import { isAvgData } from '../../utils/sports';


/**
 * 計算同一時間範圍數據用
 */
 export class TemporaryCount {

  private _countObj = {};


  private _totalActivities = 0;


  private _startTime: number = 0;


  private _endTime: number = 0;

  /**
   * 將變數初始化
   */
  init() {
    this._countObj = {};
    this._totalActivities = 0;
    this._startTime = 0;
    this._endTime = 0;
  }

  /**
   * 將各數據加總
   * @param data {any}-一個日期範圍內的一個運動類別數據
   */
  countData(data: any) {    
    const isSpecialData = (str: string, keyword: string) => !isAvgData(str) && str.toLowerCase().includes(keyword);
    const excludeKey = ['type', 'weightTrainingInfo'];
    const { totalActivities } = data;
    this._totalActivities += totalActivities;
    for (let _key in data) {
      
      if (!excludeKey.includes(_key)) {
        const value = Math.abs(+data[_key] ?? 0);

        // 處理舊有數據正負值與該數據類型牴觸的情形（球類）
        const checkValue = isSpecialData(_key, 'min') ? -value : value;

        // 確認是否為最大或最小類型的數據（球類）
        if (isSpecialData(_key, 'max')) {
          if ((this._countObj[_key] ?? 0) < checkValue) this._countObj[_key] = checkValue;
        } else if (isSpecialData(_key, 'mini')) {
          if ((this._countObj[_key] ?? Infinity) > checkValue) this._countObj[_key] = checkValue;
        } else {
          // 平均數據需依運動數目加權回來再進行加總
          const totalValue = isAvgData(_key) ? checkValue * totalActivities : checkValue;
          this._countObj[_key] = this._countObj[_key] ? this._countObj[_key] + totalValue : totalValue;
        }

      } else if (_key === 'weightTrainingInfo') {
        const currentInfo = this._countObj[_key];
        const info = data[_key];
        this._countObj[_key] = currentInfo ? currentInfo.concat(info) : info;
      }

    }

  }

  /**
   * 將加總的平均數據依運動數目進行均化
   */
  handleDataAverage(obj: any) {
    let result = {};
    for (let _key in obj) {
      const totalValue = obj[_key];
      result[_key] = _key === 'weightTrainingInfo' ?
        totalValue : mathRounding(isAvgData(_key) ? totalValue / this._totalActivities : totalValue, 1);
    }

    return result;
  }

  /**
   * 儲存日期範圍供比對用
   * @param start {number}-開始時間(timestamp)
   * @param end {number}-結束時間(timestamp)
   */
  saveDate(start: number, end: number) {
    this._startTime = start;
    this._endTime = end;
  }

  /**
   * 取得目前數據所屬日期範圍
   */
  get dateRange() {
    return { startTime: this._startTime, endTime: this._endTime };
  }

  /**
   * 取得運動數目
   */
  get totalActivities() {
    return this._totalActivities;
  }

  /**
   * 取得結果
   */
  get result() {
    return {
      activities: this.handleDataAverage(this._countObj),
      startTime: this._startTime,
      endTime: this._endTime
    };

  }

}