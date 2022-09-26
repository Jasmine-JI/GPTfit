import {
  Component,
  OnInit,
  Input,
  Output,
  OnChanges,
  OnDestroy,
  EventEmitter,
  SimpleChanges,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { DateRange } from '../../classes/date-range';
import { ReportCondition, DateRangeType, DateRangeInfo } from '../../models/report-condition';
import { DateUnit } from '../../enum/report';
import dayjs from 'dayjs';
import { SportType } from '../../enum/sports';
import { deepCopy } from '../../utils/index';
import { GroupLevel, BrandType } from '../../enum/professional';
import { Subject, Subscription, fromEvent, merge } from 'rxjs';
import { takeUntil, debounceTime } from 'rxjs/operators';
import { DefaultDateRange } from '../../classes/default-date-range';
import { GroupInfo } from '../../classes/group-info';
import { LocalstorageService, GlobalEventsService } from '../../../core/services';
import { WeekDayLock } from '../../../core/models/compo';
import { ReportDateUnit } from '../../classes/report-date-unit';

@Component({
  selector: 'app-condition-selector',
  templateUrl: './condition-selector.component.html',
  styleUrls: ['./condition-selector.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConditionSelectorComponent implements OnInit, OnChanges, OnDestroy {
  /**
   * 初始條件
   */
  @Input() initialCondition: ReportCondition;

  /**
   * 該頁面載入進度
   */
  @Input() progress: number;

  /**
   * 報告條件的發送器
   */
  @Output() confirm: EventEmitter<ReportCondition> = new EventEmitter();

  private ngUnsubscribe = new Subject();
  private pluralEvent = new Subscription();
  private resizeEvent = new Subscription();

  /**
   * ui 會用到的 flag
   */
  uiFlag = {
    showGroupList: false,
    showBaseDateRangeList: false,
    showCompareDateRangeList: false,
    showDateUnitList: false,
    showTargetUnitList: false,
    unfold: true,
    isMobile: false,
    isIsoWeekUsing: true,
  };

  /**
   * 篩選條件
   */
  reportCondition: ReportCondition;

  /**
   * 日曆可選的星期
   */
  weekDayLock = {
    start: <WeekDayLock>[false, false, false, false, false, false, false],
    end: <WeekDayLock>[false, false, false, false, false, false, false],
  };

  /**
   * 結束日期最小可選日期
   */
  endLimitDay = {
    base: {
      min: <number | null>dayjs('2010', 'YYYY').valueOf(),
      max: <number | null>dayjs().endOf('year').valueOf(),
    },
    compare: {
      min: <number | null>dayjs('2010', 'YYYY').valueOf(),
      max: <number | null>dayjs().endOf('year').valueOf(),
    },
  };

  /**
   * 快速選單清單
   */
  quickDateList = {
    base: <Array<DateRangeInfo>>[],
    compare: <Array<DateRangeInfo>>[],
  };

  readonly SportType = SportType;
  readonly GroupLevel = GroupLevel;
  readonly BrandType = BrandType;
  readonly DateUnit = DateUnit;
  private readonly groupListDropId = this.globalEventsService.getComponentUniqueId();
  private readonly reportUnitDropId = this.globalEventsService.getComponentUniqueId();
  private readonly baseDateRangeDropId = this.globalEventsService.getComponentUniqueId();
  private readonly compareDateRangeDropId = this.globalEventsService.getComponentUniqueId();

  constructor(
    private changeDetectorRef: ChangeDetectorRef,
    private localstorageService: LocalstorageService,
    private globalEventsService: GlobalEventsService
  ) {}

  ngOnInit(): void {}

  ngOnChanges(e: SimpleChanges): void {
    if (e.initialCondition) {
      this.checkDeviceWidth();
      this.subscribeResizeEvent();
      this.uiFlag.isIsoWeekUsing = this.getIsoWeekUsing();
      this.resetCondition();
      this.weekDayLock = this.getWeekDayLock();
      this.handleEndLimitDay();
      this.submitCondition();
    }
  }

  /**
   * 確認是否為攜帶裝置寬度
   * @author kidin-1110427
   */
  checkDeviceWidth() {
    const { innerWidth } = window;
    this.uiFlag.isMobile = innerWidth < 767;
  }

  /**
   * 訂閱resize事件
   * @author kidin-1110427
   */
  subscribeResizeEvent() {
    const resizeEvent = fromEvent(window, 'resize');
    this.resizeEvent = resizeEvent
      .pipe(debounceTime(500), takeUntil(this.ngUnsubscribe))
      .subscribe(() => {
        this.checkDeviceWidth();
      });
  }

  /**
   * 取得日曆可選的星期
   */
  getWeekDayLock() {
    const { isIsoWeekUsing } = this.uiFlag;
    const { unit } = this.reportCondition.dateUnit ?? { unit: DateUnit.week };
    const defaultWeekLock: WeekDayLock = [false, false, false, false, false, false, false];
    switch (unit) {
      case DateUnit.week: {
        const openIsoWeekStartDay = isIsoWeekUsing ? 1 : 0;
        const openIsoWeekEndDay = isIsoWeekUsing ? 0 : 6;
        return {
          start: defaultWeekLock.map(
            (_weekLock, _index) => _index !== openIsoWeekStartDay
          ) as WeekDayLock,
          end: defaultWeekLock.map(
            (_weekLock, _index) => _index !== openIsoWeekEndDay
          ) as WeekDayLock,
        };
      }
      default:
        return { start: defaultWeekLock, end: defaultWeekLock };
    }
  }

  /**
   * 顯示群組清單與否
   * @param e {MouseEvent}
   * @author kidin-1110315
   */
  showGroupList(e: MouseEvent) {
    e.stopPropagation();
    const { showGroupList } = this.uiFlag;
    if (showGroupList) {
      this.uiFlag.showGroupList = false;
      this.unSubscribePluralEvent();
    } else {
      const { groupListDropId } = this;
      this.globalEventsService.setRxCloseDropList(groupListDropId);
      this.uiFlag.showGroupList = true;
      this.subscribePluralEvent(groupListDropId);
    }
  }

  /**
   * 顯示基準日期範圍選擇清單與否
   * @param e {MouseEvent}
   * @author kidin-1110315
   */
  showBaseDateRangeList(e: MouseEvent) {
    e.stopPropagation();
    const { showBaseDateRangeList } = this.uiFlag;
    if (showBaseDateRangeList) {
      this.uiFlag.showBaseDateRangeList = false;
      this.unSubscribePluralEvent();
    } else {
      const { baseDateRangeDropId } = this;
      this.globalEventsService.setRxCloseDropList(baseDateRangeDropId);
      this.uiFlag.showBaseDateRangeList = true;
      this.subscribePluralEvent(baseDateRangeDropId);
    }
  }

  /**
   * 顯示比較日期範圍選擇清單與否
   * @param e {MouseEvent}
   * @author kidin-1110315
   */
  showCompareDateRangeList(e: MouseEvent) {
    e.stopPropagation();
    const { showCompareDateRangeList } = this.uiFlag;
    if (showCompareDateRangeList) {
      this.uiFlag.showCompareDateRangeList = false;
      this.unSubscribePluralEvent();
    } else {
      const { compareDateRangeDropId } = this;
      this.globalEventsService.setRxCloseDropList(compareDateRangeDropId);
      this.uiFlag.showCompareDateRangeList = true;
      this.subscribePluralEvent(compareDateRangeDropId);
    }
  }

  /**
   * 顯示報告日期單位選擇清單與否
   * @param e {MouseEvent}
   * @author kidin-1110315
   */
  showDateUnitList(e: MouseEvent) {
    e.stopPropagation();
    const { showDateUnitList } = this.uiFlag;
    if (showDateUnitList) {
      this.uiFlag.showDateUnitList = false;
      this.unSubscribePluralEvent();
    } else {
      const { reportUnitDropId } = this;
      this.globalEventsService.setRxCloseDropList(reportUnitDropId);
      this.uiFlag.showDateUnitList = true;
      this.subscribePluralEvent(reportUnitDropId);
    }
  }

  /**
   * 選擇群組
   * @param id {string}-group id
   * @param name {string}-group name
   * @author kidin-111315
   */
  selectGroup(id: string, name: string) {
    if (this.reportCondition.group) {
      const { id: oldId } = this.reportCondition.group.focusGroup;
      if (id !== oldId) {
        const level = GroupInfo.getGroupLevel(id);
        this.reportCondition.group.focusGroup = { id, level, name };
        this.reportCondition.needRefreshData = true;
      }

      this.unSubscribePluralEvent();
    }
  }

  /**
   * 選擇運動類別
   * @param type {SportType}
   * @author kidin-1110315
   */
  selectSportType(type: SportType) {
    this.reportCondition.sportType = type;
    this.changeDetectorRef.markForCheck();
  }

  /**
   * 將條件重置為初始條件
   */
  resetCondition(init = true) {
    if (init) this.reportCondition = deepCopy(this.initialCondition);
    this.resetDate();
    this.quickDateList = this.getQuickDateList();
  }

  /**
   * 將日期範圍條件重置為初始條件
   */
  resetDate() {
    const defaultDateRange = this.getDefaultDateRange();
    this.selectBaseDateRange(defaultDateRange);
    this.selectCompareDateRange('none');
    this.handleEndLimitDay();
    this.reportCondition.needRefreshData = true;
    this.changeDetectorRef.markForCheck();
  }

  /**
   * 根據報告呈現單位取得預設範圍日期
   */
  getDefaultDateRange(): DateRangeType {
    const { unit } = this.reportCondition.dateUnit as ReportDateUnit;
    switch (unit) {
      case DateUnit.week:
        return 'thisWeek';
      case DateUnit.month:
        return 'thisMonth';
      case DateUnit.season:
        return 'thisSeason';
      case DateUnit.year:
        return 'thisYear';
      default:
        return 'sevenDay';
    }
  }

  /**
   * 送出條件，並將 needRefreshData 變數重置
   * @author kidin-1110315
   */
  submitCondition() {
    if (this.progress === 100) {
      this.changeDetectorRef.markForCheck();
      this.confirm.emit(this.reportCondition);
      this.reportCondition.needRefreshData = false;
      if (this.uiFlag.isMobile) this.uiFlag.unfold = false;
    }
  }

  /**
   * 訂閱點擊和滾動事件
   * @param componentId {number}-組件唯一碼
   */
  subscribePluralEvent(componentId: number) {
    const clickEvent = fromEvent(document, 'click');
    const scrollElement = document.querySelector('.main__container');
    const scrollEvent = fromEvent(scrollElement!, 'scroll');
    const closeDropEvent = this.globalEventsService.getRxCloseDropList();
    this.pluralEvent = merge(clickEvent, scrollEvent, closeDropEvent)
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((e) => {
        if (e !== componentId) {
          this.unSubscribePluralEvent();
          this.changeDetectorRef.markForCheck();
        }
      });
  }

  /**
   * 解除訂閱點擊和滾動事件
   * @author kidin-1110315
   */
  unSubscribePluralEvent() {
    this.uiFlag = {
      ...this.uiFlag,
      showGroupList: false,
      showBaseDateRangeList: false,
      showCompareDateRangeList: false,
      showDateUnitList: false,
      showTargetUnitList: false,
    };

    this.pluralEvent.unsubscribe();
    this.changeDetectorRef.markForCheck();
  }

  /**
   * 變更基準日期範圍開始時間
   * @param timestamp {number}-所選日期之時間戳
   */
  baseStartTimeChange(timestamp: number) {
    this.reportCondition.baseTime.startTimestamp = timestamp;
    this.reportCondition.baseTime.endTimestamp = this.autoGetEndDay(timestamp);
    this.reportCondition.baseTime.dateRange = 'custom';
    if (this.reportCondition.compareTime?.dateRange === 'sameRangeLastYear') {
      this.selectCompareDateRange('sameRangeLastYear');
    } else {
      this.reportCondition.compareTime = null;
    }

    this.quickDateList = this.getQuickDateList();
    this.afterChangeDate();
  }

  /**
   * 變更基準日期範圍結束時間
   * @param timestamp {number}-所選日期之時間戳
   */
  baseEndTimeChange(timestamp: number) {
    this.reportCondition.baseTime.endTimestamp = timestamp;
    this.reportCondition.baseTime.dateRange = 'custom';

    if (this.reportCondition.compareTime?.dateRange === 'sameRangeLastYear')
      this.selectCompareDateRange('sameRangeLastYear');
    this.quickDateList = this.getQuickDateList();
    this.afterChangeDate();
  }

  /**
   * 變更比較日期範圍開始時間
   * @param timestamp {number}-所選日期之時間戳
   */
  compareStartTimeChange(timestamp: number) {
    if (!this.reportCondition.compareTime) this.reportCondition.compareTime = new DateRange();
    this.reportCondition.compareTime.startTimestamp = timestamp;
    this.reportCondition.compareTime.endTimestamp = this.autoGetEndDay(timestamp);
    this.reportCondition.compareTime.dateRange = 'custom';
    this.afterChangeDate();
  }

  /**
   * 變更比較日期範圍結束時間
   * @param timestamp {number}-所選日期之時間戳
   */
  compareEndTimeChange(timestamp: number) {
    if (!this.reportCondition.compareTime) return false;
    this.reportCondition.compareTime.endTimestamp = timestamp;
    this.reportCondition.compareTime.dateRange = 'custom';
    this.afterChangeDate();
  }

  /**
   * 使用者選擇開始時間後，依據報告單位自動幫使用者選擇結束日
   * @param startTimestamp {number}-所選日期之時間戳
   */
  autoGetEndDay(startTimestamp: number) {
    const { unit } = this.reportCondition.dateUnit ?? { unit: DateUnit.week };
    const dayjsObj = dayjs(startTimestamp);
    switch (unit) {
      case DateUnit.month:
        return dayjsObj.endOf('month').valueOf();
      case DateUnit.season:
        return dayjsObj.endOf('quarter').valueOf();
      case DateUnit.year:
        return dayjsObj.endOf('year').valueOf();
      default:
        return dayjsObj.add(6, 'day').endOf('day').valueOf();
    }
  }

  /**
   * 變更日期後，確認日期單位與更新旗標
   * @author kidin-1110325
   */
  afterChangeDate() {
    this.handleEndLimitDay();
    this.reportCondition.needRefreshData = true;
    this.changeDetectorRef.markForCheck();
  }

  /**
   * 選擇指定基準日期範圍
   * @author kidin-1110316
   */
  selectBaseDateRange(range: DateRangeType) {
    this.reportCondition.baseTime.dateRange = range;
    const { unit } = this.reportCondition.dateUnit as ReportDateUnit;
    const { isIsoWeekUsing } = unit === DateUnit.week ? this.uiFlag : { isIsoWeekUsing: undefined };
    const dateRange = DefaultDateRange.getAssignRangeDate(range, isIsoWeekUsing);
    if (dateRange) {
      const { startTime, endTime } = dateRange;
      this.reportCondition.baseTime.startTimestamp = startTime;
      this.reportCondition.baseTime.endTimestamp = endTime;
      if (this.reportCondition.compareTime?.dateRange === 'sameRangeLastYear')
        this.selectCompareDateRange('sameRangeLastYear');
      this.afterChangeDate();
    }

    this.quickDateList = this.getQuickDateList();
  }

  /**
   * 選擇指定比較日期範圍
   * @author kidin-1110316
   */
  selectCompareDateRange(range: DateRangeType) {
    if (!this.reportCondition.compareTime) this.reportCondition.compareTime = new DateRange();
    this.reportCondition.compareTime.dateRange = range;
    switch (range) {
      case 'none':
        this.reportCondition.compareTime = null;
        break;
      case 'sameRangeLastYear': {
        const { startTimestamp, endTimestamp } = this.reportCondition.baseTime;
        const { startTime, endTime } = DefaultDateRange.getSameRangeLastYear(
          startTimestamp,
          endTimestamp
        );
        this.reportCondition.compareTime.startTimestamp = startTime;
        this.reportCondition.compareTime.endTimestamp = endTime;
        break;
      }
      default: {
        const { isIsoWeekUsing } =
          this.reportCondition.dateUnit?.unit === DateUnit.week
            ? this.uiFlag
            : { isIsoWeekUsing: undefined };
        const dateRange = DefaultDateRange.getAssignRangeDate(range, isIsoWeekUsing);
        if (dateRange) {
          const { startTime: start, endTime: end } = dateRange;
          this.reportCondition.compareTime.startTimestamp = start;
          this.reportCondition.compareTime.endTimestamp = end;
        }

        break;
      }
    }

    this.afterChangeDate();
  }

  /**
   * 變更日期範圍單位
   * @param unit {DateUnit}-日期範圍單位
   */
  selectDateUnit(unit: DateUnit) {
    const { dateUnit } = this.reportCondition;
    const { unit: beforeUnit } = dateUnit ?? { unit: DateUnit.week };
    if (unit !== beforeUnit) {
      (this.reportCondition.dateUnit as ReportDateUnit).unit = unit;
      this.resetCondition(false);
      this.reportCondition.needRefreshData = true;
      this.weekDayLock = this.getWeekDayLock();
      this.handleEndLimitDay();
      this.quickDateList = this.getQuickDateList();
    }
  }

  /**
   * 展開/收合條件篩選器
   */
  foldSelector() {
    this.uiFlag.unfold = !this.uiFlag.unfold;
  }

  /**
   * 處理結束日可選擇的範圍
   */
  handleEndLimitDay() {
    const defaultMax = dayjs().endOf('year').valueOf();
    const columnMax = 52;
    const {
      baseTime: { startTimestamp: baseStartTime },
      compareTime,
      dateUnit,
    } = this.reportCondition;
    this.endLimitDay.base.min = baseStartTime;
    this.endLimitDay.compare.min = compareTime ? compareTime.startTimestamp : null;
    const dayjsUnitKey = dateUnit?.getUnitString() ?? 'week';
    const baseMax = dayjs(baseStartTime).add(columnMax, dayjsUnitKey).valueOf();
    const compareMax = compareTime
      ? dayjs(compareTime.startTimestamp).add(columnMax, dayjsUnitKey).valueOf()
      : defaultMax;
    this.endLimitDay.base.max = baseMax > defaultMax ? defaultMax : baseMax;
    this.endLimitDay.compare.max = compareMax > defaultMax ? defaultMax : compareMax;
  }

  /**
   * 變更是否使用isoWeek(週一為一週第一天)
   */
  changeIsoWeekUsing() {
    this.uiFlag.isIsoWeekUsing = !this.uiFlag.isIsoWeekUsing;
    this.localstorageService.setIsoWeekStatus(this.uiFlag.isIsoWeekUsing);
    this.weekDayLock = this.getWeekDayLock();
    this.resetDate();
  }

  /**
   * 確認是否是否使用isoWeek(週一為一週第一天)
   */
  getIsoWeekUsing() {
    return this.localstorageService.getIsoWeekStatus();
  }

  /**
   * 取得可選擇的快速日期範圍清單
   */
  getQuickDateList() {
    const { unit } = this.reportCondition.dateUnit as ReportDateUnit;
    let baseList: Array<DateRangeType>;
    let compareList: Array<DateRangeType>;
    let isIsoWeekUsing: boolean | undefined;
    switch (unit) {
      case DateUnit.season:
        baseList = ['thisSeason', 'thisYear'];
        compareList = ['lastSeason', 'lastYear', 'sameRangeLastYear', 'none'];
        break;
      case DateUnit.month:
        baseList = ['sixMonth', 'thisMonth', 'thisSeason', 'thisYear'];
        compareList = ['lastMonth', 'lastSeason', 'lastYear', 'sameRangeLastYear', 'none'];
        break;
      case DateUnit.week: {
        baseList = ['sixMonth', 'thisWeek', 'thisMonth', 'thisSeason', 'thisYear'];
        compareList = ['lastWeek', 'lastMonth', 'lastSeason', 'lastYear', 'none'];
        isIsoWeekUsing = this.uiFlag.isIsoWeekUsing;
        break;
      }
      case DateUnit.day:
        baseList = ['today', 'sevenDay', 'thirtyDay', 'thisWeek', 'thisMonth', 'thisSeason'];
        compareList = ['lastWeek', 'lastMonth', 'lastSeason', 'sameRangeLastYear', 'none'];
        break;
      default:
        baseList = ['thisYear'];
        compareList = ['lastYear', 'sameRangeLastYear', 'none'];
        break;
    }

    return {
      base: baseList.map((_type) => this.getAssignRangeDate(_type, isIsoWeekUsing)),
      compare: compareList.map((_type) => this.getAssignRangeDate(_type, isIsoWeekUsing)),
    };
  }

  /**
   * 取得指定範圍的時間
   * @param type {DateRangeType}-日期範圍類別
   * @param isIsoWeekUsing {isIsoWeekUsing}-是否週一為一週起始日
   */
  getAssignRangeDate(type: DateRangeType, isIsoWeekUsing: boolean | undefined) {
    let dateRange: DateRangeInfo | null;
    if (type === 'sameRangeLastYear') {
      const { startTimestamp, endTimestamp } = this.reportCondition.baseTime;
      dateRange = DefaultDateRange.getSameRangeLastYear(startTimestamp, endTimestamp);
    } else {
      dateRange = DefaultDateRange.getAssignRangeDate(type, isIsoWeekUsing);
    }

    if (!dateRange) return { startTime: null, endTime: null, type };
    const { startTime, endTime } = dateRange;
    return { startTime, endTime, type };
  }

  /**
   * 解除rxjs訂閱
   */
  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }
}
