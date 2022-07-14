import { Component, OnInit, HostListener, Inject, Input, Output, EventEmitter } from '@angular/core';
import { GlobalEventsManager } from '../../global-events-manager';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { Observable } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import { UtilsService } from '../../services/utils.service';
import { langData } from '../../models/i18n';
import { GetClientIpService } from '../../services/get-client-ip.service';
import { setLocalStorageObject, getLocalStorageObject } from '../../utils/index';

@Component({
  // tslint:disable-next-line:component-selector
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
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
  navItemNum = 1;
  login$: Observable<boolean>;
  langName: string;
  hideLogout = false;
  showActivityEntry = false;

  @Input() isAlphaVersion = false;
  @Output() selectPage = new EventEmitter<string>();

  constructor(
    private globalEventsManager: GlobalEventsManager,
    private router: Router,
    private authService: AuthService,
    private utilsService: UtilsService,
    private getClientIp: GetClientIpService,
    private translateService: TranslateService
  ) {}

  ngOnInit() {
    this.getIpAddress();
    this.langName = langData[getLocalStorageObject('locale')];
    this.login$ = this.authService.isLogin;
    this.deviceWidth = window.innerWidth;
    this.href = this.router.url;
    this.handleActivePage();

    if (this.href.indexOf('resetpassword') > -1) {
      this.utilsService.setResetPasswordStatus(true);
    } else {
      this.utilsService.setResetPasswordStatus(false);
    }

    // 確認修改密碼是否完成-kidin-1090109（bug1043）
    this.utilsService.getResetPasswordStatus().subscribe(res => {
      this.isShowResetPwd = res;
    });

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

  /**
   * 確認現在頁面以對應active連結
   * @author kidin-1091013
   */
  handleActivePage() {
    switch (this.router.url) {
      case '/':
      case '/introduction/system':
        this.navItemNum = 1;
        break;
      case '/introduction/application':
      case '/introduction/application#connect':
      case '/introduction/application#cloudrun':
      case '/introduction/application#trainlive':
      case '/introduction/application#fitness':
      case '/#connect':
      case '/#cloudrun':
      case '/#trainlive':
      case '/#fitness':
        this.navItemNum = 2;
        break;
      case '/introduction/analysis':
        this.navItemNum = 3;
        break;
      case '/official-activity':
        this.navItemNum = 4;
      case '/signIn-web':
        this.navItemNum = 5;
        break;
      default:
        this.navItemNum = 0;
        break;
    }

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
    this.toggleMask();
    switch(num) {
      case 1:
        this.selectPage.emit('system');
        break;
      case 2:
        this.selectPage.emit('application');
        break;
      case 3:
        this.selectPage.emit('analysis');
        break;
      case 4:
        this.router.navigateByUrl('/official-activity');
        break;
      case 5:
      case 6:
        this.router.navigateByUrl('/signIn-web');
        break;
    }

  }

  switchLang(lang: string) {
    this.langName = langData[lang];
    this.translateService.use(lang);
    setLocalStorageObject('locale', lang);
    this.toggleMask();
  }

  /**
   * 取得使用者所在地區，台灣區才會顯示活動入口
   * @author kidin-1110207
   */
  getIpAddress() {
    this.getClientIp.requestIpAddress().subscribe(res => {
      const { country: countryCode } = (res as any);
      const openCountry = ['TW'];
      if (openCountry.includes(countryCode)) {
        this.showActivityEntry = true;
      }

    });

  }
  

}
