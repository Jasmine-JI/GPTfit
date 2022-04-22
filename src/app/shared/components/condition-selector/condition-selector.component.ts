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
  ChangeDetectorRef
} from '@angular/core';
import { DateRange } from '../../classes/date-range';
import { ReportCondition, DateRangeType, ReportDateType } from '../../models/report-condition';
import { DateUnit } from '../../enum/report';
import dayjs from 'dayjs';
import { SportType } from '../../enum/sports';
import { deepCopy } from '../../utils/index';
import { GroupLevel, BrandType } from '../../enum/professional';
import { Subject, Subscription, fromEvent, merge } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { DefaultDateRange } from '../../classes/default-date-range';
import { DAY } from '../../models/utils-constant';
import { GroupInfo } from '../../classes/group-info';

@Component({
  selector: 'app-condition-selector',
  templateUrl: './condition-selector.component.html',
  styleUrls: ['./condition-selector.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
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
  @Output() onConfirm: EventEmitter<ReportCondition> = new EventEmitter();

  private ngUnsubscribe = new Subject();
  private pluralEvent = new Subscription();

  /**
   * ui 會用到的 flag
   */
  uiFlag = {
    showGroupList: false,
    showBaseDateRangeList: false,
    showCompareDateRangeList: false,
    showDateUnitList: false,
    hideDayUnit: false
  };

  /**
   * 日期範圍類別
   */
  dateRange = {
    base: <DateRangeType>'custom',
    compare: <DateRangeType>'none'
  };

  /**
   * 篩選條件
   */
  reportCondition: ReportCondition;

  readonly SportType = SportType;
  readonly GroupLevel = GroupLevel;
  readonly BrandType = BrandType;
  readonly DateUnit = DateUnit;

  constructor(
    private changeDetectorRef: ChangeDetectorRef
  ) {}

  ngOnInit(): void {}


  ngOnChanges(e: SimpleChanges): void {
    if (e.initialCondition) {
      this.resetCondition();
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
      this.uiFlag.showGroupList = true;
      this.subscribePluralEvent();
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
      this.uiFlag.showBaseDateRangeList = true;
      this.subscribePluralEvent();
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
      this.uiFlag.showCompareDateRangeList = true;
      this.subscribePluralEvent();
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
      this.uiFlag.showDateUnitList = true;
      this.subscribePluralEvent();
    }

  }

  /**
   * 選擇群組
   * @param id {string}-group id
   * @param name {string}-group name
   * @author kidin-111315
   */
  selectGroup(id: string, name: string) {
    const { id: oldId } = this.reportCondition.group.focusGroup;
    if (id !== oldId) {
      const level = GroupInfo.getGroupLevel(id);
      this.reportCondition.group.focusGroup = { id, level, name };
      this.reportCondition.needRefreshData = true;
    }

    this.unSubscribePluralEvent();
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
   * @author kidin-1110315
   */
  resetCondition() {
    this.reportCondition = deepCopy(this.initialCondition);
    this.uiFlag.hideDayUnit = this.checkDayOptionsHide();
    this.reportCondition.needRefreshData = true;
    this.changeDetectorRef.markForCheck();
  }

  /**
   * 送出條件，並將 needRefreshData 變數重置
   * @author kidin-1110315
   */
  submitCondition() {
    if (this.progress === 100) {
      this.onConfirm.emit(this.reportCondition);
      this.reportCondition.needRefreshData = false;
    }
      
  }

  /**
   * 訂閱點擊和滾動事件
   * @author kidin-1110315
   */
  subscribePluralEvent() {
    const clickEvent = fromEvent(document, 'click');
    const scrollElement = document.querySelector('.main-body');
    const scrollEvent = fromEvent(scrollElement, 'scroll');
    this.pluralEvent = merge(clickEvent, scrollEvent).pipe(
      takeUntil(this.ngUnsubscribe)
    ).subscribe(res => {
      this.unSubscribePluralEvent();
      this.changeDetectorRef.markForCheck();
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
      showDateUnitList: false
    };

    this.pluralEvent.unsubscribe();
    this.changeDetectorRef.markForCheck();
  }

  /**
   * 變更基準日期範圍開始時間
   * @param e {MouseEvent}
   * @author kidin-1110316
   */
  baseStartTimeChange(e: MouseEvent) {
    const { target } = e as any;
    const { value } = target;
    if (value) {
      const timestamp = dayjs(value, 'YYYY-MM-DD').valueOf();
      this.reportCondition.baseTime.startTimestamp = timestamp;
      this.dateRange.base = 'custom';
    } else {
      target.value = this.reportCondition.baseTime.getStartTimeFormat('YYYY-MM-DD');
    }

    this.checkDateRange('base', 'endTimestamp');
    if (this.dateRange.compare === 'sameRangeLastYear') this.selectCompareDateRange('sameRangeLastYear');
    this.afterChangeDate();
  }

  /**
   * 變更基準日期範圍結束時間
   * @param e {MouseEvent}
   * @author kidin-1110316
   */
  baseEndTimeChange(e: MouseEvent) {
    const { target } = e as any;
    const { value } = target;
    if (value) {
      const timestamp = dayjs(value, 'YYYY-MM-DD').endOf('day').valueOf();
      this.reportCondition.baseTime.endTimestamp = timestamp;
      this.dateRange.base = 'custom';
    } else {
      target.value = this.reportCondition.baseTime.getEndTimeFormat('YYYY-MM-DD');
    }

    this.checkDateRange('base', 'startTimestamp');
    if (this.dateRange.compare === 'sameRangeLastYear') this.selectCompareDateRange('sameRangeLastYear');
    this.afterChangeDate();
  }

  /**
   * 變更比較日期範圍開始時間
   * @param e {MouseEvent}
   * @author kidin-1110316
   */
  compareStartTimeChange(e: MouseEvent) {
    const { target } = e as any;
    const { value } = target;
    if (value) {
      if (!this.reportCondition.compareTime) this.reportCondition.compareTime = new DateRange;
      const timestamp = dayjs(value, 'YYYY-MM-DD').valueOf();
      this.reportCondition.compareTime.startTimestamp = timestamp;
      this.dateRange.compare = 'custom';
      this.checkDateRange('compare', 'endTimestamp');
    } else {
      this.reportCondition.compareTime = null;
      this.dateRange.compare = 'none';
    }

    this.afterChangeDate();
  }

  /**
   * 變更比較日期範圍結束時間
   * @param e {MouseEvent}
   * @author kidin-1110316
   */
  compareEndTimeChange(e: MouseEvent) {
    const { target } = e as any;
    const { value } = target;
    if (value) {
      if (!this.reportCondition.compareTime) this.reportCondition.compareTime = new DateRange;
      const timestamp = dayjs(value, 'YYYY-MM-DD').endOf('day').valueOf();
      this.reportCondition.compareTime.endTimestamp = timestamp;
      this.dateRange.compare = 'custom';
      this.checkDateRange('compare', 'startTimestamp');
    } else {
      this.reportCondition.compareTime = null;
      this.dateRange.compare = 'none';
    }

    this.afterChangeDate();
  }

  /**
   * 變更日期後，確認日期單位與更新旗標
   * @author kidin-1110325
   */
  afterChangeDate() {
    this.uiFlag.hideDayUnit = this.checkDayOptionsHide();
    this.reportCondition.needRefreshData = true;
    this.changeDetectorRef.markForCheck();
  }

  /**
   * 確認日期是否結束時間大於開始時間
   * @param type {ReportDateType}-日期範圍類別
   * @param checkKey {'startTimestamp' | 'endTimestamp'}-受檢查的鍵名
   * @author kidin-1110325
   */
  checkDateRange(type: ReportDateType, checkKey: 'startTimestamp' | 'endTimestamp') {
    const datetTypeKey = type === 'base' ? 'baseTime' : 'compareTime';
    const { startTimestamp, endTimestamp } = this.reportCondition[datetTypeKey];
    if (endTimestamp < startTimestamp) {
      const changeKey = checkKey === 'startTimestamp' ? 'endTimestamp' : 'startTimestamp'
      const changeValue = this.reportCondition[datetTypeKey][changeKey];
      this.reportCondition[datetTypeKey][checkKey] = changeValue;
    }

  }

  /**
   * 選擇指定基準日期範圍
   * @author kidin-1110316
   */
  selectBaseDateRange(range: DateRangeType) {
    this.dateRange.base = range;
    const { startTime, endTime } = DefaultDateRange.getAssignRangeDate(range);
    this.reportCondition.baseTime.startTimestamp = startTime;
    this.reportCondition.baseTime.endTimestamp = endTime;
    if (this.dateRange.compare === 'sameRangeLastYear') this.selectCompareDateRange('sameRangeLastYear');
    this.uiFlag.hideDayUnit = this.checkDayOptionsHide();
    this.reportCondition.needRefreshData = true;
    this.changeDetectorRef.markForCheck();
  }

  /**
   * 選擇指定比較日期範圍
   * @author kidin-1110316
   */
  selectCompareDateRange(range: DateRangeType) {
    this.dateRange.compare = range;
    if (!this.reportCondition.compareTime) this.reportCondition.compareTime = new DateRange;
    switch (range) {
      case 'none':
        this.reportCondition.compareTime = null;
        break;
      case 'sameRangeLastYear':
        const { startTimestamp, endTimestamp } = this.reportCondition.baseTime;
        const { startTime, endTime } = DefaultDateRange.getSameRangeLastYear(startTimestamp, endTimestamp);
        this.reportCondition.compareTime.startTimestamp = startTime;
        this.reportCondition.compareTime.endTimestamp = endTime;
        break;
      default:
        const { startTime: start, endTime: end } = DefaultDateRange.getAssignRangeDate(range);
        this.reportCondition.compareTime.startTimestamp = start;
        this.reportCondition.compareTime.endTimestamp = end;
        break;
    }

    this.uiFlag.hideDayUnit = this.checkDayOptionsHide();
    this.reportCondition.needRefreshData = true;
    this.changeDetectorRef.markForCheck();
  }

  /**
   * 若選擇範圍過大（> 52天），則日期單位清單隱藏"日"的選項
   * @author kidin-1110316
   */
  checkDayOptionsHide() {
    const overRange = 52 * DAY;
    const { baseTime, compareTime, dateUnit: { unit } } = this.reportCondition;
    const { startTimestamp, endTimestamp } = baseTime;
    if (endTimestamp - startTimestamp > overRange) return this.resolveDateUnitConflict(unit);

    if (compareTime) {
      const { startTimestamp: startTime, endTimestamp: endTime } = compareTime;
      if (endTime - startTime > overRange)  return this.resolveDateUnitConflict(unit);
    }

    return false;
  }

  /**
   * 若時間範圍超出52天，且日期範圍單位選擇日，則變更為週
   * @param unit {DateUnit}-時間範圍單位
   * @author kidin-1110316
   */
  resolveDateUnitConflict(unit: DateUnit) {
    if (unit === DateUnit.day) this.selectDateUnit(DateUnit.week);
    return true;
  }

  /**
   * 變更日期範圍單位
   * @param unit {DateUnit}-日期範圍單位
   * @author kidin-1110316
   */
  selectDateUnit(unit: DateUnit) {
    this.reportCondition.dateUnit.unit = unit;
    this.reportCondition.needRefreshData = true;
  }

  /**
   * 解除rxjs訂閱
   */
  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

}
