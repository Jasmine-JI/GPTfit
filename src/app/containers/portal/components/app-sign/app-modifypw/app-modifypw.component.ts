import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import {
  AuthService,
  Api10xxService,
  GetClientIpService,
  GlobalEventsService,
  HintDialogService,
  ApiCommonService,
} from '../../../../../core/services';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router, RouterLink } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MessageBoxComponent } from '../../../../../shared/components/message-box/message-box.component';
import { formTest } from '../../../../../core/models/regex/form-test';
import { TFTViewMinWidth } from '../../../models/app-webview';
import { Subject, Subscription, fromEvent, of } from 'rxjs';
import { takeUntil, tap, switchMap } from 'rxjs/operators';
import { headerKeyTranslate, getUrlQueryStrings } from '../../../../../core/utils';
import { SignInType, AccountType } from '../../../../../core/enums/personal';
import { errorMessage } from '../../../../../core/models/const';
import { appPath } from '../../../../../app-path.const';
import { FormsModule } from '@angular/forms';
import { LoadingBarComponent } from '../../../../../components/loading-bar/loading-bar.component';
import { NgIf, NgClass } from '@angular/common';

type InputType = 'oldPassword' | 'newPassword';

@Component({
  selector: 'app-app-modifypw',
  templateUrl: './app-modifypw.component.html',
  styleUrls: ['./app-modifypw.component.scss'],
  standalone: true,
  imports: [NgIf, LoadingBarComponent, NgClass, FormsModule, RouterLink, TranslateModule],
})
export class AppModifypwComponent implements OnInit, AfterViewInit, OnDestroy {
  private ngUnsubscribe = new Subject();
  private resizeSubscription = new Subscription();

  readonly passwordReg = formTest.password;
  readonly SignTypeEnum = SignInType;
  readonly userSettingUrl = `/${appPath.dashboard.home}/${appPath.personal.userSettings}`;

  appSys = 0; // 0: web 1: ios 2: android
  dataIncomplete = true;
  newToken = '';
  progress = 100;
  ip = '';
  pcView = false;
  mobileSize = window.innerWidth < TFTViewMinWidth;
  requestHeader = {};

  displayPW = {
    oldPassword: false,
    newPassword: false,
  };

  editBody: any = {
    editType: 1,
    token: '',
    oldPassword: '',
    newAccountType: 0,
    newPassword: '',
  };

  // 輸入錯誤提示
  cue = {
    oldPassword: '',
    newPassword: '',
  };

  // 惡意註冊圖碼解鎖
  imgCaptcha = {
    show: false,
    imgCode: '',
    code: '',
    cue: '',
    placeholder: '',
  };

  constructor(
    private translate: TranslateService,
    private authService: AuthService,
    private api10xxService: Api10xxService,
    private router: Router,
    private snackbar: MatSnackBar,
    private getClientIp: GetClientIpService,
    private dialog: MatDialog,
    private globalEventsService: GlobalEventsService,
    private hintDialogService: HintDialogService,
    private apiCommonService: ApiCommonService
  ) {}

