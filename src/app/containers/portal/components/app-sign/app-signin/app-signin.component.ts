import { Component, OnInit, OnDestroy } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { UtilsService } from '@shared/services/utils.service';
import { AuthService } from '../../../../../shared/services/auth.service';
import { MessageBoxComponent } from '@shared/components/message-box/message-box.component';

import { Subscription } from 'rxjs';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-app-signin',
  templateUrl: './app-signin.component.html',
  styleUrls: ['./app-signin.component.scss']
})
export class AppSigninComponent implements OnInit, OnDestroy {

  subscription: Subscription[] = [];
  i18n = {
    account: '',
    email: '',
    password: ''
  };
  loginStatus = 'check';  // check: 等待登入; logging：登入中; success： 成功;
  isKeyin = false;
  displayPW = false;
  dataIncomplete = true;
  currentAccount = '';
  pcView = false;

  loginBody: any = {
    signInType: 1, // 1. 信箱 2. 手機 3. Token
    password: '',
  };

  // 帳號類型選項
  selectLists = [
    {
      name: 'email',
      i18nKey: 'universal_userAccount_email'
    },
    {
      name: 'phone',
      i18nKey: 'universal_userAccount_phone'
    }
  ];

  fontOpt = {
    size: '20px',
    weight: 'bold',
    color: '#aaaaaa'
  };

  webFontOpt = {
    size: '16px',
    weight: 'normal',
    color: '#757575'
  };

  position = {
    bottom: '25px',
    zIndex: 101
  };

  cue = {
    email: '',
    password: '',
    signResult: ''
  };

  // 驗證用
  regCheck = {
    email: /^.{1,63}@[a-zA-Z0-9]{2,63}.[a-zA-Z]{2,63}(.[a-zA-Z]{2,63})?$/,
    emailPass: false,
    phone: /^([1-9][0-9]+)$/,
    phonePass: false,
    countryCodePass: false,
    password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[^]{8,20}$/,
    passwordPass: false
  };

  constructor(
    private translate: TranslateService,
    private utils: UtilsService,
    private authService: AuthService,
    private dialog: MatDialog,
    private router: Router
  ) {
    // 當語系變換就重新取得翻譯-kidin-1090720
    this.subscription.push(
      this.translate.onLangChange.subscribe(() => {
        this.getTranslate();
      })

    );

  }

  ngOnInit() {
    this.getTranslate();

    if (location.pathname.indexOf('web') > 0) {
      this.pcView = true;
      this.utils.setHideNavbarStatus(false);
    } else {
      this.pcView = false;
      this.utils.setHideNavbarStatus(true);
    }

  }

  // 取得多國語系翻譯-kidin-1090620
  getTranslate () {
    this.subscription.push(
        this.translate.get([
        'universal_userAccount_account',
        'universal_userAccount_email',
        'universal_userAccount_password'
      ]).subscribe(res => {
        this.i18n = {
          account: res['universal_userAccount_account'],
          email: res['universal_userAccount_email'],
          password: res['universal_userAccount_password']
        };

      })

    );

  }

  // 返回app-kidin-1090513
  turnBack () {
    this.router.navigateByUrl('/');
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
        this.loginBody.signInType = 2;
      } else {
        this.loginBody.signInType = 1;

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
    this.loginBody.signInType = +e + 1;

    if (+e + 1 === 1) {

      if (!this.regCheck.email.test(this.currentAccount)) {
        this.currentAccount = '';
        this.dataIncomplete = true;
      }

    } else {

      if (!this.regCheck.phone.test(this.currentAccount)) {
        this.currentAccount = '';
        this.dataIncomplete = true;
      }

    }

  }

  // 確認使用者信箱格式-kidin-1090511
  checkEmail (e) {
    if ((e.type === 'keypress' && e.code === 'Enter') || e.type === 'focusout' || e.type === undefined) {
      const inputEmail = e.currentTarget.value;

      if (inputEmail.length === 0 || !this.regCheck.email.test(inputEmail)) {
        this.cue.email = 'universal_userAccount_emailFormat';
        this.regCheck.emailPass = false;
      } else {
        this.loginBody.email = inputEmail;
        this.cue.email = '';
        this.regCheck.emailPass = true;
      }
    }

    this.checkAll();
  }

  // 取得使用者輸入的國碼-kidin-1090504
  onCodeChange (countryCode) {
    this.loginBody.countryCode = +countryCode;
    this.regCheck.countryCodePass = true;

    this.checkAll();
  }

