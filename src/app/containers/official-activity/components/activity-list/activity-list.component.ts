import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { OfficialActivityService } from '../../services/official-activity.service';
import { UtilsService } from '../../../../shared/services/utils.service';
import { UserProfileService } from '../../../../shared/services/user-profile.service';
import { Subject, Subscription, fromEvent, merge, of, combineLatest } from 'rxjs';
import { takeUntil, switchMap, map } from 'rxjs/operators';
import { UserProfileInfo, AccountTypeEnum, AccountStatusEnum } from '../../../../shared/models/user-profile-info';
import moment from 'moment';
import { MapLanguageEnum } from '../../../../shared/models/i18n';
import { SelectDate } from '../../../../shared/models/utils-type';
import { DomSanitizer } from '@angular/platform-browser';
import { EventStatus } from '../../models/activity-content';
import { CloudrunService } from '../../../../shared/services/cloudrun.service';
import { formTest } from '../../../../shared/models/form-test';
import { 
  PaidStatusEnum,
  ProductShipped,
  HaveProduct,
  ApplyStatus,
  ListStatus
} from '../../models/activity-content';
import { AccessRight } from '../../../../shared/models/accessright';
import { TranslateService } from '@ngx-translate/core';
import { codes } from '../../../../shared/models/countryCode';


type Page = 'activity-list' | 'my-activity';

enum AllStatus {
  notEnable,
  unPaid,
  paid,
  personCanceling,
  personCancelled,
  eventCutoff,
  eventCancelled,
}

const defaultRaceDate = {
  start: moment().subtract(6, 'months'),
  end: moment().add(6, 'months')
}

@Component({
  selector: 'app-activity-list',
  templateUrl: './activity-list.component.html',
  styleUrls: ['./activity-list.component.scss']
})
export class ActivityListComponent implements OnInit, OnDestroy {
  private ngUnsubscribe = new Subject();
  private globelEventSubscription = new Subscription;

  /**
   * ui會用到的各個flag
   */
  uiFlag = {
    progress: 100,
    currentPage: <Page>'activity-list',
    editMode: false,
    isMobile: false,
    showManageMenu: false,
    openDatePicker: false,
    showCreateScheduleBox: false,
    showListStatusMenu: false,
    showCountryCodeList: false,
    showDetail: null
  }

  /**
   * api 6004 request body
   */
  eventListCondition = {
    token: '',
    filterListStatus: <ListStatus>ListStatus.all,
    filterRaceStartTime: defaultRaceDate.start.unix(),
    filterRaceEndTime: defaultRaceDate.end.unix(),
    page: {
      index: 0,
      counts: 10
    }

  };

  selectDate = {
    startTimestamp: defaultRaceDate.start.valueOf(),
    endTimestamp: defaultRaceDate.end.valueOf()
  };

  /**
   * 建立排程賽局所需資訊(api 2004)
   */
  scheduleRace = {
    token: null,
    sportMode: 0, // 競賽模式
    trainingType: 0,  // Treadmill
    mapIndex: null,
    raceType: 0,  // 競速競賽
    raceLap: 1,
    raceOrientation: 0,  // 正方向競賽
    maxRaceMans: 50,
    raceManPermission: 0,  // 公開
    raceClearCode: null,
    raceName: null,
    schedTimestamp: null
  };

  /**
   * 排程賽局時間設定
   */
  scheduleTime = {
    today: null,
    date: null,
    time: null
  }

  paginationList = [1];
  totalCounts = 0;
  lastPage = 1;
  screenSize: number;
  eventList = [];
  effectEventList = [];
  serverTimestamp: number;
  token = this.utils.getToken();
  userProfile: UserProfileInfo;
  timeInterval: any;
  allMapInfo: Array<any>;
  mapLanguage = 0;
  mapImgPath = `${location.origin}/app/public_html/cloudrun/update/`;
  readonly PaidStatusEnum = PaidStatusEnum;
  readonly ProductShipped = ProductShipped;
  readonly EventStatus = EventStatus;
  readonly HaveProduct = HaveProduct;
  readonly ApplyStatus = ApplyStatus;
  readonly ListStatus = ListStatus;
  readonly AccessRight = AccessRight;
  readonly passAdmin = [AccessRight.auditor, AccessRight.pusher];
  readonly countryCodeList = codes;
  readonly AccountTypeEnum = AccountTypeEnum;
  readonly AllStatus = AllStatus;

