
/**
 * 處理Array<Object>數據排序相關
 */
export class SportAnalysisSort {

  /**
   * 是否為群組分析資料
   */
  private _isGroupAnalysis = false;

  /**
   * 陣列數據
   */
  private _data: Array<any>;

  /**
   * 排序方向
   */
  private _isAscending = false;

  /**
   * 排序依據
   */
  private _type: string = 'name';

  constructor(data: Array<any>, sortType: 'targetAchievedPeople' | 'memberName') {
    this._data = data;
    this._type = sortType;
    this._isGroupAnalysis = sortType === 'targetAchievedPeople';
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
    const { _type, _isGroupAnalysis } = this;
    switch (_type) {
      case 'groupName':
      case 'memberName':
        this.sortName();
        break;
      case 'targetAchievedPeople':
        this.sortAchievedRate();
        break;
      case 'activityPeople':
        this.sortNormalData();
        break;
      default:
        _isGroupAnalysis ? this.sortPersonAvgData() : this.sortNormalData();
        break;
    }

  }

  /**
   * 將名稱進行排序
   */
  sortName() {
    const { _isAscending, _type } = this;
    this._data.sort((a, b) => {
      const aFirstCharCode = a[_type].charCodeAt(0);
      const bFirstCharCode = b[_type].charCodeAt(0);
      return _isAscending ? aFirstCharCode - bFirstCharCode : bFirstCharCode - aFirstCharCode;
    });
  }

  /**
   * 依據總人數計算達成率後，依達成率進行排序(團體分析)
   */
  sortAchievedRate() {
    const { _isAscending, _type } = this;
    this._data.sort((a, b) => {
      const aTotalPeople = a.totalPeople;
      const bTotalPeople = b.totalPeople;
      const aValue = aTotalPeople ? (a.base[_type] || 0) / aTotalPeople : 0;
      const bValue = bTotalPeople ? (b.base[_type] || 0) / bTotalPeople : 0;
      return _isAscending ? aValue - bValue : bValue - aValue;
    });
  }

  /**
   * 針對群組人均數據進行排序(以活動人數計算人均)
   */
  sortPersonAvgData() {
    const { _isAscending, _type } = this;
    this._data.sort((a, b) => {
      const aActivityPeople = a.base.activityPeople;
      const bActivityPeople = b.base.activityPeople;
      const aValue = aActivityPeople ? (a.base[_type] || 0) / aActivityPeople : 0;
      const bValue = bActivityPeople ? (b.base[_type] || 0) / bActivityPeople : 0;
      return _isAscending ? aValue - bValue : bValue - aValue;
    });
  }

  /**
   * 針對一般數據進行排序
   */
  sortNormalData() {
    const { _isAscending, _type } = this;
    this._data.sort((a, b) => {
      const aValue = a.base[_type] || 0;
      const bValue = b.base[_type] || 0;
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