  // 取得使用者輸入的電話號碼-kidin-
  getPhoneNum (phoneNum) {
    if (phoneNum.length === 0) {
      this.regCheck.phonePass = false;
    } else {
      this.loginBody.mobileNumber = phoneNum;
      this.regCheck.phonePass = true;
    }

    this.checkAll();
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
        this.regCheck.passwordPass = false;
      } else {
        this.loginBody.password = inputPassword;
        this.cue.password = '';
        this.regCheck.passwordPass = true;
      }
    }

    this.checkAll();
  }

  // 確認是否所有欄位皆已完成-kidin-1090512
  checkAll () {

    if (!this.regCheck.passwordPass) {
      this.dataIncomplete = true;
    } else {

      if (this.loginBody.signInType === 1 && !this.regCheck.emailPass) {
        this.dataIncomplete = true;
      } else if (this.loginBody.signInType === 2 && (!this.regCheck.countryCodePass || !this.regCheck.phonePass)) {
        this.dataIncomplete = true;
      } else {
        this.dataIncomplete = false;
      }

    }

  }

  // 登入-kidin-1090527
  login () {
    this.loginStatus = 'logging';
    this.authService.loginServerV2(this.loginBody).subscribe(res => {

      if (res.processResult.resultCode === 200) {
        this.cue.signResult = '';
        const token = res.signIn.token;
        this.utils.writeToken(token);
        this.authService.setLoginStatus(true);
        this.loginStatus = 'success';

        if (res.signIn.counter <= 1) {
          this.router.navigateByUrl('/firstLogin-web');
        } else if (this.authService.backUrl.length > 0) {
          location.href = this.authService.backUrl; // 為了讓登入的api request payload清除掉
        } else {
          location.href = '/dashboard'; // 為了讓登入的api request payload清除掉
        }

      } else {

        switch (res.processResult.apiReturnMessage) {
          case 'Sign in fail, found error mobile number or country code.':
          case 'Sign in fail, found error email.':
          case 'Sign in fail, found error password.':
            this.cue.signResult = 'universal_userAccount_errorAccountPassword';
            break;
          default:
            this.dialog.open(MessageBoxComponent, {
              hasBackdrop: true,
              data: {
                title: 'Message',
                body: `Server error.<br />Please try again later.`,
                confirmText: this.translate.instant(
                  'universal_operating_confirm'
                ),
                onConfirm: this.turnBack.bind(this)
              }
            });

            console.log(`${res.processResult.resultCode}: ${res.processResult.apiReturnMessage}`);
            break;
        }

        this.loginStatus = 'check';
      }

    });

  }

  // 轉導至qrcode sign頁面-kidin-1090527
  navigateToQrcodeSign () {

    if (this.pcView === true) {
      this.router.navigateByUrl('/signInQrcode-web');
    } else {
      this.router.navigateByUrl('/signInQrcode');
    }

  }

  // 顯示註冊條款-kidin-1090529
  showPrivateMsg(e) {
    e.preventDefault();
    let text = '';
    text = `${this.translate.instant('universal_userAccount_clauseContentPage1')}
    <a target="_blank"href="https://www.alatech.com.tw/action-copyright.htm">『${this.translate.instant('universal_userAccount_clause')}』</a>
    、 <a target="_blank" href="https://www.alatech.com.tw/action-privacy.htm">『${this.translate.instant('universal_userAccount_privacyStatement')}』</a>
    ${this.translate.instant('universal_userAccount_clauseContentPage2')}`.replace(/\n/gm, '');

    let title: string,
        confirmText: string,
        cancelText: string;

     this.subscription.push(this.translate.get([
        'universal_userAccount_clause',
        'universal_operating_agree',
        'universal_operating_disagree'
      ]).subscribe(res => {
        title = res['universal_userAccount_clause'];
        confirmText = res['universal_operating_agree'];
        cancelText = res['universal_operating_disagree'];
      })

     );

    this.dialog.open(MessageBoxComponent, {
      hasBackdrop: true,
      data: {
        title: title,
        body: text.trim(),
        confirmText: confirmText,
        cancelText: cancelText,
        onConfirm: this.navigateToSignup
      }
    });

  }

  // 轉導至註冊頁面-kidin-1090529
  navigateToSignup () {
    this.router.navigateByUrl('/register-web');
  }

  // 離開頁面則取消隱藏navbar和清除Interval-kidin-1090514
  ngOnDestroy () {
    this.utils.setHideNavbarStatus(false);
    this.subscription.forEach(_subscription => _subscription.unsubscribe());
  }

}
