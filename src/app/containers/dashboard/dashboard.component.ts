import {
  Component,
  OnInit,
  ChangeDetectorRef,
  AfterViewChecked,
  OnDestroy
} from '@angular/core';
import { GlobalEventsManager } from '../../shared/global-events-manager';
import { AuthService } from '../../shared/services/auth.service';
import { Router } from '@angular/router';
import { UserProfileService } from '../../shared/services/user-profile.service';
import { UtilsService } from '../../shared/services/utils.service';
import { TranslateService } from '@ngx-translate/core';
import { NavigationEnd } from '@angular/router';
import { version } from '../../shared/version';
import { HashIdService } from '../../shared/services/hash-id.service';
import { DetectInappService } from '../../shared/services/detect-inapp.service';
import { MatDialog } from '@angular/material/dialog';
import { MessageBoxComponent } from '../../shared/components/message-box/message-box.component';
import { Subject, forkJoin } from 'rxjs';
import { takeUntil, switchMap, map } from 'rxjs/operators';
import { UserProfileInfo } from './models/userProfileInfo';
import { GroupService } from './services/group.service';


enum Dashboard {
  trainLive,
  myGroup,
  searchGroup,
  myActivity,
  myDevice,
  sportReport,
  lifeTracking,
  cloudrun,
  innerAdmin,
  innerSearch,
  coordinateTranslate,
  lifeTrackingLog,
  systemLog,
  eventManagement,
  allGroupList,
  createBrandGroup,
  createEnterpriseGroup,
  createPush,
  pushList,
  deviceSearch,
  deviceLog
};


