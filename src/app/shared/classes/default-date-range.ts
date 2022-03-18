import dayjs from 'dayjs';
import { DateRangeType } from '../models/report-condition';

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
      endTime: dayjs().endOf('day').valueOf()
    };

    return dateRange;
  }

  /**
   * 取得過去7日時間範圍
   */
  static getSevenDay() {
    const dateRange = {
      startTime: dayjs().subtract(7, 'day').startOf('day').valueOf(),
      endTime: dayjs().endOf('day').valueOf()
    };

    return dateRange;
  }

  /**
   * 取得過去30日時間範圍
   */
  static getThirtyDay() {
    const dateRange = {
      startTime: dayjs().subtract(30, 'day').startOf('day').valueOf(),
      endTime: dayjs().endOf('day').valueOf()
    };

    return dateRange;
  }

  /**
   * 取得過去6個月時間範圍
   */
  static getSixMonth() {
    const dateRange = {
      startTime: dayjs().subtract(6, 'month').startOf('day').valueOf(),
      endTime: dayjs().endOf('day').valueOf()
    };

    return dateRange;
  }

  /**
   * 取得本週時間範圍
   */
  static getThisWeek() {
    const dateRange = {
      startTime: dayjs().startOf('week').valueOf(),
      endTime: dayjs().endOf('week').valueOf()
    };

    return dateRange;
  }

  /**
   * 取得本月時間範圍
   */
  static getThisMonth() {
    const dateRange = {
      startTime: dayjs().startOf('month').valueOf(),
      endTime: dayjs().endOf('month').valueOf()
    };

    return dateRange;
  }

  /**
   * 取得今年時間範圍
   */
  static getThisYear() {
    const dateRange = {
      startTime: dayjs().startOf('year').valueOf(),
      endTime: dayjs().endOf('year').valueOf()
    };

    return dateRange;
  }

  /**
   * 取得上一週時間範圍
   */
  static getLastWeek() {
    const lastSevenDay = dayjs().subtract(7, 'day');
    const dateRange = {
      startTime: lastSevenDay.startOf('week').valueOf(),
      endTime: lastSevenDay.endOf('week').valueOf()
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
      endTime: lastMonth.endOf('month').valueOf()
    };

    return dateRange;
  }

  /**
   * 取得去年同期時間範圍
   */
  static getSameRangeLastYear(startTime: number, endTime: number) {
    const dateRange = {
      startTime: dayjs(startTime).subtract(1, 'year').startOf('day').valueOf(),
      endTime: dayjs(endTime).subtract(1, 'year').endOf('day').valueOf()
    };

    return dateRange;
  }

  /**
   * 取得指定時間範圍
   * @param type {DateRangeType}-指定之時間範圍
   */
  static getAssignRangeDate(type: DateRangeType) {
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
        return DefaultDateRange.getThisWeek();
      case 'thisMonth':
        return DefaultDateRange.getThisMonth();
      case 'thisYear':
        return DefaultDateRange.getThisYear();
      case 'lastWeek':
        return DefaultDateRange.getLastWeek();
      case 'lastMonth':
        return DefaultDateRange.getLastMonth();
      case 'none':
        return null;
    }

  }

}