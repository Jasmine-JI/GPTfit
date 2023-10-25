import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef,
  ChangeDetectorRef,
  HostListener,
} from '@angular/core';
import dayjs from 'dayjs';
import { ReportConditionOpt } from '../../../core/models/compo/report-condition.model';
import { Subject, Subscription, fromEvent, merge } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { GlobalEventsService, NodejsApiService, ReportService } from '../../../core/services';
import { Lang } from '../../../core/models/common';
import { SportType } from '../../../core/enums/sports';
import { FileSortType } from '../../../core/enums/api';
import { getLocalStorageObject } from '../../../core/utils';
import { Gender } from '../../../core/enums/personal';
import { SportTypePipe } from '../../../core/pipes/sport-type.pipe';
import { TimeFormatPipe } from '../../../core/pipes/time-format.pipe';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MatIconModule } from '@angular/material/icon';
import { DateRangePickerComponent } from '../date-range-picker/date-range-picker.component';
import { NgIf, NgFor, CommonModule } from '@angular/common';
import {
  MAT_DATE_LOCALE,
  MAT_DATE_FORMATS,
  MatNativeDateModule,
  DateAdapter,
} from '@angular/material/core';
import {
  MAT_MOMENT_DATE_ADAPTER_OPTIONS,
  MomentDateAdapter,
} from '@angular/material-moment-adapter';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { BreakpointObserver } from '@angular/cdk/layout';

const DATE_FORMAT = {
  parse: {
    dateInput: 'YYYY-MM-DD',
  },
  display: {
    dateInput: 'YYYY-MM-DD',
    monthYearLabel: 'YYYY MMM',
    dateA11yLabel: 'LL',
    monthYearA11yLabel: 'YYYY MMMM',
  },
};

interface DateCondition {
  type:
    | 'sevenDay'
    | 'thirtyDay'
    | 'sixMonth'
    | 'today'
    | 'thisWeek'
    | 'thisMonth'
    | 'thisYear'
    | 'custom';
  maxTimestamp: number;
  startTimestamp: number;
  endTimestamp: number;
  endOfShift: boolean;
  openSelector: null | 'calendarPeriod' | 'custom';
}

type MapListType = 'all' | 'routine';

@Component({
  selector: 'app-activity-list-filter',
  templateUrl: './activity-list-filter.component.html',
  styleUrls: ['./activity-list-filter.component.scss'],
  standalone: true,
  imports: [
    NgIf,
    DateRangePickerComponent,
    MatIconModule,
    NgFor,
    TranslateModule,
    TimeFormatPipe,
    SportTypePipe,
    CommonModule,
    MatFormFieldModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatInputModule,
  ],
  providers: [
    {
      provide: DateAdapter,
      useClass: MomentDateAdapter,
      deps: [MAT_DATE_LOCALE, MAT_MOMENT_DATE_ADAPTER_OPTIONS],
    },
    { provide: MAT_DATE_FORMATS, useValue: DATE_FORMAT },
  ],
})
export class ActivityListFilterComponent implements OnInit, OnDestroy {
  private ngUnsubscribe = new Subject();
  clickSubscription: Subscription;
  resizeSubScription: Subscription;

  @ViewChild('filterSection') filterSection: ElementRef;
  @ViewChild('dateSelectorBar') dateSelectorBar: ElementRef;
  @ViewChild('calendarPeriod') calendarPeriod: ElementRef;
  @ViewChild('dropMenu') dropMenu: ElementRef;
  @ViewChild('selectOption') selectOption: ElementRef;

  /**
   *日期快速選單
   */
  dateOptions = {
    sevenDay: 'universal_time_last7Days',
    thirtyDay: 'universal_time_last30Days',
    sixMonth: 'universal_time_last6Months',
    today: 'universal_time_today',
    thisWeek: 'universal_time_thisWeek',
    thisMonth: 'universal_time_thisMonth',
    thisYear: 'universal_time_thisYear',
    custom: 'universal_system_custom',
  };

