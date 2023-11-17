import { Component, OnInit, OnDestroy, HostListener, Input, ElementRef } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import {
  Api10xxService,
  Api50xxService,
  AuthService,
  GetClientIpService,
  GlobalEventsService,
  UserService,
} from '../../../core/services';
import {
  BehaviorSubject,
  Observable,
  Subject,
  Subscription,
  fromEvent,
  merge,
  takeUntil,
} from 'rxjs';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { langData } from '../../../core/models/const';
import { setLocalStorageObject, getLocalStorageObject } from '../../../core/utils';
import { appPath, linkList } from '../../../app-path.const';
import { NgIf, NgTemplateOutlet, AsyncPipe } from '@angular/common';
import { MatIcon, MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { UserProfile } from '../../../core/models/api/api-10xx';
import { InboxComponent } from '../../../containers/station-mail/inbox/inbox.component';
import { StationMailService } from '../../../containers/station-mail/services/station-mail.service';
import { checkResponse } from '../../../core/utils';
import { AccessRight } from '../../../core/enums/common';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
  standalone: true,
  imports: [
    MatIconModule,
    NgIf,
    RouterLink,
    NgTemplateOutlet,
    AsyncPipe,
    TranslateModule,
    RouterLinkActive,
    FormsModule,
    InboxComponent,
  ],
})
export class NavbarComponent implements OnInit, OnDestroy {
  @Input() isAlphaVersion = false;
  private ngUnsubscribe = new Subject();
  private pluralEventSubscription = new Subscription();

  isShowMask = false;
  href: string;
  deviceWidth: number;
  login$: BehaviorSubject<boolean>;
  login: any;
  langName: string;
  showActivityEntry = false;
  isCountdownFinished = false;
  menu = {
    MainNav: false, //hamber選單
    memberMenu: false, //頭像內設定
    showLanguage: false,
    personalMenu: false, //個人
    groupMenu: false,
    adminMenu: false,
    systemAdminMenu: false,
    groupAdminMenu: false,
    pushNotifiAdminMenu: false,
    deviceAdminMenu: false,
    operateAdminMenu: false,

    backbtn: false,
    backAdminbtn: false,
  };
  uiFlag = {
    showStationMailList: false,
    haveNewMail: false,
  };
  alaPoint: any;
  notifyUpdateTime: number | null = null;
  mailNotify: NodeJS.Timeout;
  token = this.authService.token;

  userProfile = <UserProfile>{};
  accountStatus = this.userService.getUser().signInfo?.accountStatus;
  systemAccessright = this.userService.getUser().systemAccessright;
  readonly AccessRight = AccessRight;
  readonly linkList = linkList;

  constructor(
    private router: Router,
    private authService: AuthService,
    private getClientIp: GetClientIpService,
    private translateService: TranslateService,
    private globalEventsService: GlobalEventsService,
    private el: ElementRef,
    private userService: UserService,
    private api50xxService: Api50xxService,
    private stationMailService: StationMailService,
    private api10xxService: Api10xxService
  ) {}

  ngOnInit() {
    this.checkIfLogin();
    this.getUserProfile();
    this.getIpAddress();
    this.langName = langData[getLocalStorageObject('locale')];
    this.deviceWidth = window.innerWidth;
    this.href = this.router.url;
    this.subscribeRxUserProfile();
    this.checkNewMail();
    this.pollingNewMail();
    this.getAlaZonePoint();
  }

  /**
   * 檢查登入狀態
   */
  checkIfLogin() {
    this.authService.isLogin.pipe(takeUntil(this.ngUnsubscribe)).subscribe((ifLogin) => {
      this.login = ifLogin;
    });
  }

  /**
   * 取得個人AlaPoint資料
   */
  getAlaZonePoint() {
    if (this.authService.token) {
      const body = { token: this.authService.token };
      this.api10xxService
        .fetchAlaZonePoint(body)
        .pipe(takeUntil(this.ngUnsubscribe))
        .subscribe((_res) => {
          // console.log(_res);
          if (_res.data) {
            // console.lo。g(_res.data[0]);
            this.alaPoint = _res.data[0];
          }
        });
    }
  }

  /**
   * 顯示收件匣與否
   * @param {MouseEvent}
   */
  showStationMailList(e: MouseEvent) {
    e.stopPropagation();
    const { showStationMailList } = this.uiFlag;
    if (showStationMailList) {
      this.unsubscribePluralEvent();
    } else {
      this.uiFlag.showStationMailList = true;
      this.uiFlag.haveNewMail = false;
      this.subscribePluralEvent();
    }
  }

  /**
   * 定時call api確認是否有最新郵件
   */
  pollingNewMail() {
    if (!this.mailNotify) {
      this.mailNotify = setInterval(() => {
        this.checkNewMail();
      }, 30000);
    }
  }

