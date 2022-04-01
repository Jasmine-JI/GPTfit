import { SportType } from '../enum/sports';


/**
 * 統計個人運動偏好
 */
export class PreferSportType {

  private _sportTypestatistics = {};

  /**
   * 更新運動類別次數
   */
  countType(type: SportType, count: number) {
    const { _sportTypestatistics } = this;
    this._sportTypestatistics[type] = (_sportTypestatistics[type] ?? 0) + count;
  }

  /**
   * 取得次數前三多的運動類別
   */
  get preferSport() {
    const sortType = Object.entries(this._sportTypestatistics)
      .sort((_a, _b) => {
        const [_aKey, _aValue] = _a;
        const [_bKey, _bValue] = _b;
        return (_bValue as number) - (_aValue as number);
      })
      .map(_result => {
        const [_key, _value] = _result;
        return +_key;
      });

    return sortType.slice(0, 3);
  }

}