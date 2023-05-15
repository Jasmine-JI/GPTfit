import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import {
  Api10xxService,
  AuthService,
  UserService,
  GetClientIpService,
  GlobalEventsService,
  HintDialogService,
  ApiCommonService,
  NetworkService,
} from '../../../../../core/services';
import { MessageBoxComponent } from '../../../../../shared/components/message-box/message-box.component';
import { Subject, fromEvent, Subscription, of } from 'rxjs';
import { takeUntil, tap, switchMap } from 'rxjs/operators';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { AccountTypeEnum } from '../../../../../shared/enum/account';
import { TFTViewMinWidth } from '../../../models/app-webview';
import { headerKeyTranslate, getUrlQueryStrings } from '../../../../../core/utils';

const errorMsg = 'Error!<br /> Please try again later.';
type RedirectPage = 'sign' | 'setting' | 'event';

@Component({
  selector: 'app-app-enable',
  templateUrl: './app-enable.component.html',
  styleUrls: ['./app-enable.component.scss'],
})
export class AppEnableComponent implements OnInit, AfterViewInit, OnDestroy {
  private ngUnsubscribe = new Subject();
  private resizeSubscription = new Subscription();

  progress = 100;
  ip = '';
  pcView = false;

  accountInfo = {
    type: 1, // 1：信箱 2：手機
    account: 'Please wait...',
    id: 0,
  };

  appInfo = {
    sys: 0, // 0: web, 1: ios, 2: android
    token: '',
    project: 0, // 0.webCenter、1.alaConnect、2alaCloudRun、3.alaTrainLive、4.alaFitness
  };

  phoneCaptcha = {
    cue: '',
    value: '',
    placeholder: '',
  };

  logMessage = {
    enable: '',
    success: '',
    confirm: '',
  };

  // 由email連結得到的參數
  emailLinkString = {
    enableAccountFlow: 0,
    userId: 0,
    verificationCode: '',
    project: 0,
  };

  // 惡意攻擊圖碼解鎖
  imgCaptcha = {
    show: false,
    imgCode: '',
    cue: '',
    code: '',
  };

  timeCount = 30;
  mobileSize = window.innerWidth < TFTViewMinWidth;
  sendEmail = false;
  enableSuccess = false;
  requestHeader = {};
  redirectPage: RedirectPage = 'sign';
  readonly AccountTypeEnum = AccountTypeEnum;

  constructor(
    private translate: TranslateService,
    private api10xxService: Api10xxService,
    private dialog: MatDialog,
    private router: Router,
    public getClientIp: GetClientIpService,
    private authService: AuthService,
    private userService: UserService,
    private globalEventsService: GlobalEventsService,
    private hintDialogService: HintDialogService,
    private apiCommonService: ApiCommonService,
    private networkService: NetworkService
  ) {
    translate.onLangChange.pipe(takeUntil(this.ngUnsubscribe)).subscribe(() => {
      this.createPlaceholder();
    });
  }

