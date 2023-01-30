import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { AppCode } from '../../../models/app-webview';
import { Router } from '@angular/router';
import dayjs from 'dayjs';
import {
  AuthService,
  Api10xxService,
  Api11xxService,
  GlobalEventsService,
  HintDialogService,
  ApiCommonService,
} from '../../../../../core/services';
import { Subject, Subscription, fromEvent } from 'rxjs';
import { takeUntil, switchMap, map } from 'rxjs/operators';
import { TranslateService } from '@ngx-translate/core';
import { AccountTypeEnum } from '../../../../../shared/enum/account';
import { TFTViewMinWidth } from '../../../models/app-webview';
import { headerKeyTranslate, getUrlQueryStrings } from '../../../../../core/utils';

enum DestroyFlow {
  search = 1,
  apply,
  verify,
  cancel,
}

enum DestroyStatus {
  notApplied,
  verifying,
  destroying,
}

@Component({
  selector: 'app-app-destroy-account',
  templateUrl: './app-destroy-account.component.html',
  styleUrls: ['./app-destroy-account.component.scss'],
})
export class AppDestroyAccountComponent implements OnInit, AfterViewInit, OnDestroy {
  private ngUnsubscribe = new Subject();

  private resizeSubscription = new Subscription();

  // ui用到的各種flag
  uiFlag = {
    progress: 100,
    isAnyGroupAdmin: false,
    cancelDestroy: false,
    sendPhoneCaptcha: false,
    Countdown: false,
    verifyCodeError: false,
  };

  appSys: AppCode = 0;
  token: string;
  user: any;
  verifyCode = '';
  timeCount = 30;
  deleteApplySuccessText = '';
  mobileSize = window.innerWidth < TFTViewMinWidth;
  requestHeader = {};

  /**
   * 儲存api 1013相關資訊
   */
  destroyResp = {
    status: DestroyStatus.notApplied,
    destroyTimestamp: null,
  };

  checkBox = {
    compressed: false,
    adminGiveUp: false,
  };

  readonly AccountTypeEnum = AccountTypeEnum;
  readonly DestroyFlow = DestroyFlow;
  readonly DestroyStatus = DestroyStatus;
  constructor(
    private router: Router,
    private api10xxService: Api10xxService,
    private api11xxService: Api11xxService,
    private translate: TranslateService,
    private auth: AuthService,
    private globalEventsService: GlobalEventsService,
    private hintDialogService: HintDialogService,
    private apiCommonService: ApiCommonService
  ) {}

  ngOnInit(): void {
    this.getQueryString();
    this.subscribeResizeEvent();
  }

  /**
   * 因應ios嵌入webkit物件時間點較後面，故在此生命週期才判斷裝置平台
   * @author kidin-1090710
   */
  ngAfterViewInit() {
    this.getDeviceSys();
    this.getUserToken();
  }

  /**
   * 從url取得header
   * @author kidin-1110114
   */
  getQueryString() {
    const query = getUrlQueryStrings(location.search);
    this.requestHeader = {
      ...this.requestHeader,
      ...headerKeyTranslate(query),
    };
  }

  /**
   * 訂閱頁面尺寸改變事件
   * @author kidin-1101230
   */
  subscribeResizeEvent() {
    const resizeEvent = fromEvent(window, 'resize');
    this.resizeSubscription = resizeEvent.pipe(takeUntil(this.ngUnsubscribe)).subscribe((e) => {
      this.mobileSize = window.innerWidth < TFTViewMinWidth;
    });
  }

  /**
   * 取得裝置平台
   * @author kidin-1091216
   */
  getDeviceSys() {
    this.setPageStyle(true);
    if ((window as any).webkit) {
      this.appSys = 1;
    } else if ((window as any).android) {
      this.appSys = 2;
    } else {
      this.appSys = 0;
    }

    this.requestHeader = {
      deviceType: this.appSys,
      ...this.requestHeader,
    };
  }

  /**
   * 根據裝置設定頁面樣式
   * @param isPcView {boolean}-是否非行動裝置或TFT
   * @author kidin-1110113
   */
  setPageStyle(isPcView: boolean) {
    this.globalEventsService.setHideNavbarStatus(isPcView);
    this.globalEventsService.setDarkModeStatus(isPcView);
  }

  /**
   * 取得使用者的token
   * @author kidin-1091217
   */
  getUserToken() {
    if (this.appSys === 0) {
      this.token = this.auth.token;
    } else {
      const { search } = location;
      const { tk } = getUrlQueryStrings(search);
      this.token = tk ? tk : '';
    }

    if (this.token.length === 0) {
      this.auth.backUrl = location.href;
      this.router.navigateByUrl('/signIn');
    } else {
      this.getUserProfile();
      this.checkQueryString();
    }
  }