  constructor(
    private officialActivityService: OfficialActivityService,
    private utils: UtilsService,
    private userProfileService: UserProfileService,
    private router: Router,
    private sanitizer: DomSanitizer,
    private cloudrunService: CloudrunService,
    private translate: TranslateService
  ) { }

  ngOnInit(): void {
    this.getUserProfile();
    this.checkDomain();
    this.checkLanguage();
    this.checkMobileMode();
    this.checkCurrentPage();
    this.subscribeUrlChange();
  }

  /**
   * 確認query string
   * @author kidin-1110113
   */
   checkPage() {
    const { p } = this.utils.getUrlQueryStrings(location.search);
    if (p && formTest.number.test(p)) {
      const idx = +p - 1;
      const index = idx >= 0 ? idx : 0;
      this.eventListCondition.page.index = index;
    }

  }

  /**
   * 取得使用者資訊
   * @author kidin-1101006
   */
  getUserProfile() {
    this.userProfileService.getRxUserProfile().pipe(
      takeUntil(this.ngUnsubscribe)
    ).subscribe(res => {
      this.userProfile = res;
      if (res) {
        this.token = this.utils.getToken();
        this.checkCurrentPage();
      } else {
        this.uiFlag.editMode = false;
        if (this.uiFlag.currentPage === 'my-activity') {
          this.router.navigateByUrl(`/official-activity/activity-list`);
        }

      }
      
    });

  }

  /**
   * 確認domain以方便產生雲跑圖片路徑
   * @author kidin-1101007
   */
  checkDomain() {
    const { hostname, origin } = location;
    if (hostname === 'www.gptfit.com') {
      this.mapImgPath = `${origin}/app/public_html/cloudrun/update/`;
    } else {
      this.mapImgPath = 'https://app.alatech.com.tw/app/public_html/cloudrun/update/';
    }

  }

  /**
   * 確認現在頁面
   * @author kidin-1101006
   */
  checkCurrentPage() {
    const { pathname } = location,
          [, mainPath, childPath, ...rest] = pathname.split('/');
    this.uiFlag.currentPage = childPath as Page;
    if (childPath === 'activity-list') {
      this.checkPage();
      this.getActivityList();
    } else if (childPath === 'my-activity') {
      this.getUserHistory();
    }

  }

  /**
   * 訂閱url變更事件，若有關鍵字則使用關鍵字篩選活動
   * @author kidin-1101217
   */
  subscribeUrlChange() {
    this.router.events.pipe(
      takeUntil(this.ngUnsubscribe)
    ).subscribe(e => {
      if (e instanceof NavigationEnd) {
        this.checkPage();
        const { search } = this.utils.getUrlQueryStrings(location.search);
        const searchWords = decodeURIComponent(search);
        const { currentPage } = this.uiFlag;
        switch (currentPage) {
          case 'activity-list':
            if (!search || searchWords.length === 0) {
              delete (this.eventListCondition as any).searchWords;
            } else {
              Object.assign(this.eventListCondition, { searchWords });
            }
            
            this.getActivityList();
            break;
          case 'my-activity':
            this.handleEffectEvent();
            if (searchWords) {
              this.effectEventList = this.effectEventList.filter(_list => _list.eventName.includes(searchWords));
            }

            break;
        }
        
      }

    });

  }

  /**
   * 確認語系以對應地圖多國語系
   * @returns {}
   * @author kidin-1101007
   */
  checkLanguage() {
    const lan = this.utils.getLocalStorageObject('locale');
    switch (lan) {
      case 'zh-tw':
        this.mapLanguage = MapLanguageEnum.TW;
        break;
      case 'zh-cn':
        this.mapLanguage = MapLanguageEnum.CN;
        break;
      case 'es-es':
        this.mapLanguage = MapLanguageEnum.ES;
        break;
      default:
        this.mapLanguage = MapLanguageEnum.EN;
        break;
    }

  }