  ngOnInit() {
    this.createPlaceholder();
    this.subscribeResizeEvent();

    if (location.pathname.indexOf('web') > 0) {
      this.pcView = true;
      this.setPageStyle(false);
    } else {
      this.pcView = false;
      this.setPageStyle(true);
    }

    this.getUrlString(location.search);
    this.getUserInfo();
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
   * 因應ios嵌入webkit物件時間點較後面，故在此生命週期才判斷裝置平台
   * @author kidin-1090710
   */
  ngAfterViewInit() {
    if (this.pcView === false) {
      this.getDeviceSys();
    }
  }

  // 確認ngx translate套件已經載入再產生翻譯-kidin-1090430
  createPlaceholder() {
    this.translate
      .get('hellow world')
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe(() => {
        this.phoneCaptcha.placeholder = this.translate.instant(
          'universal_userAccount_phoneCaptcha'
        );
        this.logMessage = {
          enable: this.translate.instant('universal_deviceSetting_switch'),
          success: this.translate.instant('universal_status_success'),
          confirm: this.translate.instant('universal_operating_confirm'),
        };
      });
  }

  // 取得裝置平台-kidin-1090518
  getDeviceSys() {
    if ((window as any).webkit) {
      this.appInfo.sys = 1;
    } else if ((window as any).android) {
      this.appInfo.sys = 2;
    } else {
      this.appInfo.sys = 0;
    }
  }

  // 取得url query string和token-kidin-1090514
  getUrlString(urlStr) {
    const query = getUrlQueryStrings(urlStr);
    this.requestHeader = {
      ...this.requestHeader,
      ...headerKeyTranslate(query),
    };

    Object.entries(query).forEach(([_key, _value]) => {
      switch (_key) {
        case 'tk':
          this.appInfo.token = _value as string;
          break;
        case 'p':
          this.appInfo.project = +_value;
          this.emailLinkString.project = +_value;
          if (+_value === 0) {
            this.pcView = true;
          }

          break;
        case 'eaf':
          this.emailLinkString.enableAccountFlow = +_value;
          break;
        case 'ui':
          this.emailLinkString.userId = +_value;
          break;
        case 'vc':
          this.emailLinkString.verificationCode = _value as string;
          break;
        case 'ru':
          this.redirectPage = _value as RedirectPage;
          break;
      }
    });

    if (this.appInfo.token === '') {
      this.appInfo.token = this.authService.token;
    }

    if (this.emailLinkString.enableAccountFlow !== 0) {
      this.emailEnable(this.emailLinkString);
    }
  }

  // 使用token取得使用者帳號資訊-kidin-1090514
  getUserInfo() {
    if (this.appInfo.token !== '') {
      const body = {
        token: this.appInfo.token || '',
      };

      this.api10xxService.fetchGetUserProfile(body).subscribe((res) => {
        if (this.apiCommonService.checkRes(res)) {
          const {
            userProfile,
            signIn: { accountType },
          } = res as any;
          if (accountType === AccountTypeEnum.email) {
            this.accountInfo = {
              type: 1,
              account: userProfile.email,
              id: userProfile.userIdk,
            };
          } else {
            this.accountInfo = {
              type: 2,
              account: `+${userProfile.countryCode} ${userProfile.mobileNumber}`,
              id: userProfile.userId,
            };

            this.reciprocal();
          }
        }
      });
    }
  }

  // 取得使用者ip位址-kidin-1090521
  getClientIpaddress() {
    const { remoteAddr } = this.requestHeader as any;
    if (!remoteAddr) {
      return this.getClientIp.requestIpAddress().pipe(
        tap((res) => {
          this.ip = (res as any).ip;
          this.requestHeader = {
            ...this.requestHeader,
            remoteAddr: this.ip,
          };
        })
      );
    } else {
      return of(this.requestHeader);
    }
  }

  // 返回app-kidin-1090513
  turnBack() {
    if (this.appInfo.sys === 1) {
      (window as any).webkit.messageHandlers.closeWebView.postMessage('Close');
    } else if (this.appInfo.sys === 2) {
      (window as any).android.closeWebView('Close');
    } else {
      window.close();
      if (history.length >= 2) {
        // 可能已編輯過帳號，故需重整頁面
        window.onunload = this.refreshParent;
      }

      this.redirect();
    }
  }

  /**
   * 轉導至指定頁面
   * @author kidin-1110218
   */
  redirect() {
    let path: string;
    switch (this.redirectPage) {
      case 'event':
        path = '/official-activity/my-activity';
        break;
      case 'setting':
        path = '/dashboard/user-settings';
        break;
      default:
        path = this.pcView ? '/signIn-web' : '/signIn';
        break;
    }

    this.router.navigateByUrl(path);
  }

  // 倒數計時倒數計時並取得server手機驗證碼-kidin-1090519
  reciprocal() {
    if (this.imgCaptcha.show) {
      this.removeCaptcha('reciprocal');
    } else {
      this.progress = 40;
      const body = {
        enableAccountFlow: 1,
        token: this.appInfo.token,
        project: this.appInfo.project,
      };

      this.getClientIpaddress()
        .pipe(
          switchMap((ipResult) => this.api10xxService.fetchEnableAccount(body, this.requestHeader))
        )
        .subscribe((res: any) => {
          const resultInfo = res.processResult;
          if (resultInfo.resultCode !== 200) {
            switch (resultInfo.apiReturnMessage) {
              case 'Found attack, update status to lock!':
              case 'Found lock!': {
                const captchaBody = {
                  unlockFlow: 1,
                  imgLockCode: res.processResult.imgLockCode,
                };

                this.api10xxService
                  .fetchCaptcha(captchaBody, this.requestHeader)
                  .subscribe((captchaRes) => {
                    this.imgCaptcha = {
                      show: true,
                      imgCode: `data:image/png;base64,${captchaRes.captcha.randomCodeImg}`,
                      cue: '',
                      code: '',
                    };
                  });

                break;
              }
              default:
                this.showMsgBox(errorMsg, 'turnBack');
                console.error(
                  `${res.processResult.resultCode}: ${res.processResult.apiReturnMessage}`
                );
                break;
            }
          } else if (resultInfo.resultCode === 200) {
            this.translate
              .get('hellow world')
              .pipe(takeUntil(this.ngUnsubscribe))
              .subscribe(() => {
                const msg = this.translate.instant('universal_userAccount_sendSmsSuccess');
                this.debounceBack(msg);

                const btnInterval = setInterval(() => {
                  this.timeCount--;

                  if (this.timeCount === 0) {
                    this.timeCount = 30;

                    // 設any處理typescript報錯：Argument of type 'Timer' is not assignable to parameter of type 'number'-kidin-1090515
                    window.clearInterval(btnInterval as any);
                  }
                }, 1000);
              });
          }

          this.progress = 100;
        });
    }
  }

  // 確認手機驗證碼是否符合-kidin-1090515
  checkPhoneCaptcha(e) {
    if ((e.type === 'keypress' && e.code === 'Enter') || e.type === 'focusout') {
      const inputPhoneCaptcha = e.currentTarget.value;
      if (inputPhoneCaptcha.length < 6) {
        this.phoneCaptcha.cue = 'universal_userAccount_errorCaptcha';
      } else {
        this.phoneCaptcha.value = inputPhoneCaptcha;
        this.phoneCaptcha.cue = '';
      }
    }
  }

  // 確認是否填寫圖形驗證碼欄位-kidin-1090514
  checkImgCaptcha(e) {
    if ((e.type === 'keypress' && e.code === 'Enter') || e.type === 'focusout') {
      const inputImgCaptcha = e.currentTarget.value;
      if (inputImgCaptcha.length === 0) {
        this.imgCaptcha.cue = 'universal_userAccount_errorCaptcha';
      } else {
        this.imgCaptcha.code = inputImgCaptcha;
        this.imgCaptcha.cue = '';
      }
    }
  }

  // 進行啟用帳號流程-kidin-1090515
  submit() {
    const online = this.networkService.checkNetworkStatus();
    if (online) {
      if (this.imgCaptcha.show) {
        this.removeCaptcha('submit');
      } else {
        this.progress = 30;
        const body = {
          enableAccountFlow: 2,
          token: this.appInfo.token,
          userId: this.accountInfo.id,
          project: this.appInfo.project,
        };

        if (this.accountInfo.type === 2) {
          (body as any).verificationCode = this.phoneCaptcha.value;
        } else {
          body.enableAccountFlow = 1;
          if (this.redirectPage === 'event') {
            Object.assign(body, { redirectUrl: 'event' });
          }
        }

        this.getClientIpaddress()
          .pipe(
            switchMap((ipResult) =>
              this.api10xxService.fetchEnableAccount(body, this.requestHeader)
            )
          )
          .subscribe((res: any) => {
            if (res.processResult.resultCode !== 200) {
              let msgBody;
              switch (res.processResult.apiReturnMessage) {
                case `Post fail, parmameter 'project' or 'token' or 'userId' error.`:
                case `Post fail, check 'userId' error with verification code.`:
                  msgBody = this.translate.instant('universal_userAccount_errorCaptcha');
                  this.showMsgBox(msgBody, 'none');
                  break;
                case 'Found attack, update status to lock!':
                case 'Found lock!': {
                  const captchaBody = {
                    unlockFlow: 1,
                    imgLockCode: res.processResult.imgLockCode,
                  };

                  this.api10xxService
                    .fetchCaptcha(captchaBody, this.requestHeader)
                    .subscribe((captchaRes) => {
                      this.imgCaptcha = {
                        show: true,
                        imgCode: `data:image/png;base64,${captchaRes.captcha.randomCodeImg}`,
                        cue: '',
                        code: '',
                      };
                    });

                  break;
                }
                default:
                  msgBody = errorMsg;
                  console.error(
                    `${res.processResult.resultCode}: ${res.processResult.apiReturnMessage}`
                  );
                  this.showMsgBox(errorMsg, 'turnBack');
                  break;
              }
            } else {
              if (this.accountInfo.type === 1) {
                this.sendEmail = true;
                if (this.pcView) {
                  const msgBody = this.translate.instant(
                    'universal_userAccount_sendCaptchaChackEmail'
                  );
                  this.showMsgBox(msgBody, 'enableSuccess');
                }
              } else {
                this.enableSuccess = true;
                const msgBody = `${this.logMessage.enable} ${this.logMessage.success}`;
                if (this.pcView) {
                  this.showMsgBox(msgBody, 'enableSuccess');
                } else {
                  this.debounceBack(msgBody, this.turnFirstLoginOrBack);
                }

                this.userService.refreshUserProfile();
              }
            }

            this.progress = 100;
          });
      }
    }
  }

  /**
   * 待訊息顯示一段時間後再轉導
   * @param msg {string}-欲顯示之訊息
   * @param fn {Founction}-轉導函式
   * @author kidin-1110110
   */
  debounceBack(msg: string, fn: Function = undefined) {
    this.hintDialogService.showSnackBar(msg);
    if (fn) setTimeout(fn.bind(this), 2000);
  }

  // 解除圖碼鎖定-kidin-1090618
  removeCaptcha(action: string) {
    const releaseBody = {
      unlockFlow: 2,
      unlockKey: this.imgCaptcha.code,
    };

    this.api10xxService.fetchCaptcha(releaseBody, this.requestHeader).subscribe((res) => {
      if (res.processResult.resultCode === 200) {
        this.imgCaptcha.show = false;

        if (action === 'submit') {
          this.submit();
        } else {
          this.reciprocal();
        }
      } else {
        switch (res.processResult.apiReturnMessage) {
          case 'Found a wrong unlock key.':
            this.imgCaptcha.cue = 'universal_userAccount_errorCaptcha';
            break;
          default:
            this.dialog.open(MessageBoxComponent, {
              hasBackdrop: true,
              data: {
                title: 'Message',
                body: `Error.<br />Please try again later.`,
                confirmText: this.logMessage.confirm,
                onConfirm: this.turnBack.bind(this),
              },
            });

            console.error(`${res.processResult.resultCode}: ${res.processResult.apiReturnMessage}`);
            break;
        }
      }

      this.progress = 100;
    });
  }

  // 點擊email認證信後送出驗證碼給server驗證-kidin-1090518
  emailEnable(body) {
    const { enable, success, confirm } = this.logMessage;
    if (enable !== '' && success !== '' && confirm !== '') {
      this.progress = 30;
      this.getClientIpaddress()
        .pipe(
          switchMap((ipResult) => this.api10xxService.fetchEnableAccount(body, this.requestHeader))
        )
        .subscribe((res: any) => {
          let msgBody;
          if (res.processResult.resultCode !== 200) {
            switch (res.processResult.apiReturnMessage) {
              case 'Enable account fail, account was enabled.': // 已啟用後再次點擊啟用信件，則當作啟用成功-kidin-1090520
                msgBody = `${this.logMessage.enable} ${this.logMessage.success}`;
                this.showMsgBox(msgBody, 'enableSuccess');
                break;
              default:
                msgBody = errorMsg;
                console.error(
                  `${res.processResult.resultCode}: ${res.processResult.apiReturnMessage}`
                );
                this.showMsgBox(msgBody, 'turnBack');
                break;
            }
          } else {
            msgBody = `${this.logMessage.enable} ${this.logMessage.success}`;
            this.showMsgBox(msgBody, 'enableSuccess');
            this.userService.refreshUserProfile();
          }

          this.progress = 100;
        });
    } else {
      setTimeout(() => {
        this.emailEnable(body);
      }, 500);
    }
  }

  /**
   * 顯示彈跳視窗訊息
   * @param msg {string}-欲顯示的訊息
   * @param action {'turnBack' | 'enableSuccess' | 'none'}
   * @author kidin-1091229
   */
  showMsgBox(msg: string, action: 'turnBack' | 'enableSuccess' | 'none') {
    let fn: Function;
    switch (action) {
      case 'turnBack':
        fn = this.turnBack;
        break;
      case 'enableSuccess':
        fn = this.turnFirstLoginOrBack;
        break;
      case 'none':
        break;
    }

    if (this.pcView) {
      const data = {
        title: 'Message',
        body: msg,
        confirmText: this.logMessage.confirm,
      };

      if (fn) Object.assign(data, { onConfirm: fn.bind(this) });

      this.dialog.open(MessageBoxComponent, {
        hasBackdrop: true,
        disableClose: true,
        data,
      });
    } else {
      this.debounceBack(msg, fn);
    }
  }

  /**
   * 啟用成功後導回app或個人設定頁面
   * @author kidin-1091222
   */
  turnFirstLoginOrBack() {
    if (this.appInfo.sys === 1) {
      (window as any).webkit.messageHandlers.closeWebView.postMessage('Close');
    } else if (this.appInfo.sys === 2) {
      (window as any).android.closeWebView('Close');
    } else {
      if (this.redirectPage !== 'event') window.close();
      window.onunload = this.refreshParent;
      // 若無法關閉瀏覽器則導回登入頁
      if (this.redirectPage === 'sign') this.redirectPage = 'setting';
      this.redirect();
    }
  }

  /**
   * 關閉子視窗後將頁面重新整理
   * @author kidin-1091229
   */
  refreshParent() {
    window.opener.location.reload();
  }

  // 離開頁面則取消隱藏navbar-kidin-1090514
  ngOnDestroy() {
    this.setPageStyle(false);
    this.ngUnsubscribe.next(null);
    this.ngUnsubscribe.complete();
  }
}
