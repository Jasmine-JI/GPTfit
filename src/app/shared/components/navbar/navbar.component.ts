import { Component, OnInit, HostListener, Input, Output, EventEmitter } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService, GetClientIpService, GlobalEventsService } from '../../../core/services';
import { Observable } from 'rxjs';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { langData } from '../../../core/models/const';
import { setLocalStorageObject, getLocalStorageObject } from '../../../core/utils';
import { appPath } from '../../../app-path.const';
import { NgIf, NgTemplateOutlet, AsyncPipe } from '@angular/common';

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
  standalone: true,
  imports: [NgIf, RouterLink, NgTemplateOutlet, AsyncPipe, TranslateModule],
})
export class NavbarComponent implements OnInit {
  isShowMask = false;
  isCollapseShow = false;
  href: string;
  deviceWidth: number;
  navItemNum = 1;
  login$: Observable<boolean>;
  langName: string;
  hideLogout = false;
  showActivityEntry = false;

  readonly dashboardHomeUrl = `/${appPath.dashboard.home}`;

  @Input() isAlphaVersion = false;
  @Output() selectPage = new EventEmitter<string>();

  constructor(
    private router: Router,
    private authService: AuthService,
    private getClientIp: GetClientIpService,
    private translateService: TranslateService,
    private globalEventsService: GlobalEventsService
  ) {}

  ngOnInit() {
    this.getIpAddress();
    this.langName = langData[getLocalStorageObject('locale')];
    this.login$ = this.authService.isLogin;
    this.deviceWidth = window.innerWidth;
    this.href = this.router.url;
    this.handleActivePage();
  }

  /**
   * 確認現在頁面以對應active連結
   * @author kidin-1091013
   */
  handleActivePage() {
    const {
      portal: { introduction, signInWeb },
      officialActivity,
    } = appPath;
    switch (this.router.url) {
      case '/':
      case `/${introduction.home}/${introduction.system}`:
        this.navItemNum = 1;
        break;
      case `/${introduction.home}/${introduction.application}`:
      case `/${introduction.home}/${introduction.application}${introduction.connectAnchor}`:
      case `/${introduction.home}/${introduction.application}${introduction.cloudrunAnchor}`:
      case `/${introduction.home}/${introduction.application}${introduction.trainliveAnchor}`:
      case `/${introduction.home}/${introduction.application}${introduction.fitnessAnchor}`:
      case `/${introduction.connectAnchor}`:
      case `/${introduction.cloudrunAnchor}`:
      case `/${introduction.trainliveAnchor}`:
      case `/${introduction.fitnessAnchor}`:
        this.navItemNum = 2;
        break;
      case `/${introduction.home}/${introduction.analysis}`:
        this.navItemNum = 3;
        break;
      case `/${officialActivity.home}`:
        this.navItemNum = 4;
        break;
      case `/${signInWeb}`:
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

  toggleMenu() {
    if (this.deviceWidth < 992) {
      const { isShowMask, isCollapseShow } = this;
      this.isShowMask = !isShowMask;
      this.isCollapseShow = !isCollapseShow;
      this.globalEventsService.setShowMaskStatus(this.isShowMask);
    }
  }

  logout() {
    this.authService.logout();
  }

  chooseNavItem(num: number) {
    const { officialActivity, portal } = appPath;
    this.navItemNum = num;
    this.isCollapseShow = false;
    this.isShowMask = false;
    this.globalEventsService.setShowMaskStatus(this.isShowMask);
    switch (num) {
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
        this.router.navigateByUrl(`/${officialActivity.home}`);
        break;
      case 5:
      case 6:
        this.router.navigateByUrl(`/${portal.signInWeb}`);
        break;
    }
  }

  switchLang(lang: string) {
    this.langName = langData[lang];
    this.translateService.use(lang);
    setLocalStorageObject('locale', lang);
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
}
