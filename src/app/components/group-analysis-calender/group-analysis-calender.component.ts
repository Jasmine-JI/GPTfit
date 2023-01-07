import {
  Component,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { CalenderType, OneCalenderDay } from '../../core/models/compo';
import dayjs, { Dayjs } from 'dayjs';
import { AuthService, Api21xxService } from '../../core/services';
import { TranslateModule } from '@ngx-translate/core';
import { getUrlQueryStrings } from '../../core/utils';
import { ResultCode } from '../../core/enums/common';
import { SportTypeIconPipe, TimeFormatPipe } from '../../core/pipes';

const currentDayjs = dayjs();

@Component({
  selector: 'app-group-analysis-calender',
  standalone: true,
  imports: [CommonModule, TranslateModule, SportTypeIconPipe, TimeFormatPipe],
  templateUrl: './group-analysis-calender.component.html',
  styleUrls: ['./group-analysis-calender.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GroupAnalysisCalenderComponent implements OnChanges, OnDestroy {
  @Output() selectSingleClass = new EventEmitter();
  @Output() selectRangeDate = new EventEmitter();
  @Input() groupId = '';

  isInit = true;
  classTimeDayjs: Dayjs;
  currentTimestamp = currentDayjs.startOf('day').valueOf();
  focusMonthDayjs = currentDayjs.startOf('month');
  calenderType: CalenderType = 'single';
  firstCalenderList: Array<OneCalenderDay>;
  secondCalenderList: Array<OneCalenderDay>;
  selectStartTimestamp = this.currentTimestamp;
  selectEndTimestamp = currentDayjs.endOf('day').valueOf();
  debounce: NodeJS.Timeout;
  isDebugMode = false;
  rangeClassList: Array<any> = [];
  oneDayClassList: Array<any> = [];
  selectClassIndex = null;

  constructor(
    private authService: AuthService,
    private api21xxService: Api21xxService,
    private changeDetectorRef: ChangeDetectorRef
  ) {}

  ngOnChanges(e: SimpleChanges): void {
    const { groupId } = e;
    if (groupId.firstChange) this.checkQueryString();
    this.createCalender();
  }

  /**
   * 確認url query string 是否指定時間與debug模式
   */
  checkQueryString() {
    const { startTime, endTime, classTime, debug } = getUrlQueryStrings(location.search);
    this.isDebugMode = debug !== undefined;
    const checkTimestamp = 1514736000; // 2018-01-01
    // 確認指定的時間是否合理
    if (classTime && +classTime >= checkTimestamp) {
      this.calenderType = 'single';
      const classTimeDayjs = dayjs(+classTime);
      this.classTimeDayjs = classTimeDayjs;
      this.focusMonthDayjs = classTimeDayjs.startOf('month');
      this.selectStartTimestamp = classTimeDayjs.startOf('day').valueOf();
      this.selectEndTimestamp = classTimeDayjs.endOf('day').valueOf();
    } else if (startTime && endTime && +startTime >= checkTimestamp && +endTime > +startTime) {
      this.calenderType = 'range';
      const startTimeDayjs = dayjs(+startTime);
      this.focusMonthDayjs = startTimeDayjs.startOf('month');
      this.selectStartTimestamp = startTimeDayjs.startOf('day').valueOf();
      this.selectEndTimestamp = dayjs(+endTime)
        .endOf('day')
        .valueOf();
    }
  }

  /**
   * 生成日曆
   */
  createCalender() {
    const { calenderType, focusMonthDayjs } = this;
    switch (calenderType) {
      case 'range':
        [this.firstCalenderList, this.secondCalenderList] =
          this.createRangeCalender(focusMonthDayjs);
        break;
      default:
        this.firstCalenderList = this.getSingleCalender(focusMonthDayjs);
        break;
    }

    this.debounceAction(this.getRangeClassList.bind(this));
  }

  /**
   * 取得單一日曆
   * @param focusMonthDayjs {Dayjs}-目前聚焦月份的dayjs物件
   */
  getSingleCalender(focusMonthDayjs: Dayjs) {
    const calenderStart = focusMonthDayjs.startOf('week').valueOf();
    const calenderEnd = focusMonthDayjs.endOf('month').endOf('week').valueOf();
    const monthStart = focusMonthDayjs.valueOf();
    const monthEnd = focusMonthDayjs.endOf('month').valueOf();
    const diffDay = dayjs(calenderEnd).diff(dayjs(calenderStart), 'day');
    const calenderList: Array<OneCalenderDay> = [];
    for (let i = 0; i <= diffDay; i++) {
      const _dayjs = dayjs(calenderStart).add(i, 'day');
      const _timestamp = _dayjs.valueOf();
      let oneCalenderDay: OneCalenderDay;
      if (_timestamp >= monthStart && _timestamp <= monthEnd) {
        oneCalenderDay = {
          day: +_dayjs.format('DD'),
          startTimestamp: _dayjs.valueOf(),
          endTimestamp: _dayjs.endOf('day').valueOf(),
          haveClass: false,
        };
      }

      calenderList.push(oneCalenderDay);
    }

    return calenderList;
  }

  /**
   * 取得範圍日曆
   * @param focusMonthDayjs {Dayjs}-目前聚焦月份的dayjs物件
   */
  createRangeCalender(focusMonthDayjs: Dayjs) {
    const secondFocusMonth = focusMonthDayjs.add(1, 'month');
    return [this.getSingleCalender(focusMonthDayjs), this.getSingleCalender(secondFocusMonth)];
  }

  /**
   * 根據不同使用方式取得Api 2111 Request Body
   * @param searchTimeOption {number}-要覆蓋 api 2111 searchTime 的設定
   */
  getApi2011RequestBody(searchTimeOption: any) {
    const { isDebugMode, groupId } = this;
    return {
      token: this.authService.token,
      searchTime: {
        type: 1,
        fuzzyTime: '',
        filterStartTime: '',
        filterEndTime: '',
        filterSameTime: isDebugMode ? 1 : 2,
        ...searchTimeOption,
      },
      searchRule: {
        activity: 99,
        targetUser: isDebugMode ? 99 : 2,
        fileInfo: {
          author: '',
          dispName: '',
          equipmentSN: '',
          class: groupId,
          teacher: '',
          tag: '',
        },
      },
      display: {
        activityLapLayerDisplay: 3,
        activityLapLayerDataField: [],
        activityPointLayerDisplay: 3,
        activityPointLayerDataField: [],
      },
      page: '0',
      pageCounts: '1000',
    };
  }

  /**
   * 取得期間上課概要資訊
   */
  getRangeClassList() {
    const dateFormat = 'YYYY-MM-DDTHH:mm:ss.SSSZ';
    const { calenderType, focusMonthDayjs } = this;
    const filterStartTime = focusMonthDayjs.format(dateFormat);
    const filterEndTime =
      calenderType === 'single'
        ? focusMonthDayjs.endOf('month').format(dateFormat)
        : focusMonthDayjs.add(1, 'month').endOf('month').format(dateFormat);
    const body = this.getApi2011RequestBody({ type: 1, filterStartTime, filterEndTime });
    this.api21xxService.fetchMultiActivityData(body).subscribe((res) => {
      this.markInCalender(res);
      this.changeDetectorRef.markForCheck();
    });
  }

  /**
   * 將有上課的日期進行註記
   * @param res {any}-api 2111 response
   */
  markInCalender(res: any) {
    const { info, activities, resultCode } = res;
    if (resultCode === ResultCode.success) {
      // 將一般類型運動與複合式運動清單合併並依開始時間排序
      const allActivities = (info?.activities || []).concat(activities || []).sort((_a, _b) => {
        const _aStartTimestamp = dayjs(_a.activityInfoLayer.startTime).valueOf();
        const _bStartTimestamp = dayjs(_b.activityInfoLayer.startTime).valueOf();
        return _aStartTimestamp - _bStartTimestamp;
      });

      this.rangeClassList = allActivities;
      // 變更有上課的日期旗標
      allActivities.forEach((_activity) => {
        const startDayjs = dayjs(_activity.activityInfoLayer.startTime).startOf('day');
        const StartMonth = startDayjs.startOf('month').valueOf();
        const focusMonth = this.focusMonthDayjs.valueOf();
        const nextFocusMonth = this.focusMonthDayjs.add(1, 'month').valueOf();
        let belongCalender: Array<OneCalenderDay>;
        let calenderStart: Dayjs;
        if (StartMonth === focusMonth) {
          belongCalender = this.firstCalenderList;
          calenderStart = this.focusMonthDayjs.startOf('week');
        } else if (StartMonth === nextFocusMonth) {
          belongCalender = this.secondCalenderList;
          calenderStart = this.focusMonthDayjs.add(1, 'month').startOf('week');
        }

        const diffDay = startDayjs.diff(calenderStart, 'day');
        belongCalender[diffDay].haveClass = true;
      });

      this.checkInit();
    }
  }

  /**
   * 處理進入頁面指定的初始狀態
   */
  checkInit() {
    if (this.isInit) {
      if (this.calenderType === 'single') {
        this.getDefaultSingleClass();
      } else {
        this.emitRangeDate();
      }
      this.isInit = false;
    }
  }

  /**
   * 取得預設單堂課程報告
   */
  getDefaultSingleClass() {
    this.oneDayClassList = this.getOneDayClassList();
    const index = this.findClassIndex();
    if (this.oneDayClassList.length > 0) {
      this.selectClass(index > -1 ? index : 0);
    }
  }

  /**
   * 取得url指定的課程時間在選擇日期中的序列
   */
  findClassIndex() {
    const { oneDayClassList, classTimeDayjs } = this;
    if (oneDayClassList && classTimeDayjs) {
      return oneDayClassList.findIndex((_list) => {
        const { startTime } = _list.activityInfoLayer;
        return classTimeDayjs.valueOf() === dayjs(startTime).valueOf();
      });
    }
  }

  /**
   * 切換日曆類別
   * @param type {CalenderType}-日曆累別
   */
  switchTab(type: CalenderType) {
    const { calenderType } = this;
    if (type !== calenderType) {
      this.calenderType = type;
      this.createCalender();

      switch (this.calenderType) {
        case 'range':
          this.emitRangeDate();
          break;
        default:
          this.selectEndTimestamp = dayjs(this.selectStartTimestamp).endOf('day').valueOf();
          this.getDefaultSingleClass();
          break;
      }
    }
  }

  /**
   * 向前切換日曆
   */
  switchPrev() {
    this.focusMonthDayjs = dayjs(this.focusMonthDayjs).subtract(1, 'month');
    this.createCalender();
  }

  /**
   * 向後切換日曆
   */
  switchNext() {
    this.focusMonthDayjs = dayjs(this.focusMonthDayjs).add(1, 'month');
    this.createCalender();
  }

  /**
   * 使用者點擊日期
   * @param startTimestamp {number}-當天開始時間
   * @param endTimestamp {number}-當天結束時間
   * @param haveClass {boolean}-當日是否有課程
   */
  selectDate(dayInfo: OneCalenderDay) {
    const { startTimestamp, endTimestamp, haveClass } = dayInfo;
    const { calenderType } = this;
    switch (calenderType) {
      case 'range':
        this.handleRangeDate(startTimestamp, endTimestamp);
        break;
      default:
        this.handleSingleDate(startTimestamp, endTimestamp, haveClass);
        break;
    }
  }

  /**
   * 使用者點擊單一日期並顯示當日課程清單
   * @param startTimestamp {number}-當天開始時間
   * @param endTimestamp {number}-當天結束時間
   * @param haveClass {boolean}-當日是否有課程
   */
  handleSingleDate(startTimestamp: number, endTimestamp: number, haveClass: boolean) {
    this.selectClassIndex = null;
    this.selectStartTimestamp = startTimestamp;
    this.selectEndTimestamp = endTimestamp;
    this.oneDayClassList = haveClass ? this.getOneDayClassList() : [];
  }

  /**
   * 取得單一天課程列表
   */
  getOneDayClassList() {
    const { selectStartTimestamp } = this;
    return this.rangeClassList.filter((_class) => {
      const _startTimestamp = dayjs(_class.activityInfoLayer.startTime).startOf('day').valueOf();
      return _startTimestamp === selectStartTimestamp;
    });
  }

  /**
   * 使用者選擇日期範圍
   * @param startTimestamp {number}-當天開始時間
   * @param endTimestamp {number}-當天結束時間
   */
  handleRangeDate(startTimestamp: number, endTimestamp: number) {
    const { selectStartTimestamp, selectEndTimestamp } = this;
    if (!selectEndTimestamp && startTimestamp >= selectStartTimestamp) {
      this.selectEndTimestamp = endTimestamp;
      this.emitRangeDate();
    } else {
      this.selectStartTimestamp = startTimestamp;
      this.selectEndTimestamp = undefined;
    }
  }

  /**
   * 將使用者選擇的日期範圍傳給父組件
   */
  emitRangeDate() {
    const timeFormat = 'YYYY-MM-DDTHH:mm:ss.SSSZ';
    const { selectStartTimestamp, selectEndTimestamp } = this;
    const range = {
      filterStartTime: dayjs(selectStartTimestamp).format(timeFormat),
      filterEndTime: dayjs(selectEndTimestamp).format(timeFormat),
    };
    this.selectRangeDate.emit(range);
  }

  /**
   * 選擇指定的單一課堂
   * @param startTime {number}-課程開始時間
   */
  selectClass(index: number) {
    this.selectClassIndex = index;
    const { startTime } = this.oneDayClassList[index].activityInfoLayer;
    this.selectSingleClass.emit(startTime);
  }

  /**
   * 連續切換行事曆時，給予debounce time避免呼叫太多api
   */
  debounceAction(callback: CallableFunction) {
    if (this.debounce) {
      clearTimeout(this.debounce);
    }

    this.debounce = setTimeout(() => {
      callback();
    }, 300);
  }

  /**
   * 將計時器移除
   */
  ngOnDestroy(): void {
    if (this.debounce) clearTimeout(this.debounce);
  }
}
