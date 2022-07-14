/**
 * 處理重訓動作分析數據排序相關
 */
export class WeightTrainingAnalysisSort {

  /**
   * 陣列數據
   */
  private _data: Array<any>;

  /**
   * 排序方向
   */
  private _isAscending = true;

  /**
   * 排序依據
   */
  private _type: string;

  constructor(data: Array<any>, sortType: string = 'trainingName') {
    this._data = data;
    this._type = sortType;
    this.sortData();
  }

  /**
  * 設定排序方向
  */
  changeOrder() {
    this._isAscending = !this._isAscending;
    this.sortData();
  }

  /**
   * 取得排序方向
   */
  get isAscending() {
    return this._isAscending;
  }

  /**
   * 設定排序依據
   */
  changeSortType(type: string) {
    this._type = type;
    this.sortData();
  }

  /**
   * 取得排序依據
   */
  get sortType() {
    return this._type;
  }

  /**
   * 是否使用目前欄位進行排序
   */
  isSorting(type: string) {
    return this._type === type;
  }

  /**
   * 根據排序依據與排序方向進行排序（僅以基準日期進行排序）
   */
  sortData() {
    const { _type } = this;
    switch (_type) {
      case 'trainingName':
        this.sortIndex();
        break;
      default:
        this.sortNormalData();
        break;
    }

  }

  /**
   * 根據重訓動作編號進行排序
   */
  sortIndex() {
    const { _isAscending } = this;
    this._data.sort((a, b) => {
      const aIndex = +a[0];
      const bIndex = +b[0];
      return _isAscending ? aIndex - bIndex : bIndex - aIndex;
    });
  }

  /**
   * 針對一般數據進行排序
   */
  sortNormalData() {
    const { _isAscending, _type } = this;
    this._data.sort((a, b) => {
      const aValue = +a[1].base[_type] || 0;
      const bValue = +b[1].base[_type] || 0;
      return _isAscending ? aValue - bValue : bValue - aValue;
    });

  }

  /**
   * 取得數據
   */
  get data() {
    return this._data;
  }

}