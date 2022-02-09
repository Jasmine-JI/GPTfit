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
import { HashIdService } from '../../shared/services/hash-id.service';
import { DetectInappService } from '../../shared/services/detect-inapp.service';
import { Subject, forkJoin } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { UserProfileInfo } from './models/userProfileInfo';
import { DashboardService } from './services/dashboard.service';
import { langData } from '../../shared/models/i18n';
import { SignTypeEnum } from '../../shared/models/utils-type';

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
  systemFolder,
  allGroupList,
  createBrandGroup,
  createEnterpriseGroup,
  createPush,
  pushList,
  deviceSearch,
  deviceLog,
  appFlowAnalysis
};


interface UiFlag {
  currentDrop: string;
  sidebarMode: 'hide' | 'narrow' | 'expand';
  navFixed: boolean;
  mobileMode: boolean;
  hover: boolean;
}

type Theme = 'light' | 'dark';

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

  langName: string;
  userProfile = <UserProfileInfo>{};
  isPreviewMode = false;
  isLoading = false;
  isMaskShow = false;
  isCollapseOpen = false;
  target = Dashboard.myActivity; // 目前預設是我的活動
  isUserMenuShow = false;
  isHadContainer = true;
  footerAddClassName = '';
  isAlphaVersion = false;
  version: string;
  isHideFooter = false;
  debounce: any;
  sideBarList = Dashboard;
  theme: Theme = 'light';

  constructor(
    private globalEventsManager: GlobalEventsManager,
    private authService: AuthService,
    private router: Router,
    private utilsService: UtilsService,
    public translateService: TranslateService,
    private cdRef: ChangeDetectorRef,
    private hashIdService: HashIdService,
    private detectInappService: DetectInappService,
    private userProfileService: UserProfileService,
    private dashboardService: DashboardService
  ) {}

  ngOnInit() {
    this.isLoading = true;
    this.tokenLogin();
    this.checkCurrentPage(location.pathname);
    this.subscribeRouter();
    this.subscribeLangChange();
    this.getWebVersion();
    this.utilsService.checkBrowserLang();
    this.handleGlobalEvent();
    this.onResize();
  }

  ngAfterViewChecked() {
    this.cdRef.detectChanges();
  }

  /**
   * 根據url帶的query string，做相對應的處理
   * @param query {string}-query string
   * @author kidin-1100604
   */
  checkQueryString(queryString: string) {
    if (queryString) {
      const queryArr = queryString.split('?')[1].split('&');
      queryArr.forEach(_query => {
        const [key, value] = _query.split('=');
        switch (key) {
          case 'ipm':
            this.isPreviewMode = true;
            this.changeTheme('light', false); // 預覽列印頁面必為清亮模式
            break;
          case 'theme':
            // 暗黑模式尚未完成，故只先開放20權
            const checkValue = ['light', 'dark'].includes(value),
                  isPreviewMode = queryString.includes('ipm='),
                  checkAccessRight = this.userProfile.systemAccessRight[0] <= 20;
            if (checkValue && !isPreviewMode && checkAccessRight) {
              this.changeTheme(value as Theme);
            }
            
            break;
        }

      });

    }
    
  }

  /**
   * 使用token進行登入
   * @author kidin
   */
  tokenLogin() {
    const body = {
      signInType: SignTypeEnum.token,
      token: this.utilsService.getToken()
    };

    this.authService.loginCheck(body).subscribe(res => {
      const [userProfile, accessRight] = res;
      this.userProfile = 
        this.userProfileService.userProfileCombineAccessRight(userProfile, accessRight);

      if (this.userProfile) {
        this.isLoading = false;
        this.subscribeUserProfileChange();
        this.checkQueryString(location.search);
        if (!this.isPreviewMode) this.checkTheme();
      }

    });

  }

  /**
   * 訂閱個人資訊變更
   * @author kidin-1110208
   */
  subscribeUserProfileChange() {
    this.userProfileService.getRxUserProfile().pipe(
      takeUntil(this.ngUnsubscribe)
    ).subscribe(res => {
      this.userProfile = res;
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
    ).subscribe(() => {
      this.detectInappService.checkBrowser();
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
    const [, mainPath, secondPath, thirdPath, ...rest] = url.split('/');
    switch (secondPath) {
      case 'coach-dashboard':
        this.target = Dashboard.trainLive;
        break;
      case 'live':
        if (thirdPath === 'train-live') this.target = Dashboard.trainLive;
        break;
      case 'group-search':
        this.target = Dashboard.searchGroup;
        break;
      case 'activity-list':
        this.target = Dashboard.myActivity;
        break;
      case 'sport-report':
        this.target = Dashboard.sportReport;
        break;
      case 'my-group-list':
        this.target = Dashboard.myGroup;
        break;
      case 'device':
        this.target = Dashboard.myDevice;
        break;
      case 'life-tracking':
        this.target = Dashboard.lifeTracking;
        break;
      case 'cloudrun':
        this.target = Dashboard.cloudrun;
        break;
      case 'system':
        
        switch (thirdPath) {
          case 'device_log':
            this.target = Dashboard.deviceLog;
            break;
          case 'all-group-list':
            this.target = Dashboard.allGroupList;
            break;
          case 'create-brand-group':
            this.target = Dashboard.createBrandGroup;
            break;
          case 'setting-member':
            this.target = Dashboard.innerAdmin;
            break;
          case 'inner-test':
            this.target = Dashboard.innerSearch;
            break;
          case 'inner-gpx':
            this.target = Dashboard.coordinateTranslate;
            break;
          case 'device-pair-management':
            this.target = Dashboard.deviceSearch;
            break;
          case 'life-tracking':
            this.target = Dashboard.lifeTrackingLog;
            break;
          case 'create-com-group':
            this.target = Dashboard.createEnterpriseGroup;
            break;
        }

        break;
      default:
        this.target = null;
        break;
    }

  }

  /**
   * 確認web版本
   * @author kidin
   */
  getWebVersion() {
    [this.isAlphaVersion, this.version] = this.utilsService.checkWebVersion();
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
        this.uiFlag.currentDrop = '';
        break;
    }

  }

  logout() {
    this.authService.logout();
    this.router.navigateByUrl('/signIn-web');
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
        this.handleSideBarMode('expand');
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
      this.handleSideBarMode('narrow');
    } else if (!this.uiFlag.navFixed && this.uiFlag.mobileMode) {
      this.handleSideBarMode('hide');
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
      this.handleSideBarMode('expand');
    }
    
  }

  /**
   * 處理sidebar 收合等
   * @param mode {'expand' | 'hide' | 'narrow'}-sidebar 模式
   * @author kidin-1091111
   */
  handleSideBarMode(mode: 'expand' | 'hide' | 'narrow') {
    this.uiFlag.sidebarMode = mode;
    this.dashboardService.setSideBarMode(mode);
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
   * 檢查主體
   * @author kidin-1100603
   */
  checkTheme() {
    const storeTheme = this.utilsService.getLocalStorageObject('theme');
    if (this.userProfile.systemAccessRight[0] <= 20 && storeTheme) {
      this.changeTheme(storeTheme);
    } else if (this.userProfile.systemAccessRight[0] <= 20 && storeTheme === undefined){
      // 避免狀態與class name不符
      const checkClassName = document.body.classList.value.includes('theme__dark');
      if (checkClassName) {
        this.theme = 'dark';
      } else {
        this.theme = 'light';
      }

    }
    
  }

  /**
   * 變更主題顏色
   * @param theme {Theme}-主題顏色
   * @author kidin-1100602
   */
  changeTheme(theme: Theme = undefined, save: boolean = true) {
    let nextTheme: Theme;
    if (theme) {
      nextTheme = theme;
    } else {
      nextTheme = this.theme === 'dark' ? 'light' : 'dark';
    }

    if (nextTheme === 'light') {
      document.body.classList.remove('theme__dark');
    } else {
      // 確認是否已有theme__dark這個class name，避免重複添加
      const checkClassName = document.body.classList.value.includes('theme__dark');
      if (!checkClassName) document.body.classList.add('theme__dark');
    }

    if (save) this.utilsService.setLocalStorageObject('theme', nextTheme);
    this.theme = nextTheme;
  }

  /**
   * 變更語言
   * @param lang {string}-語言類別
   * @author kidin-1100929
   */
  switchLang(lang: string) {
    this.langName = langData[lang];
    this.translateService.use(lang);
    this.utilsService.setLocalStorageObject('locale', lang);
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
