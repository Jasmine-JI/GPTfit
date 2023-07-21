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
import { UserProfile } from '../../../core/models/api/api-10xx';

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
  login$: Observable<boolean>;
  langName: string;
  showActivityEntry = false;
  isCountdownFinished = false;
  menu = {
    MainNav: false,
    memberMenu: false,
    showLanguage: false,
  };
  userProfile = <UserProfile>{};
  accountStatus = this.userService.getUser().signInfo?.accountStatus;
  @Input() isAlphaVersion = false;

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
   * 點擊選單 hamber 時，判斷 ckecked 狀態顯示遮罩
   * @param ifchecked
   */
  toggleMenu(ifchecked: boolean) {
    this.menu.MainNav = ifchecked;
    this.isShowMask = ifchecked;
    this.menu.memberMenu = false;
  }

  /**
   * 點擊收合選單
   * @param str
   */
  toggle(str: string) {
    switch (str) {
      case 'memberMenu':
        this.menu.memberMenu = !this.menu.memberMenu;
        this.menu.MainNav = false;
        this.isShowMask = this.menu.memberMenu ? true : false;
        this.menu.showLanguage = false;
        break;
      case 'showLanguage':
        this.menu.showLanguage = !this.menu.showLanguage;
        break;
    }
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
    this._ngUnsubscirbe.next(null);
    this._ngUnsubscirbe.complete();
  }
}