  /**
   * 確認是否為驗證信link轉導過來進行驗證流程
   * @author kidin-1091223
   */
  checkQueryString() {
    const { vc } = getUrlQueryStrings(location.search);
    if (vc) {
      this.checkBox.compressed = true;
      this.verifyIdentidy(vc);
    } else {
      this.checkDestroyStatus();
    }
  }

  /**
   * 取得使用者userProfile
   * @author kidin-1091223
   */
  getUserProfile() {
    this.uiFlag.progress = 30;
    this.api10xxService.fetchGetUserProfile({ token: this.token }).subscribe((res) => {
      const { signIn, userProfile } = res as any;
      if (this.apiCommonService.checkRes(res)) {
        const { accountType } = signIn;
        this.user = {
          accountType,
          ...userProfile,
        };
      }

      this.uiFlag.progress = 100;
    });
  }

  /**
   * 確認刪除帳號狀態
   * @author kidin-1091223
   */
  checkDestroyStatus() {
    if (this.token.length === 0) {
      this.turnBack();
    } else {
      const body = {
        token: this.token,
        flow: 1,
      };

      this.uiFlag.progress = 30;
      this.api10xxService.fetchDestroyAccount(body, this.requestHeader).subscribe((res) => {
        const { status, destroyTimestamp } = res as any;
        if (this.apiCommonService.checkRes(res)) {
          this.destroyResp.status = status;
          if (status === DestroyStatus.notApplied) {
            this.checkoutIsGroupAdmin();
          } else if (status === DestroyStatus.destroying) {
            this.destroyResp.destroyTimestamp = destroyTimestamp;
            const destroyDate = dayjs(destroyTimestamp * 1000).format('YYYY-MM-DD'),
              destroyTime = dayjs(destroyTimestamp * 1000).format('HH:mm');
            this.getTranslate(destroyDate, destroyTime);
          }
        }

        this.uiFlag.progress = 100;
      });
    }
  }

  /**
   * 確認是否有任何群組管理員的身份，若無才可刪除帳號
   * @author kidin-1091223
   */
  checkoutIsGroupAdmin() {
    this.uiFlag.progress = 30;
    this.api11xxService
      .fetchMemberAccessRight({ token: this.token })
      .pipe(
        switchMap((response) => this.translate.get('hellow world').pipe(map((resp) => response))),
        takeUntil(this.ngUnsubscribe)
      )
      .subscribe((res) => {
        const { info } = res as any;
        if (this.apiCommonService.checkRes(res)) {
          if (info.groupAccessRight.some((_list) => +_list.accessRight < 90)) {
            this.uiFlag.isAnyGroupAdmin = true;
          }
        }

        this.uiFlag.progress = 100;
      });
  }

  /**
   * 申請撤銷帳號
   * @author kidin-1091223
   */
  applyDestroy() {
    const body = {
      token: this.token,
      flow: DestroyFlow.apply,
    };

    this.uiFlag.progress = 30;
    this.api10xxService
      .fetchDestroyAccount(body, this.requestHeader)
      .pipe(
        switchMap((response) => this.translate.get('hellow world').pipe(map((resp) => response))),
        takeUntil(this.ngUnsubscribe)
      )
      .subscribe((res) => {
        const { status } = res as any;
        if (this.apiCommonService.checkRes(res)) {
          this.destroyResp.status = status;
          if (this.user.accountType === AccountTypeEnum.phone) {
            const msg = this.translate.instant('universal_userAccount_sendSmsSuccess');
            this.hintDialogService.showSnackBar(msg);
            this.countDown();
          } else {
            const msg = this.translate.instant('universal_userAccount_sendCaptchaChackEmail');
            this.hintDialogService.showSnackBar(msg);
          }
        }

        this.uiFlag.progress = 100;
      });
  }

  /**
   * 點擊帳號驗證
   * @author kidin-1091228
   */
  submitVerifyCode() {
    this.verifyIdentidy(this.verifyCode);
  }