  /**
   * 確認現在裝置螢幕大小是否為攜帶型裝置
   * @author kidin-1101012
   */
  checkMobileMode() {
    this.officialActivityService.getScreenSize().pipe(
      takeUntil(this.ngUnsubscribe)
    ).subscribe(res => {
      this.screenSize = res as number;
      this.uiFlag.isMobile = res <= 767;
    });

  }

  /**
   * 取得賽事列表
   * @author kidin-1101006
   */
  getActivityList() {
    const { progress } = this.uiFlag;
    if (progress === 100) {
      this.uiFlag.progress = 30;
      this.eventListCondition.token = this.token;
      this.officialActivityService.getEventList(this.eventListCondition).pipe(
        switchMap(eventListRes => this.officialActivityService.getRxAllMapInfo().pipe(
          map(mapInfoRes => [eventListRes, mapInfoRes])
        )),
        takeUntil(this.ngUnsubscribe)
      ).subscribe(resArr => {
        const [eventListRes, mapInfoRes] = resArr;
        this.allMapInfo = mapInfoRes;
        if (this.utils.checkRes(eventListRes)) {
          const { eventList, currentTimestamp, totalCounts } = eventListRes;
          this.eventList = eventList;
          this.serverTimestamp = currentTimestamp;
          this.totalCounts = totalCounts;
          this.lastPage = Math.ceil(this.totalCounts / 10);
          this.handleEffectEvent();
          this.scrollPage();
          this.createPaginationList();
        }

        this.setQueryString();
        this.uiFlag.progress = 100;
      });

    }

  }

  /**
   * 根據活動報名時間是否開始與使用者權限篩選可顯示之活動列表
   * @author kidin-1101116
   */
  handleEffectEvent() {
    const { eventList, userProfile, serverTimestamp } = this;
    if (eventList.length > 0) {
      const isAdmin = userProfile && userProfile.systemAccessRight[0] <= 28;
      const effectEvent = eventList.filter(_list => serverTimestamp >= _list.applyDate.startDate);
      if (isAdmin) {
        this.effectEventList = eventList;
      } else {
        this.effectEventList = effectEvent;
      }

      this.countCurrentTime(serverTimestamp);
    } else {
      this.effectEventList = [];
    }

  }

  /**
   * 取得個人歷史資訊，未登入者導至登入頁面，
   * 自動檢查最新的那賽事繳費狀態是否未繳費，未繳費則使用api 6014更新繳費狀態再重新取得個人歷史資訊
   * @author kidin-1101006
   */
  getUserHistory() {
    const { token } = this;
    if (token) {
      const { progress } = this.uiFlag;
      if (progress === 100) {
        this.uiFlag.progress = 30;
        this.officialActivityService.getParticipantHistory({token}).subscribe(res => {
          if (this.utils.checkRes(res)) {
            const { info: { history }, currentTimestamp } = res;
            if (history) {
              const reverseList = history.reverse();
              this.eventList = reverseList;
              this.effectEventList = reverseList;
            }
            
            this.countCurrentTime(currentTimestamp);
          }

          this.uiFlag.progress = 100;
        });

      }

    } else {
      this.router.navigateByUrl('/signIn-web');
    }

  }

  /**
   * 更新現在時間
   * @param currentTimestamp {number}-server 的現在時間
   * @author kidin-1101006
   */
  countCurrentTime(currentTimestamp: number) {
    if (!this.timeInterval) {
      this.serverTimestamp = currentTimestamp;
      this.timeInterval = setInterval(() => {
        this.serverTimestamp += 1;
      }, 1000);

    }

  }

  /**
   * 轉導至指定頁面
   * @param e {MouseEvent}
   * @param page {'contestant-list' | 'edit-activity' | 'edit-carousel'}-欲轉導之頁面
   * @param eventId {number}-活動流水id
   * @param canEdit {boolean}-該活動是否可編輯
   * @author kidin-1101013
   */
  navigatePage(
    e: MouseEvent,
    page: 'contestant-list' | 'edit-activity' | 'edit-carousel',
    eventId: number,
    canEdit: boolean
  ) {
    e.preventDefault();
    if (canEdit || page === 'contestant-list') {
      this.router.navigateByUrl(`/official-activity/${page}/${eventId}`);
    } else if (page === 'edit-carousel') {
      this.router.navigateByUrl(`/official-activity/${page}`);
    }
    
  }