  /**
   * 確認是否有無最新信件
   */
  checkNewMail() {
    const body = { token: this.authService.token };
    this.api50xxService.fetchMessageNotifyFlagStatus(body).subscribe({
      next: (res) => {
        if (checkResponse(res, false)) {
          const { status, updateTime } = res.flag;
          const haveNewMail = status === 2;
          if (haveNewMail && updateTime !== this.notifyUpdateTime) {
            this.uiFlag.haveNewMail = true;
            this.stationMailService.setNewMailNotify(true);
          }
        } else {
          this.uiFlag.haveNewMail = false;
        }
      },
      error: (err) => console.error(err),
    });
  }

  /**
   * 轉導至收件匣
   * @param e {MouseEvent}
   */
  navigateInbox(e: MouseEvent) {
    e.preventDefault();
    const { dashboard, stationMail } = appPath;
    this.router.navigateByUrl(`/${dashboard.home}/${stationMail.home}/${stationMail.inbox}`);
  }

  /**
   * 轉導至建立新訊息頁面
   */
  navigateNewMailPage() {
    const { dashboard, stationMail } = appPath;
    this.router.navigateByUrl(`/${dashboard.home}/${stationMail.home}/${stationMail.newMail}`);
  }

  /**
   * 訂閱全域點擊與滾動事件，以關閉列表
   */
  subscribePluralEvent() {
    const scrollElement = document.querySelector('.main__container') as Element;
    const scrollEvent = fromEvent(scrollElement, 'scroll');
    const clickEvent = fromEvent(document, 'click');
    this.pluralEventSubscription = merge(scrollEvent, clickEvent)
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe(() => {
        this.unsubscribePluralEvent();
      });
  }

  /**
   * 解除訂閱全域點擊與滾動事件
   */
  unsubscribePluralEvent() {
    this.uiFlag.showStationMailList = false;
    this.closeAllMenu();
    this.pluralEventSubscription.unsubscribe();
  }

  /**
   * 訂閱使用者個人資訊(訪客/登入者)
   */
  subscribeRxUserProfile() {
    this.userService
      .getUser()
      .rxUserProfile.pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((res) => {
        this.userProfile = res;
      });
  }

