import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
import { DateRangeType } from '../models/report-condition';

dayjs.extend(isoWeek);

/**
 * 提供特定時間範圍之值(timestamp)
 */
export class DefaultDateRange {
  /**
   * 取得今日時間範圍
   */
  static getToday() {
    const dateRange = {
      startTime: dayjs().startOf('day').valueOf(),
      endTime: dayjs().endOf('day').valueOf(),
    };

    return dateRange;
  }

  /**
   * 取得過去7日時間範圍
   */
  static getSevenDay() {
    const dateRange = {
      startTime: dayjs().subtract(7, 'day').startOf('day').valueOf(),
      endTime: dayjs().subtract(1, 'day').endOf('day').valueOf(),
    };

    return dateRange;
  }

  /**
   * 取得過去30日時間範圍
   */
  static getThirtyDay() {
    const dateRange = {
      startTime: dayjs().subtract(30, 'day').startOf('day').valueOf(),
      endTime: dayjs().subtract(1, 'day').endOf('day').valueOf(),
    };

    return dateRange;
  }

  /**
   * 取得過去6個月時間範圍
   * @param isMondayFirst {boolean}-一週開始日是否為週一
   */
  static getSixMonth(isMondayFirst: boolean | undefined = undefined) {
    const firstDayByMonth = dayjs().subtract(6, 'month').startOf('month');
    const endDayByMonth = dayjs().subtract(1, 'month').endOf('month');
    return this.getDateRange(firstDayByMonth, endDayByMonth, isMondayFirst);
  }

  /**
   * 取得本週時間範圍
   * @param isMondayFirst {boolean}-一週開始日是否為週日
   */
  static getThisWeek(isMondayFirst = true) {
    const referenceWeek = isMondayFirst ? 'isoWeek' : 'week';
    const dateRange = {
      startTime: dayjs().startOf(referenceWeek).valueOf(),
      endTime: dayjs().endOf(referenceWeek).valueOf(),
    };

    return dateRange;
  }

  /**
   * 取得本月時間範圍
   * @param isMondayFirst {boolean}-一週開始日是否為週一
   */
  static getThisMonth(isMondayFirst: boolean | undefined = undefined) {
    const firstDayByMonth = dayjs().startOf('month');
    const endDayByMonth = dayjs().endOf('month');
    return this.getDateRange(firstDayByMonth, endDayByMonth, isMondayFirst);
  }

  /**
   * 取得本季時間範圍
   * @param isMondayFirst {boolean}-一週開始日是否為週一
   */
  static getThisSeason(isMondayFirst: boolean | undefined = undefined) {
    const firstDayByMonth = dayjs().startOf('quarter');
    const endDayByMonth = dayjs().endOf('quarter');
    return this.getDateRange(firstDayByMonth, endDayByMonth, isMondayFirst);
  }

  /**
   * 取得今年時間範圍
   * @param isMondayFirst {boolean}-一週開始日是否為週一
   */
  static getThisYear(isMondayFirst: boolean | undefined = undefined) {
    const firstDayByMonth = dayjs().startOf('year');
    const endDayByMonth = dayjs().endOf('year');
    return this.getDateRange(firstDayByMonth, endDayByMonth, isMondayFirst);
  }

  /**
   * 取得上一週時間範圍
   * @param isMondayFirst {boolean}-一週開始日是否為週日
   */
  static getLastWeek(isMondayFirst = true) {
    const referenceWeek = isMondayFirst ? 'isoWeek' : 'week';
    const lastSevenDay = dayjs().subtract(7, 'day');
    const dateRange = {
      startTime: lastSevenDay.startOf(referenceWeek).valueOf(),
      endTime: lastSevenDay.endOf(referenceWeek).valueOf(),
    };

    return dateRange;
  }

  /**
   * 取得上個月時間範圍
   * @param isMondayFirst {boolean}-一週開始日是否為週一
   */
  static getLastMonth(isMondayFirst: boolean | undefined = undefined) {
    const lastMonth = dayjs().subtract(1, 'month');
    const firstDayByMonth = lastMonth.startOf('month');
    const endDayByMonth = lastMonth.endOf('month');
    return this.getDateRange(firstDayByMonth, endDayByMonth, isMondayFirst);
  }