  /**
   * 開啟管理賽事模式
   * @author kidin-1101013
   */
  switchEditMode() {
    this.uiFlag.editMode = !this.uiFlag.editMode;
  }

  /**
   * 取得所選日期
   * @param date {SelectDate}
   * @author kidin-1101013
   */
  getSelectDate(date: SelectDate) {
    const { startDate, endDate } = date;
    this.eventListCondition.filterRaceStartTime = moment(startDate).unix();
    this.eventListCondition.filterRaceEndTime = moment(endDate).unix();
    this.initPageIndex();
    this.selectDate = {
      startTimestamp: moment(startDate).valueOf(),
      endTimestamp: moment(endDate).valueOf()
    }

    this.unsubscribePluralEvent();
    this.checkCurrentPage();
  }

  /**
   * 顯示管理選單
   * @author kidin-1101013
   */
  showManageMenu(e: MouseEvent) {
    e.stopPropagation();
    const { showManageMenu } = this.uiFlag;
    if (showManageMenu) {
      this.unsubscribePluralEvent();
    } else {
      this.uiFlag.showManageMenu = true;
      this.subscribePluralEvent();
    }

  }

  /**
   * 訂閱全域點擊與滾動事件
   * @author kidin-1101013
   */
  subscribePluralEvent() {
    const scrollElement = document.querySelector('.main__page');
    const clickEvent = fromEvent(scrollElement, 'click');
    const scrollEvent = fromEvent(scrollElement, 'scroll');
    this.globelEventSubscription = merge(clickEvent, scrollEvent).pipe(
      takeUntil(this.ngUnsubscribe)
    ).subscribe(e => {
      this.unsubscribePluralEvent();
    });

  }

  /**
   * 取消訂閱全域點擊事件
   * @author kidin-1101013
   */
  unsubscribePluralEvent() {
    this.uiFlag.showManageMenu = false;
    this.uiFlag.openDatePicker = false;
    this.uiFlag.showListStatusMenu = false;
    this.uiFlag.showCountryCodeList = false;
    this.globelEventSubscription.unsubscribe();
  }

