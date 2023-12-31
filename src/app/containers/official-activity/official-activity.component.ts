import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { Router, NavigationEnd, RouterOutlet } from '@angular/router';
import { Subject, Subscription, fromEvent, merge, combineLatest, of } from 'rxjs';
import { takeUntil, switchMap, tap, debounceTime } from 'rxjs/operators';
import { UserProfile } from '../../core/models/api/api-10xx';
import { OfficialActivityService } from './services/official-activity.service';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { codes, errorMessage } from '../../core/models/const';
import { formTest } from '../../core/models/regex/form-test';
import { MatSnackBar } from '@angular/material/snack-bar';
import { KeyCode } from '../../core/enums/common/key-code.enum';
import { ResetPasswordFlow, UnlockFlow, QrSignInFlow } from '../../core/enums/api';
import { AlaApp, Domain, WebIp, WebPort, QueryString } from '../../core/enums/common';
import { SignInType } from '../../core/enums/personal';
import {
  NodejsApiService,
  AuthService,
  Api50xxService,
  UserService,
  GetClientIpService,
  DetectInappService,
  Api10xxService,
  EnvironmentCheckService,
  HintDialogService,
  ApiCommonService,
} from '../../core/services';
import {
  setLocalStorageObject,
  getLocalStorageObject,
  getCurrentTimestamp,
  deepCopy,
  checkResponse,
} from '../../core/utils';
import { StationMailService } from '../station-mail/services/station-mail.service';
import { appPath } from '../../app-path.const';
import { FormsModule } from '@angular/forms';
import { QRCodeModule } from 'angularx-qrcode';
import { MatIconModule } from '@angular/material/icon';
import { InboxComponent } from '../station-mail/inbox/inbox.component';
import { NgIf, NgClass, NgFor } from '@angular/common';
import { LoadingBarComponent } from '../../components/loading-bar/loading-bar.component';

const { officialActivity } = appPath;

type AuthAction =
  | 'login'
  | 'register'
  | 'qrLogin'
  | 'forgetPassword'
  | 'resetPassword'
  | 'sendVerifySuccess';
type AuthInput = 'accountInput' | 'passwordInput' | 'nicknameInput' | 'smsInput';
type AlertType = 'empty' | 'format' | 'mistake' | 'repeat' | 'improper' | 'overdue' | 'notExist';

@Component({
  selector: 'app-official-activity',
  templateUrl: './official-activity.component.html',
  styleUrls: ['./official-activity.component.scss'],
  standalone: true,
  imports: [
    LoadingBarComponent,
    NgIf,
    InboxComponent,
    NgClass,
    NgFor,
    RouterOutlet,
    MatIconModule,
    QRCodeModule,
    FormsModule,
    TranslateModule,
  ],
})
export class OfficialActivityComponent implements OnInit, AfterViewInit, OnDestroy {
  private ngUnsubscribe = new Subject();
  private pageResize = new Subscription();
  private globleEventSubscription = new Subscription();

  @ViewChild('accountInput') accountInput: ElementRef;
  @ViewChild('passwordInput') passwordInput: ElementRef;
  @ViewChild('nicknameInput') nicknameInput: ElementRef;
  @ViewChild('smsInput') smsInput: ElementRef;

  /**
   * ui 會用到的各個flag
   */
  uiFlag = {
    currentPage: officialActivity.activityList,
    isMobile: false,
    currentAdvertiseId: 1,
    showAdvertise: true,
    showSearchInput: false,
    showEntryMenu: false,
    showPersonalMenu: false,
    authBox: <AuthAction>null,
    showCountryCodeList: false,
    progress: 100,
    showNicknameHint: false,
    showPassword: false,
    focusInput: false,
    clickSubmit: false,
    fixFooter: false,
    showStationMailList: false,
    haveNewMail: false,
  };

  /**
   * 登入/註冊/忘記密碼等欄位資訊
   */
  authInfo = <any>{
    signInType: <SignInType | null>null,
    password: null,
  };

  /**
   * 登入/註冊/忘記密碼等欄位提示
   */
  authAlert = {
    account: <AlertType>null,
    password: <AlertType>null,
    nickname: <AlertType>null,
    qrLogin: <AlertType>null,
    sms: <AlertType>null,
    captcha: <AlertType>null,
  };

  /**
   * 圖碼鎖定相關
   */
  imgCaptcha = <any>{
    unlockFlow: null,
  };

  /**
   * 使用者ip及該ip所在國家
   */
  userLocation = {
    ip: null,
    countryCode: null,
  };

  qrLoginUrl: string;
  userInfo: UserProfile;
  token = this.auth.token;
  advertise = [];
  carousel: { img: string; advertiseId: number; link: string };
  carouselProgress: any;
  carouselWidth = 840;
  carouselAnimation: any;
  captchaImg: string = null;
  timeCount = 30;
  intervals: NodeJS.Timeout;
  termsConditionsUrl: string;
  privacyPolicyUrl: string;
  agreeDeclaration = false;
  activityKeyword = '';
  requestHeader = {};
  mailNotify: NodeJS.Timeout;
  notifyUpdateTime: number | null = null;

  readonly linkList = {
    activityList: `/${officialActivity.home}/${officialActivity.activityList}`,
    leaderboard: `/${officialActivity.home}/${officialActivity.leaderboard}`,
    myActivity: `/${officialActivity.home}/${officialActivity.myActivity}`,
    aboutCloudrun: `/${officialActivity.home}/${officialActivity.aboutCloudrun}`,
    contactUs: `/${officialActivity.home}/${officialActivity.contactUs}`,
  };
  readonly officialActivity = officialActivity;

  readonly SignTypeEnum = SignInType;
  readonly countryCodeList = codes;

  constructor(
    private userService: UserService,
    private router: Router,
    private officialActivityService: OfficialActivityService,
    private auth: AuthService,
    private detectInappService: DetectInappService,
    private translate: TranslateService,
    private snackbar: MatSnackBar,
    private getClientIp: GetClientIpService,
    private api10xxService: Api10xxService,
    private nodejsApiService: NodejsApiService,
    private api50xxService: Api50xxService,
    private stationMailService: StationMailService,
    private environmentCheckService: EnvironmentCheckService,
    private hintDialogService: HintDialogService,
    private apiCommonService: ApiCommonService
  ) {}

  ngOnInit(): void {
    this.environmentCheckService.checkBrowserLang();
    this.detectParamChange();
    this.checkScreenSize();
    this.handlePageResize();
    this.getUserProfile();
    this.getEventAdvertise();
    this.getCloudrunMapInfo();
    this.getDocumentUrl();
  }

