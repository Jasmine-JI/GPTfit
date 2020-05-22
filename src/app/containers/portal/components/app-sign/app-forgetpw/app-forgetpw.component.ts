import { Component, OnInit, OnDestroy } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { UtilsService } from '@shared/services/utils.service';
import { UserInfoService } from '../../../../dashboard/services/userInfo.service';
import { SignupService } from '../../../services/signup.service';
import { MessageBoxComponent } from '@shared/components/message-box/message-box.component';
import { GetClientIpService } from '../../../../../shared/services/get-client-ip.service';

import { Router } from '@angular/router';
import { MatDialog } from '@angular/material';

@Component({
  selector: 'app-app-forgetpw',
  templateUrl: './app-forgetpw.component.html',
  styleUrls: ['./app-forgetpw.component.scss']
})
export class AppForgetpwComponent implements OnInit, OnDestroy {

  sending = false;
  appSys = 1;
  isKeyin = false;
  showSendPhoneCaptcha = false;
  sendingPhoneCaptcha = false;
  displayPW = false;
  phoneFormIncomplete = true;
  dataIncomplete = true;
  timeCount = 30;
  currentAccount = '';
  newToken = '';
  ip = '';

  formValue = {
    resetPasswordFlow: 1,
    type: 1,  // 1. 信箱 2. 手機
    email: '',
    countryCode: 0,
    phone: '',
    verificationCode: '',
    project: 0,
    password: ''
  };

  // 帳號類型選項
  selectLists = [
    {
      name: 'email',
      i18nKey: 'Portal.email'
    },
    {
      name: 'phone',
      i18nKey: 'Portal.phone'
    }
  ];

  fontOpt = {
    size: '20px',
    weight: 'bold',
    color: '#aaaaaa'
  };

  position = {
    bottom: '25px',
    zIndex: 101
  };

  placeholder = {
    account: '',
    email: '',
    phone: '',
    verificationCode: '',
    password: ''
  };

  cue = {
    account: '',
    email: '',
    phone: '',
    verificationCode: '',
    password: ''
  };

  // 惡意攻擊圖碼解鎖
  imgCaptcha = {
    show: false,
    imgCode: '',
    cue: '',
    code: '',
    placeholder: ''
  };

  // 驗證用
  regCheck = {
    email: /^.{1,63}@[a-zA-Z0-9]{2,63}.[a-zA-Z]{2,63}(.[a-zA-Z]{2,63})?$/,
    phone: /^([1-9][0-9]+)$/,
    phonePass: false,
    countryCodePass: false,
    password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[^]{8,20}$/
  };

  constructor(
    private translate: TranslateService,
    private utils: UtilsService,
    private signupService: SignupService,
    private userInfoService: UserInfoService,
    private dialog: MatDialog,
    private router: Router,
    public getClientIp: GetClientIpService
  ) { }

  ngOnInit() {
    this.utils.setHideNavbarStatus(true);
    this.createPlaceholder();
    this.getUrlString(location.search);
    this.getDeviceSys();
    this.getClientIpaddress();
  }

  // 確認ngx translate套件已經載入再產生翻譯-kidin-1090430
  createPlaceholder () {

    this.translate.get('hello.world').subscribe(() => {
      this.placeholder.account = `${this.translate.instant('Portal.enterInfo')} ${this.translate.instant('Portal.account')}`;
      this.placeholder.phone = `${this.translate.instant('Portal.enterInfo')} ${this.translate.instant('Portal.phoneCaptcha')}`;
      this.placeholder.email = `${this.translate.instant('Portal.enterInfo')} ${this.translate.instant('Portal.email')}`;
      this.placeholder.password = `${this.translate.instant('Portal.enterInfo')} ${this.translate.instant('Portal.password')}`;
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
          break;
        case 'vc':
          this.formValue.verificationCode = query[i].split('=')[1];
          break;
      }

    }

    if (this.currentAccount) {
      const formatObj = {
        target: {
          value: this.currentAccount
        }
      };

      this.determineAccountType(formatObj);
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
      (window as any).webkit.closeWebView.postMessage();
    } else if (this.appSys === 2) {
      (window as any).android.closeWebView();
    } else {
      this.router.navigateByUrl('/signIn');
    }

  }

