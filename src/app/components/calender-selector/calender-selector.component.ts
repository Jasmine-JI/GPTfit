import {
  Component,
  OnInit,
  OnChanges,
  OnDestroy,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { DateUnit } from '../../core/enums/common';
import { Subject, Subscription, fromEvent, merge } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
import { TimeFormatPipe } from '../../core/pipes';
import { DayType, WeekDayLock, CalenderDayInfo } from '../../core/models/compo';
import { GlobalEventsService } from '../../core/services';

dayjs.extend(isoWeek);

@Component({
  selector: 'app-calender-selector',
  templateUrl: './calender-selector.component.html',
  styleUrls: ['./calender-selector.component.scss'],
  standalone: true,
  imports: [CommonModule, TranslateModule, TimeFormatPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CalenderSelectorComponent implements OnInit, OnChanges, OnDestroy {
  @Input() calenderType: DateUnit = DateUnit.day;
  @Input() dayType: DayType;
  @Input() weekDayLock: WeekDayLock = [false, false, false, false, false, false, false];
  @Input() minDay: number = dayjs('2010-01-01', 'YYYY-MM-DD').valueOf(); // timestamp
  @Input() maxDay: number = dayjs().endOf('day').valueOf(); // timestamp
  @Input() assignTimestamp: number | null = dayjs().valueOf();
  @Output() selectTimestamp = new EventEmitter();

  private ngUnsubscribe = new Subject();
  private pluralEventSubscription = new Subscription();
  private readonly componentId = this.globalEventsService.getComponentUniqueId();

  /**
   * 日曆目前年份
   */
  calenderYear: number;

  /**
   * 日曆目前月份
   */
  calenderMonth: number;

  /**
   * 日曆目前日期
   */
  calenderDay: number;

  /**
   * 日期清單
   */
  dayList: Array<Array<CalenderDayInfo>> = [];

  /**
   * 年份清單
   */
  yearList = this.getYearList();

  /**
   * 顯示下拉日曆清單與否
   */
  showCalender = false;

  /**
   * 顯示年份清單與否
   */
  showYearList = false;

  /**
   * 是否可切換下個月
   */
  canSwitchNextMonth = true;

  /**
   * 是否可切換上個月
   */
  canSwitchPreviousMonth = true;

  /**
   * 是否可顯示今天的按鈕
   */
  todayButtonDisable = false;

  readonly DateUnit = DateUnit;

  constructor(
    private changeDetectorRef: ChangeDetectorRef,
    private globalEventsService: GlobalEventsService
  ) {}

  ngOnInit(): void {
    this.saveCalenderVariable();
  }

  ngOnChanges(): void {
    this.todayButtonDisable = this.checkTodayButtonDisable();
  }

  /**
   * 是否開放點擊"今天"按鈕
   */
  checkTodayButtonDisable() {
    const today = dayjs().valueOf();
    return this.checkDateDisabled(today);
  }

  /**
   * 儲存日曆變數
   * @param timestamp {number | null}-時間戳（ms）
   */
  saveCalenderVariable(timestamp: number | null = null) {
    [this.calenderYear, this.calenderMonth, this.calenderDay] = this.getDateArray(timestamp);
  }

  /**
   * 根據指定或現在日期產生日曆清單
   */
  getDayList() {
    this.dayList = [];
    const { calenderYear, calenderMonth, dayType } = this;
    const calenderTime = dayjs(`${calenderYear}-${calenderMonth}`, 'YYYY-MM');
    const monthStart = this.checkMonthStart(calenderTime);
    const monthStartWeekDay = monthStart.isoWeekday();
    const monthEnd = monthStart.endOf('month');
    const monthEndWeekDay = monthEnd.isoWeekday();
    const firstTime = monthStart.subtract(monthStartWeekDay === 7 ? 0 : monthStartWeekDay, 'day');
    const lastTime = monthEnd.add(7 - (monthEndWeekDay === 7 ? 0 : monthEndWeekDay), 'day');
    const diffDay = lastTime.diff(firstTime, 'day');
    for (let i = 0; i < diffDay; i++) {
      const dayjsObj = firstTime.add(i, 'day');
      const timestamp =
        dayType === 'start' ? dayjsObj.startOf('day').valueOf() : dayjsObj.endOf('day').valueOf();
      const [year, month, day] = dayjsObj.format('YYYY-MM-DD').split('-');
      const weekIndex = Math.floor(i / 7);
      if (!this.dayList[weekIndex]) this.dayList[weekIndex] = [];
      this.dayList[weekIndex].push({
        year,
        month,
        day,
        timestamp,
        isSelected: this.checkSameDate(timestamp, this.assignTimestamp),
        isToday: this.checkSameDate(timestamp),
        isDisabled: this.checkDateDisabled(timestamp, i),
      });
    }
  }

  /**
   * 取得該月起始日期，若超過最大日期，則取最大日期之月份
   * @param calenderTime {dayjs.Dayjs}-dayjs物件
   */
  checkMonthStart(calenderTime: dayjs.Dayjs) {
    const { maxDay } = this;
    const assignMonthStart = calenderTime.startOf('month');
    const assignStartTime = assignMonthStart.valueOf();
    if (maxDay && assignStartTime > maxDay) {
      const startMonth = dayjs(maxDay).startOf('month');
      this.calenderMonth = startMonth.month() + 1;
      return startMonth;
    } else {
      return assignMonthStart;
    }
  }

  /**
   * 確認下一個月份切換按鈕是否開放點擊
   */
  checkMonthNextButton() {
    const { calenderYear, calenderMonth, calenderType } = this;
    const monthString = calenderMonth.toString().padStart(2, '0');
    const endTimestamp = dayjs(`${calenderYear}${monthString}`, 'YYYYMM').endOf('month').valueOf();
    this.canSwitchNextMonth = endTimestamp < this.maxDay;
    if (calenderType > DateUnit.month) {
      const { calenderYear, calenderMonth } = this.getNextYearMonth();
      const yearMonth = `${calenderYear}${calenderMonth.toString().padStart(2, '0')}`;
      const nextEndDate = dayjs(yearMonth, 'YYYYMM').endOf('month').valueOf();
      this.canSwitchNextMonth = nextEndDate < this.maxDay;
    }
  }

  /**
   * 確認上一個月份切換按鈕是否開放點擊
   */
  checkMonthPreviousButton() {
    const { calenderYear, calenderMonth, calenderType } = this;
    const monthString = calenderMonth.toString().padStart(2, '0');
    const startTimestamp = dayjs(`${calenderYear}${monthString}`, 'YYYYMM')
      .startOf('month')
      .valueOf();
    this.canSwitchPreviousMonth = startTimestamp > this.minDay;
    if (calenderType > DateUnit.month) {
      const { calenderYear, calenderMonth } = this.getPreviousYearMonth();
      const yearMonth = `${calenderYear}${calenderMonth.toString().padStart(2, '0')}`;
      const previousEndDate = dayjs(yearMonth, 'YYYYMM').endOf('month').valueOf();
      this.canSwitchPreviousMonth = previousEndDate > this.minDay;
    }
  }

  /**
   * 確認月份切換按鈕是否皆開放點擊
   */
  checkMonthSwitchButton() {
    this.checkMonthNextButton();
    this.checkMonthPreviousButton();
  }

  /**
   * 取得年份列表
   */
  getYearList() {
    const list: Array<number> = [];
    const { minDay, maxDay } = this;
    const minYear = dayjs(minDay).year();
    const maxYear = dayjs(maxDay).year();
    for (let i = 0; i <= maxYear - minYear; i++) {
      list.push(minYear + i);
    }

    return list.reverse();
  }

  /**
   * 選擇今日
   * @param e {MouseEvent}
   */
  selectToday(e: MouseEvent) {
    e.stopPropagation();
    // 避免操作時剛好跨日
    if (this.checkTodayButtonDisable()) {
      this.todayButtonDisable = true;
    } else {
      this.todayButtonDisable = false;
      const timestamp = dayjs().valueOf();
      this.saveCalenderVariable(timestamp);
      this.outputResult(timestamp);
    }
  }

  /**
   * 選擇日期
   * @param e {MouseEvent}
   * @param dayInfo {CalenderDayInfo}-選擇的日期
   */
  selectDay(e: MouseEvent, dayInfo: CalenderDayInfo) {
    e.stopPropagation();
    const { year, month, day, isDisabled, timestamp } = dayInfo;
    if (!isDisabled) {
      this.calenderYear = +year;
      this.calenderMonth = +month;
      this.calenderDay = +day;
      this.outputResult(timestamp);
    }
  }

  /**
   * 切換至下個月份
   */
  switchNextMonth() {
    if (this.canSwitchNextMonth) {
      const { calenderYear, calenderMonth } = this.getNextYearMonth();
      this.calenderMonth = calenderMonth;
      this.calenderYear = calenderYear;
      this.getDayList();
      this.checkMonthNextButton();
      this.canSwitchPreviousMonth = true;
    }
  }

  /**
   * 切換至上個月份
   */
  switchPreviousMonth() {
    if (this.canSwitchPreviousMonth) {
      const { calenderYear, calenderMonth } = this.getPreviousYearMonth();
      this.calenderMonth = calenderMonth;
      this.calenderYear = calenderYear;
      this.getDayList();
      this.checkMonthPreviousButton();
      this.canSwitchNextMonth = true;
    }
  }

  /**
   * 取得切換日曆時的下一個年份與月份
   */
  getNextYearMonth() {
    let { calenderYear, calenderMonth } = this;
    const nextMonth = this.calenderMonth + this.getOffsetMonth();
    if (nextMonth > 12) {
      calenderMonth = nextMonth - 12;
      calenderYear++;
    } else {
      calenderMonth = nextMonth;
    }

    return { calenderYear, calenderMonth };
  }

  /**
   * 取得切換日曆時的上一個年份與月份
   */
  getPreviousYearMonth() {
    let { calenderYear, calenderMonth } = this;
    const previousMonth = calenderMonth - this.getOffsetMonth();
    if (previousMonth < 1) {
      calenderMonth = previousMonth + 12;
      calenderYear--;
    } else {
      calenderMonth = previousMonth;
    }

    return { calenderYear, calenderMonth };
  }

  /**
   * 取得月份切換範圍
   */
  getOffsetMonth() {
    const { calenderType } = this;
    switch (calenderType) {
      case DateUnit.year:
        return 12;
      case DateUnit.season:
        return 3;
      default:
        return 1;
    }
  }

  /**
   * 選擇日曆顯示年份
   * @param year {number}-年份
   */
  selectCalenderYear(year: number) {
    this.calenderYear = year;
    this.getDayList();
    this.checkMonthSwitchButton();
  }

  /**
   * 顯示日曆與否
   * @param e {MouseEvent}
   */
  handleCalenderDropList(e: MouseEvent) {
    e.stopPropagation();
    this.showCalender ? this.closeCalenderDropList() : this.showCalenderDropList();
  }

  /**
   * 顯示日曆
   */
  showCalenderDropList() {
    this.globalEventsService.setRxCloseDropList(this.componentId);
    this.saveCalenderVariable(this.assignTimestamp);
    this.getDayList();
    this.checkMonthSwitchButton();
    this.showCalender = true;
    this.subscribePluralEvent();
  }

  /**
   * 關閉日曆
   */
  closeCalenderDropList() {
    this.showCalender = false;
    this.closeAllList();
  }

  /**
   * 顯示月份下拉清單與否
   * @param e {MouseEvent}
   */
  handleYearDropList(e: MouseEvent) {
    e.stopPropagation();
    this.showYearList = !this.showYearList;
  }

  /**
   * 訂閱點擊與滾動事件
   */
  subscribePluralEvent() {
    const scrollElement = document.querySelector('.main__container') as Element;
    const scrollEvent = fromEvent(scrollElement, 'scroll');
    const clickEvent = fromEvent(document, 'click');
    const closeDropEvent = this.globalEventsService.getRxCloseDropList();
    this.pluralEventSubscription = merge(clickEvent, scrollEvent, closeDropEvent)
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((e) => {
        if (e !== this.componentId) {
          this.closeAllList();
        }
      });
  }

  /**
   * 解除訂閱點擊與滾動事件
   */
  closeAllList() {
    this.showYearList = false;
    this.showCalender = false;
    this.pluralEventSubscription.unsubscribe();
    this.changeDetectorRef.markForCheck();
  }

  /**
   * 解除rxjs點擊與捲動的訂閱
   */
  unsubscribePluralEvent() {
    if (this.pluralEventSubscription) this.pluralEventSubscription.unsubscribe();
  }

  /**
   * 發送選擇日期
   * @param timestamp {number}-時間戳（ms）
   */
  outputResult(timestamp: number) {
    this.assignTimestamp = timestamp;
    this.selectTimestamp.emit(timestamp);
    this.closeAllList();
  }

  /**
   * 取得日期數字陣列
   * @param timestamp {number}-時間戳(ms)
   */
  getDateArray(timestamp: number | null = null): Array<number> {
    const dayjsObj = timestamp ? dayjs(timestamp) : dayjs();
    return dayjsObj
      .format('YYYY-MM-DD')
      .split('-')
      .map((_value) => +_value);
  }

  /**
   * 確認是否為同一天
   * @param baseTimestamp {number}-基準時間戳(ms)
   * @param compareTimestamp {number | null}-比較時間戳(ms)
   */
  checkSameDate(baseTimestamp: number, compareTimestamp: number | null = null) {
    const baseDateString = dayjs(baseTimestamp).format('YYYY-MM-DD');
    const compareDateString = (compareTimestamp ? dayjs(compareTimestamp) : dayjs()).format(
      'YYYY-MM-DD'
    );
    return baseDateString === compareDateString;
  }

  /**
   * 確認該日期是否可以選擇
   * @param timestamp {number}-時間戳(ms)
   */
  checkDateDisabled(timestamp: number, index: number | null = null): boolean {
    const { calenderType, dayType, minDay, maxDay, weekDayLock } = this;
    const lessthenMinDay = minDay && timestamp < minDay;
    const overMaxDay = (maxDay && timestamp > maxDay) as boolean;
    const compareFormat = 'MMDD';
    switch (calenderType) {
      case DateUnit.year: {
        const monthDay = dayjs(timestamp).format(compareFormat);
        const invalid = monthDay !== (dayType === 'start' ? '0101' : '1231');
        return lessthenMinDay || overMaxDay || invalid;
      }
      case DateUnit.season: {
        const dayjsObj = dayjs(timestamp);
        const monthDay = dayjsObj.format(compareFormat);
        const startMonthDay = dayjsObj.startOf('quarter').format(compareFormat);
        const endMonthDay = dayjsObj.endOf('quarter').format(compareFormat);
        const invalid = monthDay !== (dayType === 'start' ? startMonthDay : endMonthDay);
        return lessthenMinDay || overMaxDay || invalid;
      }
      case DateUnit.month: {
        const dayjsObj = dayjs(timestamp);
        const monthDay = dayjsObj.format(compareFormat);
        const startMonthDay = dayjsObj.startOf('month').format(compareFormat);
        const endMonthDay = dayjsObj.endOf('month').format(compareFormat);
        const invalid = monthDay !== (dayType === 'start' ? startMonthDay : endMonthDay);
        return lessthenMinDay || overMaxDay || invalid;
      }
      case DateUnit.week: {
        let weekDay: number;
        if (index !== null) {
          weekDay = index % 7;
        } else {
          const isoWeekDay = dayjs(timestamp).isoWeekday();
          weekDay = isoWeekDay === 7 ? 0 : isoWeekDay;
        }

        return lessthenMinDay || overMaxDay || weekDayLock[weekDay];
      }
      default:
        return lessthenMinDay || overMaxDay;
    }
  }

  /**
   * 解除rxjs訂閱
   */
  ngOnDestroy(): void {
    this.unsubscribePluralEvent();
    this.ngUnsubscribe.next(null);
    this.ngUnsubscribe.complete();
  }
}
