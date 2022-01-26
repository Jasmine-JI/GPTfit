import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { UtilsService } from '../../../../../shared/services/utils.service';
import { AuthService } from '../../../../../shared/services/auth.service';
import { SignupService } from '../../../services/signup.service';
import { MessageBoxComponent } from '../../../../../shared/components/message-box/message-box.component';
import { GetClientIpService } from '../../../../../shared/services/get-client-ip.service';
import { UserProfileService } from '../../../../../shared/services/user-profile.service';
import { Subject, Subscription, fromEvent, merge, of } from 'rxjs';
import { takeUntil, tap, switchMap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { formTest } from '../../../../../shared/models/form-test';
import { codes } from '../../../../../shared/models/countryCode';
import { SignTypeEnum } from '../../../../../shared/models/utils-type';
import { TFTViewMinWidth } from '../../../models/app-webview';

const errorCaptchaI18nKey = 'universal_userAccount_errorCaptcha';
type InputType = 'account' | 'password';
enum ResetFlow {
  request = 1,
  verify,
  reset
}

@Component({
  selector: 'app-app-forgetpw',
  templateUrl: './app-forgetpw.component.html',
  styleUrls: ['./app-forgetpw.component.scss']
})
export class AppForgetpwComponent implements OnInit, AfterViewInit, OnDestroy {

  private ngUnsubscribe = new Subject();
  private clickScrollEvent = new Subscription();
  private resizeSubscription = new Subscription();

  readonly formReg = formTest;
  readonly countryCodeList = codes;
  readonly SignTypeEnum = SignTypeEnum;
  readonly ResetFlow = ResetFlow;

  displayCountryCodeList = false;
  progress = 100;
  appSys = 0;  // 0: web, 1: ios, 2: android
  showSendPhoneCaptcha = false;
  displayPW = false;
  phoneFormIncomplete = true;
  dataIncomplete = true;
  timeCount = 30;
  currentAccount = '';
  newToken = '';
  ip = '';
  pcView = false;
  mobileSize = window.innerWidth < TFTViewMinWidth;
  requestHeader = {};
  flowComplete = false;

  formValue = {
    resetPasswordFlow: ResetFlow.request,
    type: SignTypeEnum.email,  // 1. 信箱 2. 手機
    email: '',
    countryCode: 886,
    phone: null,
    verificationCode: '',
    project: 0,
    password: ''
  };

  cue = {
    account: '',
    verificationCode: '',
    password: ''
  };

  // 惡意攻擊圖碼解鎖
  imgCaptcha = {
    show: false,
    imgCode: '',
    cue: '',
    code: ''
  };

  // 驗證用
  regCheck = {
    email: this.formReg.email,
    countryCodePass: true,
    password: this.formReg.password
  };

  constructor(
    private translate: TranslateService,
    private utils: UtilsService,
    private authService: AuthService,
    private signupService: SignupService,
    private dialog: MatDialog,
    private router: Router,
    public getClientIp: GetClientIpService,
    public userProfileService: UserProfileService
  ) {}

  ngOnInit() {
    this.subscribeResizeEvent();

    if (location.pathname.indexOf('web') > 0) {
      this.pcView = true;
      this.utils.setHideNavbarStatus(false);
      this.utils.setDarkModeStatus(false);
    } else {
      this.pcView = false;
      this.utils.setHideNavbarStatus(true);
      this.utils.setDarkModeStatus(true);
    }

    this.getUrlString(location.search);
  }

  /**
   * 訂閱頁面尺寸改變事件
   * @author kidin-1101230
   */
  subscribeResizeEvent() {
    const resizeEvent = fromEvent(window, 'resize');
    this.resizeSubscription = resizeEvent.pipe(
      takeUntil(this.ngUnsubscribe)
    ).subscribe(e => {
      this.mobileSize = window.innerWidth < TFTViewMinWidth;
    });

  }

  /**
   * 因應ios嵌入webkit物件時間點較後面，故在此生命週期才判斷裝置平台
   * @author kidin-1090710
   */
  ngAfterViewInit () {
    if (this.pcView === false) {
      this.getDeviceSys();
    }

  }

  // 取得裝置平台-kidin-1090518
  getDeviceSys () {
    if ((window as any).webkit) {
      this.appSys = 1;
    } else if ((window as any).android) {
      this.appSys = 2;
    } else {
      this.appSys = 0;
    }

    this.requestHeader = {
      deviceType: this.appSys,
      ...this.requestHeader
    };

  }

  // 取得url query string-kidin-1090514
  getUrlString (urlStr) {
    const query = this.utils.getUrlQueryStrings(urlStr);
    this.requestHeader = {
      ...this.requestHeader,
      ...this.utils.headerKeyTranslate(query)
    };
    Object.entries(query).forEach(([_key, _value]) => {
      const _valueStr = _value as string;
      switch (_key) {
        case 'rpf':
          this.formValue.resetPasswordFlow = +_valueStr;
          break;
        case 'e':
          this.formValue.email = this.currentAccount = decodeURIComponent(_valueStr || '') ;
          break;
        case 'mn':
          this.currentAccount = _valueStr || '';
          break;
        case 'cc':
          this.formValue.countryCode = +_valueStr || null;
          break;
        case 'p':
          this.formValue.project = +_valueStr;

          if (+_valueStr === 0) {
            this.pcView = true;
          }

          break;
        case 'vc':
          this.formValue.verificationCode = _valueStr;
          break;
      }

    });

    if (this.currentAccount) {
      this.determineAccountType(this.currentAccount);
    }

    if (this.formValue.verificationCode.length !== 0) {
      this.submit();
    }

  }

  // 取得使用者ip位址-kidin-1090521
  getClientIpaddress () {
    const { remoteAddr } = this.requestHeader as any;
    if (!remoteAddr) {
      return this.getClientIp.requestJsonp('https://api.ipify.org', 'format=jsonp', 'callback').pipe(
        tap(res => {
          this.ip = (res as any).ip;
          this.requestHeader = {
            ...this.requestHeader,
            remoteAddr: this.ip
          };
        })
      );

    } else {
      return of(this.requestHeader);
    }

  }

  // 返回app-kidin-1090513
  turnBack () {
    if (this.appSys === 1) {
      (window as any).webkit.messageHandlers.closeWebView.postMessage('Close');
    } else if (this.appSys === 2) {
      (window as any).android.closeWebView('Close');
    } else {

      if (this.pcView === true) {
        this.router.navigateByUrl('/signIn-web');
      } else {
        this.router.navigateByUrl('/signIn');
      }

    }

  }

  // 判斷使用者輸入的帳號切換帳號類型-kidin-1090518
  determineAccountType(e: any) {
    if (e.key) {
      const account = e.currentTarget.value;

      if (e.key.length === 1 || e.key === 'Backspace') {

        if (e.key === 'Backspace') {
          const value = account.slice(0, account.length - 1);
          if (value.length > 0 && this.formReg.number.test(value)) {
            this.formValue.type = 2;
          } else {
            this.formValue.type = 1;
          }
  
        } else if (this.formReg.number.test(account) && this.formReg.number.test(e.key)) {
          this.formValue.type = 2;
        } else if (!this.formReg.number.test(e.key)) {
          this.formValue.type = 1;
        }

      }

    } else {

      if (this.formReg.number.test(e)) {
        this.formValue.type = 2;
      } else {
        this.formValue.type = 1;
      }

    }
    
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
        this.formValue.type = 2;
        this.cue.account = '';
        this.formValue.phone = account;
        this.checkPhoneForm();
      } else {
        this.formValue.type = 1;
        this.formValue.email = account;
        this.checkEmail(this.formValue.email);
      }

    } else {
      this.formValue.type = 1;
      this.cue.account = 'universal_status_wrongFormat';
    }

  }

  // 確認使用者信箱格式-kidin-1090511
  checkEmail (email: string) {

    if (email.length === 0 || !this.regCheck.email.test(email)) {
      this.cue.account = 'universal_status_wrongFormat';
      this.dataIncomplete = true;
    } else {
      this.cue.account = '';
      this.dataIncomplete = false;
    }

  }

  // 取得使用者輸入的國碼-kidin-1090504
  onCodeChange (countryCode) {
    this.formValue.countryCode = +countryCode;
    this.regCheck.countryCodePass = true;

    this.checkPhoneForm();
  }

  // 確認國碼及手機皆已輸入-kidin-1090519
  checkPhoneForm () {

    setTimeout(() => {  // 處理angular檢查時，狀態不一致的問題-kidin-1090519
      if (this.regCheck.countryCodePass) {
        this.phoneFormIncomplete = false;
      } else {
        this.phoneFormIncomplete = true;
      }

    }, 0);

  }

  // 倒數計時並取得server手機驗證碼-kidin-1090519
  reciprocal () {

    if (this.imgCaptcha.show) {
      this.removeCaptcha('reciprocal');
    } else {
      this.progress = 40;
      const body = {
        resetPasswordFlow: ResetFlow.request,
        accountType: SignTypeEnum.phone,
        countryCode: this.formValue.countryCode,
        mobileNumber: +this.formValue.phone,
        project: this.formValue.project
      };

      this.getClientIpaddress().pipe(
        switchMap(ipResult => this.signupService.fetchForgetpwd(body, this.requestHeader))
      ).subscribe((res: any) => {
        const resultInfo = res.processResult;
        if (resultInfo.resultCode !== 200) {

          switch (resultInfo.apiReturnMessage) {
            case 'Found attack, update status to lock!':
            case 'Found lock!':
              this.getImgCaptcha(res.processResult.imgLockCode);
              break;
            case 'Post fail, account is not existing.':
              this.cue.account = 'universal_userAccount_noRegisterData';
              break;
            default:
              const msgBody = 'Error!<br /> Please try again later.';
              this.showMsgBox(msgBody, this.turnBack);
              console.error(`${res.processResult.resultCode}: ${res.processResult.apiReturnMessage}`);
              break;
          }

        } else if (resultInfo.resultCode === 200) {
          const msg = this.translate.instant('universal_userAccount_sendSmsSuccess');
          this.showMsgBox(msg, undefined);
          const btnInterval = setInterval(() => {
            this.timeCount--;
            if (this.timeCount === 0) {
              this.timeCount = 30;
              // 設any處理typescript報錯：Argument of type 'Timer' is not assignable to parameter of type 'number'-kidin-1090515
              window.clearInterval(btnInterval as any);
            }

          }, 1000);

        }

        this.progress = 100;
      });

    }

  }

  // 確認手機驗證碼是否符合-kidin-1090515
  checkPhoneCaptcha (e) {
    if ((e.type === 'keypress' && e.code === 'Enter') || e.type === 'focusout') {
      const inputPhoneCaptcha = e.currentTarget.value;
      if (inputPhoneCaptcha.length < 6) {
        this.cue.verificationCode = errorCaptchaI18nKey;
      } else {
        this.formValue.verificationCode = inputPhoneCaptcha;
        this.cue.verificationCode = '';

        if (!this.phoneFormIncomplete) {
          this.dataIncomplete = false;
        } else {
          this.dataIncomplete = true;
        }

      }
    }

  }

  // 顯示密碼-kidin-1090429
  toggleDisplayPW () {
    if (this.displayPW === false) {
      this.displayPW = true;
    } else {
      this.displayPW = false;
    }

  }

  // 確認密碼格式-kidin-1090511
  checkPassword (e) {
    if ((e.type === 'keypress' && e.code === 'Enter') || e.type === 'focusout') {
      const inputPassword = e.currentTarget.value;

      if (!this.regCheck.password.test(inputPassword)) {
        this.cue.password = 'universal_userAccount_passwordFormat';
        this.dataIncomplete = true;
      } else {
        this.formValue.password = inputPassword;
        this.cue.password = '';
        this.dataIncomplete = false;
      }
    }

  }

  // 寄發驗證信或檢查驗證碼-kidin-1090515
  submit () {
    this.progress = 30;
    if (this.imgCaptcha.show) {
      this.removeCaptcha('submit');
    } else {
      const { type, resetPasswordFlow } = this.formValue;
      if (type === SignTypeEnum.email && resetPasswordFlow === ResetFlow.request) {
        this.sendEmailCaptcha();
      } else if (type === SignTypeEnum.email && resetPasswordFlow === ResetFlow.verify) {
        this.emailVarify();
      } else if (type === SignTypeEnum.phone && resetPasswordFlow !== ResetFlow.reset) {
        this.phoneVarify();
      } else if (resetPasswordFlow === ResetFlow.reset) {
        this.resetPWD();
      }

    }

  }

  // 寄發驗證信-kidin-1090519
  sendEmailCaptcha () {
    const { email, project } = this.formValue;
    const body = {
      resetPasswordFlow: ResetFlow.request,
      accountType: SignTypeEnum.email,
      email,
      project
    };

    this.getClientIpaddress().pipe(
      switchMap(ipResult => this.signupService.fetchForgetpwd(body, this.requestHeader))
    ).subscribe((res: any) => {
      if (res.processResult.resultCode !== 200) {

        switch (res.processResult.apiReturnMessage) {
          case 'Found attack, update status to lock!':
          case 'Found lock!':
            this.getImgCaptcha(res.processResult.imgLockCode);
            break;
          case 'Post fail, account is not existing.':
            this.cue.account = 'universal_userAccount_noRegisterData';
            break;
          default:
            const msgBody = 'Error!<br /> Please try again later.';
            this.showMsgBox(msgBody, this.turnBack);
            console.error(`${res.processResult.resultCode}: ${res.processResult.apiReturnMessage}`);
            break;
        }

      } else {
        const msgBody = this.translate.instant('universal_userAccount_sendCaptchaChackEmail');
        this.showMsgBox(msgBody, this.turnBack);
      }

      this.progress = 100;
    });

  }

  // 確認是否填寫圖形驗證碼欄位-kidin-1090514
  checkImgCaptcha (e) {
    if ((e.type === 'keypress' && e.code === 'Enter') || e.type === 'focusout') {
      const inputImgCaptcha = e.currentTarget.value;
      if (inputImgCaptcha.length === 0) {
        this.imgCaptcha.cue = errorCaptchaI18nKey;
      } else {
        this.imgCaptcha.code = inputImgCaptcha;
        this.imgCaptcha.cue = '';
      }
    }

  }

  // 解除圖碼鎖定-kidin-1090618
  removeCaptcha (action: string) {
    const releaseBody = {
      unlockFlow: 2,
      unlockKey: this.imgCaptcha.code
    };

    this.getClientIpaddress().pipe(
      switchMap(ipResult => this.signupService.fetchCaptcha(releaseBody, this.requestHeader))
    ).subscribe((res: any) => {
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
            this.imgCaptcha.cue = errorCaptchaI18nKey;
            this.progress = 100;
            break;
          default:
            const msgBody = `Error.<br />Please try again later.`;
            this.showMsgBox(msgBody, this.turnBack);
            console.error(`${res.processResult.resultCode}: ${res.processResult.apiReturnMessage}`);
            break;
        }

      }

    });

  }

  // 點擊認證信後送出認證碼並引導至下一步-kidin-1090519
  emailVarify () {
    const { email, verificationCode, project } = this.formValue;
    const body = {
      resetPasswordFlow: ResetFlow.verify,
      accountType: SignTypeEnum.email,
      email,
      verificationCode,
      project
    };

    this.getClientIpaddress().pipe(
      switchMap(ipResult => this.signupService.fetchForgetpwd(body, this.requestHeader))
    ).subscribe((res: any) => {
      if (res.processResult.resultCode !== 200) {
        let msgBody;
        switch (res.processResult.apiReturnMessage) {
          case 'Found attack, update status to lock!':
          case 'Found lock!':
            this.getImgCaptcha(res.processResult.imgLockCode);
            break;
          case 'Post fail, account was reset password.':
          case 'Reset password fail, reset time expired.':
          case 'Check and verification code is invalid.':
            msgBody = 'universal_userAccount_linkHasExpired';
            this.showMsgBox(msgBody, this.turnBack);
            break;
          default:
            msgBody = 'Error!<br /> Please try again later.';
            console.error(`${res.processResult.resultCode}: ${res.processResult.apiReturnMessage}`);
            this.showMsgBox(msgBody, this.turnBack);
            break;
        }

      } else {
        this.formValue.resetPasswordFlow = ResetFlow.reset;
        this.dataIncomplete = true;
      }

      this.progress = 100;
    });

  }

  // 送出簡訊認證碼並引導至下一步-kidin-1090519
  phoneVarify () {
    const { countryCode, phone, verificationCode, project } = this.formValue;
    const body = {
      resetPasswordFlow: ResetFlow.verify,
      accountType: SignTypeEnum.phone,
      countryCode,
      mobileNumber: +phone,
      verificationCode,
      project
    };

    this.getClientIpaddress().pipe(
      switchMap(ipResult => this.signupService.fetchForgetpwd(body, this.requestHeader))
    ).subscribe((res: any) => {
      if (res.processResult.resultCode !== 200) {

        switch (res.processResult.apiReturnMessage) {
          case 'Found attack, update status to lock!':
          case 'Found lock!':
            this.getImgCaptcha(res.processResult.imgLockCode);
            break;
          case 'SMS Code error.':
          case 'Get phone and sms infomation is not enough.':
            this.cue.verificationCode = errorCaptchaI18nKey;
            break;
          case 'Post fail, account is not existing.':
            this.cue.account = 'universal_userAccount_noRegisterData';
            break;
          default:
            const msgBody = 'Error!<br /> Please try again later.';
            this.showMsgBox(msgBody, this.turnBack);
            console.error(`${res.processResult.resultCode}: ${res.processResult.apiReturnMessage}`);
            break;
        }

      } else {
        this.formValue.resetPasswordFlow = ResetFlow.reset;
        this.dataIncomplete = true;
      }

      this.progress = 100;
    });

  }

  // 傳token回app-kidin-1090518
  sendTokenToApp (token) {

    if (this.appSys === 1) {
      (window as any).webkit.messageHandlers.returnToken.postMessage(token);
    } else if (this.appSys === 2) {
      (window as any).android.returnToken(token);
    }

  }

  // 重設密碼-kidin-1090519
  resetPWD () {
    const { email, countryCode, phone, type, password, verificationCode, project } = this.formValue;
    const body: any = {
      resetPasswordFlow: ResetFlow.reset,
      accountType: type,
      newPassword: password,
      verificationCode,
      project
    };

    if (type === SignTypeEnum.email) {
      body.email = email;
    } else {
      body.countryCode = countryCode;
      body.mobileNumber = +phone;
    }

    this.getClientIpaddress().pipe(
      switchMap(ipResult => this.signupService.fetchForgetpwd(body, this.requestHeader))
    ).subscribe((res: any) => {
      let msgBody;
      if (!this.utils.checkRes(res, false)) {
        const { processResult, resultMessage } = res;
        const resultMsg = processResult ? processResult.apiReturnMessage : resultMessage;
        switch (resultMsg) {
          case 'Found attack, update status to lock!':
          case 'Found lock!':
            this.getImgCaptcha(processResult.imgLockCode);
            break;
          case 'Post fail, account is not existing.':
            this.cue.account = 'universal_userAccount_noRegisterData';
            break;
          default:
            const msgBody = 'Error. Please try again later.';
            this.showMsgBox(msgBody, this.turnBack);
            break;
        }

      } else {
        msgBody = this.translate.instant('universal_userAccount_passwordResetComplete');
        this.newToken = res.resetPassword.newToken;
        this.utils.writeToken(this.newToken);  // 直接在瀏覽器幫使用者登入
        this.userProfileService.refreshUserProfile({token: this.newToken});
        this.authService.setLoginStatus(true);
        this.sendTokenToApp(this.newToken);
        this.flowComplete = true;
      }

      this.showMsgBox(msgBody, this.turnBack);
      this.progress = 100;
    });

  }

  /**
   * 取得圖碼
   * @param code {string}-imgLockCode
   * @author kidin-1090803
   */
  getImgCaptcha(code: string) {
    const captchaBody = {
      unlockFlow: 1,
      imgLockCode: code
    };

    this.getClientIpaddress().pipe(
      switchMap(ipResult => this.signupService.fetchCaptcha(captchaBody, this.requestHeader))
    ).subscribe((captchaRes: any) => {
      this.imgCaptcha = {
        show: true,
        imgCode: `data:image/png;base64,${captchaRes.captcha.randomCodeImg}`,
        cue: '',
        code: ''
      };
      
    });

  }

  // 顯示彈跳視窗訊息-kidin-1090518
  showMsgBox (msg: string, fn: Function) {
    if (this.pcView) {
      this.translate.get('hellow world').pipe(
        takeUntil(this.ngUnsubscribe)
      ).subscribe(() => {
        const data = {
          title: 'Message',
          body: msg,
          confirmText: this.translate.instant('universal_operating_confirm')
        };
  
        if (fn) Object.assign(data, { onConfirm: fn.bind(this) });
  
        this.dialog.open(MessageBoxComponent, {
          hasBackdrop: true,
          disableClose: true,
          data
        });

      });

    } else {
      this.utils.showSnackBar(msg);
      if (fn) setTimeout(fn.bind(this), 2000);
    }

  }

  /**
   * 顯示國碼選擇清單
   * @param e {MouseEvent}
   * @author kidin-1110103
   */
   showCountryCodeList(e: MouseEvent) {
    e.stopPropagation();
    const { formValue: { type }, displayCountryCodeList } = this;
    if (type === SignTypeEnum.phone) {
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
    this.clickScrollEvent = merge(clickEvent, scrollEvent).pipe(
      takeUntil(this.ngUnsubscribe)
    ).subscribe(() => {
      this.unsubscribeClickScrollEvent();
    });

  }

  /**
   * 取消訂閱全域點擊與滾動事件
   * @author kidin-1110103
   */
  unsubscribeClickScrollEvent() {
    this.displayCountryCodeList = false;
    if (this.clickScrollEvent) this.clickScrollEvent.unsubscribe();
  }
  
  /**
   * 選擇國碼
   * @param e {MouseEvent}
   * @param code {string}-所選國碼
   * @author kidin-1110103
   */
  selectCountryCode(e: MouseEvent, code: string) {
    e.stopPropagation();
    this.formValue.countryCode = +code.split('+')[1];
    this.regCheck.countryCodePass = true;
    this.cue.account = '';  
    this.unsubscribeClickScrollEvent();
  }

  // 離開頁面則取消隱藏navbar和取消rxjs訂閱-kidin-1090514
  ngOnDestroy () {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }


}