  // 判斷使用者輸入的帳號切換帳號類型-kidin-1090518
  determineAccountType (e) {

    const account = e.target.value,
          numReg = /^([0-9]*)$/;
    if (account.length !== 0) {

      let inputAccount = '';
      if (account[0] === '0' && numReg.test(account)) {
        inputAccount = account.slice(1, account.length);
      } else {
        inputAccount = account;
      }

      if (this.regCheck.phone.test(inputAccount)) {
        this.formValue.type = 2;
      } else {
        this.formValue.type = 1;

        const formatValue = {
          currentTarget: {
            value: inputAccount
          }
        };

        this.checkEmail(formatValue);
      }

      this.currentAccount = inputAccount;
      this.isKeyin = true;

    } else {
      this.isKeyin = false;
      this.currentAccount = '';
    }

  }

  // 取得使用者選擇的帳號類型
  getAccountType (e) {
    this.formValue.type = +e + 1;

    if (+e + 1 === 1) {

      if (!this.regCheck.email.test(this.currentAccount)) {
        this.currentAccount = '';
      }

    } else {

      if (!this.regCheck.phone.test(this.currentAccount)) {
        this.currentAccount = '';
      }

    }

  }

  // 確認使用者信箱格式-kidin-1090511
  checkEmail (e) {
    if ((e.type === 'keypress' && e.code === 'Enter') || e.type === 'focusout' || e.type === undefined) {
      const inputEmail = e.currentTarget.value;

      if (inputEmail.length === 0 || !this.regCheck.email.test(inputEmail)) {
        this.cue.email = this.translate.instant('Portal.emailFormat');
        this.dataIncomplete = true;
      } else {
        this.formValue.email = inputEmail;
        this.cue.email = '';
        this.dataIncomplete = false;
      }
    }

  }

  // 取得使用者輸入的國碼-kidin-1090504
  onCodeChange (countryCode) {
    this.formValue.countryCode = +countryCode;
    this.regCheck.countryCodePass = true;

    this.checkPhoneForm();
  }

  // 取得使用者輸入的電話號碼-kidin-
  getPhoneNum (phoneNum) {
    if (phoneNum.length === 0) {
      this.regCheck.phonePass = false;
    } else {
      this.formValue.phone = phoneNum;
      this.regCheck.phonePass = true;
    }

    this.checkPhoneForm();
  }

  // 確認國碼及手機皆已輸入-kidin-1090519
  checkPhoneForm () {

    setTimeout(() => {  // 處理angular檢查時，狀態不一致的問題-kidin-1090519
      if (this.regCheck.countryCodePass === true && this.regCheck.phonePass === true) {
        this.phoneFormIncomplete = false;
      } else {
        this.phoneFormIncomplete = true;
      }

    }, 0);

  }