  /**
   * 將頁面捲動到上方再顯示日期選擇器，避免無法完整顯示
   * @param e {MouseEvent}
   * @author kidin-1101014
   */
  checkScreenHeight(e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!this.uiFlag.openDatePicker) {
      const dateRangePickHeight = 560;
      const screenHeight = window.innerHeight;
      const listElement = document.querySelector('.activity__list__section') as any;
      const listElementTop = listElement.offsetTop - 60;
      const isNarrowMobile = window.innerWidth < 500;
      if (isNarrowMobile && screenHeight - listElementTop < dateRangePickHeight) {
        this.scrollPage(listElementTop);
        setTimeout(() => {
          this.openDateRangePicker();
        }, 300);

      } else {
        this.openDateRangePicker();
      }

    } else {
      this.unsubscribePluralEvent();
    }

  }

  /**
   * 捲動頁面至指定位置
   * @param top {number}-指定位置
   * @author kidin-1110104
   */
  scrollPage(top: number = 0) {
    const mainBodyElement = document.querySelector('.main__page');
    mainBodyElement.scrollTo({top, behavior: top === 0 ? 'smooth' : 'auto'});
  }

  /**
   * 開啟日期選擇器
   * @author kidin-1101014
   */
  openDateRangePicker() {
    this.uiFlag.openDatePicker = true;
    this.subscribePluralEvent();
  }

  /**
   * 成立訂單並前往綠界繳費頁面
   * @param eventId {number}-活動流水id
   * @param feeId {number}-商品費用
   * @param productName {string}-商品名稱
   * @param totalAmount {number}-商品價格
   * @author kidin-1101117
   */
  navigatePaidPage(
    e: MouseEvent,
    eventId: number,
    feeId: number,
    productName: string,
    totalAmount: number
  ) {
    e.stopPropagation();
    e.preventDefault();
    const body = {
      token: this.token,
      eventId,
      feeId,
      productName,
      totalAmount
    };

    this.officialActivityService.createProductOrder(body).subscribe(res => {
      if (this.utils.checkRes(res)) {
        const { responseHtml } = res;
        const newElement = document.createElement('div');
        const target = document.querySelector('.main__page');
        newElement.innerHTML = responseHtml as any;
        target.appendChild(newElement);
        (document.getElementById('data_set') as any).submit();
      }
      
    });

  }

  /**
   * 顯示建立排程賽局之彈跳視窗
   * @param e {MouseEvent}
   * @param eventId {number}
   * @param canEdit {boolean}
   * @author kidin-1101208
   */
  showCreateScheduleBox(e: MouseEvent, eventName: string, mapId: number, canEdit: boolean) {
    e.preventDefault();
    if (canEdit) {
      const defaultSchedule = moment().add(3, 'day').unix();
      const defaultDate = moment(defaultSchedule * 1000).startOf('day').unix();
      const defaultTime = defaultSchedule - defaultDate;
      this.uiFlag.showCreateScheduleBox = true;
      this.scheduleRace.token = this.token;
      this.scheduleRace.mapIndex = mapId;
      this.scheduleRace.raceName = eventName;
      this.scheduleRace.schedTimestamp = defaultSchedule;
      this.scheduleTime = {
        today: moment().unix(),
        date: defaultSchedule,
        time: defaultTime
      };

    }
    
  }

  /**
   * 關閉建立排程賽局之彈跳視窗
   * @author kidin-1101208
   */
  closeCreateScheduleBox() {
    this.uiFlag.showCreateScheduleBox = false;
    this.initScheduleRace();
    this.scheduleTime = {
      today: null,
      date: null,
      time: null
    }

  }

  /**
   * 初始化scheduleRace物件
   * @author kidin-1101208
   */
  initScheduleRace() {
    this.scheduleRace = {
      token: null,
      sportMode: 0,
      trainingType: 0,
      mapIndex: null,
      raceType: 0,
      raceLap: 1,
      raceOrientation: 0,
      maxRaceMans: 50,
      raceManPermission: 0,
      raceClearCode: null,
      raceName: null,
      schedTimestamp: null
    };

  }

  /**
   * 取得所選排程賽局日期
   * @param date {SelectDate}-排程賽局開始日
   * @author kidin-1101013
   */
  getScheduleDate(date: SelectDate) {
    const { startDate } = date;
    this.scheduleTime.date = moment(startDate).unix();
    this.checkScheduleTime();
  }

  /**
   * 取得所選排程賽局時間
   * @param e {Event}
   * @author kidin-1101208
   */
  getScheduleTime(e: Event) {
    const [hour, min] = (e as any).target.value.split(':');
    this.scheduleTime.time = +hour * 3600 + +min * 60;
  }

  /**
   * 確認排程賽局時間是否設定為現在時間10分鐘以上
   * @author kidin-1101208
   */
  checkScheduleTime() {
    const today = moment().unix();
    const { date, time } = this.scheduleTime;
    const compareDate = moment(today * 1000).startOf('day').unix();
    const bufferTime = 20 * 60;
    if (date < compareDate) {
      this.scheduleTime = {
        today,
        date: compareDate,
        time: today - compareDate + bufferTime  // 排程賽局需設定10分後以上
      };

    } else if (date === compareDate) {
      const compareTime = today - compareDate + bufferTime;
      if (time < compareTime) {
        this.scheduleTime.time = compareTime;
      }

    }

  }

  /**
   * 建立排程賽局
   * @author kidin-1101208
   */
  submitSchedule() {
    const { progress } = this.uiFlag;
    if (progress === 100) {
      this.uiFlag.progress = 30;
      const { date, time } = this.scheduleTime;
      this.scheduleRace.schedTimestamp = date + time;
      this.cloudrunService.createRace(this.scheduleRace).subscribe(res => {
        let msg: string;
        if (this.utils.checkRes(res, false)) {
          msg = '建立成功';
          this.closeCreateScheduleBox();
        } else {
          const { msgCode } = res;
          if (msgCode === 1283) {
            msg = '建立失敗，單一帳號僅限建立一場賽事';
          } else {
            msg = '建立失敗';
          }
          
        }

        this.utils.showSnackBar(msg);
        this.uiFlag.progress = 100;
      });

    }

  }

  /**
   * 往前切換分頁
   * @author kidin-1110104
   */
  switchPrePagination() {
    if (this.uiFlag.progress === 100) {
      const { page: { index } } = this.eventListCondition;
      if (index !== 0) {
        this.eventListCondition.page.index = index - 1;
        this.getActivityList();
      }

    }

  }

  /**
   * 往後切換分頁
   * @author kidin-1110104
   */
  switchNextPagination() {
    if (this.uiFlag.progress === 100) {
      const { page: { index } } = this.eventListCondition;
      const nextPage = index + 1;
      if (nextPage < this.lastPage) {
        this.eventListCondition.page.index = nextPage;
        this.getActivityList();
      }

    }

  }

  /**
   * 切換指定分頁
   * @author kidin-1110104
   */
  switchAssignPagination(index: number = null) {
    this.eventListCondition.page.index = index !== null ? index : this.lastPage - 1;
    this.getActivityList();
  }

  /**
   * 建立頁碼選單
   * @author kidin-1110104
   */
  createPaginationList() {
    if (this.lastPage > 1) {
      const { innerWidth }  = window;
      const PAGE_SHOW_LENGTH = innerWidth < 400 ? 3 : 5;
      const boundary = Math.floor(PAGE_SHOW_LENGTH / 2);
      const { page: { index } } = this.eventListCondition;
      const currentPage = index + 1;
      this.paginationList = [currentPage];
      let nextPage = currentPage;
      let prePage = currentPage;
      for (let i = 1; i <= boundary; i++) {
        nextPage += 1;
        prePage -= 1;
        let nextComplement = false;
        let preComplement = false;
        if (nextPage <= this.lastPage) {
          this.paginationList.push(nextPage);
        } else {
          preComplement = true
        }

        if (prePage > 0) {
          this.paginationList.unshift(prePage);
        } else {
          nextComplement = true;
        }

        if (nextComplement && nextPage + 1 <= this.lastPage) {
          nextPage += 1;
          this.paginationList.push(nextPage);
        }

        if (preComplement && prePage - 1 > 0) {
          prePage -= 1;
          this.paginationList.unshift(prePage);
        }
        
      }

    } else {
      this.paginationList = [1];
    }
    
  }

  /**
   * 將頁碼加入url query string
   * @author kidin-1110113
   */
  setQueryString() {
    const { index } = this.eventListCondition.page;
    const { origin, pathname, search } = location;
    const query = this.utils.getUrlQueryStrings(search);
    Object.assign(query, { p: index + 1 });
    const newSearch = this.utils.setUrlQueryString(query);
    if (newSearch !== search && history.pushState) {
      const newUrl = `${origin}${pathname}${newSearch}`;
      window.history.pushState({path: newUrl}, '', newUrl);
    }
    
  }

  /**
   * 顯示活動列表篩選狀態清單
   * @param e {MouseEvent}
   * @author kidin-1110120
   */
  showListStatusMenu(e: MouseEvent) {
    e.stopPropagation();
    const { showListStatusMenu } = this.uiFlag;
    if (showListStatusMenu) {
      this.unsubscribePluralEvent();
    } else {
      this.uiFlag.showListStatusMenu = true;
      this.subscribePluralEvent();
    }

  }

  /**
   * 選擇列表活動篩選狀態
   * @param e {MouseEvent}
   * @param status {ListStatus}-列表活動篩選狀態
   * @author kidin-1110120
   */
  chooseListStatus(e: MouseEvent, status: ListStatus) {
    e.stopPropagation();
    this.eventListCondition.filterListStatus = status;
    this.initPageIndex();
    this.unsubscribePluralEvent();
    this.checkCurrentPage();
  }

  /**
   * 將頁碼導回第一頁
   * @author kidin-1110120
   */
  initPageIndex() {
    this.eventListCondition.page.index = 0;
    this.setQueryString();
  }

  /**
   * 展開或收合詳細資訊
   * @param e {MouseEvent}
   * @param index {number}-指定之賽事序列
   * @author kidin-1110217
   */
  toggleDetail(e: MouseEvent, index: number) {
    e.stopPropagation();
    e.preventDefault();
    const { showDetail } = this.uiFlag;
    this.uiFlag.showDetail = showDetail === index ? null : index;
  }

  /**
   * 申請退出賽市或取消申請退出
   * @param e {MouseEvent}
   * @param index {number}-欲更新資訊之活動編號
   * @author kidin-1110216
   */
  quitEvent(e: MouseEvent, index: number) {
    e.preventDefault();
    e.stopPropagation();
    const { applyDate: { endDate }, applyStatus } = this.effectEventList[index];
    const eventNotEnd = this.serverTimestamp < endDate;
    const notLeave = applyStatus !== ApplyStatus.cancel;
    if (eventNotEnd && notLeave) {
      const newStatus = applyStatus === ApplyStatus.applied ? ApplyStatus.applyingQuit : ApplyStatus.applied;
      const userProfile = { applyStatus: newStatus };
      this.updateEventUserProfile(index, { userProfile });
    }

  }

  /**
   * 更新國碼
   * @param e {MouseEvent}
   * @param index {number}-欲更新資訊之活動編號
   * @author kidin-1110216
   */
  updateCountryCode(e: MouseEvent, code: string, index: number) {
    e.stopPropagation();
    const { accountType } = this.userProfile;
    if (this.checkCanEdit(index)) {
      const countryCode = code.split('+')[1];
      const userProfile = { countryCode };
      this.updateEventUserProfile(index, { userProfile });
      this.utils.setLocalStorageObject('countryCode', countryCode);
    }
    
    this.unsubscribePluralEvent();
  }

  /**
   * 確認電話號碼格式與更新電話號碼
   * @param e {Event}-change event
   * @param index {number}-欲更新資訊之活動編號
   * @author kidin-1110216
   */
  updatePhoneNumber(e: Event, index: number) {
    const { accountType } = this.userProfile;
    if (this.checkCanEdit(index)) {
      const phone = +(e as any).target.value.trim();
      if (!formTest.phone.test(`${phone}`)) {
        this.translate.get('hellow world').pipe(
          takeUntil(this.ngUnsubscribe)
        ).subscribe(res => {
          const msg = 'universal_status_wrongFormat';
          this.utils.showSnackBar(msg);
        });
        
      } else {
        const userProfile = { phone };
        this.updateEventUserProfile(index, { userProfile });
      }

    }

  }

  /**
   * 確認email格式與更新email
   * @param e {Event}-change event
   * @param index {number}-欲更新資訊之活動編號
   * @author kidin-1110216
   */
  updateEmail(e: Event, index: number) {
    const { accountType } = this.userProfile;
    if (this.checkCanEdit(index)) {
      const email = (e as any).target.value.trim();
      if (!formTest.email.test(email)) {
        this.translate.get('hellow world').pipe(
          takeUntil(this.ngUnsubscribe)
        ).subscribe(res => {
          const msg = 'universal_status_wrongFormat';
          this.utils.showSnackBar(msg);
        });
        
      } else {
        const userProfile = { email };
        this.updateEventUserProfile(index, { userProfile });
      }

    }

  }

  /**
   * 確認地址格式與更新地址
   * @param e {Event}-change event
   * @param index {number}-欲更新資訊之活動編號
   * @author kidin-1110216
   */
  updateAddress(e: Event, index: number) {
    if (this.checkCanEdit(index)) {
      const address = (e as any).target.value.trim();
      if (address.length < 10) {
        this.translate.get('hellow world').pipe(
          takeUntil(this.ngUnsubscribe)
        ).subscribe(res => {
          const msg = 'universal_status_wrongFormat';
          this.utils.showSnackBar(msg);
        });
        
      } else {
        const userProfile = { address };
        this.updateEventUserProfile(index, { userProfile });
      }

    }

  }

  /**
   * 更新備註
   * @param e {Event}-change event
   * @param index {number}-欲更新資訊之活動編號
   * @author kidin-1110216
   */
  updateRemark(e: Event, index: number) {
    if (this.checkCanEdit(index)) {
      const remark = (e as any).target.value.trim();
      const userProfile = { remark };
      this.updateEventUserProfile(index, { userProfile });
    }

  }

  /**
   * 確認是否可編輯欄位
   * @param index {number}-欲更新資訊之活動編號
   * @param checkShipped {boolean}-是否
   * @author kidin-1110216
   */
  checkCanEdit(index: number, checkShipped: boolean = true) {
    const { raceDate: { endDate }, applyStatus, eventStatus, productShipped } = this.effectEventList[index];
    const allowStatus = [ApplyStatus.notYet, ApplyStatus.applied];
    const normalHeldEvent = eventStatus === EventStatus.audit;
    const eventNotEnd = this.serverTimestamp < endDate;
    const notLeaveEvent = allowStatus.includes(applyStatus);
    const productUnShip = !checkShipped || productShipped === ProductShipped.unShip;
    return normalHeldEvent && eventNotEnd && notLeaveEvent && productUnShip;
  }

  /**
   * 使用api 6015更新指定賽事報名資訊
   * @param index {number}-欲更新資訊之活動編號
   * @param update {any}-欲更新的項目
   * @author kidin-1110216
   */
  updateEventUserProfile(index: number, update: any) {
    const { progress } = this.uiFlag;
    if (progress === 100) {
      this.uiFlag.progress = 30;
      const { eventId } = this.effectEventList[index];
      const body = {
        token: this.token,
        targetEventId: eventId,
        ...update
      };

      combineLatest([
        this.translate.get('hellow world'),
        this.officialActivityService.updateEventUserProfile(body)
      ]).subscribe(resArray => {
        const [translateResult, updateResult] = resArray;
        let msg: string;
        if (this.utils.checkRes(updateResult)) {
          msg = this.translate.instant('universal_status_updateCompleted');
          const { userProfile: newUserProfle } = update;
          const { applyStatus } = newUserProfle;
          if (applyStatus) {
            this.effectEventList[index].applyStatus = applyStatus;
          } else {
            const { userProfile: oldUserProfile } = this.effectEventList[index];
            this.effectEventList[index].userProfile = {
              ...oldUserProfile,
              ...newUserProfle
            };

          }

        } else {
          msg = this.translate.instant('universal_popUpMessage_updateFailed');
        }

        this.utils.showSnackBar(msg);
        this.uiFlag.progress = 100;
      });

    }

  }

  /**
   * 顯示國碼選擇清單
   * @param e {MouseEvent}
   * @param index {number}-欲更新資訊之活動編號
   * @author kidin-1101108
   */
  showCountryCodeList(e: MouseEvent, index: number) {
    e.stopPropagation();
    e.preventDefault();
    const { showCountryCodeList } = this.uiFlag;
    if (showCountryCodeList) {
      this.unsubscribePluralEvent();
    } else {
      const { accountType } = this.userProfile;
      const notPhoneAccount = accountType !== AccountTypeEnum.phone;
      if (this.checkCanEdit(index) && notPhoneAccount) {
        this.uiFlag.showCountryCodeList = true;
        this.subscribePluralEvent();
      }

    }
    
  }

  /**
   * 確認帳號是否驗證、報名狀態、繳費狀態、賽事狀態
   * @param index {number}-活動編號
   * @author kidin-1110217
   */
  checkAllStatus(index: number) {
    const { serverTimestamp, effectEventList, userProfile } = this;
    const { fee, paidStatus, applyStatus, eventStatus, raceDate: { endDate } } = effectEventList[index];
    if (eventStatus === EventStatus.cancel) return AllStatus.eventCancelled;
    if (serverTimestamp > endDate) return AllStatus.eventCutoff;
    if (applyStatus === ApplyStatus.cancel) return AllStatus.personCancelled;

    const accountEnable = userProfile && userProfile.accountStatus === AccountStatusEnum.enabled;
    if (!accountEnable) return AllStatus.notEnable;
    if (applyStatus === ApplyStatus.applyingQuit) return AllStatus.personCanceling;

    return fee === 0 || paidStatus === PaidStatusEnum.paid ? AllStatus.paid : AllStatus.unPaid;
  }

  /**
   * 開啟啟用帳號頁面
   * @author kidin-1110217
   */
  openEnablePage() {
    window.open(`/enableAccount?ru=event`, '', 'height=700,width=375,resizable=no');
  }

  /**
   * 解除rxjs訂閱
   */
  ngOnDestroy() {
    if (this.timeInterval) clearInterval(this.timeInterval);
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

}
