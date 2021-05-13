import { Component, OnInit, OnDestroy, ViewChild, ElementRef, HostListener } from '@angular/core';
import { UtilsService } from '../../services/utils.service';
import { ReportService } from '../../services/report.service';
import moment from 'moment';
import { ReportConditionOpt, GroupSimpleInfo, SportType, SportCode } from '../../models/report-condition';
import { Subject, Subscription, fromEvent, Observable } from 'rxjs';
import { takeUntil, switchMap, tap } from 'rxjs/operators';
import { CloudrunService } from '../../services/cloudrun.service';
import { GroupService } from '../../../containers/dashboard/services/group.service';


interface DateCondition {
  type: 'sevenDay' | 'thirtyDay' | 'sixMonth' | 'today' | 'thisWeek' | 'thisMonth' | 'thisYear' | 'custom';
  maxTimestamp: number;
  startTimestamp: number;
  endTimestamp: number;
  endOfShift: boolean;
  openSelector : null | 'calendarPeriod' | 'custom';
}

type MapListType = 'all' | 'routine';

@Component({
  selector: 'app-report-filter',
  templateUrl: './report-filter.component.html',
  styleUrls: ['./report-filter.component.scss']
})
export class ReportFilterComponent implements OnInit, OnDestroy {

  private ngUnsubscribe = new Subject();
  clickSubscription: Subscription;

  @ViewChild('filterSection') filterSection: ElementRef;
  @ViewChild('dateSelectorBar') dateSelectorBar: ElementRef;
  @ViewChild('calendarPeriod') calendarPeriod: ElementRef;
  @ViewChild('dropMenu') dropMenu: ElementRef;

  /**
   * UI上會需要用到的變數或flag
   */
  uiFlag = {
    showConditionSelector: true,
    isPreviewMode: false,
    dateTypeIdx: 0,
    showDateTypeShiftIcon: false,
    showMapSelector: false,
    dateTypeBarWidth: '800px',
    dateTypeBarOffset: 'translateX(0px)',
    calendarPeriodOffset: 'translateX(0px)',
    activeDateTypeOffset: 'translateX(0px)',
    offsetNum: 0,
    disableBtn: 'pre',
    isLoading: false,
    currentType: '',
    currentLanguage: 'zh-tw',
    mapListType: <MapListType>'routine'
  }

  /**
   * 日期選擇器相關變數
   */
  date: DateCondition = {
    type: 'sevenDay',
    maxTimestamp: moment().endOf('day').valueOf(),
    startTimestamp: moment().startOf('day').subtract(6, 'days').valueOf(),
    endTimestamp: moment().endOf('day').valueOf(),
    endOfShift: true,
    openSelector: null
  }