  /**
   * UI上會需要用到的變數或flag
   */
  uiFlag = {
    showConditionSelector: true,
    showOrderSelector: false,
    isPreviewMode: false,
    isGroupPage: location.pathname.includes('group-info'),
    dateTypeIdx: 0,
    showMapSelector: false,
    isLoading: false,
    currentType: '',
    currentLanguage: <Lang>'zh-tw',
    mapListType: <MapListType>'routine',
    orderType: 1,
    dateOption: this.dateOptions.custom,
    isDateSelect: false,
  };

  /**
   * 日期選擇器相關變數
   */
  date: DateCondition = {
    type: 'sevenDay',
    maxTimestamp: dayjs().endOf('day').valueOf(),
    startTimestamp: dayjs().startOf('day').subtract(6, 'day').valueOf(),
    endTimestamp: dayjs().endOf('day').valueOf(),
    endOfShift: true,
    openSelector: null,
  };

  FilterStartTime: string;
  FilterEndTime: string;

  /**
   * 運動類別清單
   */
  sportCondition = [
    SportType.all,
    SportType.run,
    SportType.cycle,
    SportType.weightTrain,
    SportType.swim,
    SportType.aerobic,
    SportType.row,
    SportType.ball,
    SportType.complex,
  ];

  /**
   *運動類別清單
   */
  sports = [
    { type: SportType.all },
    { type: SportType.run, icon: '1_083-run' },
    { type: SportType.cycle, icon: '1_084-cycle' },
    { type: SportType.weightTrain, icon: '2_065-part_weight_training' },
    { type: SportType.swim, icon: '1_085-swim' },
    { type: SportType.aerobic, icon: '1_087-aerobic' },
    { type: SportType.row, icon: '1_088-row' },
    { type: SportType.ball, icon: '2_073-basketball' },
    { type: SportType.complex, icon: '2_038-complex' },
  ];

  OrderBtns = [
    { orderType: FileSortType.startDate, text: 'universal_time_date' },
    { orderType: FileSortType.totalSecond, text: 'universal_activityData_totalTime' },
    { orderType: FileSortType.distance, text: 'universal_activityData_distance' },
    { orderType: FileSortType.avgHr, text: 'universal_activityData_avgHr' },
  ];

  /**
   * 可以選擇的條件（包含選擇狀態）
   */
  reportConditionOpt: ReportConditionOpt;

  /**
   * 雲跑地圖清單
   */
  mapList: Array<any> = [];

  /**
   * 雲跑例行賽事列表
   */
  routineRaceList: Array<any> = [];

  timeout: any;
  readonly Sex = Gender;
  constructor(
    private reportService: ReportService,
    private changeDetectorRef: ChangeDetectorRef,
    private globalEventsService: GlobalEventsService,
    private nodejsApiService: NodejsApiService,
    private breakpointObserver: BreakpointObserver
  ) {}

  ngOnInit(): void {
    this.uiFlag.currentLanguage = getLocalStorageObject('locale');
    this.onResize();
    this.getReportCondition();
    this.getLoadingStatus();
  }

  /**
   * 開啟/關閉快速日期選單
   */
  dateSelect() {
    this.uiFlag.isDateSelect = !this.uiFlag.isDateSelect;
  }

  getObjectKeys(obj: any): string[] {
    return Object.keys(obj);
  }

  get isMobile() {
    return this.breakpointObserver.isMatched('(max-width: 767px)');
  }

  @HostListener('document:click', ['$event'])
  handleClick(event: Event): void {
    if (this.selectOption) {
      // 檢查點擊事件是否發生在 date_option 之外
      if (!this.selectOption.nativeElement.contains(event.target)) {
        this.uiFlag.isDateSelect = false;
      }
    }
  }

