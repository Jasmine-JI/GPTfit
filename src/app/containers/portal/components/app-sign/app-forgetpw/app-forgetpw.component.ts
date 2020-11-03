import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { UtilsService } from '../../../../../shared/services/utils.service';
import { UserInfoService } from '../../../../dashboard/services/userInfo.service';
import { AuthService } from '../../../../../shared/services/auth.service';
import { SignupService } from '../../../services/signup.service';
import { MessageBoxComponent } from '@shared/components/message-box/message-box.component';
import { GetClientIpService } from '../../../../../shared/services/get-client-ip.service';
import { UserProfileService } from '../../../../../shared/services/user-profile.service';

import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { formTest } from '../../../models/form-test';

@Component({
  selector: 'app-app-forgetpw',
  templateUrl: './app-forgetpw.component.html',
  styleUrls: ['./app-forgetpw.component.scss']
})
export class AppForgetpwComponent implements OnInit, AfterViewInit, OnDestroy {

  private ngUnsubscribe = new Subject();

  readonly formReg = formTest;

  i18n = {
    account: '',
    email: '',
    phone: '',
    password: '',
    verificationCode: '',
    errorCaptcha: '',
    linkExpired: '',
    confirm: ''
  };
  sending = false;
  appSys = 0;  // 0: web, 1: ios, 2: android
  showSendPhoneCaptcha = false;
  sendingPhoneCaptcha = false;
  displayPW = false;
  phoneFormIncomplete = true;
  dataIncomplete = true;
  timeCount = 30;
  currentAccount = '';
  newToken = '';
  ip = '';
  pcView = false;

  formValue = {
    resetPasswordFlow: 1,
    type: 1,  // 1. 信箱 2. 手機
    email: '',
    countryCode: 0,
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
    countryCodePass: false,
    password: this.formReg.password
  };

  constructor(
    private translate: TranslateService,
    private utils: UtilsService,
    private authService: AuthService,
    private signupService: SignupService,
    private userInfoService: UserInfoService,
    private dialog: MatDialog,
    private router: Router,
    public getClientIp: GetClientIpService,
    public userProfileService: UserProfileService
  ) {
    translate.onLangChange.pipe(
      takeUntil(this.ngUnsubscribe)
    ).subscribe(() => {
      this.getTranslate();
    });

  }

