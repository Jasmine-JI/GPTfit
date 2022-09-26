import { MuscleGroup } from '../../enum/weight-train';

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
  private _type = 'name';

  constructor(
    data: Array<any>,
    sortType: 'targetAchievedPeople' | 'memberName',
    isGroupAnalysis: boolean
  ) {
    this._data = data;
    this._type = sortType;
    this._isGroupAnalysis = isGroupAnalysis;
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
        this._isGroupAnalysis ? this.sortAchievedRate() : this.sortTargetAchievedRate();
        break;
      case 'activityPeople':
        this.sortNormalData();
        break;
      case 'preferMuscle':
        this.sortPreferMuscle();
        break;
      case 'armMuscle':
        this.sortMuscleData(MuscleGroup.armMuscle);
        break;
      case 'pectoralsMuscle':
        this.sortMuscleData(MuscleGroup.pectoralsMuscle);
        break;
      case 'shoulderMuscle':
        this.sortMuscleData(MuscleGroup.shoulderMuscle);
        break;
      case 'backMuscle':
        this.sortMuscleData(MuscleGroup.backMuscle);
        break;
      case 'abdominalMuscle':
        this.sortMuscleData(MuscleGroup.abdominalMuscle);
        break;
      case 'legMuscle':
        this.sortMuscleData(MuscleGroup.legMuscle);
        break;
      case 'preferSports':
        this.sortPreferSports();
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
   * 根據使用者第一偏好運動進行排序
   */
  sortPreferSports() {
    const { _isAscending } = this;
    this._data.sort((a, b) => {
      const aPrefer = a.base.preferSports;
      const aFirstPrefer = aPrefer && aPrefer.length > 0 ? aPrefer[0] : 0;
      const bPrefer = b.base.preferSports;
      const bFirstPrefer = bPrefer && bPrefer.length > 0 ? bPrefer[0] : 0;

      // 無運動資料者必排最後
      return aFirstPrefer > 0
        ? _isAscending
          ? aFirstPrefer - bFirstPrefer
          : bFirstPrefer - aFirstPrefer
        : 1;
    });
  }

  /**
   * 根據使用者第一偏好肌群進行排序
   */
  sortPreferMuscle() {
    const { _isAscending } = this;
    this._data.sort((a, b) => {
      const aPrefer = a.base.preferMuscleGroup;
      const aFirstPrefer = aPrefer && aPrefer.length > 0 ? aPrefer[0] : 0;
      const bPrefer = b.base.preferMuscleGroup;
      const bFirstPrefer = bPrefer && bPrefer.length > 0 ? bPrefer[0] : 0;

      // 無重訓資料者必排最後
      return aFirstPrefer > 0
        ? _isAscending
          ? aFirstPrefer - bFirstPrefer
          : bFirstPrefer - aFirstPrefer
        : 1;
    });
  }

  /**
   * 根據指定的肌群重訓數據進行排序
   * @param muscle {MuscleGroup}-肌群
   */
  sortMuscleData(muscle: MuscleGroup) {
    const countWeight = (data: Array<number>) => data.reduce((prev, current) => prev * current);
    const { _isAscending } = this;
    this._data.sort((a, b) => {
      const aBaseData = a.base.muscleGroupData;
      const bBaseData = b.base.muscleGroupData;
      const aWeight = countWeight(aBaseData ? aBaseData[muscle] : [0, 0, 0]);
      const bWeight = countWeight(bBaseData ? bBaseData[muscle] : [0, 0, 0]);
      return _isAscending ? aWeight - bWeight : bWeight - aWeight;
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
   * 針對個人達成率進行排序
   */
  sortTargetAchievedRate() {
    const key = 'targetAchieveRate';
    this._data.sort((a, b) => {
      const aValue = a.base[key] || 0;
      const bValue = b.base[key] || 0;
      return this._isAscending ? aValue - bValue : bValue - aValue;
    });
  }

  /**
   * 取得數據
   */
  get data() {
    return this._data;
  }
}