  /**
   * 選擇快速日期
   * @param */
  dateOption(dateOption: string) {
    this.uiFlag.isDateSelect = false;
    this.uiFlag.dateOption = this.dateOptions[dateOption];
    switch (dateOption) {
      case 'sevenDay':
        this.date.type = 'sevenDay';
        this.changeOptionTime(
          dayjs().startOf('day').subtract(6, 'day').toDate(),
          dayjs().endOf('day').toDate()
        );
        break;
      case 'thirtyDay':
        this.date.type = 'thirtyDay';
        this.changeOptionTime(
          dayjs().startOf('day').subtract(29, 'day').toDate(),
          dayjs().endOf('day').toDate()
        );
        break;
      case 'sixMonth':
        this.date.type = 'sixMonth';
        this.changeOptionTime(
          dayjs().subtract(6, 'month').add(1, 'day').toDate(),
          dayjs().endOf('day').toDate()
        );
        break;
      case 'today':
        this.date.type = 'today';
        this.changeOptionTime(dayjs().startOf('day').toDate(), dayjs().endOf('day').toDate());
        break;
      case 'thisWeek':
        this.date.type = 'thisWeek';
        this.changeOptionTime(dayjs().startOf('week').toDate(), dayjs().endOf('day').toDate());
        break;
      case 'thisMonth':
        this.date.type = 'thisMonth';
        this.changeOptionTime(dayjs().startOf('month').toDate(), dayjs().endOf('day').toDate());
        break;
      case 'thisYear':
        this.date.type = 'thisYear';
        this.changeOptionTime(dayjs().startOf('year').toDate(), dayjs().endOf('day').toDate());
        break;
      case 'custom':
        this.date.type = 'custom';
        break;
      default:
        break;
    }
  }

  /**
   *快速日期區間選單
   */
  changeOptionTime(optionStartTime: Date, optionEndTime: Date) {
    this.FilterStartTime = dayjs(optionStartTime).format('YYYY-MM-DDT00:00:00.000+08:00');
    this.FilterEndTime = dayjs(optionEndTime).format('YYYY-MM-DDT23:59:59.999+08:00');

    this.date.startTimestamp = dayjs(optionStartTime).valueOf();
    this.date.endTimestamp = dayjs(optionEndTime).valueOf();

    // 設置debounce避免使用者快速點擊而大量呼叫api
    if (this.timeout) {
      clearTimeout(this.timeout);
    }

    this.timeout = setTimeout(() => {
      if (this.reportConditionOpt.hideConfirmBtn) {
        this.submit();
      }
    }, 300);
  }

  /**
   * custom更改起始日
   */
  changeStartTime(FilterStartTime: Date) {
    this.uiFlag.dateOption = this.dateOptions.custom;
    this.date.type = 'custom';
    this.FilterStartTime = dayjs(FilterStartTime).format('YYYY-MM-DDT00:00:00.000+08:00');
    this.date.startTimestamp = dayjs(FilterStartTime).valueOf();
    this.TimeoutSubmit();
  }

  /**
   * custom更改結束日
   */
  changeEndTime(FilterEndTime: Date) {
    this.uiFlag.dateOption = this.dateOptions.custom;
    this.date.type = 'custom';
    this.FilterEndTime = dayjs(FilterEndTime).format('YYYY-MM-DDT23:59:59.999+08:00');
    this.date.endTimestamp = dayjs(FilterEndTime).endOf('day').valueOf();
    this.TimeoutSubmit();
  }

  /**
   * 設置debounce避免使用者快速點擊而大量呼叫api
   */
  TimeoutSubmit() {
    if (this.timeout) {
      clearTimeout(this.timeout);
    }

    this.timeout = setTimeout(() => {
      if (this.reportConditionOpt.hideConfirmBtn) {
        this.submit();
      }
    }, 300);
  }

  /**
   * 儲存排序 type
   * @param orderType
   */
  chooseOrderType(orderType: number) {
    this.reportService.setSelectedOrderType(orderType);
    this.changeDetectorRef.markForCheck();
    this.uiFlag.orderType = this.reportService.getSelectedOrderType();
    this.submit();
  }