  ngOnInit() {
    this.getUrlString(location.search);
    this.getUserInfo();
    this.subscribeResizeEvent();

    if (location.pathname.indexOf('-web') > -1) {
      this.pcView = true;
      this.setPageStyle(false);
    } else {
      this.pcView = false;
      this.setPageStyle(true);
    }

    // 在首次登入頁面按下登出時，跳轉回登入頁-kidin-1090109(bug575)
    this.authService.isLogin.subscribe((res) => {
      if (!res && this.pcView) {
        return this.router.navigateByUrl(`/${appPath.portal.signInWeb}`);
      }
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
    const query = getUrlQueryStrings(urlStr);
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
      token: this.editBody.token,
    };

    this.api10xxService.fetchGetUserProfile(body).subscribe((res) => {
      if (this.apiCommonService.checkRes(res)) {
        const {
          userProfile,
          signIn: { accountType },
        } = res as any;
        if (accountType === AccountType.email) {
          this.editBody.newAccountType = 1;
          this.editBody.newEmail = userProfile.email;
        } else {
          this.editBody.newAccountType = 2;
          this.editBody.newCountryCode = userProfile.countryCode;
          this.editBody.newMobileNumber = userProfile.mobileNumber;
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
      const { dashboard, personal } = appPath;
      this.router.navigateByUrl(`/${dashboard.home}/${personal.userSettings}`);
    }
  }

  // 顯示密碼-kidin-1090429
  toggleDisplayPW(input: InputType) {
    if (this.displayPW[input] === false) {
      this.displayPW[input] = true;
    } else {
      this.displayPW[input] = false;
    }
  }

  // 確認密碼格式-kidin-1090511
  checkPassword(e, input: InputType) {
    if ((e.type === 'keypress' && e.code === 'Enter') || e.type === 'focusout') {
      const inputPassword = e.currentTarget.value,
        regPWD = this.passwordReg;
      if (!regPWD.test(inputPassword)) {
        this.cue[input] = 'universal_userAccount_passwordFormat';
      } else {
        this.editBody[input] = inputPassword;
        this.cue[input] = '';
      }

      if (
        this.editBody.oldPassword.length > 0 &&
        this.editBody.newPassword.length > 0 &&
        this.cue.oldPassword.length === 0 &&
        this.cue.newPassword.length === 0
      ) {
        this.dataIncomplete = false;
      } else {
        this.dataIncomplete = true;
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

  // 送出修改密碼-kidin-1090519
  submit() {
    this.progress = 30;
    if (this.imgCaptcha.show) {
      const releaseBody = {
        unlockFlow: 2,
        unlockKey: this.imgCaptcha.code,
      };

      this.getClientIpaddress()
        .pipe(
          switchMap((ipResult) => this.api10xxService.fetchCaptcha(releaseBody, this.requestHeader))
        )
        .subscribe((res: any) => {
          if (res.processResult.resultCode === 200) {
            this.imgCaptcha.show = false;
            this.submit();
          } else {
            switch (res.processResult.apiReturnMessage) {
              case 'Found a wrong unlock key.':
                this.imgCaptcha.cue = 'universal_userAccount_errorCaptcha';
                break;
              default:
                this.showErrorMsg();
                console.error(
                  `${res.processResult.resultCode}: ${res.processResult.apiReturnMessage}`
                );
                break;
            }
          }

          this.progress = 100;
        });
    } else {
      this.sendFormInfo();
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
        if (res.processResult.resultCode !== 200) {
          switch (res.processResult.apiReturnMessage) {
            case 'Edit account fail, old password is not correct.':
              this.cue.oldPassword = 'universal_userAccount_notSamePassword';
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
                  this.imgCaptcha.show = true;
                  this.imgCaptcha.imgCode = `data:image/png;base64,${captchaRes.captcha.randomCodeImg}`;
                });

              break;
            }
            default:
              this.showErrorMsg();
              console.error(
                `${res.processResult.resultCode}: ${res.processResult.apiReturnMessage}`
              );
          }
        } else {
          this.newToken = res.editAccount.newToken;
          this.authService.setToken(this.newToken); // 直接在瀏覽器幫使用者登入
          this.authService.tokenLogin();
          this.finishEdit(this.newToken);
          const modifyI18n = this.translate.instant('universal_operating_modify');
          const successI18n = this.translate.instant('universal_status_success');
          this.snackbar.open(`${modifyI18n} ${successI18n}`, 'OK', { duration: 1000 });

          setTimeout(() => {
            window.close();
            this.turnBack();
          }, 1000);
        }

        this.progress = 100;
      });
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

  // 回傳新token-kidin-1090518
  finishEdit(token) {
    if (this.appSys === 1) {
      (window as any).webkit.messageHandlers.returnToken.postMessage(token);
    } else if (this.appSys === 2) {
      (window as any).android.returnToken(token);
    }
  }

  // 離開頁面則取消隱藏navbar-kidin-1090514
  ngOnDestroy() {
    this.setPageStyle(false);
    this.ngUnsubscribe.next(null);
    this.ngUnsubscribe.complete();
  }
}