  /**
   * 驗證帳號
   * @param code {string}-驗證碼
   * @author kidin-1091223
   */
  verifyIdentidy(code: string) {
    const body = {
      token: this.token,
      flow: DestroyFlow.verify,
      verificationCode: code,
    };

    this.uiFlag.progress = 30;
    this.api10xxService
      .fetchDestroyAccount(body, this.requestHeader)
      .pipe(
        switchMap((response) => this.translate.get('hellow world').pipe(map((resp) => response))),
        takeUntil(this.ngUnsubscribe)
      )
      .subscribe((res) => {
        const { processResult, info, resultCode: resCode, status, destroyTimestamp } = res as any;
        if (
          !processResult &&
          info.rtnMsg.indexOf('Exception: invalid literal for int() with base 10:') > -1
        ) {
          this.uiFlag.verifyCodeError = true;
        } else if (!processResult && resCode === 400) {
          const msg = 'Error! Please try again later.';
          this.hintDialogService.showSnackBar(msg);
        } else if (processResult.resultCode !== 200) {
          this.checkoutIsGroupAdmin();
          this.checkBox.compressed = false;
          const { apiReturnMessage } = processResult;
          if (apiReturnMessage === 'Destroy me fail, code was verified.') {
            const msg = this.translate.instant('universal_userAccount_linkHasExpired');
            this.hintDialogService.showSnackBar(msg);
          } else if (apiReturnMessage === 'Destroy me fail, found verification code error.') {
            const msg = this.translate.instant('universal_userAccount_errorCaptcha');
            this.uiFlag.verifyCodeError = true;
            this.hintDialogService.showSnackBar(msg);
          } else {
            this.checkDestroyStatus();
          }
        } else {
          this.uiFlag.verifyCodeError = false;
          this.destroyResp = {
            status,
            destroyTimestamp,
          };

          const destroyDate = dayjs(destroyTimestamp * 1000).format('YYYY-MM-DD'),
            destroyTime = dayjs(destroyTimestamp * 1000).format('HH:mm');
          this.getTranslate(destroyDate, destroyTime);
        }

        this.uiFlag.progress = 100;
      });
  }

  /**
   * 取消銷毀帳號
   * @author kidin-1091223
   */
  cancelDestroy() {
    const body = {
      token: this.token,
      flow: DestroyFlow.cancel,
    };

    this.uiFlag.progress = 30;
    this.api10xxService.fetchDestroyAccount(body, this.requestHeader).subscribe((res) => {
      this.uiFlag.progress = 100;
      if (this.apiCommonService.checkRes(res)) {
        this.destroyResp.status = DestroyStatus.notApplied;
        this.uiFlag.cancelDestroy = true;
      }
    });
  }

  /**
   * 回上一頁或返回app
   * @author kidin-1091216
   */
  turnBack() {
    if (this.appSys === 1) {
      (window as any).webkit.messageHandlers.closeWebView.postMessage('Close');
    } else if (this.appSys === 2) {
      (window as any).android.closeWebView('Close');
    } else {
      window.close();
      this.router.navigateByUrl('/dashboard/user-settings'); // 避免頁面無法關閉
    }
  }

  /**
   * 使用者確認資料封存
   */
  handleCheckCompress() {
    this.checkBox.compressed = !this.checkBox.compressed;
  }

  /**
   * 管理員確認繼續刪帳號
   * @author kidin-1110112
   */
  handleAdminGiveUp() {
    this.checkBox.adminGiveUp = !this.checkBox.adminGiveUp;
  }

  /**
   * 儲存使用者輸入的驗證碼
   * @param e {Event}
   * @author kidin-1091224
   */
  handleVerifyCode(e: Event) {
    this.verifyCode = (e as any).target.value;
  }

  // 倒數計時倒數計時並取得server手機驗證碼-kidin-1090519
  countDown() {
    const btnInterval = setInterval(() => {
      this.timeCount--;

      if (this.timeCount === 0) {
        this.uiFlag.Countdown = false;
        this.timeCount = 30;

        // 設any處理typescript報錯：Argument of type 'Timer' is not assignable to parameter of type 'number'-kidin-1090515
        window.clearInterval(btnInterval as any);
      }
    }, 1000);
  }

  /**
   * 待多國語系套件載完後再取得翻譯
   * @param date {string}-刪除帳號的日期
   * @param time {string}-刪除帳號的時間
   * @author kidin-1091228
   */
  getTranslate(date: string, time: string) {
    this.translate
      .get('hellow world')
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe(() => {
        this.deleteApplySuccessText = `${this.translate.instant(
          'universal_userAccount_successfullyRequestedToDeleteAccount',
          {
            'yyyy-mm-dd': `<span class="date__time__warn">${date}</span>`,
            'HH:MM': `<span class="date__time__warn">${time}</span>`,
          }
        )}`;
      });
  }

  /**
   * 取消訂閱rxjs
   * @author kidin-1091223
   */
  ngOnDestroy() {
    this.setPageStyle(false);
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }
}