  /**
   * 當畫面大小改變時，根據畫面大小縮放日期選擇器
   * @author kidin-1091028
   */
  onResize() {
    const resizeEvent = fromEvent(window, 'resize');
    this.date.openSelector = null;
    this.resizeSubScription = merge(resizeEvent, this.globalEventsService.getRxSideBarMode())
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((e) => {});

    this.changeDetectorRef.markForCheck();
  }

  /**
   * 取得報告可以篩選的條件
   * @author kidin-1091028
   */
  getReportCondition() {
    this.reportService
      .getReportCondition()
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((res) => {
        this.reportConditionOpt = res;
        // 確認頁面是否變更
        const { pageType } = this.reportConditionOpt;

        if (pageType !== this.uiFlag.currentType) {
          this.initDate();
          this.uiFlag.currentType = pageType;

          // 運動列表預設不展開條件篩選器
          // if (pageType === 'file') {
          //   this.uiFlag.showConditionSelector = false;
          // }
        }

        // 確認雲跑的地圖資訊是否載入
        const mapLoaded = this.mapList.length > 0 && this.routineRaceList.length > 0;
        if (pageType === 'cloudRun' && !mapLoaded) {
          this.getMapList();
        }

        // 確認是否可以選擇日期
        const { date } = res;
        if (date && date.startTimestamp !== null) {
          const { startTimestamp, endTimestamp, type } = date;
          this.date.startTimestamp = startTimestamp;
          this.date.endTimestamp = endTimestamp;
          this.date.type = type;
          if (endTimestamp <= this.date.maxTimestamp) {
            this.date.endOfShift = false;
          } else {
            this.date.endOfShift = true;
          }
        }

        this.changeDetectorRef.markForCheck();
      });
  }

  /**
   * 初始化日期
   * @author kidin-1091215
   */
  initDate() {
    this.date = {
      type: 'sevenDay',
      maxTimestamp: dayjs().endOf('day').valueOf(),
      startTimestamp: dayjs().startOf('day').subtract(6, 'day').valueOf(),
      endTimestamp: dayjs().endOf('day').valueOf(),
      endOfShift: true,
      openSelector: null,
    };
  }

  /**
   * 取得是否loading
   * @author kidin-1091210
   */
  getLoadingStatus() {
    this.reportService
      .getReportLoading()
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((res) => {
        this.uiFlag.isLoading = res;
        this.changeDetectorRef.markForCheck();
      });
  }

  /**
   * 取得所有maplist
   * @author kidin-1091029
   */
  getMapList() {
    this.nodejsApiService.getAllMapInfo().subscribe((res) => {
      const { list, leaderboard } = res;
      this.mapList = list;
      this.routineRaceList = leaderboard;
      if (this.reportConditionOpt.cloudRun.month === this.routineRaceList[0].month) {
        this.uiFlag.mapListType = 'routine';
      }
    });
  }

  /**
   * 展開或收合條件選擇器
   * @author kidin-1091028
   */
  openConditionSelector(e: string) {
    switch (e) {
      case 'order':
        this.uiFlag.showOrderSelector = !this.uiFlag.showOrderSelector;
        break;
      case 'filten':
        this.uiFlag.showConditionSelector = !this.uiFlag.showConditionSelector;
        this.uiFlag.showOrderSelector = false;
        break;
      default:
        break;
    }
  }

  /**
   * 當使用者點擊功能列時，將功能列捲動到上面避免日曆被遮住
   * @param element {string}-欲捲動的元素
   * @author kidin-1100119
   */
  scrollToChildPageTop(element: string) {
    const listEle = this[element].nativeElement,
      listEleTop = listEle.offsetTop,
      mainBodyEle = document.querySelector('.main-body');

    if (mainBodyEle) {
      mainBodyEle.scrollTo({ top: listEleTop - 60, behavior: 'smooth' });
    }
  }

