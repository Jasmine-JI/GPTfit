import {
  Component,
  OnInit,
  ChangeDetectorRef,
  AfterViewChecked,
  OnDestroy
} from '@angular/core';
import { GlobalEventsManager } from '@shared/global-events-manager';
import { AuthService } from '@shared/services/auth.service';
import { Router } from '@angular/router';
import { UserInfoService } from './services/userInfo.service';
import { UserProfileService } from '../../shared/services/user-profile.service';
import { UtilsService } from '@shared/services/utils.service';
import { TranslateService } from '@ngx-translate/core';
import { UserInfo } from './models/userInfo';
import { NavigationEnd } from '@angular/router';
import { version } from '@shared/version';
import { HashIdService } from '@shared/services/hash-id.service';
import { DetectInappService } from '@shared/services/detect-inapp.service';
import { MatDialog } from '@angular/material/dialog';
import { MessageBoxComponent } from '@shared/components/message-box/message-box.component';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { UserProfileInfo } from './models/userProfileInfo';
import { GroupService } from './services/group.service';


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
  target = 14; // 目前預設是我的活動
  isUserMenuShow = false;
  accountStatus = 2; // 1:未啟用 2:已啟用
  isHadContainer = true;
  footerAddClassName = '';
  userId: number;
  isAlphaVersion = false;
  version: string;
  isHideFooter = false;
  debounce: any;

  constructor(
    private globalEventsManager: GlobalEventsManager,
    private authService: AuthService,
    private router: Router,
    private userInfoService: UserInfoService,
    private utilsService: UtilsService,
    public translateService: TranslateService,
    private cdRef: ChangeDetectorRef,
    private hashIdService: HashIdService,
    private detectInappService: DetectInappService,
    private dialog: MatDialog,
    private userProfileService: UserProfileService,
    private groupService: GroupService
  ) {

    if (location.search.indexOf('ipm=s') > -1) {
      this.isPreviewMode = true;
    }

    this.router.events.subscribe(_val => {
      if (_val instanceof NavigationEnd) {
        if (_val.url.indexOf('/dashboard/coach-dashboard') > -1) {
          this.isHadContainer = false;
          this.isHideFooter = true;
          this.uiFlag.mobileMode = true;
          this.shrinkSidebar();
        } else if (_val.url.indexOf('/dashboard/system/event-management') > -1) {
          this.uiFlag.mobileMode = true;
          this.shrinkSidebar();
        } else if (window.innerWidth > 768) {
          this.isHadContainer = true;
          this.isHideFooter = false;
          this.uiFlag.mobileMode = false;
          this.shrinkSidebar();
        }
        if (
          _val.url.indexOf('/dashboard/coach-dashboard') > -1 ||
          _val.url.indexOf('/dashboard/live/train-live') > -1
        ) {
          this.target = 3;
        } else if (_val.url.indexOf('/dashboard/group-search') > -1) {
          this.target = 17;
        } else if (_val.url.indexOf('/dashboard/activity-list') > -1) {
          this.target = 14;
        } else if (_val.url.indexOf('/dashboard/sport-report') > -1) {
          this.target = 16;
        } else if (
          _val.url.indexOf('/dashboard/my-group-list') > -1 ||
          _val.url.indexOf('/dashboard/group-search') > -1
        ) {
          this.target = 10;
        } else if (_val.url.indexOf('/dashboard/system/device_log') > -1) {
          // 字長的先排前辨識
          this.target = 5;
        } else if (_val.url.indexOf('/dashboard/device') > -1) {
          this.target = 15;
        } else if (
          _val.url.indexOf('/dashboard/system/event-management') > -1
        ) {
          this.target = 6;
        } else if (_val.url.indexOf('/dashboard/system/event-calendar') > -1) {
          // 字長的先排前辨識
          this.target = 8;
        } else if (_val.url.indexOf('/dashboard/system/event') > -1) {
          this.target = 7;
        } else if (
          _val.url.indexOf('/dashboard/system/leaderboard-settings') > -1
        ) {
          this.target = 9;
        } else if (_val.url.indexOf('/dashboard/system/all-group-list') > -1) {
          this.target = 11;
        } else if (
          _val.url.indexOf('/dashboard/system/create-brand-group') > -1
        ) {
          this.target = 12;
        } else if (_val.url.indexOf('/dashboard/system/setting-member') > -1) {
          this.target = 13;
        } else if (_val.url.indexOf('/dashboard/system/inner-test') > -1) {
          this.target = 18;
        } else if (_val.url.indexOf('/dashboard/system/inner-gpx') > -1) {
          this.target = 19;
        } else if (_val.url.indexOf('/dashboard/system/device-pair-management') > -1) {
          this.target = 20;
        } else if (_val.url.indexOf('/dashboard/system/life-tracking') > -1) {
          this.target = 21;
        } else if (_val.url.indexOf('/dashboard/system/create-com-group') > -1) {
          this.target = 22;
        } else if (_val.url.indexOf('/dashboard/life-tracking') > -1) {
          this.target = 23;
        } else {
          this.target = 0;
        }

      }

    });

    this.userInfoService
      .getInitialUserInfoStatus()
      .subscribe((res: UserInfo) => {
        const { isInitial } = res;
        if (!isInitial) {
          this.isLoading = true;
          const token = this.utilsService.getToken() || '';
          const body = {
            signInType: 3,
            token
          };

          // 使用api v2 1003確認或刷新token和取得帳號狀態
          this.authService.loginServerV2(body).subscribe(loginRes => {
            this.accountStatus = loginRes.signIn.accountStatus;
          });

        }

      });

    this.userProfileService.getRxUserProfile().pipe(
      takeUntil(this.ngUnsubscribe)
    ).subscribe(res => {
      this.isLoading = false;
      this.userProfile = (res as UserProfileInfo);
    });

  }

  ngOnInit() {
    this.translateService.onLangChange.pipe(
      takeUntil(this.ngUnsubscribe)
    ).subscribe(() => {
      if (this.detectInappService.isInApp || this.detectInappService.isIE) {
        if (this.detectInappService.isLine) {
          if (location.search.length === 0) {
            location.href += '?openExternalBrowser=1';
          } else {
            location.href += '&openExternalBrowser=1';
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
    });

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
    this.globalEventsManager.showMask(false);
    let browserLang = this.utilsService.getLocalStorageObject('locale');
    if (!browserLang) {
      browserLang = this.translateService.getBrowserCultureLang().toLowerCase();
      this.translateService.use(browserLang);
      this.utilsService.setLocalStorageObject('locale', browserLang);
    } else {
      this.translateService.use(browserLang);
    }

    this.userInfoService.getUserId().subscribe(res => {
      this.userId = res;
    });

    this.globalEventsManager.showNavBarEmitter.subscribe(mode => {
      this.isMaskShow = mode;
    });

    this.globalEventsManager.setFooterRWDEmitter.subscribe(_num => {
      if (_num > 0) {
        this.footerAddClassName = `footer-rwd--${_num}`;
      } else {
        this.footerAddClassName = '';
      }
    });

    if (window.innerWidth < 769) {
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

  ngAfterViewChecked() {
    this.cdRef.detectChanges();
  }

  onResize(event) {
    if (
      (location.pathname.indexOf('/dashboard/group-info') > -1 && event.target.innerWidth < 1000)
      || event.target.innerWidth < 769
    ) {
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
      case 14:
      case 15:
      case 6:
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
    this.router.navigateByUrl(`/enableAccount-web`);
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