  @HostListener('window:resize', [])
  onResize() {
    this.deviceWidth = window.innerWidth;
    this.checkShowMask();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!this.el.nativeElement.contains(target)) {
      this.closeAllMenu();
    }
  }

  /**
   * 重新調整視窗大小時，判斷是否出現開合選單
   */
  checkShowMask() {
    if (this.deviceWidth > 767) {
      this.menu.MainNav = false;
      this.menu.backbtn = false;
      this.isShowMask =
        this.menu.memberMenu ||
        this.menu.personalMenu ||
        this.menu.groupMenu ||
        this.menu.adminMenu ||
        this.menu.systemAdminMenu
          ? true
          : false;
    } else {
      this.menu.MainNav = true;
      this.menu.backbtn = true;
    }
  }

  /**
   * 取得已儲存之user profile
   */
  getUserProfile() {
    this.userService
      .getUser()
      .rxUserProfile.pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((res) => {
        const { systemAccessright, signInfo } = this.userService.getUser();
        this.userProfile = res;
        this.accountStatus = signInfo?.accountStatus;
        this.systemAccessright = systemAccessright;
      });
  }

  /**
   * 點擊選單 hamber 時，判斷 ckecked 狀態顯示遮罩
   * @param ifchecked
   */
  toggleMenu(ifchecked: boolean) {
    this.closeAllMenu();
    this.menu.memberMenu = false;
    this.menu.MainNav = ifchecked;
    this.isShowMask = ifchecked;
  }

  /**
   * 點擊收合選單
   * @param str
   */
  toggle(str: string) {
    switch (str) {
      case 'memberMenu':
        this.closeAllMenu();
        this.menu.MainNav = false;
        this.menu.showLanguage = false;
        this.menu.memberMenu = !this.menu.memberMenu;
        this.isShowMask = this.menu.memberMenu ? true : false;
        break;
      case 'showLanguage':
        this.menu.memberMenu = true;
        this.menu.showLanguage = !this.menu.showLanguage;
        break;
      case 'personalMenu':
        this.closeAllAdminMenu();
        this.menu.memberMenu = false;
        this.menu.groupMenu = false;
        this.menu.adminMenu = false;
        this.menu.personalMenu = !this.menu.personalMenu;
        break;
      case 'groupMenu':
        this.closeAllAdminMenu();
        this.menu.memberMenu = false;
        this.menu.personalMenu = false;
        this.menu.adminMenu = false;
        this.menu.groupMenu = !this.menu.groupMenu;
        break;
      case 'adminMenu':
        this.menu.memberMenu = false;
        this.menu.personalMenu = false;
        this.menu.groupMenu = false;
        this.menu.adminMenu = !this.menu.adminMenu;
        this.closeAllAdminMenu();
        break;
      case 'systemAdminMenu':
        this.menu.memberMenu = false;
        this.menu.personalMenu = false;
        this.menu.groupMenu = false;
        this.menu.systemAdminMenu = !this.menu.systemAdminMenu;
        break;
      case 'groupAdminMenu':
        this.menu.memberMenu = false;
        this.menu.personalMenu = false;
        this.menu.groupMenu = false;
        this.menu.groupAdminMenu = !this.menu.groupAdminMenu;
        break;
      case 'pushNotifiAdminMenu':
        this.menu.memberMenu = false;
        this.menu.personalMenu = false;
        this.menu.groupMenu = false;
        this.menu.pushNotifiAdminMenu = !this.menu.pushNotifiAdminMenu;
        break;
      case 'deviceAdminMenu':
        this.menu.memberMenu = false;
        this.menu.personalMenu = false;
        this.menu.groupMenu = false;
        this.menu.deviceAdminMenu = !this.menu.deviceAdminMenu;
        break;
      case 'operateAdminMenu':
        this.menu.memberMenu = false;
        this.menu.personalMenu = false;
        this.menu.groupMenu = false;
        this.menu.operateAdminMenu = !this.menu.operateAdminMenu;
        break;
      default:
        break;
    }
    this.isShowMask =
      this.menu.personalMenu ||
      this.menu.groupMenu ||
      this.menu.adminMenu ||
      this.menu.systemAdminMenu ||
      this.menu.memberMenu
        ? true
        : false;
    this.menu.backbtn =
      (this.menu.personalMenu || this.menu.groupMenu || this.menu.adminMenu) && this.menu.MainNav
        ? true
        : false;
    this.menu.backAdminbtn =
      (this.menu.systemAdminMenu ||
        this.menu.groupAdminMenu ||
        this.menu.pushNotifiAdminMenu ||
        this.menu.deviceAdminMenu ||
        this.menu.operateAdminMenu) &&
      this.menu.adminMenu
        ? true
        : false;
  }

  /**
   * 關閉所有選單
   */
  closeAllMenu() {
    this.menu.personalMenu = false;
    this.menu.groupMenu = false;
    this.menu.adminMenu = false;
    this.menu.showLanguage = false;
    this.menu.MainNav = false;
    this.isShowMask = false;
    this.menu.memberMenu = false;

    this.closeAllAdminMenu();
  }

  /**
   * 關閉所有系統管理選單
   */
  closeAllAdminMenu() {
    this.menu.systemAdminMenu = false;
    this.menu.groupAdminMenu = false;
    this.menu.pushNotifiAdminMenu = false;
    this.menu.deviceAdminMenu = false;
    this.menu.operateAdminMenu = false;
  }

  /**
   * 手機第二層選單返回第一層選單
   */
  backToMainNav() {
    this.closeAllMenu();
    this.menu.MainNav = true;
    this.isShowMask = true;
  }

  /**
   * 系統管理第二層選單回第一層管理選單
   */
  backToAdminMenu() {
    // this.closeAllMenu();
    // this.menu.MainNav = true;
    // this.menu.adminMenu = true;
    // this.isShowMask = true;
    // this.menu.backAdminbtn = false;
    // this.menu.systemAdminMenu = false;
    this.closeAllAdminMenu();
  }

  /**
   * 登出
   */
  logout() {
    this.authService.logout();
  }

  /**
   * 轉導至啟用帳號頁面
   * @author kidin-1090513
   */
  toEnableAccount(): void {
    const { portal } = appPath;
    window.open(`/${portal.enableAccount}`, '', 'height=700,width=375,resizable=no');
  }

  /**
   * 頁面跳轉
   * @param string
   */
  chooseNavItem(string: string) {
    const { officialActivity, portal } = appPath;
    this.isShowMask = false;
    this.menu.memberMenu = false;
    window.scrollTo(0, 0);
    switch (string) {
      case 'home':
        this.router.navigateByUrl(`/`);
        break;
      case 'activity':
        this.router.navigateByUrl(`/${officialActivity.home}`);
        break;
      case 'signIn':
        this.router.navigateByUrl(`/${portal.signInWeb}`);
        break;
      case 'logout':
        this.logout();
        this.router.navigateByUrl(`/${portal.signInWeb}`);
        break;
    }
  }

  switchLang(lang: string) {
    this.langName = langData[lang];
    this.translateService.use(lang);
    setLocalStorageObject('locale', lang);
    this.chooseNavItem(lang);
  }

  /**
   * 取得使用者所在地區，台灣區才會顯示活動入口
   * @author kidin-1110207
   */
  getIpAddress() {
    this.getClientIp.requestIpAddress().subscribe((res) => {
      const { country: countryCode } = res as any;
      const openCountry = ['TW'];
      if (openCountry.includes(countryCode)) {
        this.showActivityEntry = true;
      }
    });
  }

  /**
   * 解除rxjs訂閱
   */
  ngOnDestroy() {
    this.ngUnsubscribe.next(null);
    this.ngUnsubscribe.complete();
    if (this.mailNotify) clearInterval(this.mailNotify);
  }
}