  /**
   * 點擊品牌/企業條件-則下面階層全亮或全暗
   * @author kidin-1091029
   */
  handleClickBrand() {
    const { groupId } = this.reportConditionOpt.group.brands;
    this.reportConditionOpt.group.selectGroup = groupId.split('-').slice(0, 3).join('-');
    if (this.reportConditionOpt.hideConfirmBtn) {
      this.submit();
    }
    this.changeDetectorRef.markForCheck();
  }

  /**
   * 點擊分店/分公司條件-則下面階層全亮或全暗，點擊取消時品牌/企業亦取消選取
   * @author kidin-1091029
   */
  handleClickBranch(branchIdx: number) {
    const { groupId } = this.reportConditionOpt.group.branches[branchIdx];
    this.reportConditionOpt.group.selectGroup = groupId.split('-').slice(0, 4).join('-');
    if (this.reportConditionOpt.hideConfirmBtn) {
      this.submit();
    }

    this.changeDetectorRef.markForCheck();
  }

  /**
   * 點擊課程/部門條件，點擊取消時品牌/企業及分店/分公司亦取消選取
   * @author kidin-1091029
   */
  handleClickCoach(coachIdx: number) {
    const { groupId } = this.reportConditionOpt.group.coaches[coachIdx];
    this.reportConditionOpt.group.selectGroup = groupId.split('-').slice(0, 5).join('-');
    if (this.reportConditionOpt.hideConfirmBtn) {
      this.submit();
    }
    this.changeDetectorRef.markForCheck();
  }

  /**
   * 點擊運動類別
   * @author kidin-1091029
   */
  handleClickSportType(type: SportType) {
    this.reportConditionOpt.sportType = type;
    if (this.reportConditionOpt.sportType) {
      this.submit();
    }

    this.changeDetectorRef.markForCheck();
  }

  /**
   * 顯示地圖選擇器
   * @event click
   * @param e {MouseEvent}
   * @author kidin-1091029
   */
  showMapSelector(e: MouseEvent) {
    e.stopPropagation();
    if (this.uiFlag.showMapSelector) {
      this.clickUnsubscribe();
    } else {
      this.uiFlag.showMapSelector = true;
      this.scrollToChildPageTop('dropMenu');
      this.clickSubscribe();
    }
  }

  /**
   * 訂閱click全域事件
   * @author kidin-1100304
   */
  clickSubscribe() {
    const listenEle = document.querySelector('.main__container');
    const clickEvent = fromEvent(listenEle, 'click');
    this.clickSubscription = clickEvent.pipe(takeUntil(this.ngUnsubscribe)).subscribe((e) => {
      this.clickUnsubscribe();
    });

    this.changeDetectorRef.markForCheck();
  }

  /**
   * 取消訂閱click全域事件
   */
  clickUnsubscribe() {
    this.date.openSelector = null;
    this.uiFlag.showMapSelector = false;
    this.clickSubscription.unsubscribe();
    this.changeDetectorRef.markForCheck();
  }

  /**
   * 選擇雲跑地圖
   * @author kidin-1091029
   */
  chooseMap(idx: number) {
    this.reportConditionOpt.cloudRun.mapId = idx;
    this.changeDetectorRef.markForCheck();
  }

  /**
   * 送出條件
   * @author kidin-1091028
   */
  submit() {
    if (this.reportConditionOpt.date) {
      Object.assign(this.reportConditionOpt, {
        date: {
          startTimestamp: this.date.startTimestamp,
          endTimestamp: this.date.endTimestamp,
          type: this.date.type,
        },
      });
    }
    this.reportService.setReportCondition(this.reportConditionOpt);
    this.changeDetectorRef.markForCheck();
  }

  /**
   * 變更雲跑地圖清單類別
   * @param type {MapListType}-清單類別
   * @author kidin-1100308
   */
  changeMapListType(type: MapListType) {
    this.uiFlag.mapListType = type;
    if (type === 'routine') {
      this.chooseRoutine(0);
    }

    this.changeDetectorRef.markForCheck();
  }