  ngAfterViewInit() {
    this.checkCurrentPage();
  }

  /**
   * 訂閱語言改變事件
   * @author kidin
   */
  checkBrowser() {
    this.translate.onLangChange.pipe(takeUntil(this.ngUnsubscribe)).subscribe((resArr) => {
      this.detectInappService.checkBrowser();
    });
  }

  /**
   * 取得文件位址
   * @author kidin-1101207
   */
  getDocumentUrl() {
    const { hostname } = location;
    let host: string;
    switch (hostname) {
      case WebIp.develop:
      case `${WebIp.develop}:${WebPort.develop}`:
      case Domain.uat:
        host = `https://${Domain.uat}/app/public_html/appHelp`;
        break;
      case Domain.newProd:
        host = `https://${Domain.newProd}/app/public_html/appHelp`;
        break;
    }

    const { currentLang } = this.translate;
    let documentLang: string;
    switch (currentLang) {
      case 'zh-tw':
        documentLang = 'zh-TW';
        break;
      case 'zh-cn':
        documentLang = 'zh-CN';
        break;
      default:
        documentLang = 'en-US';
        break;
    }

    this.termsConditionsUrl = `${host}/${documentLang}/termsConditions.html`;
    this.privacyPolicyUrl = `${host}/${documentLang}/privacyPolicy.html`;
  }