  /**
   * 運動類別清單
   */
  sportCondition = [
    SportCode.all,
    SportCode.run,
    SportCode.cycle,
    SportCode.weightTrain,
    SportCode.swim,
    SportCode.aerobic,
    SportCode.row,
    SportCode.ball
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

  constructor(
    private utils: UtilsService,
    private reportService: ReportService,
    private cloudrunService: CloudrunService,
    private groupService: GroupService
  ) {}

  ngOnInit(): void {
    this.uiFlag.currentLanguage = this.utils.getLocalStorageObject('locale');
    this.onResize();
    this.getReportCondition();
    this.getLoadingStatus();
  }

  /**
   * 當畫面大小改變時，根據畫面大小縮放日期選擇器
   * @author kidin-1091028
   */
  @HostListener ('window:resize', [])
  onResize() {
    this.date.openSelector = null;

    setTimeout(() => {
      const filterSection = this.filterSection.nativeElement,
            filterSectionWidth = filterSection.clientWidth;

      if (filterSectionWidth < 820) {
        this.uiFlag.showDateTypeShiftIcon = true;
        this.uiFlag.dateTypeBarWidth = `${filterSectionWidth - 90}px`;
      } else {
        this.uiFlag.showDateTypeShiftIcon = false;
        this.uiFlag.dateTypeBarWidth = `800px`;
        this.uiFlag.offsetNum = 0;
        this.uiFlag.dateTypeBarOffset = `translateX(0px)`;
        this.changeActiveBar();
      }

    })

  }

  /**
   * 當畫面大小改變時，根據畫面大小縮放日期選擇器
   * @author kidin-1091028
   */
  @HostListener ('window:click', [])
  onClick() {
    if (this.date.openSelector === 'calendarPeriod') {
      this.date.openSelector = null;
    }
    
  }

  /**
   * 取得報告可以篩選的條件
   * @author kidin-1091028
   */
  getReportCondition() {
    this.reportService.getReportCondition().pipe(
      takeUntil(this.ngUnsubscribe)
    ).subscribe(res => {
      this.reportConditionOpt = res;
      if (this.reportConditionOpt.reportType !== this.uiFlag.currentType) {
        this.initDate();
        this.uiFlag.currentType = this.reportConditionOpt.reportType;
      }

      if (this.reportConditionOpt.reportType === 'cloudRun' && (this.mapList.length === 0 || this.routineRaceList.length === 0)) {
        this.getMapList();
      }

      if (res.date.startTimestamp !== null) {
        this.date.startTimestamp = res.date.startTimestamp;
        this.date.endTimestamp = res.date.endTimestamp;
        this.date.type = res.date.type;
        if (res.date.endTimestamp <= this.date.maxTimestamp) {
          this.date.endOfShift = false;
        } else {
          this.date.endOfShift = true;
        }

        this.changeActiveBar();
      }

    });

  }

  /**
   * 初始化日期
   * @author kidin-1091215
   */
  initDate() {
    this.date = {
      type: 'sevenDay',
      maxTimestamp: moment().endOf('day').valueOf(),
      startTimestamp: moment().startOf('day').subtract(6, 'days').valueOf(),
      endTimestamp: moment().endOf('day').valueOf(),
      endOfShift: true,
      openSelector: null
    }

    this.changeActiveBar();
  }

  /**
   * 取得是否loading
   * @author kidin-1091210
   */
  getLoadingStatus() {
    this.reportService.getReportLoading().pipe(
      takeUntil(this.ngUnsubscribe)
    ).subscribe(res => {
      this.uiFlag.isLoading = res;
    });

  }

  /**
   * 取得所有maplist
   * @author kidin-1091029
   */
  getMapList() {
    this.cloudrunService.getAllMapInfo().subscribe(res => {
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
  openConditionSelector() {
    this.uiFlag.showConditionSelector = !this.uiFlag.showConditionSelector;
  }

  /**
   * 點擊日期選擇類型列的平移按鈕
   * @param action {'pre' | 'next'} - 使用者所點擊的按鈕
   * @author kidin-1091027
   */
  shiftDateTypeBar(action: 'pre' | 'next') {
    const filterSection = this.filterSection.nativeElement,
          filterSectionWidth = filterSection.clientWidth;

    if (action === 'pre') {
      this.uiFlag.offsetNum += 160;
    } else {
      this.uiFlag.offsetNum -= 160;
    }

    if (this.uiFlag.offsetNum === 0) {
      this.uiFlag.disableBtn = 'pre';
    } else if (this.uiFlag.offsetNum <= filterSectionWidth - 848) {
      this.uiFlag.disableBtn = 'next';
    } else {
      this.uiFlag.disableBtn = null;
    }

    this.uiFlag.dateTypeBarOffset = `translateX(${this.uiFlag.offsetNum}px)`;
    this.changeActiveBar();
  }

  /**
   * 切換日期類別
   * @param e {MouseEvent}
   * @param opt {number}-使用者點擊的日期類別
   * @author kidin-1091023
   */
  selectDateRange(e: MouseEvent, opt: number) {
    e.stopPropagation();
    e.preventDefault();
    switch (opt) {
      case 0:
        this.date.type = 'sevenDay';
        this.date.startTimestamp = moment().startOf('day').subtract(6, 'days').valueOf();
        this.date.endTimestamp = moment().endOf('day').valueOf();
        this.date.openSelector = null;

        if (this.reportConditionOpt.hideConfirmBtn) {
          this.submit();
        }

        break;
      case 1:
        this.date.type = 'thirtyDay';
        this.date.startTimestamp = moment().startOf('day').subtract(29, 'days').valueOf();
        this.date.endTimestamp = moment().endOf('day').valueOf();
        this.date.openSelector = null;

        if (this.reportConditionOpt.hideConfirmBtn) {
          this.submit();
        }

        break;
      case 2:
        this.date.type = 'sixMonth';
        this.date.startTimestamp = moment().subtract(6, 'month').add(1, 'days').valueOf();
        this.date.endTimestamp = moment().endOf('day').valueOf();
        this.date.openSelector = null;

        if (this.reportConditionOpt.hideConfirmBtn) {
          this.submit();
        }

        break;
      case 3:
        this.scrollToChildPageTop('filterSection');
        if (this.date.openSelector !== 'calendarPeriod') {
          this.date.openSelector = 'calendarPeriod';
          const dropList = this.calendarPeriod.nativeElement,
                dropListCenter = dropList.getBoundingClientRect().left,
                dateSelectorBar = this.dateSelectorBar.nativeElement,
                dateSelectorBarLeft = dateSelectorBar.getBoundingClientRect().left;

          // 根據畫面大小調整選單位置
          this.uiFlag.calendarPeriodOffset = `translateX(${dropListCenter - dateSelectorBarLeft + 20}px)`;
          
        } else {
          this.date.openSelector = null;
        }
        
        break;
      case 4:
        this.date.type = 'custom';
        this.scrollToChildPageTop('filterSection');
        // 待捲動動畫結束再顯示日期選擇器
        setTimeout(() => {
          if (this.date.openSelector !== 'custom') {
            this.date.openSelector = 'custom';
          } else {
            this.date.openSelector = null;
          }
        }, 500);

        break;
    }

    this.changeActiveBar();
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
      mainBodyEle.scrollTo({top: listEleTop - 60, behavior: 'smooth'});
    };
    
  }

  /**
   * 根據現在所選擇的日期類別顯示藍色底線
   * @author kidin-1091028
   */
  changeActiveBar() {
    switch (this.date.type) {
      case 'sevenDay':
        this.uiFlag.activeDateTypeOffset = `translateX(${this.uiFlag.offsetNum}px)`;
        break;
      case 'thirtyDay':
        this.uiFlag.activeDateTypeOffset = `translateX(${this.uiFlag.offsetNum + 160}px)`;;
        break;
      case 'sixMonth':
        this.uiFlag.activeDateTypeOffset = `translateX(${this.uiFlag.offsetNum + 320}px)`;;
        break;
      case 'today':
      case 'thisWeek':
      case 'thisMonth':
      case 'thisYear':
        this.uiFlag.activeDateTypeOffset = `translateX(${this.uiFlag.offsetNum + 480}px)`;;
        break;
      case 'custom':
        this.uiFlag.activeDateTypeOffset = `translateX(${this.uiFlag.offsetNum + 640}px)`;;
        break;
    }

  }

  /**
   * 選擇曆期
   * @param opt {'today'| 'thisWeek' | 'thisMonth' | 'thisYear'}
   * @author kidin-1091023
   */
  selectCalendarPeroid(opt: 'today'| 'thisWeek' | 'thisMonth' | 'thisYear') {
    this.date.type = opt;
    switch (opt) {
      case 'today':
        this.date.startTimestamp = moment().startOf('day').valueOf();
        this.date.endTimestamp = moment().endOf('day').valueOf();
        break;
      case 'thisWeek':
        this.date.startTimestamp = moment().startOf('week').valueOf();
        this.date.endTimestamp = moment().endOf('day').valueOf();
        break;
      case 'thisMonth':
        this.date.startTimestamp = moment().startOf('month').valueOf();
        this.date.endTimestamp = moment().endOf('day').valueOf();
        break;
      case 'thisYear':
        this.date.startTimestamp = moment().startOf('year').valueOf();
        this.date.endTimestamp = moment().endOf('day').valueOf();
        break;
    }

    this.date.openSelector = null;
    this.changeActiveBar();

    if (this.reportConditionOpt.hideConfirmBtn) {
      this.submit();
    }

  }

  /**
   * 取得使用者所選擇的日期
   * @param e.starDate {string} - 使用者選擇的起始日期('YYYY-MM-DDTHH:mm:ss.SSSZ')
   * @param e.endDate {string} - 使用者選擇的結束日期('YYYY-MM-DDTHH:mm:ss.SSSZ')
   * @author kidin-1091023
   */
  getSelectDate(e: {startDate: string, endDate: string}) {
    if (this.date.openSelector === 'custom') {
      this.date.startTimestamp = moment(e.startDate).valueOf();
      this.date.endTimestamp = moment(e.endDate).valueOf();
      this.date.openSelector = null;

      if (this.reportConditionOpt.hideConfirmBtn) {
        this.submit();
      }

    }
    
  }

  /**
   * 根據日期類別往前平移日期
   * @author kidin-1091023
   */
  shiftPreTime() {
    const startTime = moment(this.date.startTimestamp);
    switch (this.date.type) {
      case 'sevenDay':
      case 'thisWeek':
        this.date.startTimestamp = startTime.subtract(7, 'days').valueOf();
        this.date.endTimestamp = startTime.add(6, 'days').endOf('day').valueOf();
        break;
      case 'thirtyDay':
        this.date.startTimestamp = startTime.subtract(30, 'days').valueOf();
        this.date.endTimestamp = startTime.add(29, 'days').endOf('day').valueOf();
        break;
      case 'sixMonth':
        this.date.startTimestamp = startTime.subtract(6, 'month').valueOf();
        this.date.endTimestamp = startTime.add(6, 'month').subtract(1, 'days').endOf('day').valueOf();
        break;
      case 'today':
        this.date.startTimestamp = startTime.subtract(1, 'days').valueOf();
        this.date.endTimestamp = startTime.endOf('day').valueOf();
        break;
      case 'thisMonth':
        this.date.startTimestamp = startTime.subtract(1, 'month').startOf('month').valueOf();
        this.date.endTimestamp = startTime.endOf('month').valueOf();
        break;
      case 'thisYear':
        this.date.startTimestamp = startTime.subtract(1, 'year').startOf('year').valueOf();
        this.date.endTimestamp = startTime.endOf('year').valueOf();
        break;
      case 'custom':
        const range = moment(this.date.endTimestamp).diff(startTime);
        this.date.startTimestamp = moment(this.date.startTimestamp - range).startOf('day').valueOf();
        this.date.endTimestamp = moment(this.date.startTimestamp + range).endOf('day').valueOf();
        break;
    }

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
   * 根據日期類別往後平移日期
   * @author kidin-1091023
   */
  shiftNextTime() {
    const startTime = moment(this.date.startTimestamp);
    switch (this.date.type) {
      case 'sevenDay':
      case 'thisWeek':
        this.date.startTimestamp = startTime.add(7, 'days').valueOf();
        this.date.endTimestamp = startTime.add(6, 'days').endOf('day').valueOf();
        break;
      case 'thirtyDay':
        this.date.startTimestamp = startTime.add(30, 'days').valueOf();
        this.date.endTimestamp = startTime.add(29, 'days').endOf('day').valueOf();
        break;
      case 'sixMonth':
        this.date.startTimestamp = startTime.add(6, 'month').valueOf();
        this.date.endTimestamp = startTime.add(6, 'month').subtract(1, 'days').endOf('day').valueOf();
        break;
      case 'today':
        this.date.startTimestamp = startTime.add(1, 'days').valueOf();
        this.date.endTimestamp = startTime.endOf('day').valueOf();
        break;
      case 'thisMonth':
        this.date.startTimestamp = startTime.add(1, 'month').startOf('month').valueOf();
        this.date.endTimestamp = startTime.endOf('month').valueOf();
        break;
      case 'thisYear':
        this.date.startTimestamp = startTime.add(1, 'year').startOf('year').valueOf();
        this.date.endTimestamp = startTime.endOf('year').valueOf();
        break;
      case 'custom':
        const range = moment(this.date.endTimestamp).diff(startTime);
        this.date.startTimestamp = moment(this.date.startTimestamp + range).startOf('day').valueOf();
        this.date.endTimestamp = moment(this.date.startTimestamp + range).endOf('day').valueOf();
        break;
    }

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
   * 點擊品牌/企業條件-則下面階層全亮或全暗
   * @author kidin-1091029
   */
  handleClickBrand() {
    const { groupId } = this.reportConditionOpt.group.brands;
    this.reportConditionOpt.group.selectGroup = groupId.split('-').slice(0, 3).join('-');
  }

  /**
   * 點擊分店/分公司條件-則下面階層全亮或全暗，點擊取消時品牌/企業亦取消選取
   * @author kidin-1091029
   */
  handleClickBranch(branchIdx: number) {
    const { groupId } = this.reportConditionOpt.group.branches[branchIdx];
    this.reportConditionOpt.group.selectGroup = groupId.split('-').slice(0, 4).join('-');
  }

  /**
   * 點擊課程/部門條件，點擊取消時品牌/企業及分店/分公司亦取消選取
   * @author kidin-1091029
   */
  handleClickCoach(coachIdx: number) {
    const { groupId } = this.reportConditionOpt.group.coaches[coachIdx];
    this.reportConditionOpt.group.selectGroup = groupId.split('-').slice(0, 5).join('-');
  }

  /**
   * 點擊運動類別
   * @author kidin-1091029
   */
  handleClickSportType(type: SportType) {
    this.reportConditionOpt.sportType = type;
    
    if (this.reportConditionOpt.hideConfirmBtn) {
      this.submit();
    }
    
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
    const clickEvent = fromEvent(document, 'click');
    this.clickSubscription = clickEvent.pipe(
      takeUntil(this.ngUnsubscribe)
    ).subscribe(() => {
      this.clickUnsubscribe();
    });

  }

  /**
   * 取消訂閱click全域事件
   */
  clickUnsubscribe() {
    this.uiFlag.showMapSelector = false;
    this.clickSubscription.unsubscribe();
  }

  /**
   * 選擇雲跑地圖
   * @author kidin-1091029
   */
  chooseMap(idx: number) {
    this.reportConditionOpt.cloudRun.mapId = idx;
  }

  /**
   * 送出條件
   * @author kidin-1091028
   */
  submit() {
    Object.assign(this.reportConditionOpt, {
      date: {
        startTimestamp: this.date.startTimestamp,
        endTimestamp: this.date.endTimestamp,
        type: this.date.type
      }
    });

    this.reportService.setReportCondition(this.reportConditionOpt);
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

  }

  /**
   * 選擇例行賽月份
   * @param index {number}-清單序位
   * @author kidin-1100308
   */
  chooseRoutine(index: number) {
    const {month, mapId} = this.routineRaceList[index],
          isThisMonth = moment().format('YYYYMM') === month;
    this.reportConditionOpt.cloudRun.month = month;
    this.reportConditionOpt.cloudRun.mapId = +mapId;
    this.date = {
      type: 'thisMonth',
      maxTimestamp: moment().endOf('day').valueOf(),
      startTimestamp: moment(month, 'YYYYMM').startOf('month').valueOf(),
      endTimestamp: moment(month, 'YYYYMM').endOf('month').valueOf(),
      endOfShift: !isThisMonth,
      openSelector: null
    }

    this.changeActiveBar();
  }

  /**
   * 切換是否只顯示完賽數據
   * @author kidin-1100413
   */
  changeCheckStatus() {
    this.reportConditionOpt.cloudRun.checkCompletion = !this.reportConditionOpt.cloudRun.checkCompletion;
  }

  /**
   * 取消rxjs訂閱
   * @author kidin-1091029
   */
  ngOnDestroy() {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

}
