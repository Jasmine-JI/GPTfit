import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import {
  AuthService,
  Api10xxService,
  GetClientIpService,
  GlobalEventsService,
  HintDialogService,
  ApiCommonService,
  NetworkService,
} from '../../../../../core/services';
import { MessageBoxComponent } from '../../../../../shared/components/message-box/message-box.component';
import { Subject, Subscription, fromEvent, merge, of } from 'rxjs';
import { takeUntil, tap, switchMap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { formTest } from '../../../../../core/models/regex/form-test';
import { codes, errorMessage } from '../../../../../core/models/const';
import { TFTViewMinWidth } from '../../../models/app-webview';
import {
  headerKeyTranslate,
  getUrlQueryStrings,
  getLocalStorageObject,
} from '../../../../../core/utils';
import { SignInType, AccountType } from '../../../../../core/enums/personal';
import { appPath } from '../../../../../app-path.const';

@Component({
  selector: 'app-app-change-account',
  templateUrl: './app-change-account.component.html',
  styleUrls: ['./app-change-account.component.scss'],
})
export class AppChangeAccountComponent implements OnInit, AfterViewInit, OnDestroy {
  private ngUnsubscribe = new Subject();
  private clickScrollEvent = new Subscription();
  private resizeSubscription = new Subscription();

  readonly formReg = formTest;
  readonly SignTypeEnum = SignInType;
  readonly countryCodeList = codes;
  readonly signInUrl = `/${appPath.portal.signInWeb}`;

  i18n = {
    account: '',
    password: '',
  };
  displayPW = false;
  dataIncomplete = true;
  progress = 100;
  newToken = '';
  appSys = 0; // 0:web, 1:ios, 2:android
  ip = '';
  pcView = false;
  mobileSize = window.innerWidth < TFTViewMinWidth;
  displayCountryCodeList = false;
  requestHeader = {};

  editBody: any = {
    editType: 2,
    token: '',
    oldPassword: '',
    newAccountType: SignInType.email,
  };

  cue = {
    password: '',
    account: '',
  };

  accountInfo = {
    oldType: SignInType.email,
    oldAccount: '',
  };

  // 驗證用
  regCheck = {
    email: this.formReg.email,
    emailPass: false,
    password: this.formReg.password,
    passwordPass: false,
  };

  // 惡意註冊圖碼解鎖
  imgCaptcha = {
    show: false,
    imgCode: '',
    code: '',
    cue: '',
    placeholder: '',
  };

  accountType = AccountType.email;
  constructor(
    private translate: TranslateService,
    private authService: AuthService,
    private api10xxService: Api10xxService,
    private dialog: MatDialog,
    private router: Router,
    private getClientIp: GetClientIpService,
    private globalEventsService: GlobalEventsService,
    private hintDialogService: HintDialogService,
    private apiCommonService: ApiCommonService,
    private networkService: NetworkService
  ) {
    translate.onLangChange.pipe(takeUntil(this.ngUnsubscribe)).subscribe(() => {
      this.getTranslate();
    });
  }

  ngOnInit() {
    this.getUrlString(location.search);
    this.getUserInfo();
    this.getTranslate();
    this.subscribeResizeEvent();
    if (location.pathname.indexOf('-web') > -1) {
      this.pcView = true;
      this.setPageStyle(false);
    } else {
      this.pcView = false;
      this.setPageStyle(true);
    }
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

  // 取得多國語系翻譯-kidin-1090620
  getTranslate() {
    this.translate
      .get('hollo word')
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe(() => {
        this.i18n = {
          account: this.translate.instant('universal_userAccount_emailPerPhone'),
          password: this.translate.instant('universal_userAccount_password'),
        };
      });
  }

  // 取得裝置平台-kidin-1090518
  getDeviceSys() {
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

  // 取得url query string和token-kidin-1090514
  getUrlString(urlStr) {
    const query = getUrlQueryStrings(location.search);
    this.requestHeader = {
      ...this.requestHeader,
      ...headerKeyTranslate(query),
    };

    const { tk } = query;
    if (tk) this.editBody.token = tk;

    if (this.editBody.token === '') {
      this.editBody.token = this.authService.token;
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

  // 使用token取得使用者帳號資訊-kidin-1090514
  getUserInfo() {
    const body = {
      token: this.editBody.token || '',
    };

    this.api10xxService.fetchGetUserProfile(body).subscribe((res) => {
      if (this.apiCommonService.checkRes(res)) {
        const {
          signIn: { accountType },
          userProfile,
        } = res;
        this.accountType = accountType;
        if (accountType === AccountType.email) {
          this.accountInfo = {
            oldType: SignInType.email,
            oldAccount: userProfile.email,
          };
        } else {
          this.accountInfo = {
            oldType: SignInType.phone,
            oldAccount: `+${userProfile.countryCode} ${userProfile.mobileNumber}`,
          };
        }
      }
    });
  }

  // 返回app-kidin-1090513
  turnBack() {
    if (this.appSys === 1) {
      (window as any).webkit.messageHandlers.closeWebView.postMessage('Close');
    } else if (this.appSys === 2) {
      (window as any).android.closeWebView('Close');
    } else {
      window.close();
      // 若無法關閉視窗就導回登入頁
      this.redirectSignIn();
    }
  }

  /**
   * 變更帳號成功後關閉視窗並重新整理
   * @author kidin-1091229
   */
  closeWindow() {
    if (this.appSys === 1) {
      (window as any).webkit.messageHandlers.closeWebView.postMessage('Close');
    } else if (this.appSys === 2) {
      (window as any).android.closeWebView('Close');
    } else {
      window.close();
      window.opener.location.reload();
      // 若無法關閉視窗就導回登入頁
      this.redirectSignIn();
    }
  }

  /**
   * 根據裝置轉導至對應的登入頁
   */
  redirectSignIn() {
    const { portal } = appPath;
    const url = this.pcView === true ? portal.signInWeb : portal.signIn;
    this.router.navigateByUrl(`/${url}`);
  }

  // 判斷使用者輸入的帳號切換帳號類型-kidin-1090518
  determineAccountType(e: KeyboardEvent) {
    const account = (e as any).currentTarget.value;
    if (e.key.length === 1 || e.key === 'Backspace') {
      if (e.key === 'Backspace') {
        const value = account.slice(0, account.length - 1);
        if (value.length > 0 && this.formReg.number.test(value)) {
          this.editBody.newAccountType = SignInType.phone;
        } else {
          this.editBody.newAccountType = SignInType.email;
        }
      } else if (this.formReg.number.test(account) && this.formReg.number.test(e.key)) {
        this.editBody.newAccountType = SignInType.phone;
        this.setCountryCode();
      } else if (!this.formReg.number.test(e.key)) {
        this.editBody.newAccountType = SignInType.email;
        if (this.editBody.newCountryCode) delete this.editBody.newCountryCode;
      }
    }
  }

  /**
   * 從localstorage取得已儲存之country code，若無則預設886
   * @author kidin-1110111
   */
  setCountryCode() {
    const countryCode = getLocalStorageObject('countryCode');
    this.editBody.newCountryCode = countryCode ? +countryCode : 886;
    this.checkAll(this.regCheck);
  }

  /**
   * 儲存使用者輸入的帳號
   * @param e {ChangeEvent}
   * @author kidin-1091006
   */
  saveAccount(e: Event) {
    const account = (e as any).currentTarget.value;

    if (account.length > 0) {
      if (this.formReg.number.test(account)) {
        this.editBody.newAccountType = SignInType.phone;
        this.cue.account = '';
        this.editBody.newMobileNumber = account;
        this.checkAll(this.regCheck);
      } else {
        this.editBody.newAccountType = SignInType.email;
        this.editBody.newEmail = account;
        this.checkEmail(this.editBody.newEmail);
      }
    } else {
      this.editBody.newAccountType = SignInType.email;
      this.cue.account = 'universal_status_wrongFormat';
    }
  }

  // 確認使用者信箱格式-kidin-1090511
  checkEmail(email: string) {
    if (email.length === 0 || !this.regCheck.email.test(email)) {
      this.cue.account = 'universal_status_wrongFormat';
      this.regCheck.emailPass = false;
    } else {
      this.cue.account = '';
      this.regCheck.emailPass = true;
    }

    this.checkAll(this.regCheck);
  }

  // 顯示密碼-kidin-1090429
  toggleDisplayPW() {
    if (this.displayPW === false) {
      this.displayPW = true;
    } else {
      this.displayPW = false;
    }
  }

  // 確認密碼格式-kidin-1090511
  checkPassword(e) {
    if ((e.type === 'keypress' && e.code === 'Enter') || e.type === 'focusout') {
      const inputPassword = e.currentTarget.value;
      if (!this.regCheck.password.test(inputPassword)) {
        this.cue.password = 'universal_userAccount_passwordFormat';
        this.regCheck.passwordPass = false;
      } else {
        this.editBody.oldPassword = inputPassword;
        this.cue.password = '';
        this.regCheck.passwordPass = true;
      }

      this.checkAll(this.regCheck);
    }
  }

  // 取得使用者輸入的國碼-kidin-1090504
  onCodeChange(countryCode) {
    this.editBody.newCountryCode = +countryCode;
    this.cue.account = '';
    this.checkAll(this.regCheck);
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

  // 確認是否所有欄位皆已完成-kidin-1090512
  checkAll(check) {
    const { emailPass, passwordPass } = check;
    const { show, code } = this.imgCaptcha;
    if (this.editBody.newAccountType === SignInType.email) {
      if (!emailPass || !passwordPass || (show && code.length === 0)) {
        this.dataIncomplete = true;
      } else {
        this.dataIncomplete = false;
      }
    } else {
      if (!passwordPass || (show && code.length === 0)) {
        this.dataIncomplete = true;
      } else {
        this.cue.account = '';
        this.dataIncomplete = false;
      }
    }
  }

  // 進行變更帳號流程-kidin-1090518
  submit() {
    const online = this.networkService.checkNetworkStatus();
    if (online) {
      this.progress = 30;
      if (this.imgCaptcha.show) {
        const releaseBody = {
          unlockFlow: 2,
          unlockKey: this.imgCaptcha.code,
        };

        this.getClientIpaddress()
          .pipe(
            switchMap((ipResult) =>
              this.api10xxService.fetchCaptcha(releaseBody, this.requestHeader)
            )
          )
          .subscribe((res: any) => {
            const {
              processResult,
              resultCode: resCode,
              apiCode: resApiCode,
              resultMessage: resMsg,
            } = res as any;
            if (!processResult) {
              this.apiCommonService.handleError(resCode, resApiCode, resMsg);
            } else {
              const { resultCode, apiReturnMessage } = processResult;
              if (resultCode === 200) {
                this.imgCaptcha.show = false;
                this.submit();
              } else {
                switch (apiReturnMessage) {
                  case 'Found a wrong unlock key.':
                    this.imgCaptcha.cue = 'universal_userAccount_errorCaptcha';
                    break;
                  default:
                    this.showErrorMsg();
                    console.error(`${resultCode}: ${apiReturnMessage}`);
                    break;
                }
              }
            }

            this.progress = 100;
          });
      } else {
        this.sendFormInfo();
      }
    }
  }

  // 傳送變更表單-kidin-1090514
  sendFormInfo() {
    this.getClientIpaddress()
      .pipe(
        switchMap((ipResult) =>
          this.api10xxService.fetchEditAccountInfo(this.editBody, this.requestHeader)
        )
      )
      .subscribe((res: any) => {
        const {
          processResult,
          resultCode: resCode,
          apiCode: resApiCode,
          resultMessage: resMsg,
        } = res as any;
        if (!processResult) {
          this.apiCommonService.handleError(resCode, resApiCode, resMsg);
        } else {
          const { resultCode, apiReturnMessage, imgLockCode } = processResult;
          if (resultCode !== 200) {
            switch (apiReturnMessage) {
              case 'Change account is existing.':
                this.cue.account = 'accountRepeat';
                break;
              case 'Change account fail, old password is not correct.':
                this.cue.password = 'universal_userAccount_notSamePassword';
                break;
              case 'Found attack, update status to lock!':
              case 'Found lock!': {
                const captchaBody = {
                  unlockFlow: 1,
                  imgLockCode: imgLockCode,
                };

                this.api10xxService
                  .fetchCaptcha(captchaBody, this.requestHeader)
                  .subscribe((captchaRes: any) => {
                    this.imgCaptcha.show = true;
                    this.imgCaptcha.imgCode = `data:image/png;base64,${captchaRes.captcha.randomCodeImg}`;
                  });

                break;
              }
              default:
                this.showErrorMsg();
                console.error(`${resultCode}: ${apiReturnMessage}`);
                break;
            }
          } else {
            this.newToken = res.editAccount.newToken;
            this.authService.setToken(this.newToken); // 直接在瀏覽器幫使用者登入

            if (this.appSys === 1) {
              (window as any).webkit.messageHandlers.returnToken.postMessage(this.newToken);
            } else if (this.appSys === 2) {
              (window as any).android.returnToken(this.newToken);
            }

            const modifyI18n = this.translate.instant('universal_operating_modify');
            const successI18n = this.translate.instant('universal_status_success');
            const msg = `${modifyI18n} ${successI18n}`;
            this.hintDialogService.showSnackBar(msg);
            this.toEnableAccount();
          }
        }

        this.progress = 100;
      });
  }

  // 轉導至啟用帳號頁面-kidin-1090513
  toEnableAccount() {
    this.globalEventsService.setHideNavbarStatus(false);
    this.router.navigateByUrl(`/${appPath.portal.enableAccount}`);
  }

  /**
   * 根據頁面使用dialog或snackbar顯示訊息
   * @param msg {string}-欲顯示的訊息
   * @author kidin-1110111
   */
  showErrorMsg() {
    if (this.pcView) {
      this.dialog.open(MessageBoxComponent, {
        hasBackdrop: true,
        data: {
          title: 'Message',
          body: `Error.<br />Please try again later.`,
          confirmText: this.translate.instant('universal_operating_confirm'),
          onConfirm: this.turnBack.bind(this),
        },
      });
    } else {
      const msg = errorMessage;
      this.debounceTurnBack(msg);
    }
  }

  /**
   * 待snackbar訊息顯示兩秒後再轉導
   * @author kidin-1110117
   * @author kidin-1110117
   */
  debounceTurnBack(msg: string) {
    this.hintDialogService.showSnackBar(msg);
    this.progress = 30;
    setTimeout(() => {
      this.progress = 30;
      this.turnBack();
    }, 2000);
  }

  /**
   * 顯示國碼選擇清單
   * @param e {MouseEvent}
   * @author kidin-1110103
   */
  showCountryCodeList(e: MouseEvent) {
    e.stopPropagation();
    const {
      editBody: { newAccountType },
      displayCountryCodeList,
    } = this;
    if (newAccountType === SignInType.phone) {
      if (displayCountryCodeList) {
        this.unsubscribeClickScrollEvent();
      } else {
        this.displayCountryCodeList = true;
        this.subscribeClickScrollEvent();
      }
    }
  }

  /**
   * 訂閱點擊與滾動事件
   * @author kidin-1110103
   */
  subscribeClickScrollEvent() {
    const targetElement = document.querySelector('main');
    const clickEvent = fromEvent(document, 'click');
    const scrollEvent = fromEvent(targetElement, 'scroll');
    this.clickScrollEvent = merge(clickEvent, scrollEvent)
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe(() => {
        this.unsubscribeClickScrollEvent();
      });
  }

  /**
   * 選擇國碼
   * @param e {MouseEvent}
   * @param code {string}-所選國碼
   * @author kidin-1110103
   */
  selectCountryCode(e: MouseEvent, code: string) {
    e.stopPropagation();
    this.editBody.newCountryCode = +code.split('+')[1];
    this.cue.account = '';
    this.checkAll(this.regCheck);
    this.unsubscribeClickScrollEvent();
  }

  /**
   * 取消訂閱全域點擊與滾動事件
   * @author kidin-1110103
   */
  unsubscribeClickScrollEvent() {
    this.displayCountryCodeList = false;
    if (this.clickScrollEvent) this.clickScrollEvent.unsubscribe();
  }

  // 離開頁面則取消隱藏navbar-kidin-1090514
  ngOnDestroy() {
    this.setPageStyle(false);
    this.ngUnsubscribe.next(null);
    this.ngUnsubscribe.complete();
  }
}