  /**
   * 處理url param改變的事件
   * @author kidin-1091110
   */
  detectParamChange() {
    this.router.events.pipe(takeUntil(this.ngUnsubscribe)).subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.closeAuthBox();
        this.handleAdvertiseSize();
        this.checkCurrentPage();
      }
    });
  }

  /**
   * 確認現在頁面
   * @author kidin-1101004
   */
  checkCurrentPage() {
    const { pathname } = location;
    const [, , secondPath] = pathname.split('/');
    if (secondPath) {
      const childPage = secondPath;
      this.uiFlag.currentPage = childPage;
      this.checkShowAdvertisePage(secondPath);
      this.checkForbiddenPage(secondPath);

      if (!this.uiFlag.isMobile) this.checkPageUnderlinePosition(childPage);
    }

    if (this.uiFlag.showAdvertise) {
      if (!this.carouselProgress) this.startCarousel();
    } else {
      this.stopCarousel();
    }
  }

  /**
   * 確認目前路徑是否顯示廣告
   * @param path {string}-參考路徑
   */
  checkShowAdvertisePage(path: string) {
    this.uiFlag.showAdvertise = [
      officialActivity.activityList,
      officialActivity.myActivity,
      officialActivity.editCarousel,
    ].includes(path);
  }

  /**
   * 確認目前路徑是否固定
   * @param path {string}-參考路徑
   * @author kidin-1110208
   */
  checkForbiddenPage(path: string) {
    setTimeout(() => {
      const { pageNoPermission, pageNotFound } = appPath;
      this.uiFlag.fixFooter = [pageNoPermission, pageNotFound].includes(path);
    });
  }

  /**
   * 確認所在頁面，調整頁面提示底線的位置
   * @param page 現在所在頁面
   */
  checkPageUnderlinePosition(page: string) {
    setTimeout(() => {
      const { pageNoPermission, pageNotFound } = appPath;
      if (![pageNoPermission, pageNotFound].includes(page)) {
        const target = document.querySelector(`[name=${page}]`);
        const linkActiveUnderline = document.getElementById('link__active') as any;
        if (target) {
          const pageEntryElement = document.querySelector('.child__page__entry');
          if (pageEntryElement && target) {
            const entryXPosition = pageEntryElement.getBoundingClientRect().x;
            const { width, x } = target.getBoundingClientRect();
            linkActiveUnderline.style.width = `${width}px`;
            linkActiveUnderline.style.left = `${x - entryXPosition}px`;
          }
        } else {
          if (linkActiveUnderline) linkActiveUnderline.style.width = '0px';
        }
      }
    }, 500);
  }

  /**
   * 偵測瀏覽器是否改變大小
   * @author kidin-1100928
   */
  handlePageResize() {
    const page = fromEvent(window, 'resize');
    this.pageResize = page.pipe(debounceTime(300), takeUntil(this.ngUnsubscribe)).subscribe(() => {
      this.checkScreenSize();
      this.unsubscribePluralEvent();
    });
  }

  /**
   * 取得登入者資訊
   */
  getUserProfile() {
    this.userService
      .getUser()
      .rxUserProfile.pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((res) => {
        this.token = this.auth.token;
        this.userInfo = res;
        this.pollingNewMail();
      });
  }

  /**
   * 確認現在視窗大小
   * @author kidin-1100928
   */
  checkScreenSize() {
    const { innerWidth } = window;
    if (innerWidth <= 767) {
      this.uiFlag.isMobile = true;
    } else {
      this.uiFlag.isMobile = false;
      this.checkPageUnderlinePosition(this.uiFlag.currentPage);
    }

    this.officialActivityService.setScreenSize(innerWidth);
    const { showAdvertise } = this.uiFlag;
    if (showAdvertise) {
      this.handleAdvertiseSize();
    }
  }

  /**
   * 根據螢幕大小設定輪播尺寸
   * @author kidin-1101005
   */
  handleAdvertiseSize() {
    const innerWidth = document.documentElement.clientWidth;
    const { isMobile } = this.uiFlag,
      advertiseElement = document.querySelectorAll('.carousel__block')[0] as any,
      advertiseImg = document.querySelectorAll('.carousel__img'),
      totalOtherWidth = isMobile ? 120 : 330;
    if (advertiseElement) {
      const widthCount = innerWidth - totalOtherWidth;
      this.carouselWidth = widthCount > 840 ? 840 : widthCount;
      advertiseElement.style.width = `${this.carouselWidth}px`;
      advertiseImg.forEach((_adImg) => {
        (_adImg as any).style.width = `${this.carouselWidth}px`;
      });
    } else {
      setTimeout(() => {
        this.handleAdvertiseSize();
      });
    }
  }

  /**
   * 取得輪播內容
   * @author kidin-1101004
   */
  getEventAdvertise() {
    const body = {
      token: this.auth.token,
    };

    this.officialActivityService
      .getCarouselTime()
      .pipe(switchMap((time) => this.officialActivityService.getEventAdvertise(body)))
      .subscribe((res) => {
        if (this.apiCommonService.checkRes(res)) {
          const { advertise } = res;
          this.advertise = advertise
            .filter((_ad) => this.officialActivityService.filterInvalidCarousel(_ad))
            .map((_ad, index) => {
              _ad.advertiseId = index + 1;
              return _ad;
            });

          const { showAdvertise } = this.uiFlag;
          const advertiseLength = this.advertise.length;
          const haveAdvertise = advertiseLength > 0;
          if (showAdvertise && haveAdvertise) {
            this.handleAdvertiseSize();
            this.startCarousel();
          }
        }
      });
  }

  /**
   * 開始進行輪播
   * @author kidin-1101006
   */
  startCarousel() {
    this.stopCarousel(); // 避免因切換頁面造成重複啟動計時器
    const { advertise, uiFlag } = this;
    if (advertise && advertise.length > 0) {
      const { currentAdvertiseId } = uiFlag;
      const { img, advertiseId, link } = advertise[currentAdvertiseId - 1];
      this.carousel = {
        advertiseId,
        img,
        link,
      };

      if (advertise.length > 1) {
        this.carouselProgress = setInterval(() => {
          this.switchNextCarousel();
        }, 7000);
      }
    }
  }

  /**
   * 停止輪播
   * @author kidin-1101028
   */
  stopCarousel() {
    if (this.carouselProgress) {
      clearInterval(this.carouselProgress);
      this.carouselProgress = undefined;
    }

    if (this.carouselAnimation) {
      clearInterval(this.carouselAnimation);
      this.carouselAnimation = undefined;
    }
  }

  /**
   * 切換下一張輪播
   * @author kidin-1101005
   */
  switchNextCarousel() {
    if (!this.carouselAnimation) {
      const { currentAdvertiseId } = this.uiFlag;
      const advertiseLen = this.advertise.length;
      if (currentAdvertiseId + 1 > advertiseLen) {
        this.uiFlag.currentAdvertiseId = 1;
      } else {
        this.uiFlag.currentAdvertiseId++;
      }

      this.carouselPlay('next');
    }
  }

  /**
   * 切換前一張輪播
   * @author kidin-1101005
   */
  switchPreCarousel() {
    if (!this.carouselAnimation) {
      const { currentAdvertiseId } = this.uiFlag;
      const advertiseLen = this.advertise.length;
      if (currentAdvertiseId - 1 < 1) {
        this.uiFlag.currentAdvertiseId = advertiseLen;
      } else {
        this.uiFlag.currentAdvertiseId--;
      }

      this.carouselPlay('pre');
    }
  }

  /**
   * 輪播切換
   * @param action {'next' | 'pre'}-播放方向
   * @author kidin-1101015
   */
  carouselPlay(action: 'next' | 'pre') {
    const { currentAdvertiseId } = this.uiFlag;
    const { img, link } = this.advertise[currentAdvertiseId - 1];
    const carouselList = document.querySelectorAll('.carousel__list')[0] as any;
    const switchCarousel = document.createElement('li');
    switchCarousel.classList.add('carousel__list__item');
    switchCarousel.innerHTML = `
      <a href="${link}" target="_blank">
        <img src="${img}" alt="ad" class="carousel__img" style="width: ${this.carouselWidth}px;">
      </a>
    `;

    if (action === 'pre') {
      carouselList.insertBefore(switchCarousel, carouselList.firstChild);
      carouselList.style.left = `${-this.carouselWidth}px`;
    } else {
      carouselList.appendChild(switchCarousel);
    }

    const animationTotalTime = 500;
    const oneShiftTime = 10;
    let timeCount = 0;
    this.carouselAnimation = setInterval(() => {
      if (timeCount > animationTotalTime) {
        const itemList = document.querySelectorAll('.carousel__list__item');
        const removeIndex = action === 'pre' ? itemList.length - 1 : 0;
        const removeTargetElement = itemList[removeIndex];
        removeTargetElement.parentNode.removeChild(removeTargetElement);
        carouselList.style.left = 0;
        clearInterval(this.carouselAnimation);
        this.carouselAnimation = undefined;
      } else {
        const ratio = timeCount / animationTotalTime;
        const shiftRatio = action === 'pre' ? 1 - ratio : ratio;
        carouselList.style.left = `${-this.carouselWidth * shiftRatio}px`;
      }

      timeCount += oneShiftTime;
    }, oneShiftTime);
  }

  /**
   * 取得雲跑地圖資訊並儲存
   * @author kidin-1101007
   */
  getCloudrunMapInfo() {
    this.nodejsApiService.getAllMapInfo().subscribe((res) => {
      const { list, leaderboard } = res;
      this.officialActivityService.saveAllMapInfo(list);
      this.officialActivityService.saveRoutine(leaderboard);
    });
  }

  /**
   * 轉導至指定頁面
   * @param e {MouseEvent}
   * @param path {string}-指定路徑
   * @author kidin-1101004
   */
  navigate(e: MouseEvent, path: string) {
    if (e) e.preventDefault();
    this.router.navigateByUrl(path);
  }

  /**
   * 顯示搜尋輸入框
   * @author kidin-1101014
   */
  showSearchInput() {
    this.uiFlag.showSearchInput = true;
    const inputElement = document.getElementById('search__input');
    inputElement.focus();
  }

  /**
   * 隱藏搜尋輸入框，並取消搜尋
   * @author kidin-1101014
   */
  hideSearchInput() {
    this.uiFlag.showSearchInput = false;
    const inputElement = document.getElementById('search__input') as any;
    inputElement.value = '';
    this.activityKeyword = '';
    const { currentPage } = this.uiFlag;
    this.searchActivity(currentPage); // 將關鍵字去除
  }

  /**
   * 顯示個人選單
   * @param e {MouseEvent}
   * @author kidin-1101202
   */
  showPersonalMenu(e: MouseEvent) {
    e.stopPropagation();
    const { showPersonalMenu } = this.uiFlag;
    if (showPersonalMenu) {
      this.unsubscribePluralEvent();
    } else {
      this.uiFlag.showPersonalMenu = true;
      this.subscribePluralEvent();
    }
  }

  /**
   * 手機模式顯示子頁面入口選單
   * @param e {MouseEvent}
   * @author kidin-1101014
   */
  showEntryMenu(e: MouseEvent) {
    e.stopPropagation();
    const { showEntryMenu } = this.uiFlag;
    if (showEntryMenu) {
      this.unsubscribePluralEvent();
    } else {
      this.uiFlag.showEntryMenu = true;
      this.subscribePluralEvent();
    }
  }

  /**
   * 訂閱全域點擊和捲動事件
   * @author kidin-1101014
   */
  subscribePluralEvent() {
    const scrollElement = document.querySelector('.main__page'),
      clickEvent = fromEvent(document, 'click'),
      scrollEvent = fromEvent(scrollElement, 'scroll');
    this.globleEventSubscription = merge(clickEvent, scrollEvent)
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((e) => {
        this.unsubscribePluralEvent();
      });
  }

  /**
   * 隱藏選單並取消訂閱全域點擊事件
   * @author kidin-1101014
   */
  unsubscribePluralEvent() {
    this.uiFlag.showPersonalMenu = false;
    this.uiFlag.showEntryMenu = false;
    this.uiFlag.showCountryCodeList = false;
    this.uiFlag.showStationMailList = false;
    this.globleEventSubscription.unsubscribe();
  }

  /**
   * 顯示登入視窗
   * @author kidin-1101202
   */
  showLoginBox() {
    this.uiFlag.authBox = 'login';
  }

  /**
   * 關閉登入/註冊視窗
   * @author kidin-1101202
   */
  closeAuthBox() {
    const { focusInput } = this.uiFlag;
    if (!focusInput) {
      this.initAuthInfo();
      this.initAuthAlert();
      this.captchaImg = null;
      this.uiFlag.authBox = null;
    }
  }

  /**
   * 清除所有已經儲存的欄位
   * @author kidin-1101206
   */
  initAuthInfo() {
    this.authInfo = {
      signInType: null,
      password: null,
    };

    this.uiFlag.clickSubmit = false;
    if (this.accountInput) {
      this.accountInput.nativeElement.value = '';
    }
  }

  /**
   * 清除所有欄位提示
   * @author kidin-1101206
   */
  initAuthAlert() {
    this.authAlert = {
      account: null,
      password: null,
      nickname: null,
      qrLogin: null,
      sms: null,
      captcha: null,
    };
  }

  /**
   * 變更操作流程頁面
   * @param type {AuthAction}-操作流程類別
   * @author kidin-1101202
   */
  changeAuthBoxType(type: AuthAction) {
    this.uiFlag.authBox = type;
    this.initAuthInfo();
    this.initAuthAlert();
    if (type === 'qrLogin') {
      if (this.checkFrequency()) {
        const loginQrCode = this.createLoginQrcode();
        this.waitQrcodeLogin(loginQrCode);
      } else {
        this.authAlert.qrLogin = 'improper';
      }
    }
  }

  /**
   * 確認帳號類別
   * @param e {KeyboardEvent}
   * @author kidin-1101203
   */
  checkAccountType(e: KeyboardEvent) {
    const { value } = (e as any).target;
    if (this.checkEnter(e, 'accountInput')) {
      return;
    } else if (!value) {
      this.authInfo.signInType = null;
      delete this.authInfo.countryCode;
    } else if (formTest.number.test(value)) {
      this.authInfo.signInType = SignInType.phone;
      const countryCode = this.getCountryCode();
      Object.assign(this.authInfo, { countryCode });
    } else {
      this.authInfo.signInType = SignInType.email;
      delete this.authInfo.countryCode;
    }
  }

  /**
   * 從localstorage取得已儲存之countryCode，若無則預設886
   * @author kidin-1101207
   */
  getCountryCode() {
    const countryCode = getLocalStorageObject('countryCode');
    return countryCode ? countryCode : 886;
  }

  /**
   * 確認帳號是否符合格式
   * @param e {MouseEvent}
   * @author kidin-1101203
   */
  checkAccountFormat(e: MouseEvent) {
    this.uiFlag.focusInput = false;
    const value = (e as any).target.value.trim();
    const { signInType } = this.authInfo;
    if (signInType === SignInType.phone) {
      this.checkPhoneFormat(+value); // 藉由轉數字將開頭所有0去除
    } else if (signInType === SignInType.email) {
      this.checkEmailFormat(value);
    } else {
      this.authAlert.account = 'empty';
    }
  }

  /**
   * 顯示國碼選擇清單
   * @param e {MouseEvent}
   * @author kidin-1101108
   */
  showCountryCodeList(e: MouseEvent) {
    e.stopPropagation();
    const { showCountryCodeList } = this.uiFlag;
    if (showCountryCodeList) {
      this.unsubscribePluralEvent();
    } else {
      this.uiFlag.showCountryCodeList = true;
      this.subscribePluralEvent();
    }
  }

  /**
   * 選擇國碼
   * @param e {MouseEvent}
   * @param code {string}-所選國碼
   * @author kidin-1101108
   */
  selectCountryCode(e: MouseEvent, code: string) {
    e.stopPropagation();
    const newCountryCode = code.split('+')[1];
    const { countryCode: oldCountryCode } = this.authInfo;
    if (newCountryCode !== oldCountryCode) {
      this.authInfo.countryCode = newCountryCode;
      setLocalStorageObject('countryCode', newCountryCode);
    }

    this.unsubscribePluralEvent();
  }

  /**
   * 確認電話號碼是否符合格式
   * @param newPhone {number}-新編輯之手機號碼
   * @author kidin-1101108
   */
  checkPhoneFormat(newPhoneNumber: number) {
    const newPhone = `${newPhoneNumber}`;
    if (newPhone.length === 0) {
      this.authAlert.account = 'empty';
    } else if (!formTest.phone.test(newPhone)) {
      this.authAlert.account = 'format';
    } else {
      this.authAlert.account = null;
      this.authInfo.mobileNumber = newPhoneNumber;
    }
  }

  /**
   * 確認電子信箱是否符合格式
   * @param newEmail {string}-新編輯之email
   * @author kidin-1101108
   */
  checkEmailFormat(newEmail: string) {
    if (newEmail.length === 0) {
      this.authAlert.account = 'empty';
    } else if (!formTest.email.test(newEmail)) {
      this.authAlert.account = 'format';
    } else {
      this.authAlert.account = null;
      this.authInfo.email = newEmail;
    }
  }

  /**
   * 顯示暱稱輸入提示
   * @param e {MouseEvent}
   * @author kidin-1101203
   */
  showNickNameHint(e: MouseEvent) {
    this.uiFlag.showNicknameHint = true;
    this.authAlert.nickname = null;
  }

  /**
   * 確認暱稱是否符合格式
   * @param e {MouseEvent}
   * @author kidin-1101203
   */
  checkNicknameFormat(e: MouseEvent) {
    this.uiFlag.focusInput = false;
    this.uiFlag.showNicknameHint = false;
    const nickname = (e as any).target.value.trim();
    if (nickname.length === 0) {
      this.authAlert.nickname = 'empty';
    } else if (!formTest.nickname.test(nickname)) {
      this.authAlert.nickname = 'format';
    } else {
      this.authAlert.nickname = null;
      this.authInfo.nickname = nickname;
      this.checkNickname(nickname);
    }
  }

  /**
   * 確認密碼是否有值
   * @param e {MouseEvent}
   * @author kidin-1101111
   */
  checkPassword(e: MouseEvent) {
    this.uiFlag.focusInput = false;
    const password = (e as any).target.value;
    if (password.length === 0) {
      this.authAlert.password = 'empty';
    } else if (!formTest.password.test(password)) {
      this.authAlert.password = 'format';
    } else {
      this.authAlert.password = null;
      this.authInfo.password = password;
    }
  }

  /**
   * 確認簡訊驗證碼是否有值
   * @param e {MouseEvent}
   * @author kidin-1101111
   */
  checkSMS(e: MouseEvent) {
    this.uiFlag.focusInput = false;
    const sms = (e as any).target.value;
    if (sms.length === 0) {
      this.authAlert.sms = 'empty';
    } else {
      this.authAlert.sms = null;
      this.authInfo.sms = sms;
    }
  }

  /**
   * 確認是否按下enter鍵
   * @param e {KeyboardEvent}
   * @param currentInput {AuthInput}
   * @author kidin-1101206
   */
  checkEnter(e: KeyboardEvent, currentInput: AuthInput) {
    const { keyCode } = e as any;
    const isEnter = keyCode === KeyCode.enter;
    if (isEnter) {
      this.handleNextStep(currentInput);
      return true;
    } else {
      return false;
    }
  }

  /**
   * 顯示完整密碼與否
   * @author kidin-1101203
   */
  showPassword() {
    this.uiFlag.showPassword = !this.uiFlag.showPassword;
  }

  /**
   * 登入
   * @author kidin-1101111
   */
  login() {
    const { progress } = this.uiFlag;
    if (progress === 100) {
      this.uiFlag.progress = 30;
      combineLatest([
        this.auth.accountLogin(this.authInfo),
        this.translate.get('hellow world'), // 確保翻譯載入完成
      ]).subscribe((result) => {
        const loginResult = result[0];
        if (this.apiCommonService.checkRes(loginResult, false)) {
          this.handleLoginSuccess(loginResult.signIn.token);
        } else {
          this.handleLoginError(loginResult);
        }

        this.uiFlag.progress = 100;
      });
    }
  }

  /**
   * 處理登入成功後續流程
   * @param token {any}-登入權杖
   * @author kidin-1101206
   */
  handleLoginSuccess(token: any) {
    this.token = token;
    this.auth.setToken(token);
    this.auth.tokenLogin();
    this.closeAuthBox();
    const msg = this.translate.instant('universal_userAccount_signSuceesfully');
    this.snackbar.open(msg, 'OK', { duration: 3000 });
  }

  /**
   * 處理登入失敗
   * @param error {any}-api v2-1003 result
   * @author kidin-1101203
   */
  handleLoginError(error: any) {
    const { processResult } = error;
    if (processResult) {
      const { apiReturnCode } = processResult;
      const accountPasswordError = [2096, 2097, 2098];
      if (accountPasswordError.includes(apiReturnCode)) {
        this.authAlert.account = 'mistake';
      } else {
        this.hintDialogService.showSnackBar(errorMessage);
      }
    } else {
      this.hintDialogService.showSnackBar(errorMessage);
    }
  }

  /**
   * 取得使用者ip位址
   * @author kidin-1090521
   */
  getClientIpaddress() {
    const { ip } = this.userLocation;
    if (ip) {
      return of(this.userLocation);
    } else {
      return this.getClientIp.requestIpAddress().pipe(
        tap((res) => {
          const { ip, country: countryCode } = res as any;
          this.userLocation = { ip, countryCode };
        })
      );
    }
  }

  /**
   * 註冊
   * @author kidin-1101203
   */
  register() {
    const { progress } = this.uiFlag;
    if (progress === 100) {
      if (this.captchaImg) {
        this.handleCaptchaUnlock(UnlockFlow.sendUnlockCode, null, 'register');
      } else {
        this.uiFlag.progress = 30;
        const { signInType: registerType, nickname: name } = this.authInfo;
        let body = deepCopy(this.authInfo);
        delete body.signInType;
        delete body.nickname;
        body = {
          registerType,
          name,
          fromType: 1,
          fromId: AlaApp.gptfit,
          ...body,
        };

        this.getClientIpaddress()
          .pipe(
            switchMap((ipResult: any) => {
              const { ip, countryCode } = ipResult;
              if (ip) {
                this.requestHeader = {
                  remoteAddr: ip,
                  regionCode: countryCode || 'US',
                };

                return combineLatest([
                  this.api10xxService.fetchRegister(body, this.requestHeader),
                  this.translate.get('hellow world'), // 確保翻譯載入完成
                ]);
              } else {
                this.hintDialogService.showSnackBar(errorMessage);
                return of(false);
              }
            })
          )
          .subscribe((result) => {
            const registerResult = result[0];
            if (this.apiCommonService.checkRes(registerResult, false)) {
              this.handleRegisterSuccess(registerResult);
            } else {
              this.handleRegisterError(registerResult);
            }

            this.uiFlag.progress = 100;
          });
      }
    }
  }

  /**
   * 處理註冊成功後續流程
   * @param successResult {any}-成功結果
   * @author kidin-1101206
   */
  handleRegisterSuccess(successResult: any) {
    const {
      register: { token },
    } = successResult;
    this.token = token;
    this.handleLoginFollowUp(token);
    this.closeAuthBox();
    const signUpTranslation = this.translate.instant('universal_userAccount_signUp');
    const successTranslation = this.translate.instant('universal_status_success');
    const msg = `${signUpTranslation} ${successTranslation}`;
    this.snackbar.open(msg, 'OK', { duration: 3000 });
  }

  /**
   * 處理註冊失敗
   * @param error {any}-註冊失敗結果
   * @author kidin-1101206
   */
  handleRegisterError(error: any) {
    const { processResult } = error;
    if (processResult) {
      const { imgLockCode, apiReturnCode, apiReturnMessage } = processResult;
      if (imgLockCode) {
        this.handleCaptchaUnlock(UnlockFlow.requestUnlockImage, imgLockCode);
      } else {
        const accountRepeat =
          apiReturnCode === 2046 || apiReturnMessage === 'Register account is existing.';
        const nicknameRepeat =
          apiReturnCode === 2047 || apiReturnMessage === 'Register name is existing.';
        if (accountRepeat) this.authAlert.account = 'repeat';
        if (nicknameRepeat) this.authAlert.nickname = 'repeat';
      }
    } else {
      this.hintDialogService.showSnackBar(errorMessage);
    }
  }

  /**
   * 儲存token並取得user profile
   * @param token {string}
   * @author kidin-1101206
   */
  handleLoginFollowUp(token: string) {
    this.auth.setToken(token);
    this.auth.tokenLogin();
  }

  /**
   * 送出認證email或簡訊
   * @author kidin-1101203
   */
  sendVerify() {
    const { progress } = this.uiFlag;
    if (progress === 100) {
      if (this.captchaImg) {
        this.handleCaptchaUnlock(UnlockFlow.sendUnlockCode, null, 'sendVerify');
      } else {
        this.uiFlag.progress = 30;
        const flow = ResetPasswordFlow.request;
        const { signInType: accountType } = this.authInfo;
        combineLatest([
          this.fetchForgetPwd(flow, accountType),
          this.translate.get('hellow world'), // 確保翻譯載入完成
        ]).subscribe((result) => {
          const requestResult = result[0];
          if (this.apiCommonService.checkRes(requestResult, false)) {
            if (accountType === SignInType.email) {
              this.uiFlag.authBox = 'sendVerifySuccess';
            } else {
              this.reciprocal();
              const msg = this.translate.instant('universal_userAccount_sendSmsSuccess');
              this.hintDialogService.showSnackBar(msg);
            }
          } else {
            this.handleSendVerifyError(requestResult);
          }

          this.uiFlag.progress = 100;
        });
      }
    }
  }

  /**
   * 處理寄送認證失敗
   * @param error {any}-失敗結果
   * @author kidin-1101206
   */
  handleSendVerifyError(error: any) {
    const { processResult } = error;
    if (processResult) {
      const { imgLockCode } = processResult;
      if (imgLockCode) {
        this.handleCaptchaUnlock(UnlockFlow.requestUnlockImage, imgLockCode);
      } else {
        this.hintDialogService.showSnackBar(errorMessage);
      }
    } else {
      this.hintDialogService.showSnackBar(errorMessage);
    }
  }

  /**
   * 驗證手機簡訊驗證碼
   * @author kidin-1101206
   */
  submitVerify() {
    const { sms } = this.authInfo;
    const { progress } = this.uiFlag;
    if (progress === 100) {
      if (this.captchaImg) {
        this.handleCaptchaUnlock(UnlockFlow.sendUnlockCode, null, 'submitVerify');
      } else {
        if (sms.length === 0) {
          this.authAlert.sms = 'empty';
        } else {
          this.uiFlag.progress = 30;
          const flow = ResetPasswordFlow.verify;
          const accountType = SignInType.phone;
          combineLatest([
            this.fetchForgetPwd(flow, accountType),
            this.translate.get('hellow world'), // 確保翻譯載入完成
          ]).subscribe((result) => {
            const verifyResult = result[0];
            if (this.apiCommonService.checkRes(verifyResult)) {
              this.uiFlag.authBox = 'resetPassword';
            } else {
              this.handleSubmitVerifyError(verifyResult);
            }

            this.uiFlag.progress = 100;
          });
        }
      }
    }
  }

  /**
   * 處理簡訊驗證碼驗證失敗
   * @param error {any}-失敗結果
   * @author kidin-1101206
   */
  handleSubmitVerifyError(error: any) {
    const { processResult } = error;
    if (processResult) {
      const { apiReturnMessage, imgLockCode } = processResult;
      if (imgLockCode) {
        this.handleCaptchaUnlock(UnlockFlow.requestUnlockImage, imgLockCode);
      } else {
        switch (apiReturnMessage) {
          case 'SMS Code error.':
          case 'Get phone and sms infomation is not enough.':
            this.authAlert.sms = 'mistake';
            break;
          case 'Post fail, account is not existing.':
            this.authAlert.sms = 'notExist';
            break;
          default:
            this.hintDialogService.showSnackBar(errorMessage);
            break;
        }
      }
    } else {
      this.hintDialogService.showSnackBar(errorMessage);
    }
  }

  /**
   * 重設密碼
   * @author kidin-1101203
   */
  resetPassword() {
    const { progress } = this.uiFlag;
    if (progress === 100) {
      this.uiFlag.progress = 30;
      combineLatest([
        this.fetchForgetPwd(ResetPasswordFlow.reset, SignInType.phone),
        this.translate.get('hellow world'), // 確保翻譯載入完成
      ]).subscribe((result) => {
        const resetResult = result[0];
        if (this.apiCommonService.checkRes(resetResult, false)) {
          this.handleResetPwdSuccess(resetResult);
        } else {
          this.hintDialogService.showSnackBar(errorMessage);
        }

        this.uiFlag.progress = 100;
      });
    }
  }

  /**
   * 處理忘記密碼並重設成功之後續流程
   * @param successResult {any}-成功結果
   * @author kidin-1101206
   */
  handleResetPwdSuccess(successResult: any) {
    const { newToken } = successResult.resetPassword;
    this.token = newToken;
    this.handleLoginFollowUp(newToken);
    this.closeAuthBox();
    const resetTranslation = this.translate.instant('universal_operating_reset');
    const successTranslation = this.translate.instant('universal_status_success');
    const msg = `${resetTranslation} ${successTranslation}`;
    this.snackbar.open(msg, 'OK', { duration: 3000 });
  }

  /**
   * 使用api v2-1004進行忘記密碼流程
   * @param flow {ResetPasswordFlow}-目前重設密碼進行之步驟
   * @param accountType {SignInType}-帳號類別
   * @author kidin-1101206
   */
  fetchForgetPwd(flow: ResetPasswordFlow, accountType: SignInType) {
    const {
      email,
      countryCode,
      mobileNumber,
      sms: verificationCode,
      password: newPassword,
    } = this.authInfo;
    let body = <any>{
      resetPasswordFlow: flow,
      accountType: accountType,
      project: AlaApp.gptfit,
    };

    if (accountType === SignInType.email) {
      body = { email, ...body };
    } else {
      body = { countryCode, mobileNumber, ...body };
    }

    const flowAfterRequest = flow >= ResetPasswordFlow.verify;
    const isPhoneAccount = accountType === SignInType.phone;
    const isResetPwdFlow = flow === ResetPasswordFlow.reset;
    if (flowAfterRequest) body = { verificationCode, ...body };

    // email重設密碼暫仍導回gptfit原頁面進行
    if (isPhoneAccount && isResetPwdFlow) body = { newPassword, ...body };

    return this.getClientIpaddress().pipe(
      switchMap((ipResult: any) => {
        const { ip } = ipResult;
        if (ip) {
          this.requestHeader = { remoteAddr: ip };
          return this.api10xxService.fetchForgetpwd(body, this.requestHeader);
        } else {
          return of(false);
        }
      })
    );
  }

  /**
   * 確認暱稱是否重複
   * @param nickname {string}-暱稱
   * @author kidin-1101203
   */
  checkNickname(nickname: string) {
    const args = { nickname };
    const target = ['nickname'];
    const { token } = this.auth;
    if (!token) {
      this.checkRepeat(args, target).subscribe((res) => {
        if (this.apiCommonService.checkRes(res)) {
          const { nickname } = res.result[0] ?? {};
          this.authAlert.nickname = nickname ? 'repeat' : null;
        }
      });
    }
  }

  /**
   * 確認是否填寫圖形驗證碼欄位
   * @param e {MouseEvent | Event}
   * @author kidin-1101207
   */
  checkImgCaptcha(e: MouseEvent | Event) {
    this.uiFlag.focusInput = false;
    const { value } = (e as any).target;
    if (value.length === 0) {
      this.authAlert.captcha = 'empty';
    } else {
      this.imgCaptcha.unlockKey = value;
      this.authAlert.captcha = null;
    }
  }

  /**
   * 根據確認指定資訊是否重複
   * @param args {any}-查詢條件
   * @param target {Array<string>}-欲取得之目標資訊
   * @author kidin-1101112
   */
  checkRepeat(args: any, target: Array<string>) {
    const body = {
      search: {
        userInfo: {
          args,
          target,
        },
      },
    };

    return this.nodejsApiService.getAssignInfo(body);
  }

  /**
   * 登出
   * @author kidin-1101202
   */
  logout() {
    this.token = undefined;
    this.userInfo = undefined;
    this.auth.logout();
    this.stopPollingNewMail();
  }

  /**
   * 當使用者按下enter時，進行下一步
   * @param input {AuthInput}-目前所在欄位
   * @author kidin-1090817
   */
  handleNextStep(input: AuthInput) {
    const { authBox } = this.uiFlag;
    const totalInput = <Array<AuthInput>>['accountInput', 'passwordInput', 'nicknameInput'];
    let inputOrder: Array<AuthInput>;
    switch (authBox) {
      case 'login':
        inputOrder = ['accountInput', 'passwordInput'];
        break;
      case 'register':
        inputOrder = ['accountInput', 'passwordInput', 'nicknameInput'];
        break;
      case 'forgetPassword': {
        const { signInType } = this.authInfo;
        inputOrder =
          signInType === SignInType.phone ? ['accountInput', 'smsInput'] : ['accountInput'];
        break;
      }
    }

    const finalStep = inputOrder.length - 1;
    const currentStep = inputOrder.indexOf(input);

    if (currentStep === finalStep) {
      this[input].nativeElement.blur();
      this.submit();
    } else {
      const nextStep = currentStep + 1;
      const nextFocusInput = totalInput[nextStep];
      this[nextFocusInput].nativeElement.focus();
    }
  }

  /**
   * 送出表單
   * @author kidin-1101203
   */
  submit() {
    const { authBox } = this.uiFlag;
    const alertElement = document.querySelector('[data-pass=false]');
    const checkEmptyPass = this.checkAuthInfo();
    this.uiFlag.clickSubmit = true;
    const passCheck = !alertElement && checkEmptyPass;
    switch (authBox) {
      case 'login': {
        const { account: accountAlert } = this.authAlert;
        if (passCheck || accountAlert === 'mistake') this.login();
        break;
      }
      case 'register': {
        if (passCheck && this.agreeDeclaration) this.register();
        break;
      }
      case 'forgetPassword': {
        const { signInType } = this.authInfo;
        if (passCheck || this.captchaImg) {
          signInType === SignInType.phone ? this.submitVerify() : this.sendVerify();
        }

        break;
      }
      case 'resetPassword':
        if (passCheck) this.resetPassword();
        break;
      default:
        this.uiFlag.authBox = null;
        break;
    }
  }

  /**
   * 確認表單是否含空值
   * @author kidin-1101216
   */
  checkAuthInfo() {
    const {
      uiFlag: { authBox },
      authInfo,
    } = this;
    const havePhone = authInfo.countryCode && authInfo.mobileNumber ? true : false;
    const haveEmail = authInfo.email ? true : false;
    const havePassword = authInfo.password ? true : false;
    const haveNickname = authInfo.nickname ? true : false;
    switch (authBox) {
      case 'login':
        return (havePhone || haveEmail) && havePassword;
      case 'register':
        return (havePhone || haveEmail) && havePassword && haveNickname;
      case 'forgetPassword':
        return havePhone || haveEmail;
      case 'resetPassword':
        return havePassword;
    }
  }

  /**
   * 儲存國碼方便使用者下次登入自動帶入
   * @param countryCode {number}-國碼
   * @author kidin-1101206
   */
  storageCountryCode(countryCode: number) {
    setLocalStorageObject('countryCode', countryCode);
  }

  /**
   * 確認是否過於頻繁開啟qrcode頁面
   * @author kidin-1101206
   */
  checkFrequency() {
    const timeStampCount = getLocalStorageObject('count');
    const currentTimeStamp = getCurrentTimestamp('ms');
    if (!timeStampCount) {
      // 字串由timestamp+次數所組成
      setLocalStorageObject('count', `${currentTimeStamp}1`);
      return true;
    } else {
      const timeStamp = +timeStampCount.slice(0, timeStampCount.length - 1);
      const count = +timeStampCount.slice(timeStampCount.length - 1, timeStampCount.length);
      const minute = 60 * 1000;
      if (currentTimeStamp - timeStamp >= 3 * minute) {
        setLocalStorageObject('count', `${currentTimeStamp}1`);
        return true; // 超過三分鐘解瑣
      } else if (count > 4) {
        return false; // 操作超過四次則上鎖
      } else {
        setLocalStorageObject('count', `${timeStamp} ${count + 1}`);
        return true;
      }
    }
  }

  /**
   * 創建qrcode並發送guid給server進行長輪詢
   * @author kidin-1101206
   */
  createLoginQrcode() {
    const guid = this.createGuid();
    const pathName = `${location.origin}/${appPath.portal.signInQrcode}`;
    const query = `?${QueryString.qrSignInFlow}=1&${QueryString.guid}=${guid}`;
    this.qrLoginUrl = pathName + query;
    return guid;
  }

  /**
   * 等待B裝置掃描qrcode進行登入
   * @param guid {string}-由timestamp和亂數產生之guid
   * @author kidin-1101206
   */
  waitQrcodeLogin(guid: string) {
    const firstFlowBody = { qrSignInFlow: QrSignInFlow.submitGuid, guid };
    this.getClientIpaddress()
      .pipe(
        switchMap((ipResult: any) => {
          const { ip } = ipResult;
          if (ip) {
            this.requestHeader = { remoteAddr: ip };
            return this.api10xxService.fetchQrcodeLogin(firstFlowBody, this.requestHeader).pipe(
              switchMap((firstFlowResult) => {
                if (this.apiCommonService.checkRes(firstFlowResult)) {
                  const secondFlowBody = { qrSignInFlow: QrSignInFlow.longPolling, guid };
                  return this.api10xxService.fetchQrcodeLogin(secondFlowBody, this.requestHeader);
                } else {
                  return of(firstFlowResult);
                }
              })
            );
          } else {
            this.hintDialogService.showSnackBar(errorMessage);
            return of(false);
          }
        })
      )
      .subscribe((res: any) => {
        const { processResult, qrSignIn } = res;
        if (this.apiCommonService.checkRes(res, false)) {
          this.handleLoginSuccess(qrSignIn.token);
        } else {
          const { apiReturnCode } = processResult;
          switch (apiReturnCode) {
            case 2104:
              this.authAlert.qrLogin = 'overdue';
              break;
            default:
              this.snackbar.open(errorMessage, 'OK', { duration: 3000 });
              break;
          }
        }
      });
  }

  /**
   * 使用亂數與現在時間組合成guid
   * @author kidin-1101206
   */
  createGuid() {
    const currentTimeStamp = getCurrentTimestamp('ms');
    const hexadecimalTimeStamp = currentTimeStamp.toString(16);
    let guid = '';
    for (let i = 0; i < 32 - hexadecimalTimeStamp.length; i++) {
      guid += Math.floor(Math.random() * 16).toString(16);
    }

    guid += hexadecimalTimeStamp;
    return `${guid.slice(0, 8)}-${guid.slice(8, 12)}-${guid.slice(12, 16)}-${guid.slice(
      16,
      20
    )}-${guid.slice(20, 32)}`;
  }

  /**
   * 解瑣圖碼
   * @param unlockFlow {UnlockFlow}-圖碼解鎖步驟
   * @param imgLockCode {string}-imgLockCode
   * @param callback {any}-callback function
   * @author kidin-1101206
   */
  handleCaptchaUnlock(unlockFlow: UnlockFlow, imgLockCode: string = null, callback: any = null) {
    this.imgCaptcha.unlockFlow = unlockFlow;
    if (unlockFlow === UnlockFlow.requestUnlockImage) {
      this.imgCaptcha = { imgLockCode, ...this.imgCaptcha };
    } else if (!this.imgCaptcha.unlockKey) {
      this.authAlert.captcha = 'mistake';
      return false;
    }

    this.getClientIpaddress()
      .pipe(
        switchMap((ipResult: any) => {
          const { ip } = ipResult;
          if (ip) {
            this.requestHeader = { remoteAddr: ip };
            return this.api10xxService.fetchCaptcha(this.imgCaptcha, this.requestHeader);
          } else {
            return of(false);
          }
        })
      )
      .subscribe((res: any) => {
        if (this.apiCommonService.checkRes(res, false)) {
          switch (unlockFlow) {
            case UnlockFlow.requestUnlockImage:
              this.captchaImg = res.captcha.randomCodeImg;
              break;
            case UnlockFlow.sendUnlockCode:
              this.initCaptcha();
              this[callback]();
              break;
          }
        } else {
          const { processResult } = res;
          if (processResult) {
            const { apiReturnMessage } = processResult;
            switch (apiReturnMessage) {
              case "Post fail, found parameter 'unlockKey' error.":
              case 'Found a wrong unlock key.':
                this.authAlert.captcha = 'mistake';
                break;
              default:
                this.hintDialogService.showSnackBar(errorMessage);
                break;
            }
          } else {
            this.hintDialogService.showSnackBar(errorMessage);
          }
        }
      });
  }

  /**
   * 倒數計時避免濫用認證簡訊
   * @author kidin-1101206
   */
  reciprocal() {
    this.intervals = setInterval(() => {
      this.timeCount--;
      if (this.timeCount === 0) {
        this.timeCount = 30;
        window.clearInterval(this.intervals);
      }
    }, 1000);
  }

  /**
   * 將圖碼相關變數初始化
   * @author kidin-1101230
   */
  initCaptcha() {
    this.imgCaptcha = {
      unlockFlow: null,
    };

    this.captchaImg = null;
  }

  /**
   * 聚焦輸入框
   * @author kidin-1101216
   */
  focusInput() {
    this.uiFlag.focusInput = true;
  }

  /**
   * 根據所在頁面搜尋活動
   * @param page 所在頁面
   */
  searchActivity(page: string) {
    const { activityKeyword } = this;
    const query = `?${QueryString.search}=${activityKeyword}`;
    switch (page) {
      case officialActivity.myActivity:
        this.router.navigateByUrl(
          `/${officialActivity.home}/${officialActivity.myActivity}${query}`
        );
        break;
      default:
        this.router.navigateByUrl(
          `/${officialActivity.home}/${officialActivity.activityList}${query}`
        );
        break;
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
    this.checkNewMail();
    if (this.auth.token && !this.mailNotify) {
      this.mailNotify = setInterval(() => {
        this.checkNewMail();
      }, 30000);
    }
  }

  /**
   * 取消確認是否有新郵件
   */
  stopPollingNewMail() {
    if (this.mailNotify) clearInterval(this.mailNotify);
  }

  /**
   * 確認是否有無最新信件
   */
  checkNewMail() {
    const { token } = this.auth;
    if (token) {
      this.api50xxService.fetchMessageNotifyFlagStatus({ token }).subscribe((res) => {
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
      });
    }
  }

  /**
   * 轉導至收件匣
   * @param e {MouseEvent}
   */
  navigateInbox(e: MouseEvent) {
    e.preventDefault();
    const {
      dashboard,
      stationMail: { home: stationMailHome, inbox },
    } = appPath;
    this.router.navigateByUrl(`/${dashboard.home}/${stationMailHome}/${inbox}`);
  }

  /**
   * 轉導至建立新訊息頁面
   */
  navigateNewMailPage() {
    const {
      dashboard,
      stationMail: { home: stationMailHome, newMail },
    } = appPath;
    this.router.navigateByUrl(`/${dashboard.home}/${stationMailHome}/${newMail}`);
  }

  /**
   * 解除rxjs訂閱和計時器
   */
  ngOnDestroy() {
    if (this.intervals) clearInterval(this.intervals);
    this.stopPollingNewMail();
    this.stopCarousel();
    this.ngUnsubscribe.next(null);
    this.ngUnsubscribe.complete();
  }
}
