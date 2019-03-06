import {
  Component,
  OnInit,
  ChangeDetectorRef,
  AfterViewChecked
} from '@angular/core';
import {
  getUrlQueryStrings,
} from '@shared/utils/';
import { GlobalEventsManager } from '@shared/global-events-manager';
import { MatSidenav, MatDrawerToggleResult } from '@angular/material';
import { AuthService } from '@shared/services/auth.service';
import { Router } from '@angular/router';
import { UserInfoService } from './services/userInfo.service';
import { UtilsService } from '@shared/services/utils.service';
import { TranslateService } from '@ngx-translate/core';
import { UserInfo } from './models/userInfo';
import { NavigationEnd } from '@angular/router';
import { version } from '@shared/version';
import { HashIdService } from '@shared/services/hash-id.service';
import { DetectInappService } from '@shared/services/detect-inapp.service';
import { MatDialog } from '@angular/material/dialog';
import { MessageBoxComponent } from '@shared/components/message-box/message-box.component';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, AfterViewChecked {
  isPreviewMode = false;
  isLoading = false;
  isMaskShow = false;
  isCollapseOpen = false;
  target = 14; // 目前預設是我的活動
  isSideNavOpend: boolean;
  mode = 'side';
  isDefaultOpend: boolean;
  userName: string;
  userPhoto: string;
  isUserMenuShow = false;
  isSupervisor = false;
  isBrandAdministrator = false;
  isSystemDeveloper = false;
  isSystemMaintainer = false;
  isMarketingDeveloper = false;
  isBranchAdministrator = false;
  isBroadcastProducer = false;
  isCoach = false;
  isGroupAdministrator = false;
  isGeneralMember = false;
  isHadContainer = true;
  footerAddClassName = '';
  userId: number;
  isAlphaVersion = false;
  version: string;
  isHideFooter = false;
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
    private dialog: MatDialog
  ) {
    if (location.search.indexOf('ipm=s') > -1) {
      this.isPreviewMode = true;
    }
    this.router.events.subscribe(_val => {
      if (_val instanceof NavigationEnd) {
        if (_val.url.indexOf('/dashboard/coach-dashboard') > -1) {
          this.mode = 'over';
          this.isHadContainer = false;
          this.isDefaultOpend = false;
          this.isSideNavOpend = false;
          this.isHideFooter = true;
        } else {
          this.mode = 'side';
          this.isHadContainer = true;
          this.isHideFooter = false;
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
          const token = this.utilsService.getToken();
          const body = {
            token,
            iconType: 2
          };
          this.userInfoService.getUserInfo(body).then(() => {
            this.isLoading = false;
          });
        }
      });
  }

  ngOnInit() {
    this.translateService.onLangChange.subscribe(() => {
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
              body: this.translateService.instant('SH.BrowserTip'),
              confirmText: this.translateService.instant('SH.Confirm')
            }
          });
        }
      }
    });
    this.isAlphaVersion = true;
    if (location.hostname.indexOf('cloud.alatech.com.tw') > -1) {
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
    this.userInfoService.getUserIcon().subscribe(res => {
      this.userPhoto = this.utilsService.buildBase64ImgString(res);
    });
    this.userInfoService.getUserName().subscribe(res => {
      this.userName = res;
    });
    this.userInfoService.getUserId().subscribe(res => {
      this.userId = res;
    });
    this.userInfoService.getSupervisorStatus().subscribe(res => {
      this.isSupervisor = res;
      // console.log('%c this.isSupervisor', 'color: #108bcd', this.isSupervisor);
    });
    this.userInfoService.getSystemDeveloperStatus().subscribe(res => {
      this.isSystemDeveloper = res;
      // console.log(
      //   '%c this.isSystemDeveloper',
      //   'color: #108bcd',
      //   this.isSystemDeveloper
      // );
    });
    this.userInfoService.getSystemMaintainerStatus().subscribe(res => {
      this.isSystemMaintainer = res;
      // console.log(
      //   '%c this.isSystemMaintainer',
      //   'color: #108bcd',
      //   this.isSystemMaintainer
      // );
    });
    this.userInfoService.getMarketingDeveloperStatus().subscribe(res => {
      this.isMarketingDeveloper = res;
      // console.log(
      //   '%c this.isMarketingDeveloper',
      //   'color: #108bcd',
      //   this.isMarketingDeveloper
      // );
    });
    this.userInfoService.getBrandAdministratorStatus().subscribe(res => {
      this.isBrandAdministrator = res;
      // console.log(
      //   '%c this.isBrandAdministrator',
      //   'color: #108bcd',
      //   this.isBrandAdministrator
      // );
    });
    this.userInfoService.getBranchAdministratorStatus().subscribe(res => {
      this.isBranchAdministrator = res;
      // console.log(
      //   '%c this.isBranchAdministrator',
      //   'color: #108bcd',
      //   this.isBranchAdministrator
      // );
    });
    this.userInfoService.getBroadcastProducerStatus().subscribe(res => {
      this.isBroadcastProducer = res;
      // console.log(
      //   '%c this.isBroadcastProducer',
      //   'color: #108bcd',
      //   this.isBroadcastProducer
      // );
    });
    this.userInfoService.getCoachStatus().subscribe(res => {
      this.isCoach = res;
      // console.log('%c this.isCoach', 'color: #108bcd', this.isCoach);
    });
    this.userInfoService.getGroupAdministratorStatus().subscribe(res => {
      this.isGroupAdministrator = res;
      // console.log(
      //   '%c this.isGroupAdministrator',
      //   'color: #108bcd',
      //   this.isGroupAdministrator
      // );
    });
    this.userInfoService.getGeneralMemberStatus().subscribe(res => {
      this.isGeneralMember = res;
      // console.log(
      //   '%c this.isGeneralMember',
      //   'color: #108bcd',
      //   this.isGeneralMember
      // );
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
      this.mode = 'over';
      this.isDefaultOpend = false;
      this.isSideNavOpend = false;
    } else if (location.pathname.indexOf('/dashboard/coach-dashboard') > -1) {
      this.mode = 'over';
      this.isDefaultOpend = false;
      this.isSideNavOpend = false;
    } else {
      this.isDefaultOpend = true;
      this.isSideNavOpend = true;
    }
  }
  ngAfterViewChecked() {
    this.cdRef.detectChanges();
  }
  onResize(event, sideNav) {
    if (event.target.innerWidth < 769) {
      // this.toggleSideNav(sideNav);
      this.mode = 'over';
      this.isDefaultOpend = false;
      this.isSideNavOpend = false;
    } else if (location.pathname.indexOf('/dashboard/coach-dashboard') > -1) {
      this.isDefaultOpend = false;
      this.isSideNavOpend = false;
    } else {
      this.mode = 'side';
      this.isDefaultOpend = true;
      this.isSideNavOpend = true;
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
  toggleSideNav(sideNav: MatSidenav) {
    this.isSideNavOpend = !this.isSideNavOpend;
    return sideNav.toggle().then(result => {
      const toogleResult = result;
      if (toogleResult === 'open') {
        this.isSideNavOpend = true;
      } else {
        this.isSideNavOpend = false;
      }
      if (location.pathname.indexOf('/dashboard/coach-dashboard') > -1) {
        this.isSideNavOpend = false; // 如果是caoch bard 因為backdrop點擊不會觸發這個function，所以另外判斷是去handle
      }
      if (window.innerWidth < 769) {
        this.mode = 'over';
        this.isDefaultOpend = false;
      } else {
        this.isDefaultOpend = true;
      }
    });
  }
  chooseItem(_target, sidenav) {
    this.target = _target;
    if (window.innerWidth < 769 && this.target > 0) {
      this.toggleSideNav(sidenav);
    }
  }
  logout() {
    this.authService.logout();
    this.router.navigate(['/signin']);
  }
}