  /**
   * 取得上一季時間範圍
   * @param isMondayFirst {boolean}-一週開始日是否為週一
   */
  static getLastSeason(isMondayFirst: boolean | undefined = undefined) {
    const lastSeason = dayjs().subtract(1, 'quarter');
    const firstDayByMonth = lastSeason.startOf('quarter');
    const endDayByMonth = lastSeason.endOf('quarter');
    return this.getDateRange(firstDayByMonth, endDayByMonth, isMondayFirst);
  }

  /**
   * 取得上一年時間範圍
   * @param isMondayFirst {boolean}-一週開始日是否為週一
   */
  static getLastYear(isMondayFirst: boolean | undefined = undefined) {
    const lastYear = dayjs().subtract(1, 'year');
    const firstDayByMonth = lastYear.startOf('year');
    const endDayByMonth = lastYear.endOf('year');
    return this.getDateRange(firstDayByMonth, endDayByMonth, isMondayFirst);
  }

  /**
   * 取得去年同期時間範圍
   */
  static getSameRangeLastYear(startTime: number, endTime: number) {
    const dateRange = {
      startTime: dayjs(startTime).subtract(1, 'year').startOf('day').valueOf(),
      endTime: dayjs(endTime).subtract(1, 'year').endOf('day').valueOf(),
    };

    return dateRange;
  }

  /**
   * 取得指定時間範圍
   * @param type {DateRangeType}-指定之時間範圍
   * @param isMondayFirst {boolean}-一週開始日是否為週一
   */
  static getAssignRangeDate(type: DateRangeType, isMondayFirst: boolean | undefined = undefined) {
    switch (type) {
      case 'today':
        return DefaultDateRange.getToday();
      case 'sevenDay':
        return DefaultDateRange.getSevenDay();
      case 'thirtyDay':
        return DefaultDateRange.getThirtyDay();
      case 'sixMonth':
        return DefaultDateRange.getSixMonth(isMondayFirst);
      case 'thisWeek':
        return DefaultDateRange.getThisWeek(isMondayFirst);
      case 'thisMonth':
        return DefaultDateRange.getThisMonth(isMondayFirst);
      case 'thisSeason':
        return DefaultDateRange.getThisSeason(isMondayFirst);
      case 'thisYear':
        return DefaultDateRange.getThisYear(isMondayFirst);
      case 'lastWeek':
        return DefaultDateRange.getLastWeek(isMondayFirst);
      case 'lastMonth':
        return DefaultDateRange.getLastMonth(isMondayFirst);
      case 'lastSeason':
        return DefaultDateRange.getLastSeason(isMondayFirst);
      case 'lastYear':
        return DefaultDateRange.getLastYear(isMondayFirst);
      case 'none':
        return null;
      default:
        return DefaultDateRange.getSevenDay();
    }
  }

  /**
   * 確認日期範圍是否為以週為基底，並回傳對應的日期範圍
   * @param tentativeStartDate {dayjs.Dayjs}-預定起始日期
   * @param tentativeEndDate {dayjs.Dayjs}-預定結束日期
   * @param isMondayFirst {boolean | undefined}-一週開始日是否為週一
   */
  static getDateRange(
    tentativeStartDate: dayjs.Dayjs,
    tentativeEndDate: dayjs.Dayjs,
    isMondayFirst: boolean | undefined
  ) {
    if (isMondayFirst !== undefined) {
      const { unit, firstWeekDay, endWeekDay } =
        DefaultDateRange.getDayjsWeekParameter(isMondayFirst);
      const monthFirstDayByWeek = tentativeStartDate.isoWeekday() === firstWeekDay;
      const monthEndDayByWeek = tentativeEndDate.isoWeekday() === endWeekDay;
      return {
        startTime: monthFirstDayByWeek
          ? tentativeStartDate.valueOf()
          : tentativeStartDate.add(1, 'week').startOf(unit).valueOf(),
        endTime: monthEndDayByWeek
          ? tentativeEndDate.valueOf()
          : tentativeEndDate.endOf(unit).valueOf(),
      };
    } else {
      return {
        startTime: tentativeStartDate.valueOf(),
        endTime: tentativeEndDate.valueOf(),
      };
    }
  }

  /**
   * 取得dayjs使用的週單位
   * @param isMondayFirst {boolean | undefined}-一週開始日是否為週一
   */
  static getDayjsWeekParameter(isMondayFirst: boolean | undefined) {
    if (isMondayFirst) {
      return { unit: <dayjs.OpUnitType>'isoWeek', firstWeekDay: 1, endWeekDay: 7 };
    } else {
      return { unit: <dayjs.OpUnitType>'week', firstWeekDay: 7, endWeekDay: 6 };
    }
  }
}
