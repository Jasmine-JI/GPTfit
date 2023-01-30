import dayjs from 'dayjs';
import quarterOfYear from 'dayjs/plugin/quarterOfYear';
import isoWeek from 'dayjs/plugin/isoWeek';
import { DateUnit } from '../enum/report';
import { mathRounding } from '../../core/utils/index';
import { DAY } from '../models/utils-constant';
import { DateRangeType } from '../models/report-condition';

dayjs.extend(quarterOfYear);
dayjs.extend(isoWeek);

const UTC_FORMAT = 'YYYY-MM-DDTHH:mm:ss.SSSZ';

/**
 * 處理選擇日期範圍
 */
export class DateRange {
  private _startTime: number;
  private _endTime: number;
  private _rangeType: DateRangeType = 'thisWeek';

  /**
   * 指定時間範圍，若無指定則預設這個月
   * @param initStartTime {number}-開始時間(timestamp)
   * @param initEndTime {number}-結束時間(timestamp)
   */
  constructor(
    initStartTime: number | undefined = undefined,
    initEndTime: number | undefined = undefined
  ) {
    this.startTimestamp = initStartTime ? initStartTime : dayjs().startOf('month').valueOf();
    this.endTimestamp = initEndTime ? initEndTime : dayjs().endOf('month').valueOf();
  }

  /**
   * 設定開始時間戳
   * @param time {number}-起始時間timestamp或UTC格式時間
   * @author kidin-1110310
   */
  set startTimestamp(time: number | string) {
    this._startTime = dayjs(time).valueOf();
  }

  /**
   * 取得開始時間戳
   * @author kidin-1110310
   */
  get startTimestamp(): number {
    return this._startTime;
  }

  /**
   * 取得UTC開始時間
   */
  get utcStartTime(): string {
    return dayjs(this._startTime).format(UTC_FORMAT);
  }

  /**
   * 設定該日期範圍之類別
   */
  set dateRange(type: DateRangeType) {
    this._rangeType = type;
  }

  /**
   * 取得該日期範圍之類別
   */
  get dateRange() {
    return this._rangeType;
  }

  /**
   * 取得指定格式之開始時間
   * @author kidin-1110310
   */
  getStartTimeFormat(formatString: string): string {
    return dayjs(this._startTime).format(formatString);
  }

  /**
   * 設定結束時間戳
   * @param time {number}-結束時間timestamp或UTC格式時間
   * @author kidin-1110310
   */
  set endTimestamp(time: number | string) {
    this._endTime = dayjs(time).valueOf();
  }

  /**
   * 取得結束時間戳
   * @author kidin-1110310
   */
  get endTimestamp(): number {
    return this._endTime;
  }

  /**
   * 取得UTC開始時間
   */
  get utcEndTime(): string {
    return dayjs(this._endTime).format(UTC_FORMAT);
  }

  /**
   * 取得指定格式之結束時間
   * @author kidin-1110310
   */
  getEndTimeFormat(formatString: string): string {
    return dayjs(this._endTime).format(formatString);
  }

  /**
   * 依報告使用之日期範圍單位，取得實際報告日期範圍
   * ex. 使用者選擇報告日期為「3/11-3/22」，但日期計算單位選「月」，則報告實際日期範圍為3/1-3/31
   * @param unit {DateUnit}-報告日期計算單位
   * @author kidin-1110322
   */
  getReportRealTimeRange(unit: DateUnit) {
    let realStartTime: number;
    let realEndTime: number;
    const { _startTime, _endTime } = this;
    switch (unit) {
      case DateUnit.day:
        [realStartTime, realEndTime] = [_startTime, _endTime];
        break;
      case DateUnit.week: {
        const unitStr = dayjs(_startTime).isoWeekday() === 1 ? 'isoWeek' : 'week';
        realStartTime = dayjs(_startTime).startOf(unitStr).valueOf();
        realEndTime = dayjs(_endTime).endOf(unitStr).valueOf();
        break;
      }
      default:
        realStartTime = dayjs(_startTime).startOf('month').valueOf();
        realEndTime = dayjs(_endTime).endOf('month').valueOf();
        break;
    }

    return { realStartTime, realEndTime };
  }

  /**
   * 取得該日期範圍相差數目
   * @param dateUnit {string}-日期相差單位（day/week/month/quarter/year）
   */
  getDiffRange(unit: string, baseOnMonth = true) {
    const { _startTime, _endTime } = this;
    const diffDay = mathRounding((_endTime - _startTime) / DAY, 0);
    const [startYear, startMonth] = dayjs(_startTime)
      .format('YYYY-MM-DD')
      .split('-')
      .map((_str) => +_str);
    const [endYear, endMonth] = dayjs(_endTime)
      .format('YYYY-MM-DD')
      .split('-')
      .map((_str) => +_str);
    const diffMonth = (endYear - startYear) * 12 + (endMonth - startMonth) + 1;
    switch (unit) {
      case 'week':
        return mathRounding(diffDay / 7, 3);
      case 'month': {
        return baseOnMonth ? diffMonth : mathRounding(diffDay / 30, 3);
      }
      case 'quarter': {
        return baseOnMonth ? diffMonth / 3 : mathRounding(diffDay / 90, 3);
      }
      case 'year': {
        return baseOnMonth ? diffMonth / 12 : mathRounding(diffDay / 365, 3);
      }
      default:
        return diffDay;
    }
  }

  /**
   * 取得該日期範圍跨越數目（ex. 1101201~1110105 ＝> 跨了2年度）
   * @param unit {string}-日期相差單位（day/week/month/quarter/year）
   * @param referenceUnit {string}-日期相差單位，受一週的第一天是否為星期日所影響（day/week/month/quarter/year）
   */
  getCrossRange(unit: any, referenceUnit: any = null) {
    const diff = Math.ceil(this.getDiffRange(unit));
    const cross =
      dayjs(this._startTime)
        .add(diff - 1, unit)
        .endOf(referenceUnit ?? unit)
        .valueOf() !==
      dayjs(this._endTime)
        .endOf(referenceUnit ?? unit)
        .valueOf();
    return cross ? diff + 1 : diff;
  }
}
