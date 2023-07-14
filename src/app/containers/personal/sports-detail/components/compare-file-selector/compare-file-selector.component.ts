import {
  Component,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  Input,
  Output,
  EventEmitter,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import {
  AuthService,
  Api21xxService,
  UserService,
  GlobalEventsService,
} from '../../../../../core/services';
import { Api2116Post, SportsListItem } from '../../../../../core/models/api/api-21xx';
import { utcFormat } from '../../../../../core/models/const';
import { SportType } from '../../../../../core/enums/sports';
import { DataUnitType } from '../../../../../core/enums/common';
import dayjs from 'dayjs';
import { Observable, of, fromEvent, Subject, Subscription, merge } from 'rxjs';
import { tap, debounceTime, takeUntil } from 'rxjs/operators';
import {
  WeekDayKeyPipe,
  SportTimePipe,
  WeightSibsPipe,
  SpeedPaceUnitPipe,
  SportPaceSibsPipe,
  DistanceSibsPipe,
  TimeFormatPipe,
  FileSortTypePipe,
} from '../../../../../core/pipes';
import { DescFirstSortDirection, FileSortType } from '../../../../../core/enums/api';
import { getFileInfoParam } from '../../../../../core/utils';

@Component({
  selector: 'app-compare-file-selector',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    MatIconModule,
    WeekDayKeyPipe,
    SportTimePipe,
    WeightSibsPipe,
    SpeedPaceUnitPipe,
    SportPaceSibsPipe,
    DistanceSibsPipe,
    TimeFormatPipe,
    FileSortTypePipe,
  ],
  templateUrl: './compare-file-selector.component.html',
  styleUrls: ['../../sports-detail.component.scss', './compare-file-selector.component.scss'],
})
export class CompareFileSelectorComponent implements OnChanges, OnDestroy {
  private ngUnsubscribe = new Subject();
  private keyUpSubscription = new Subscription();
  private pluralEventSubscription = new Subscription();

  /**
   * 基準檔案編號
   */
  @Input() fileId: number;

  /**
   * 基準運動檔案之運動類別
   */
  @Input() sportsType: SportType;

  /**
   * 基準運動檔案之雲跑地圖名稱與id
   */
  @Input() cloudrunMapId: string;

  /**
   * 選擇的運動檔案編號
   */
  @Output() selectFile = new EventEmitter<number | null>();

  /**
   * 關鍵字輸入框
   */
  @ViewChild('keywordInput') keywordInput: ElementRef;

  /**
   * 是否正在載入中
   */
  isLoading = false;

  /**
   * 顯示比較檔案選擇器框與否
   */
  displaySelector = false;

  /**
   * 顯示年份清單
   */
  displayYearList = false;

  /**
   * 顯示排序類別清單
   */
  displaySortTypeList = false;

  /**
   * 比較檔案排序篩選條件
   */
  condition = {
    token: this.authService.token,
    filterStartTimestamp: dayjs().startOf('year').valueOf(),
    filterEndTimestamp: dayjs().valueOf(),
    sortType: FileSortType.startDate,
    sortDirection: DescFirstSortDirection.desc,
    page: 0,
    pageCounts: 10000,
    filter: {
      type: SportType.run,
      mapId: '',
      searchWords: '',
      targetDeviceType: [],
    },

    /**
     * 是否為降冪排序
     */
    get sortByDesc() {
      return this.sortDirection === DescFirstSortDirection.desc;
    },

    /**
     * 取得 api 2116 post
     */
    get api2116Post(): Api2116Post {
      const {
        token,
        filterStartTimestamp,
        filterEndTimestamp,
        sortType,
        sortDirection,
        filter,
        page,
        pageCounts,
      } = this;

      return {
        token,
        filterStartTime: dayjs(filterStartTimestamp).format(utcFormat),
        filterEndTime: dayjs(filterEndTimestamp).format(utcFormat),
        sortType,
        sortDirection,
        filter,
        page,
        pageCounts,
      };
    },
  };

  /**
   * 運動檔案篩選排序清單
   */
  fileList$: Observable<Array<SportsListItem>> | undefined;

  /**
   * 使用者使用單位
   */
  userUnit = this.userService.getUser().unit;

  /**
   * 可選擇的年份清單
   */
  yearList = this.getYearList();

  /**
   * 可選擇的排序類別
   */
  sortTypeList: Array<FileSortType> = [];

  readonly DataUnitType = DataUnitType;
  readonly FileSortType = FileSortType;
  readonly DescFirstSortDirection = DescFirstSortDirection;

