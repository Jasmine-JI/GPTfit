import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
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
    currentPage: <Page>'activity-list',
    editMode: false,
    isMobile: false,
    showManageMenu: false,
    openDatePicker: false
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
    private sanitizer: DomSanitizer
  ) { }

  ngOnInit(): void {
    if (this.token) this.getUserProfile();
    this.checkDomain();
    this.checkLanguage();
    this.checkMobileMode();
    this.checkCurrentPage();
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
      this.handleEffectEvent();
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

    });

  }

  /**
   * 根據活動報名時間是否開始與使用者權限篩選可顯示之活動列表
   * @author kidin-1101116
   */
  handleEffectEvent() {
    const { eventList, userProfile, serverTimestamp } = this;
console.log('handleEffectEvent',eventList, userProfile, serverTimestamp);
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
      this.officialActivityService.getParticipantHistory({token}).subscribe(res => {
        if (this.utils.checkRes(res)) {
          const { info: { history }, currentTimestamp } = res;
          this.eventList = history;
          this.effectEventList = history;
          this.countCurrentTime(currentTimestamp);
        }

      })
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
   * @param page {'contestant-list' | 'edit-activity'}-欲轉導之頁面
   * @param eventId {number}-活動流水id
   * @author kidin-1101013
   */
  navigatePage(
    e: MouseEvent,
    page: 'contestant-list' | 'edit-activity',
    eventId: number,
    canEdit: boolean
  ) {
    e.preventDefault();
    if (canEdit || page === 'contestant-list') {
      this.router.navigateByUrl(`/official-activity/${page}/${eventId}`);
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
          clickEvent = fromEvent(document, 'click'),
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
   * 解除rxjs訂閱
   */
  ngOnDestroy() {
    if (this.timeInterval) clearInterval(this.timeInterval);
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

}
