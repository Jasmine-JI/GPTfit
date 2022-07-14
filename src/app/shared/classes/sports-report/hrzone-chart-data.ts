/**
 * 處理心率區間數據(用於心率佔比圖)
 */
 export class HrZoneChartData {

  private _hrZone = [0, 0, 0, 0, 0, 0];

  /**
   * 統計各心率區間數據
   * @param count 
   */
  add(data: Array<number>) {
    if (data[0] !== null) this._hrZone = this._hrZone.map((_second, _index) => _second + data[_index]);
  }

  /**
   * 取得心率區間數據
   */
  get chartData() {
    return this._hrZone;
  }

}