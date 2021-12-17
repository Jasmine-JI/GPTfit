import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { OfficialActivityService } from '../../services/official-activity.service';
import { UtilsService } from '../../../../shared/services/utils.service';
import { UserProfileService } from '../../../../shared/services/user-profile.service';
import { Subject, Subscription, fromEvent, merge } from 'rxjs';
import { takeUntil, switchMap, map } from 'rxjs/operators';
import { UserProfileInfo } from '../../../dashboard/models/userProfileInfo';
import moment from 'moment';
import { PaidStatusEnum, ProductShipped } from '../../models/activity-content';
import { MapLanguageEnum } from '../../../../shared/models/i18n';
import { SelectDate } from '../../../../shared/models/utils-type';
import { DomSanitizer } from '@angular/platform-browser';
import { EventStatus } from '../../models/activity-content';
import { CloudrunService } from '../../../../shared/services/cloudrun.service';

type Page = 'activity-list' | 'my-activity';

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
    showCreateScheduleBox: false
  }

  /**
   * api 6004 request body
   */
  eventListCondition = {
    filterRaceStartTime: moment().subtract(3, 'months').unix(),
    filterRaceEndTime: moment().add(3, 'months').unix(),
    page: {
      index: 0,
      counts: 10
    }

  };

  selectDate = {
    startTimestamp: moment().subtract(3, 'months').valueOf(),
    endTimestamp: moment().add(3, 'months').valueOf()
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

  constructor(
    private officialActivityService: OfficialActivityService,
    private utils: UtilsService,
    private userProfileService: UserProfileService,
    private router: Router,
    private sanitizer: DomSanitizer,
    private cloudrunService: CloudrunService
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
   * 取得使用者資訊
   * @author kidin-1101006
   */
  getUserProfile() {
    this.userProfileService.getRxUserProfile().pipe(
      takeUntil(this.ngUnsubscribe)
    ).subscribe(res => {
      this.userProfile = res;
      if (res) {
        this.handleEffectEvent();
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
        const queryObj = this.utils.getUrlQueryStrings(location.search);
        const searchWords = decodeURIComponent(queryObj.search);
        const { currentPage } = this.uiFlag;
        switch (currentPage) {
          case 'activity-list':
            if (searchWords.length === 0) {
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
      this.officialActivityService.getEventList(this.eventListCondition).pipe(
        switchMap(eventListRes => this.officialActivityService.getRxAllMapInfo().pipe(
          map(mapInfoRes => [eventListRes, mapInfoRes])
        )),
        takeUntil(this.ngUnsubscribe)
      ).subscribe(resArr => {
        const [eventListRes, mapInfoRes] = resArr;
        this.allMapInfo = mapInfoRes;
        if (this.utils.checkRes(eventListRes)) {
          const { eventList, currentTimestamp } = eventListRes;
          this.eventList = eventList;
          this.serverTimestamp = currentTimestamp;
          this.handleEffectEvent();
        }

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
   * 取得個人歷史資訊，未登入者導至登入頁面
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
            const reverseList = history.reverse();
            this.eventList = reverseList;
            this.effectEventList = reverseList;
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
      this.unSubscribeClickEvent();
    } else {
      this.uiFlag.showManageMenu = true;
      this.subscribeClickEvent();
    }

  }

  /**
   * 訂閱全域點擊事件
   * @author kidin-1101013
   */
  subscribeClickEvent() {
    const scrollElement = document.getElementById('main__page'),
          clickEvent = fromEvent(scrollElement, 'click'),
          scrollEvent = fromEvent(scrollElement, 'scroll');
    this.globelEventSubscription = merge(clickEvent, scrollEvent).pipe(
      takeUntil(this.ngUnsubscribe)
    ).subscribe(e => {
      this.unSubscribeClickEvent();
    });

  }

  /**
   * 取消訂閱全域點擊事件
   * @author kidin-1101013
   */
  unSubscribeClickEvent() {
    this.uiFlag.showManageMenu = false;
    this.uiFlag.openDatePicker = false;
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
      const dateRangePickHeight = 560,
            navbarHeight = 60,
            screenHeight = window.innerHeight,
            listElement = document.querySelector('.activity__list__section') as any,
            listElementTop = listElement.offsetTop;
      if (screenHeight - listElementTop < dateRangePickHeight) {
        const mainBodyElement = document.getElementById('main__page');
        mainBodyElement.scrollTo({top: listElementTop, behavior: 'smooth'});
        setTimeout(() => {
          this.openDateRangePicker();
        }, 300);

      } else {
        this.openDateRangePicker();
      }

    } else {
      this.unSubscribeClickEvent();
    }

  }

  /**
   * 開啟日期選擇器
   * @author kidin-1101014
   */
  openDateRangePicker() {
    this.uiFlag.openDatePicker = true;
    this.subscribeClickEvent();
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
        const target = document.querySelector('#main__page');
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
   * 解除rxjs訂閱
   */
  ngOnDestroy() {
    if (this.timeInterval) clearInterval(this.timeInterval);
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

}