  /**
   * 組件唯一碼，
   * 用來即使點擊頁面取消冒泡的其他下拉選單元素而無法偵測到點擊事件，
   * 亦可再透過全域下拉事件取得組件唯一碼後觸發
   */
  private readonly componentId = this.globalEventsService.getComponentUniqueId();

  constructor(
    private authService: AuthService,
    private api21xxService: Api21xxService,
    private userService: UserService,
    private globalEventsService: GlobalEventsService
  ) {}

  /**
   * 父組件輸入變數時，更新變數
   * @param e
   */
  ngOnChanges(e: SimpleChanges) {
    const { sportsType, cloudrunMapId } = e;
    if (sportsType) this.condition.filter.type = this.sportsType;
    if (cloudrunMapId) this.condition.filter.mapId = this.assignMapId();
    this.sortTypeList = this.getSortTypeList();
  }

  /**
   * 取得年份清單(新到舊)
   */
  getYearList() {
    const startYear = 2019;
    const year = new Date().getUTCFullYear();
    const listLength = year - startYear + 1;
    return new Array(listLength).fill(year).map((_year, _index) => _year - _index);
  }

  /**
   * 根據運動類別取得排序類別清單
   */
  getSortTypeList() {
    let result = [FileSortType.startDate, FileSortType.avgHr, FileSortType.totalSecond];
    switch (this.sportsType) {
      case SportType.weightTrain:
        result.push(FileSortType.totalWeight);
        break;
      case SportType.run:
      case SportType.cycle:
      case SportType.swim:
      case SportType.row:
      case SportType.ball:
        result = result.concat([FileSortType.distance, FileSortType.avgSpeed]);
        break;
    }

    return result;
  }

  /**
   * 若為雲跑檔案，則清單只顯示雲跑地圖清單
   */
  assignMapId() {
    const { cloudrunMapId } = this;
    // 雲跑字串格式為 mapName?mapId=id，故需拆解
    if (cloudrunMapId) {
      const { mapId } = getFileInfoParam(cloudrunMapId);
      return mapId ?? cloudrunMapId; // 相容舊有格式
    }

    return '';
  }

  /**
   * 顯示或隱藏選擇器
   * @param e 點擊事件
   */
  toggleSelector(e: MouseEvent) {
    e.stopPropagation();
    this.displaySelector ? this.closeSelector() : this.showSelector();
  }

  /**
   * 顯示選擇器
   */
  showSelector() {
    this.globalEventsService.setRxCloseDropList(this.componentId);
    this.getFileList();
    this.subscribeSelectorPluralEvent();
    this.subscribeKeywordInput();
  }

  /**
   * 取得檔案清單
   */
  getFileList() {
    this.isLoading = true;
    this.api21xxService
      .fetchGetSportListSort(this.condition.api2116Post)
      .pipe(
        tap((res) => {
          this.isLoading = false;
          this.fileList$ = res.info && res.info.length > 0 ? of(res.info) : undefined;
        })
      )
      .subscribe();
  }

  /**
   * 訂閱點擊和滾動事件，以關閉選擇器
   */
  subscribeSelectorPluralEvent() {
    this.displaySelector = true;
    const scrollElement = document.querySelector('.main__container') as Element;
    const scrollEvent = fromEvent(scrollElement, 'scroll');
    const clickEvent = fromEvent(document, 'click');
    this.pluralEventSubscription = merge(
      clickEvent,
      scrollEvent,
      this.globalEventsService.getRxCloseDropList()
    )
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((e) => {
        if (e !== this.componentId) this.unsubscribeSelectorPluralEvent();
      });
  }

  /**
   * 解除訂閱點擊和滾動事件，並關閉選擇器
   */
  unsubscribeSelectorPluralEvent() {
    this.pluralEventSubscription.unsubscribe();
    this.closeSelector();
  }

  /**
   * 訂閱輸入框變更事件
   */
  subscribeKeywordInput() {
    setTimeout(() => {
      const targetElement = this.keywordInput.nativeElement;
      this.keyUpSubscription = fromEvent(targetElement, 'keyup')
        .pipe(debounceTime(200), takeUntil(this.ngUnsubscribe))
        .subscribe((e) => {
          const { value } = (e as any).target;
          this.condition.filter.searchWords = value ?? '';
          this.getFileList();
        });
    });
  }

  /**
   * 取消訂閱輸入框變更事件
   */
  unsubscribeKeywordInput() {
    if (this.keyUpSubscription) this.keyUpSubscription.unsubscribe();
  }

  /**
   * 關閉選擇器
   */
  closeSelector() {
    this.displaySelector = false;
    this.hideSortTypeList();
    this.hideYearList();
    this.unsubscribeKeywordInput();
  }

