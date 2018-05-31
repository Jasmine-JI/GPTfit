import { Component, OnInit, HostListener, Inject } from '@angular/core';
import { GlobalEventsManager } from '@shared/global-events-manager';
import { Router } from '@angular/router';
import { WINDOW } from '@shared/services/window.service';
import { AuthService } from '@shared/services/auth.service';
import { Observable } from 'rxjs/Observable';
import { TranslateService } from '@ngx-translate/core';
import { UtilsService } from '../../services/utils.service';

@Component({
  // tslint:disable-next-line:component-selector
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit {
  isShowMask = false;
  isCollapseShow = false;
  isCollapseSearchShow = false;
  href: string;
  isShowResetPwd = false;
  isShowDashboard = false;
  isShowLeaderboard = false;
  deviceWidth: number;
  navItemNum: number;
  login$: Observable<boolean>;
  langName: string;
  langData = {
    'zh-tw': '繁體中文',
    'zh-cn': '简体中文',
    'en-us': 'English'
  };
  constructor(
    private globalEventsManager: GlobalEventsManager,
    private router: Router,
    private authService: AuthService,
    private utilsService: UtilsService,
    @Inject(WINDOW) private window,
    private translateService: TranslateService
  ) {}

  ngOnInit() {
    this.langName = this.langData[this.utilsService.getLocalStorageObject('locale')];
    this.login$ = this.authService.getLoginStatus();
    this.deviceWidth = window.innerWidth;
    this.href = this.router.url;
    if (this.href.indexOf('leaderboard') > -1) {
      this.isShowLeaderboard = true;
      this.navItemNum = 2;
    }
    if (this.href.indexOf('signin') > -1) {
      this.navItemNum = 3;
    }
    if (this.href.indexOf('resetpassword') > -1) {
      this.isShowResetPwd = true;
    } else {
      this.isShowResetPwd = false;
    }
    if (this.href.indexOf('dashboard') > -1) {
      const sessionValue = sessionStorage.web;
      if (sessionValue === '12345678') {
        this.isShowDashboard = true;
      } else {
        this.validate();
      }
    }
    this.globalEventsManager.closeCollapseEmitter.subscribe(mode => {
      this.isCollapseShow = mode;
      if (!this.isCollapseShow) {
        this.isShowMask = false;
        this.globalEventsManager.showMask(this.isShowMask);
      }
    });
    this.globalEventsManager.showCollapseEmitter.subscribe(mode => {
      this.isCollapseSearchShow = mode;
    });
  }
  @HostListener('window:resize', [])
  onResize() {
    this.deviceWidth = window.innerWidth;
  }
  validate() {
    const pwd = window.prompt('請輸入密碼: ');
    if (pwd === '12345678') {
      sessionStorage.web = pwd;
      return (this.isShowDashboard = true);
    }
    return (location.href = '/');
  }
  toggleSearch() {
    if (this.isCollapseShow) {
      this.isCollapseShow = !this.isCollapseShow;
    } else {
      this.isShowMask = !this.isShowMask;
      this.globalEventsManager.showMask(this.isShowMask);
    }
    this.isCollapseSearchShow = !this.isCollapseSearchShow;
    this.globalEventsManager.openCollapse(this.isCollapseSearchShow);
  }
  toggleMask() {
    if (this.deviceWidth < 992) {
      if (this.isCollapseSearchShow) {
        this.isCollapseSearchShow = !this.isCollapseSearchShow;
        this.globalEventsManager.openCollapse(this.isCollapseSearchShow);
      } else {
        this.isShowMask = !this.isShowMask;
      }
      this.isCollapseShow = !this.isCollapseShow;
      this.globalEventsManager.showMask(this.isShowMask);
    }
  }
  reloadPage() {
    location.reload();
  }
  logout() {
    this.authService.logout();
  }
  chooseNavItem(num: number) {
    this.navItemNum = num;
  }
  switchLang(lang: string) {
    this.langName = this.langData[lang];
    this.translateService.use(lang);
    this.utilsService.setLocalStorageObject('locale', lang);
  }
}
