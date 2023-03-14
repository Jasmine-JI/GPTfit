/**
 * 用來處理多項數據個別加總
 */
export class AnalysisCount {
  private count: Array<number> = [];

  constructor(initValue: Array<number>) {
    this.count = initValue;
  }

  /**
   * 將各項數據進行加總
   * @param value {Array<number>}-欲進行加總的數據
   */
  add(value: Array<number>) {
    this.count = this.count.map((_count, _index) => {
      return _count + value[_index];
    });
  }

  /**
   * 取得計算結果
   */
  get result() {
    return this.count;
  }

  /**
   * 取得總數
   */
  get totalCount() {
    return this.count.reduce((_previousValue, _currentValue) => {
      return _previousValue + _currentValue;
    }, 0);
  }
}
