import { DateUnit } from '../enum/report';
import { PageType } from '../models/report-condition';
import { DAY, MONTH, WEEK, SEASON, YEAR } from '../models/utils-constant';

/**
 * 處理時間範圍單位
 */
export class ReportDateUnit {

  private _dateUnit: DateUnit;

  constructor(unit: DateUnit) {
    this.unit = unit;
  }

  /**
   * 儲存時間範圍單位
   * @param unit {DateUnit}-時間範圍單位
   */
  set unit(unit: DateUnit) {
    this._dateUnit = unit;
  }

  /**
   * 取得時間範圍單位（enum）
   */
  get unit() {
    return this._dateUnit;
  }

  /**
   * 取得時間範圍單位(string)（用於dayjs）
   * 如需使用dayjs quarter相關參數，則需引入plugin
   * import quarterOfYear from 'dayjs/plugin/quarterOfYear';
   * dayjs.extend(quarterOfYear);
   */
  getUnitString(): any {
    switch (this._dateUnit) {
      case DateUnit.day:
        return 'day';
      case DateUnit.week:
        return 'week';
      case DateUnit.month:
        return 'month';
      case DateUnit.season:
        return 'quarter';
      case DateUnit.year:
        return 'year';
    }

  }

  /**
   * 取得目前使用之時間單位的多國語系翻譯的鍵
   */
  getUnitI18nKey() {
    switch (this._dateUnit) {
      case DateUnit.day:
        return 'universal_time_day';
      case DateUnit.week:
        return 'universal_time_week';
      case DateUnit.month:
        return 'universal_time_months';
      case DateUnit.season:
        return 'universal_system_season';
      case DateUnit.year:
        return 'universal_time_year';
    }
  }

  /**
   * 取得報告時間範圍單位（用於api 2104/2107）
   */
  get reportDateType() {
    switch (this._dateUnit) {
      case DateUnit.year:
      case DateUnit.season:
      case DateUnit.month:
        return DateUnit.month;
      default:
        return this._dateUnit;
    }

  }

  /**
   * 取得報告時間範圍
   */
  get reportDatePeroid() {
    switch (this._dateUnit) {
      case DateUnit.year:
        return YEAR;
      case DateUnit.season:
        return SEASON;
      case DateUnit.month:
        return MONTH;
      case DateUnit.week:
        return WEEK;
      case DateUnit.day:
        return DAY;
    }

  }

  /**
   * 根據報告類別與日期範圍單位，回傳api 使用的 key
   * @param type {PageType}
   */
  getReportKey(type: PageType) {
    let dayRange: string;
    switch (this._dateUnit) {
      case DateUnit.year:
      case DateUnit.season:
      case DateUnit.month:
        dayRange = 'Months';
        break;
      case DateUnit.week:
        dayRange = 'Weeks';
        break;
      default:
        dayRange = 'Days';
        break;
    }

    return type === 'sportsReport' ? `reportActivity${dayRange}` : `reportLifeTracking${dayRange}`;
  }

}