  // 倒數計時並取得server手機驗證碼-kidin-1090519
  reciprocal () {
    this.sendingPhoneCaptcha = true;

    const body = {
      resetPasswordFlow: 1,
      accountType: 2,
      countryCode: this.formValue.countryCode,
      mobileNumber: this.formValue.phone,
      project: this.formValue.project
    };

    this.userInfoService.fetchForgetpwd(body, this.ip).subscribe(res => {

      const resultInfo = res.processResult;
      if (resultInfo.resultCode !== 200) {

        switch (resultInfo.apiReturnMessage) {
          case 'Found attack, update status to lock!':
          case 'Found lock!':

            const captchaBody = {
              unlockFlow: 1,
              imgLockCode: res.processResult.imgLockCode
            };

            this.signupService.fetchCaptcha(captchaBody, this.ip).subscribe(captchaRes => {
              this.imgCaptcha = {
                show: true,
                imgCode: `data:image/png;base64,${captchaRes.captcha.randomCodeImg}`,
                cue: '',
                code: '',
                placeholder: this.translate.instant('Portal.imgCaptcha')
              };
            });

            break;
          case 'Post fail, account is not existing.':
            this.cue.phone = this.translate.instant('SH.noRegisterData');
            break;
        }

        this.sendingPhoneCaptcha = false;
      } else if (resultInfo.resultCode === 200) {
        this.dialog.open(MessageBoxComponent, {
          hasBackdrop: true,
          disableClose: true,
          data: {
            title: 'Message',
            body: this.translate.instant('other.sendSmsSuccess'),
            confirmText: this.translate.instant(
              'SH.determine'
            )
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

  // 確認手機驗證碼是否符合-kidin-1090515
  checkPhoneCaptcha (e) {
    if ((e.type === 'keypress' && e.code === 'Enter') || e.type === 'focusout') {
      const inputPhoneCaptcha = e.currentTarget.value;
      if (inputPhoneCaptcha.length < 6) {
        this.cue.verificationCode = this.translate.instant('Portal.errorCaptcha');
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
        this.cue.password = this.translate.instant('Portal.passwordFormat');
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
      const releaseBody = {
        unlockFlow: 2,
        unlockKey: this.imgCaptcha.code
      };

      this.signupService.fetchCaptcha(releaseBody, this.ip).subscribe(res => {
        if (res.processResult.resultCode === 200) {
          this.imgCaptcha.show = false;
          this.submit();
        } else {
          this.imgCaptcha.cue = this.translate.instant('Portal.errorCaptcha');
          this.sending = false;
        }

      });
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
          case 'Post fail, account is not existing.':
            this.cue.email = this.translate.instant('SH.noRegisterData');
            break;
          default:
            const msgBody = 'Server error! Please try again.';
            this.showMsgBox(msgBody);
            break;
        }

      } else {
        const msgBody = this.translate.instant('other.sendCaptchaChackEmail');
        this.showMsgBox(msgBody);
      }

      this.sending = false;
    });

  }

  // 點擊認證信後送出認證碼並引導至下一步-kidin-1090519
  emailVarify () {

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
          case 'Post fail, account was reset password.':
          case 'Reset password fail, reset time expired.':
            msgBody = this.translate.instant('custom.linkFailure');
            break;
          default:
            msgBody = 'Server error! Please try again.';
            break;
        }

        this.showMsgBox(msgBody);
      } else {
        this.formValue.resetPasswordFlow = 3;
        this.dataIncomplete = true;
      }

      this.sending = false;
    });

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
          case 'SMS Code error.':
            this.cue.verificationCode = this.translate.instant('Portal.errorCaptcha');
            break;
          default:
            const msgBody = 'Server error! Please try again.';
            this.showMsgBox(msgBody);
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
      (window as any).webkit.messageHandlers.refreshToken.postMessage(token);
    } else if (this.appSys === 2) {
      (window as any).android.refreshToken(token);
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
      body.mobileNumber = this.formValue.phone;
    }

    this.userInfoService.fetchForgetpwd(body, this.ip).subscribe(res => {

      let msgBody;
      if (res.processResult.resultCode !== 200) {
        msgBody = 'Server error! Please try again.';
      } else {
        msgBody = this.translate.instant('Portal.passwordResetComplete');
        this.newToken = res.resetPassword.newToken;
        this.utils.writeToken(this.newToken);  // 直接在瀏覽器幫使用者登入
        this.sendTokenToApp(this.newToken);
      }

      this.showMsgBox(msgBody);
      this.sending = false;
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
        confirmText: this.translate.instant(
          'SH.determine'
        ),
        onConfirm: this.turnBack.bind(this)
      }
    });

  }

  // 離開頁面則取消隱藏navbar-kidin-1090514
  ngOnDestroy () {
    this.utils.setHideNavbarStatus(false);
  }


}
