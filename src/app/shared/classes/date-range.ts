import dayjs from 'dayjs';

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
  
}