  /**
   * 變更性別篩選
   * @param gender { Gender }-性別
   * @author kidin-1100308
   */
  changeGender(gender: Gender) {
    this.reportConditionOpt.gender = gender;
    this.changeDetectorRef.markForCheck();
  }

  /**
   * 選擇例行賽月份
   * @param index {number}-清單序位
   * @author kidin-1100308
   */
  chooseRoutine(index: number) {
    const { month, mapId } = this.routineRaceList[index],
      isThisMonth = dayjs().format('YYYYMM') === month;
    this.reportConditionOpt.cloudRun.month = month;
    this.reportConditionOpt.cloudRun.mapId = +mapId;
    this.date = {
      type: 'thisMonth',
      maxTimestamp: dayjs().endOf('day').valueOf(),
      startTimestamp: dayjs(month, 'YYYYMM').startOf('month').valueOf(),
      endTimestamp: dayjs(month, 'YYYYMM').endOf('month').valueOf(),
      endOfShift: !isThisMonth,
      openSelector: null,
    };
  }

  /**
   * 切換是否只顯示完賽數據
   * @author kidin-1100413
   */
  changeCheckStatus() {
    this.reportConditionOpt.cloudRun.checkCompletion =
      !this.reportConditionOpt.cloudRun.checkCompletion;
    this.changeDetectorRef.markForCheck();
  }

  /**
   * 變更年齡篩選範圍
   * @param e {Event}
   * @param boundary {'min' | 'max'}-上下限
   * @author kidin-1100721
   */
  handleAgeRange(e: Event, boundary: 'min' | 'max') {
    const targetValue = (e as any).currentTarget.value,
      checkNumRex = /^(\d*)$/,
      isMinRange = boundary === 'min';
    if (targetValue && checkNumRex.test(targetValue)) {
      const { min, max } = this.reportConditionOpt.age,
        haveMinValue = min !== null,
        haveMaxValue = max !== null;
      if (isMinRange) {
        this.reportConditionOpt.age.min = !haveMaxValue || +targetValue < max ? +targetValue : max;
      } else {
        this.reportConditionOpt.age.max = !haveMinValue || +targetValue > min ? +targetValue : min;
      }
    } else {
      this.reportConditionOpt.age[boundary] = isMinRange ? 0 : 100;
    }

    (e as any).currentTarget.value = this.reportConditionOpt.age[boundary];
    this.changeDetectorRef.markForCheck();
  }

  /**
   * 選擇裝置類別
   * @param type {string}-裝置類型代碼
   * @author kidin-1100722
   */
  selectDevice(type: string) {
    const { deviceType } = this.reportConditionOpt;
    if (deviceType.includes(type)) {
      this.reportConditionOpt.deviceType = deviceType.filter((_type) => _type !== type);
    } else {
      deviceType.push(type);
    }

    if (this.reportConditionOpt.hideConfirmBtn) {
      this.submit();
    }

    this.changeDetectorRef.markForCheck();
  }

  /**
   * 變更欲篩選的裝置使用狀態
   * @param status {'all' | 'fitpairing' | 'idle'}-欲篩選的裝置使用狀態
   * @author kidin-1100723
   */
  changeFitpairUse(status: 'all' | 'fitpairing' | 'idle') {
    this.reportConditionOpt.deviceUseStatus = status;
    this.changeDetectorRef.markForCheck();
  }

  /**
   *
   * @param e {Event | MouseEvent}
   * @author kidin-1100817
   */
  handleKeywordInput(e: Event | MouseEvent) {
    const {
      target: { value },
    } = e as any;
    this.reportConditionOpt.keyword = value;
    if (this.reportConditionOpt.hideConfirmBtn) {
      this.submit();
    }
  }

  /**
   * 取消rxjs訂閱
   * @author kidin-1091029
   */
  ngOnDestroy() {
    this.ngUnsubscribe.next(null);
    this.ngUnsubscribe.complete();
  }
}
