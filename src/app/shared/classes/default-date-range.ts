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
   */
  static getSixMonth() {
    const dateRange = {
      startTime: dayjs().subtract(6, 'month').startOf('month').valueOf(),
      endTime: dayjs().subtract(1, 'month').endOf('month').valueOf(),
    };

    return dateRange;
  }

  /**
   * 取得本週時間範圍
   * @param sundayFirst {boolean}-一週開始日是否為週日
   */
  static getThisWeek(sundayFirst = true) {
    const referenceWeek = sundayFirst ? 'week' : 'isoWeek';
    const dateRange = {
      startTime: dayjs().startOf(referenceWeek).valueOf(),
      endTime: dayjs().endOf(referenceWeek).valueOf(),
    };

    return dateRange;
  }

  /**
   * 取得本月時間範圍
   */
  static getThisMonth() {
    const dateRange = {
      startTime: dayjs().startOf('month').valueOf(),
      endTime: dayjs().endOf('month').valueOf(),
    };

    return dateRange;
  }

  /**
   * 取得今年時間範圍
   */
  static getThisYear() {
    const dateRange = {
      startTime: dayjs().startOf('year').valueOf(),
      endTime: dayjs().endOf('year').valueOf(),
    };

    return dateRange;
  }

  /**
   * 取得上一週時間範圍
   * @param sundayFirst {boolean}-一週開始日是否為週日
   */
  static getLastWeek(sundayFirst = true) {
    const referenceWeek = sundayFirst ? 'week' : 'isoWeek';
    const lastSevenDay = dayjs().subtract(7, 'day');
    const dateRange = {
      startTime: lastSevenDay.startOf(referenceWeek).valueOf(),
      endTime: lastSevenDay.endOf(referenceWeek).valueOf(),
    };

    return dateRange;
  }

  /**
   * 取得上個月時間範圍
   */
  static getLastMonth() {
    const lastMonth = dayjs().subtract(1, 'month');
    const dateRange = {
      startTime: lastMonth.startOf('month').valueOf(),
      endTime: lastMonth.endOf('month').valueOf(),
    };

    return dateRange;
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
   * @param sundayFirst {boolean}-一週開始日是否為週日
   */
  static getAssignRangeDate(type: DateRangeType, sundayFirst = true) {
    switch (type) {
      case 'today':
        return DefaultDateRange.getToday();
      case 'sevenDay':
        return DefaultDateRange.getSevenDay();
      case 'thirtyDay':
        return DefaultDateRange.getThirtyDay();
      case 'sixMonth':
        return DefaultDateRange.getSixMonth();
      case 'thisWeek':
        return DefaultDateRange.getThisWeek(sundayFirst);
      case 'thisMonth':
        return DefaultDateRange.getThisMonth();
      case 'thisYear':
        return DefaultDateRange.getThisYear();
      case 'lastWeek':
        return DefaultDateRange.getLastWeek(sundayFirst);
      case 'lastMonth':
        return DefaultDateRange.getLastMonth();
      case 'none':
        return null;
    }
  }
}