  /**
   * 關閉所有選擇器中的下拉選單
   * @param e 點擊事件
   */
  closeDropList(e: MouseEvent) {
    e.stopPropagation();
    this.displayYearList = false;
    this.displaySortTypeList = false;
  }

  /**
   * 選擇比較檔案後送出比較檔案Id
   * @param fileId 比較用運動檔案流水編號
   */
  submitCompareFileId(fileId: number) {
    this.selectFile.emit(fileId);
    this.unsubscribeSelectorPluralEvent();
  }

  /**
   * 取消比較模式
   */
  cancelCompare() {
    this.selectFile.emit(null);
  }

  /**
   * 根據排序類別決定顯示與否
   * @param type 檔案數據類別
   */
  showBySortType(type: FileSortType) {
    const { sortType } = this.condition;
    switch (sortType) {
      case FileSortType.startDate:
      case FileSortType.avgHr:
      case FileSortType.totalSecond:
        return type === this.showBySportsType();
      case FileSortType.avgSpeed:
      case FileSortType.distance:
      case FileSortType.totalWeight:
        return type === sortType;
    }
  }

  /**
   * 根據運動類別決定顯示與否
   */
  showBySportsType() {
    switch (this.sportsType) {
      case SportType.weightTrain:
        return FileSortType.totalWeight;
      case SportType.run:
      case SportType.cycle:
      case SportType.swim:
      case SportType.row:
      case SportType.ball:
        return FileSortType.distance;
      default:
        return null;
    }
  }

  /**
   * 變更排序方向
   */
  changeSortDirection() {
    const { sortByDesc } = this.condition;
    const { asc, desc } = DescFirstSortDirection;
    this.condition.sortDirection = sortByDesc ? asc : desc;
    this.getFileList();
  }

  /**
   * 年份清單顯示與否
   * @param e 點擊事件
   */
  toggleYearList(e: MouseEvent) {
    e.stopPropagation();
    this.displaySortTypeList = false;
    this.displayYearList = !this.displayYearList;
  }

  /**
   * 排序類別清單顯示與否
   * @param e 點擊事件
   */
  toggleSortTypeList(e: MouseEvent) {
    e.stopPropagation();
    this.displayYearList = false;
    this.displaySortTypeList = !this.displaySortTypeList;
  }

  /**
   * 顯示年份清單
   */
  showYearList() {
    this.displayYearList = true;
  }

  /**
   * 隱藏年份清單
   */
  hideYearList() {
    this.displayYearList = false;
  }

  /**
   * 顯示排序類別清單
   */
  showSortTypeList() {
    this.displaySortTypeList = true;
  }

  /**
   * 隱藏排序類別清單
   */
  hideSortTypeList() {
    this.displaySortTypeList = false;
  }

  /**
   * 變更篩選年份
   * @param e 點擊事件
   * @param year 年份
   */
  selectYear(e: MouseEvent, year: number) {
    e.stopPropagation();
    const dayjsObj = dayjs(`${year}`, 'YYYY');
    const startTimestamp = dayjsObj.startOf('year').valueOf();
    const { filterStartTimestamp } = this.condition;
    if (startTimestamp !== filterStartTimestamp) {
      const endTimestamp = dayjsObj.endOf('year').valueOf();
      this.condition.filterStartTimestamp = startTimestamp;
      this.condition.filterEndTimestamp = endTimestamp;
      this.getFileList();
    }

    this.displayYearList = false;
  }

  /**
   * 變更排序類別
   * @param e 點擊事件
   * @param type 排序類別
   */
  selectSortType(e: MouseEvent, type: FileSortType) {
    e.stopPropagation();
    const { sortType } = this.condition;
    if (type !== sortType) {
      this.condition.sortType = type;
      this.getFileList();
    }

    this.displaySortTypeList = false;
  }

  /**
   * 根據螢幕寬度與按鈕位置決定選擇器顯示位置，避免超出螢幕
   */
  getTranslateXStyle() {
    const { innerWidth } = window;
    const button = document.getElementById('compare__button') as Element;
    const { left } = button.getBoundingClientRect();
    const rightPadding = 10;
    const selectorDisplayWidth = innerWidth - left - rightPadding;
    const selectorWidth = 330;
    return `translateX(-${
      selectorDisplayWidth > selectorWidth ? 0 : selectorWidth - selectorDisplayWidth
    }px)`;
  }

  /**
   * 解除rxjs訂閱
   */
  ngOnDestroy(): void {
    this.ngUnsubscribe.next(null);
    this.ngUnsubscribe.complete();
  }
}
