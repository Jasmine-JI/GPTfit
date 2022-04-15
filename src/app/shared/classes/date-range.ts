import dayjs from 'dayjs';
import quarterOfYear from 'dayjs/plugin/quarterOfYear';
import { DateUnit } from '../enum/report';
dayjs.extend(quarterOfYear);


const UTC_FORMAT = 'YYYY-MM-DDTHH:mm:ss.sssZ';

/**
 * 處理選擇日期範圍
 */
export class DateRange {

  private _startTime: number;
  private _endTime: number;

  /**
   * 指定時間範圍，若無指定則預設這個月
   * @param initStartTime {number}-開始時間(timestamp)
   * @param initEndTime {number}-結束時間(timestamp)
   */
  constructor(initStartTime: number = undefined, initEndTime: number = undefined) {
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
      case DateUnit.week:
        realStartTime = dayjs(_startTime).startOf('week').valueOf();
        realEndTime = dayjs(_endTime).endOf('week').valueOf();
        break;
      default:
        realStartTime = dayjs(_startTime).startOf('month').valueOf();
        realEndTime = dayjs(_endTime).endOf('month').valueOf();
        break ;
    }

    return { realStartTime, realEndTime };
  }

  /**
   * 取得該日期範圍相差數目
   * @param unit {string}-日期相差單位（day/week/month/year）
   */
  getDiffRange(unit: string, showDecimal: boolean = false) {
    return dayjs(this._endTime).diff(this._startTime, unit as any, showDecimal);
  }

  /**
   * 取得該日期範圍跨越數目（ex. 1101201~1110105 ＝> 跨了2年度）
   * @param unit {string}-日期相差單位（day/week/month/year）
   */
  getCrossRange(unit: any) {
    const diff = Math.ceil(this.getDiffRange(unit, true));
    const cross = dayjs(this._startTime).add(diff - 1, unit).endOf(unit).valueOf() !== dayjs(this._endTime).endOf(unit).valueOf();
    return cross ? diff + 1 : diff;
  }
  
}