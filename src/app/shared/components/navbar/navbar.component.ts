import { Component, OnInit, OnDestroy, HostListener, Input, ElementRef } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import {
  AuthService,
  GetClientIpService,
  GlobalEventsService,
  UserService,
} from '../../../core/services';
import { Observable, Subject, takeUntil } from 'rxjs';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { langData } from '../../../core/models/const';
import { setLocalStorageObject, getLocalStorageObject } from '../../../core/utils';
import { appPath } from '../../../app-path.const';
import { NgIf, NgTemplateOutlet, AsyncPipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';

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
  ],
})
export class NavbarComponent implements OnInit, OnDestroy {
  /**
   * 解除rxjs用
   */
  private _ngUnsubscirbe = new Subject();

  isShowMask = false;
  href: string;
  deviceWidth: number;
  navItemStr = '';
  login$: Observable<boolean>;
  langName: string;
  showActivityEntry = false;
  isCountdownFinished = false;
  menu = {
    MainNav: false,
    memberMenu: false,
  };
  avatarUrl: string;
  nickname: string;
  readonly dashboardHomeUrl = `/${appPath.dashboard.home}`;
  @Input() isAlphaVersion = false;
  @Input() activePage = '';

  constructor(
    private router: Router,
    private authService: AuthService,
    private getClientIp: GetClientIpService,
    private translateService: TranslateService,
    private globalEventsService: GlobalEventsService,
    private el: ElementRef,
    private userService: UserService
  ) {}

  ngOnInit() {
    this.getIpAddress();
    this.langName = langData[getLocalStorageObject('locale')];
    this.login$ = this.authService.isLogin;
    this.deviceWidth = window.innerWidth;
    this.href = this.router.url;
    this.subscribeRxUserProfile();
  }

  /**
   * 訂閱使用者個人資訊(訪客/登入者)
   */
  subscribeRxUserProfile() {
    this.userService
      .getUser()
      .rxUserProfile.pipe(takeUntil(this._ngUnsubscirbe))
      .subscribe((userProfile) => {
        this.avatarUrl = userProfile.avatarUrl;
        this.nickname = userProfile.nickname;
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
      this.isShowMask = false;
      this.menu.memberMenu = false;
      this.menu.MainNav = false;
    }
  }

  /**
   * 重新調整視窗大小時，判斷是否出現開合選單
   */
  checkShowMask() {
    if (this.deviceWidth > 767) {
      this.menu.MainNav = false;
      this.isShowMask = this.menu.memberMenu ? true : false;
    }
  }

  /**
   * 點擊選單 hamber時，判斷 ckecked 狀態顯示遮罩
   * @param ifchecked
   */
  toggleMenu(ifchecked: boolean) {
    this.menu.MainNav = ifchecked;
    this.isShowMask = ifchecked;
    this.menu.memberMenu = false;
  }

  toggle(str: string) {
    switch (str) {
      case 'memberMenu':
        this.menu.memberMenu = !this.menu.memberMenu;
        this.menu.MainNav = false;
        this.isShowMask = this.menu.memberMenu ? true : false;
        break;
    }
  }

  logout() {
    this.authService.logout();
  }

  chooseNavItem(string: string) {
    const { officialActivity, portal } = appPath;
    this.navItemStr = string;
    this.isShowMask = false;
    this.globalEventsService.setShowMaskStatus(this.isShowMask);
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

  /**
   * 解除rxjs訂閱
   */
  ngOnDestroy() {
    this._ngUnsubscirbe.next(null);
    this._ngUnsubscirbe.complete();
  }
}