  ngOnInit() {
    this.getClientIpaddress();
    this.getTranslate();

    if (location.pathname.indexOf('web') > 0) {
      this.pcView = true;
      this.utils.setHideNavbarStatus(false);
    } else {
      this.pcView = false;
      this.utils.setHideNavbarStatus(true);
    }

    this.getUrlString(location.search);
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

  // 取得多國語系翻譯-kidin-1090620
  getTranslate () {
    this.translate.get('hollo word').pipe(
      takeUntil(this.ngUnsubscribe)
    ).subscribe(() => {
      this.i18n = {
        account: this.translate.instant('universal_userAccount_account'),
        email: this.translate.instant('universal_userAccount_email'),
        phone: this.translate.instant('universal_userAccount_phone'),
        password: this.translate.instant('universal_userAccount_newPassword'),
        verificationCode: this.translate.instant('universal_userAccount_phoneCaptcha'),
        errorCaptcha: this.translate.instant('universal_userAccount_errorCaptcha'),
        linkExpired: this.translate.instant('universal_userAccount_linkHasExpired'),
        confirm: this.translate.instant('universal_operating_confirm')
      };

    });

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
  }

  // 取得url query string-kidin-1090514
  getUrlString (urlStr) {

    const query = urlStr.replace('?', '').split('&');

    for (let i = 0; i < query.length; i++) {

      const queryKey = query[i].split('=')[0];
      switch (queryKey) {  // 不寫死避免之後新增參數
        case 'rpf':
          this.formValue.resetPasswordFlow = +query[i].split('=')[1];
          break;
        case 'e':
          this.formValue.email = this.currentAccount = decodeURIComponent(query[i].split('=')[1] || '') ;
          break;
        case 'mn':
          this.currentAccount = query[i].split('=')[1] || '';
          break;
        case 'cc':
          this.formValue.countryCode = +query[i].split('=')[1] || null;
          break;
        case 'p':
          this.formValue.project = +query[i].split('=')[1];

          if (+query[i].split('=')[1] === 0) {
            this.pcView = true;
          }

          break;
        case 'vc':
          this.formValue.verificationCode = query[i].split('=')[1];
          break;
      }

    }

    if (this.currentAccount) {
      this.determineAccountType(this.currentAccount);
    }

    if (this.formValue.verificationCode.length !== 0) {
      this.submit();
    }

  }

  // 取得使用者ip位址-kidin-1090521
  getClientIpaddress () {
    this.getClientIp.requestJsonp('https://api.ipify.org', 'format=jsonp', 'callback').subscribe(res => {
      this.ip = (res as any).ip;
    });

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
      if (this.regCheck.countryCodePass === true) {
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

      this.sendingPhoneCaptcha = true;

      const body = {
        resetPasswordFlow: 1,
        accountType: 2,
        countryCode: this.formValue.countryCode,
        mobileNumber: +this.formValue.phone,
        project: this.formValue.project
      };

      this.userInfoService.fetchForgetpwd(body, this.ip).subscribe(res => {

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
              this.showMsgBox(msgBody);
              console.log(`${res.processResult.resultCode}: ${res.processResult.apiReturnMessage}`);
              break;
          }

          this.sendingPhoneCaptcha = false;
        } else if (resultInfo.resultCode === 200) {
          this.dialog.open(MessageBoxComponent, {
            hasBackdrop: true,
            disableClose: true,
            data: {
              title: 'Message',
              body: this.translate.instant('universal_userAccount_sendSmsSuccess'),
              confirmText: this.i18n.confirm
            }
          });

          const btnInterval = setInterval(() => {
            this.timeCount--;

            if (this.timeCount === 0) {
              this.sendingPhoneCaptcha = false;
              this.timeCount = 30;

              // 設any處理typescript報錯：Argument of type 'Timer' is not assignable to parameter of type 'number'-kidin-1090515
              window.clearInterval(btnInterval as any);
            }

          }, 1000);

        }

      });

    }

  }

  // 確認手機驗證碼是否符合-kidin-1090515
  checkPhoneCaptcha (e) {
    if ((e.type === 'keypress' && e.code === 'Enter') || e.type === 'focusout') {
      const inputPhoneCaptcha = e.currentTarget.value;
      if (inputPhoneCaptcha.length < 6) {
        this.cue.verificationCode = this.i18n.errorCaptcha;
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

  // 將使用者輸入的密碼進行隱藏-kidin-1090430
  hidePassword () {
    const pwInputType = (<HTMLInputElement>document.getElementById('signupPW'));

    if (this.displayPW === true) {
      pwInputType.type = 'text';
    } else {
      pwInputType.type = 'password';
    }

  }

  // 顯示密碼-kidin-1090429
  toggleDisplayPW () {
    if (this.displayPW === false) {
      this.displayPW = true;
    } else {
      this.displayPW = false;
    }

    this.hidePassword();
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
    this.sending = true;

    if (this.imgCaptcha.show) {
      this.removeCaptcha('submit');
    } else {

      if (this.formValue.type === 1 && this.formValue.resetPasswordFlow === 1) {
        this.sendEmailCaptcha();
      } else if (this.formValue.type === 1 && this.formValue.resetPasswordFlow === 2) {
        this.emailVarify();
      } else if (this.formValue.type === 2 && this.formValue.resetPasswordFlow !== 3) {
        this.phoneVarify();
      } else if (this.formValue.resetPasswordFlow === 3) {
        this.resetPWD();
      }

    }

  }

  // 寄發驗證信-kidin-1090519
  sendEmailCaptcha () {
    const body = {
      resetPasswordFlow: 1,
      accountType: 1,
      email: this.formValue.email,
      project: this.formValue.project
    };

    this.userInfoService.fetchForgetpwd(body, this.ip).subscribe(res => {

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
            this.showMsgBox(msgBody);
            console.log(`${res.processResult.resultCode}: ${res.processResult.apiReturnMessage}`);
            break;
        }

      } else {
        const msgBody = this.translate.instant('universal_userAccount_sendCaptchaChackEmail');
        this.showMsgBox(msgBody);
      }

      this.sending = false;
    });

  }

  // 確認是否填寫圖形驗證碼欄位-kidin-1090514
  checkImgCaptcha (e) {
    if ((e.type === 'keypress' && e.code === 'Enter') || e.type === 'focusout') {
      const inputImgCaptcha = e.currentTarget.value;

      if (inputImgCaptcha.length === 0) {
        this.imgCaptcha.cue = this.i18n.errorCaptcha;
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

    this.signupService.fetchCaptcha(releaseBody, this.ip).subscribe(res => {
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
            this.imgCaptcha.cue = this.i18n.errorCaptcha;
            this.sending = false;
            break;
          default:
            const msgBody = `Error.<br />Please try again later.`;
            this.showMsgBox(msgBody);
            console.log(`${res.processResult.resultCode}: ${res.processResult.apiReturnMessage}`);
            break;
        }

      }

    });

  }

  // 點擊認證信後送出認證碼並引導至下一步-kidin-1090519
  emailVarify () {
    if (this.i18n.confirm !== '' && this.i18n.linkExpired !== '') {
      const body = {
        resetPasswordFlow: 2,
        accountType: 1,
        email: this.formValue.email,
        verificationCode: this.formValue.verificationCode,
        project: this.formValue.project
      };

      this.userInfoService.fetchForgetpwd(body, this.ip).subscribe(res => {

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
              msgBody = this.i18n.linkExpired;
              this.showMsgBox(msgBody);
              break;
            default:
              msgBody = 'Error!<br /> Please try again later.';
              console.log(`${res.processResult.resultCode}: ${res.processResult.apiReturnMessage}`);
              this.showMsgBox(msgBody);
              break;
          }

        } else {
          this.formValue.resetPasswordFlow = 3;
          this.dataIncomplete = true;
        }

        this.sending = false;
      });

    } else {
      setTimeout(() => {
        this.emailVarify();
      }, 200);

    }

  }

  // 送出簡訊認證碼並引導至下一步-kidin-1090519
  phoneVarify () {
    const body = {
      resetPasswordFlow: 2,
      accountType: 2,
      countryCode: this.formValue.countryCode,
      mobileNumber: +this.formValue.phone,
      verificationCode: this.formValue.verificationCode,
      project: this.formValue.project
    };

    this.userInfoService.fetchForgetpwd(body, this.ip).subscribe(res => {

      if (res.processResult.resultCode !== 200) {

        switch (res.processResult.apiReturnMessage) {
          case 'Found attack, update status to lock!':
          case 'Found lock!':
            this.getImgCaptcha(res.processResult.imgLockCode);
            break;
          case 'SMS Code error.':
          case 'Get phone and sms infomation is not enough.':
            this.cue.verificationCode = this.i18n.errorCaptcha;
            break;
          case 'Post fail, account is not existing.':
            this.cue.account = 'universal_userAccount_noRegisterData';
            break;
          default:
            const msgBody = 'Error!<br /> Please try again later.';
            this.showMsgBox(msgBody);
            console.log(`${res.processResult.resultCode}: ${res.processResult.apiReturnMessage}`);
            break;
        }

      } else {
        this.formValue.resetPasswordFlow = 3;
        this.dataIncomplete = true;
      }

      this.sending = false;
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
    const body: any = {
      resetPasswordFlow: 3,
      accountType: this.formValue.type,
      newPassword: this.formValue.password,
      verificationCode: this.formValue.verificationCode,
      project: this.formValue.project
    };

    if (this.formValue.type === 1) {
      body.email = this.formValue.email;
    } else {
      body.countryCode = this.formValue.countryCode;
      body.mobileNumber = +this.formValue.phone;
    }

    this.userInfoService.fetchForgetpwd(body, this.ip).subscribe(res => {

      let msgBody;
      if (res.processResult.resultCode !== 200) {
        msgBody = 'Error!<br /> Please try again later.';
        console.log(`${res.processResult.resultCode}: ${res.processResult.apiReturnMessage}`);
      } else {
        msgBody = this.translate.instant('universal_userAccount_passwordResetComplete');
        this.newToken = res.resetPassword.newToken;
        this.utils.writeToken(this.newToken);  // 直接在瀏覽器幫使用者登入
        this.userProfileService.refreshUserProfile({token: this.newToken});
        this.authService.setLoginStatus(true);
        this.sendTokenToApp(this.newToken);
      }

      this.showMsgBox(msgBody);
      this.sending = false;
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

    this.signupService.fetchCaptcha(captchaBody, this.ip).subscribe(captchaRes => {
      this.imgCaptcha = {
        show: true,
        imgCode: `data:image/png;base64,${captchaRes.captcha.randomCodeImg}`,
        cue: '',
        code: ''
      };
    });

  }

  // 顯示彈跳視窗訊息-kidin-1090518
  showMsgBox (msg) {

    this.dialog.open(MessageBoxComponent, {
      hasBackdrop: true,
      disableClose: true,
      data: {
        title: 'Message',
        body: msg,
        confirmText: this.i18n.confirm,
        onConfirm: this.turnBack.bind(this)
      }
    });

  }

  // 離開頁面則取消隱藏navbar和取消rxjs訂閱-kidin-1090514
  ngOnDestroy () {
    this.utils.setHideNavbarStatus(false);
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }


}