interface UiFlag {
  currentDrop: string;
  sidebarMode: 'hide' | 'narrow' | 'expand';
  navFixed: boolean;
  mobileMode: boolean;
  hover: boolean;
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, AfterViewChecked, OnDestroy {

  private ngUnsubscribe = new Subject();

  uiFlag: UiFlag = {
    currentDrop: '',
    sidebarMode: 'narrow',
    navFixed: false,
    mobileMode: false,
    hover: false
  };

  userProfile = <UserProfileInfo>{};
  isPreviewMode = false;
  isLoading = false;
  isMaskShow = false;
  isCollapseOpen = false;
  target = Dashboard.myActivity; // 目前預設是我的活動
  isUserMenuShow = false;
  accountStatus = 2; // 1:未啟用 2:已啟用
  isHadContainer = true;
  footerAddClassName = '';
  isAlphaVersion = false;
  version: string;
  isHideFooter = false;
  debounce: any;
  sideBarList = Dashboard;

  constructor(
    private globalEventsManager: GlobalEventsManager,
    private authService: AuthService,
    private router: Router,
    private utilsService: UtilsService,
    public translateService: TranslateService,
    private cdRef: ChangeDetectorRef,
    private hashIdService: HashIdService,
    private detectInappService: DetectInappService,
    private dialog: MatDialog,
    private userProfileService: UserProfileService,
    private groupService: GroupService
  ) {}

  ngOnInit() {
    this.isLoading = true;
    this.handleNavigate(location.pathname);
    this.checkPreviewPrint();
    this.tokenLogin();
    this.subscribeRouter();
    this.subscribeLangChange();
    this.checkWebVersion();
    this.checkBrowserLang();
    this.handleGlobalEvent();
    this.onResize();
  }

  ngAfterViewChecked() {
    this.cdRef.detectChanges();
  }

  /**
   * 根據url確認是否需要導至預設頁面(因延遲載入的關係無法直接在routing設定轉址)
   * @param path {string}-url path
   * @param kidin-1100531
   */
  handleNavigate(path: string) {
    switch (path) {
      case '/dashboard':
        this.router.navigateByUrl('/dashboard/activity-list');
        break;
    }

  }

  /**
   * 確認是否為預覽列印頁面
   * @author kidin
   */
  checkPreviewPrint() {
    if (location.search.indexOf('ipm=s') > -1) {
      this.isPreviewMode = true;
    }

  }

  /**
   * 使用token進行登入
   * @author kidin
   */
  tokenLogin() {
    const token = this.utilsService.getToken() || '',
          body = {
            signInType: 3,
            token
          };
    this.authService.loginServerV2(body).pipe(
      switchMap(loginRes => this.userProfileService.getRxUserProfile().pipe(
        map(userProfile => [loginRes, userProfile]),
        takeUntil(this.ngUnsubscribe)
      ))
    ).subscribe(resArr => {
      const [loginRes, userProfile] = resArr;
      this.accountStatus = loginRes.signIn.accountStatus;
      this.userProfile = userProfile;
      if (userProfile) {
        this.isLoading = false;
      }

    });

  }

  /**
   * 訂閱轉址事件
   * @author kidin
   */
  subscribeRouter() {
    this.router.events.pipe(
      takeUntil(this.ngUnsubscribe)
    ).subscribe(res => {
      if (res instanceof NavigationEnd) {
        const url = res.url;
        this.checkUiMode(url);
        this.checkCurrentPage(url);
      }

    });

  }

  /**
   * 訂閱語言改變事件
   * @author kidin
   */
  subscribeLangChange() {
    this.translateService.onLangChange.pipe(
      takeUntil(this.ngUnsubscribe)
    ).subscribe(resArr => {
      this.checkUserDevice();
    });

  }

  /**
   * 根據網址確認要套用的部份ui模式
   * @param url {string}-網址
   * @author kidin
   */
  checkUiMode(url: string) {
    if (url.indexOf('/dashboard/coach-dashboard') > -1) {
      this.isHadContainer = false;
      this.isHideFooter = true;
      this.uiFlag.mobileMode = true;
      this.shrinkSidebar();
    } else if (url.indexOf('/dashboard/system/event-management') > -1) {
      this.uiFlag.mobileMode = true;
      this.shrinkSidebar();
    } else if (window.innerWidth > 768) {
      this.isHadContainer = true;
      this.isHideFooter = false;
      this.uiFlag.mobileMode = false;
      this.shrinkSidebar();
    }

  }

  /**
   * 根據網址確認現在所在頁面
   * @param url {string}-網址
   * @author kidin
   */
  checkCurrentPage(url: string) {
    if (
      url.indexOf('/dashboard/coach-dashboard') > -1 ||
      url.indexOf('/dashboard/live/train-live') > -1
    ) {
      this.target = Dashboard.trainLive;
    } else if (url.indexOf('/dashboard/group-search') > -1) {
      this.target = Dashboard.searchGroup;
    } else if (url.indexOf('/dashboard/activity-list') > -1) {
      this.target = Dashboard.myActivity;
    } else if (url.indexOf('/dashboard/sport-report') > -1) {
      this.target = Dashboard.sportReport;
    } else if (url.indexOf('/dashboard/my-group-list') > -1) {
      this.target = Dashboard.myGroup;
    } else if (url.indexOf('/dashboard/group-search') > -1) {
      this.target = Dashboard.searchGroup;
    } else if (url.indexOf('/dashboard/system/device_log') > -1) {
      // 字長的先排前辨識
      this.target = Dashboard.deviceLog;
    } else if (url.indexOf('/dashboard/device') > -1) {
      this.target = Dashboard.myDevice;
    } else if (url.indexOf('/dashboard/system/event-management') > -1) {
      this.target = Dashboard.eventManagement;
    } else if (url.indexOf('/dashboard/system/all-group-list') > -1) {
      this.target = Dashboard.allGroupList;
    } else if (url.indexOf('/dashboard/system/create-brand-group') > -1) {
      this.target = Dashboard.createBrandGroup;
    } else if (url.indexOf('/dashboard/system/setting-member') > -1) {
      this.target = Dashboard.innerAdmin;
    } else if (url.indexOf('/dashboard/system/inner-test') > -1) {
      this.target = Dashboard.innerSearch;
    } else if (url.indexOf('/dashboard/system/inner-gpx') > -1) {
      this.target = Dashboard.coordinateTranslate;
    } else if (url.indexOf('/dashboard/system/device-pair-management') > -1) {
      this.target = Dashboard.deviceSearch;
    } else if (url.indexOf('/dashboard/system/life-tracking') > -1) {
      this.target = Dashboard.lifeTrackingLog;
    } else if (url.indexOf('/dashboard/system/create-com-group') > -1) {
      this.target = Dashboard.createEnterpriseGroup;
    } else if (url.indexOf('/dashboard/life-tracking') > -1) {
      this.target = Dashboard.lifeTracking;
    } else if (url.indexOf('/dashboard/cloudrun') > -1) {
      this.target = Dashboard.cloudrun;
    } else {
      this.target = null;
    }

  }

  /**
   * 確認使用者所使用者的瀏覽器
   * @author kidin
   */
  checkUserDevice() {
    if (this.detectInappService.isInApp || this.detectInappService.isIE) {
      if (this.detectInappService.isLine) {
        const queryString = 'openExternalBrowser=1';
        if (location.search.length === 0) {
          location.href += `?${queryString}`;
        } else {
          location.href += `&${queryString}`;
        }
      } else {
        this.dialog.open(MessageBoxComponent, {
          hasBackdrop: true,
          data: {
            title: 'message',
            body: this.translateService.instant('universal_popUpMessage_browserError'),
            confirmText: this.translateService.instant('universal_operating_confirm')
          }

        });

      }

    }

  }

  /**
   * 確認web版本
   * @author kidin
   */
  checkWebVersion() {
    this.isAlphaVersion = true;
    if (location.hostname.indexOf('cloud.alatech.com.tw') > -1
      || location.hostname.indexOf('www.gptfit.com') > -1
    ) {
      this.isAlphaVersion = false;
      this.version = version.master;
    } else if (location.hostname.indexOf('app.alatech.com.tw') > -1) {
      this.version = version.release;
    } else {
      this.version = version.develop;
    }

  }

  /**
   * 確認使用語言
   * @author kidin
   */
  checkBrowserLang() {
    let browserLang = this.utilsService.getLocalStorageObject('locale');
    if (!browserLang) {
      browserLang = this.translateService.getBrowserCultureLang().toLowerCase();
      this.translateService.use(browserLang);
      this.utilsService.setLocalStorageObject('locale', browserLang);
    } else {
      this.translateService.use(browserLang);
    }

  }


  handleGlobalEvent() {
    this.globalEventsManager.showMask(false);
    forkJoin([
      this.globalEventsManager.showNavBarEmitter,
      this.globalEventsManager.setFooterRWDEmitter
    ]).subscribe(resArr => {
      const [mode, _num] = resArr;
      this.isMaskShow = mode as boolean;
      if (_num > 0) {
        this.footerAddClassName = `footer-rwd--${_num}`;
      } else {
        this.footerAddClassName = '';
      }

    });
    
  }

  /**
   * 變更視窗大小時調整sidebar模式
   * @param event {Event}
   * @author kidin
   */
  onResize(event: any = null) {
    const screenWidth = event ? event.target.innerWidth : window.innerWidth;
    const checkUrlCond = location.pathname.indexOf('/dashboard/group-info') > -1,
          checkScreenWidthA = screenWidth < 1000,
          checkScreenWidthB = screenWidth < 769;
    if ((checkUrlCond && checkScreenWidthA) || checkScreenWidthB) {
      this.uiFlag.mobileMode = true;
      this.shrinkSidebar();
    } else if (location.pathname.indexOf('/dashboard/coach-dashboard') > -1) {
      this.uiFlag.mobileMode = true;
      this.shrinkSidebar();
    } else if (location.pathname.indexOf('/dashboard/system/event-management') > -1) {
      this.uiFlag.mobileMode = true;
      this.shrinkSidebar();
    } else {
      this.uiFlag.mobileMode = false;
      this.shrinkSidebar();
    }

  }

  touchMask() {
    this.isCollapseOpen = false;
    this.globalEventsManager.openCollapse(this.isCollapseOpen);
    this.isMaskShow = false;
    this.globalEventsManager.closeCollapse(false);
  }

  goToUserProfile(userId) {
    this.router.navigateByUrl(
      `/user-profile/${this.hashIdService.handleUserIdEncode(userId)}`
    );
  }

  chooseItem(_target) {
    this.target = _target;
    if (this.uiFlag.mobileMode) {
      this.uiFlag.navFixed = false;
      this.shrinkSidebar();
    }

    switch (_target) {
      case Dashboard.myActivity:
      case Dashboard.myDevice:
      case Dashboard.eventManagement:
        this.uiFlag.currentDrop = '';
        break;
    }

  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/signIn-web']);
  }

  /**
   * 轉導至啟用帳號頁面
   * @author kidin-1090513
   */
  toEnableAccount(): void {
    window.open(`/enableAccount`, '', 'height=700,width=375,resizable=no');
  }

  /**
   * 展開sidebar
   * @author kidin-1091013
   */
  expandSidebar() {
    this.uiFlag.hover = true;
    if (this.debounce) {
      clearTimeout(this.debounce);
    }

    this.debounce = setTimeout(() => {
      if (!this.uiFlag.mobileMode && this.uiFlag.hover) {
        this.handeSideBarMode('expand');
      }

    }, 250);

  }

  /**
   * 根據畫面大小決定隱藏還是縮小sidebar
   * @author kidin-1091013
   */
  shrinkSidebar() {
    this.uiFlag.hover = false;
    if (!this.uiFlag.navFixed && !this.uiFlag.mobileMode) {
      this.handeSideBarMode('narrow');
    } else if (!this.uiFlag.navFixed && this.uiFlag.mobileMode) {
      this.handeSideBarMode('hide');
    }
    
  }

  /**
   * 固定navside與否
   * @author kidin-1091015
   */
  navbarFixed() {
    if (this.uiFlag.navFixed) {
      this.uiFlag.navFixed = false;
      this.shrinkSidebar();
    } else {
      this.uiFlag.navFixed = true;
      this.handeSideBarMode('expand');
    }
    
  }

  /**
   * 處理sidebar 收合等
   * @param mode {'expand' | 'hide' | 'narrow'}-sidebar 模式
   * @author kidin-1091111
   */
  handeSideBarMode(mode: 'expand' | 'hide' | 'narrow') {
    this.uiFlag.sidebarMode = mode;
    this.groupService.setSideBarMode(mode);
  }

  /**
   * 根據使用者所點選的項目展開清單
   * @param index {string}
   */
  dropDown(index: string) {
    if (this.uiFlag.currentDrop === index) {
      this.uiFlag.currentDrop = '';
    } else {
      this.uiFlag.currentDrop = index;
    }

  }

  /**
   * 導至首頁
   * @author kidin-1091016
   */
  navigateHomePage() {
    this.router.navigateByUrl('/');
  }


  /**
   * 解除rxjs訂閱
   * @author kidin-1090722
   */
  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

}
