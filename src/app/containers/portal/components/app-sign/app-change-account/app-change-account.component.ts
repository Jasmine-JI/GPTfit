import { Component, OnInit, OnDestroy } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { UtilsService } from '@shared/services/utils.service';
import { AuthService } from '../../../../../shared/services/auth.service';
import { UserInfoService } from '../../../../dashboard/services/userInfo.service';
import { SignupService } from '../../../services/signup.service';
import { MessageBoxComponent } from '@shared/components/message-box/message-box.component';
import { GetClientIpService } from '../../../../../shared/services/get-client-ip.service';

import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-app-change-account',
  templateUrl: './app-change-account.component.html',
  styleUrls: ['./app-change-account.component.scss']
})
export class AppChangeAccountComponent implements OnInit, OnDestroy {

  i18n = {
    email: '',
    password: ''
  };
  displayPW = false;
  dataIncomplete = true;
  sending = false;
  newToken = '';
  appSys = 0;  // 0:web, 1:ios, 2:android
  ip = '';
  pcView = false;

  editBody: any = {
    editType: 2,
    token: '',
    oldPassword: '',
    newAccountType: 1,
  };

  cue = {
    password: '',
    email: '',
    phone: ''
  };

  accountInfo = {
    oldType: 1,
    oldAccount: ''
  };

  // 驗證用
  regCheck = {
    email: /^.{1,63}@[a-zA-Z0-9]{2,63}.[a-zA-Z]{2,63}(.[a-zA-Z]{2,63})?$/,
    emailPass: false,
    password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[^]{8,20}$/,
    passwordPass: false,
    phone: /^([1-9][0-9]+)$/,
    phonePass: false,
    countryCodePass: false
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

  // 惡意註冊圖碼解鎖
  imgCaptcha = {
    show: false,
    imgCode: '',
    code: '',
    cue: '',
    placeholder: ''
  };

  constructor(
    private translate: TranslateService,
    private utils: UtilsService,
    private authService: AuthService,
    private signupService: SignupService,
    private userInfoService: UserInfoService,
    private dialog: MatDialog,
    private router: Router,
    public getClientIp: GetClientIpService
  ) {
    translate.onLangChange.subscribe(() => {
      this.getTranslate();
    });

  }

  ngOnInit() {

    if (location.pathname.indexOf('web') > 0) {
      this.pcView = true;
      this.utils.setHideNavbarStatus(false);
    } else {
      this.pcView = false;
      this.utils.setHideNavbarStatus(true);
      this.getDeviceSys();
    }

    this.getUrlString(location.search);
    this.getUserInfo();

    // 在首次登入頁面按下登出時，跳轉回登入頁-kidin-1090109(bug575)
    this.authService.getLoginStatus().subscribe(res => {
      if (res === false && this.pcView === true) {
        return this.router.navigateByUrl('/signIn-web');
      }
    });

  }

  // 取得多國語系翻譯-kidin-1090620
  getTranslate () {
    this.translate.get('hollo word').subscribe(() => {
      this.i18n = {
        email: this.translate.instant('universal_userAccount_account'),
        password: this.translate.instant('universal_userAccount_password')
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

  // 取得url query string和token-kidin-1090514
  getUrlString (urlStr) {

    const query = urlStr.replace('?', '').split('&');
    for (let i = 0; i < query.length; i++) {

      const queryKey = query[i].split('=')[0];
      switch (queryKey) {
        case 'tk':  // 不寫死以免之後新增參數
          this.editBody.token = query[i].split('=')[1];
          break;
      }

    }

    if (this.editBody.token === '') {
      this.editBody.token = this.utils.getToken() || '';
    }

  }

  // 使用token取得使用者帳號資訊-kidin-1090514
  getUserInfo () {
    const body = {
      token: this.utils.getToken() || ''
    };

    this.userInfoService.fetchUserInfo(body).subscribe(res => {

      const profile = res.userProfile;
      if (profile.email) {
        this.accountInfo = {
          oldType: 1,
          oldAccount: profile.email
        };
      } else {
        this.accountInfo = {
          oldType: 2,
          oldAccount: `+${profile.countryCode} ${profile.mobileNumber}`
        };
      }

    });

  }

  // 返回app-kidin-1090513
  turnBack () {
    if (this.appSys === 1) {
      (window as any).webkit.messageHandlers.closeWebView.postMessage();
    } else if (this.appSys === 2) {
      (window as any).android.closeWebView();
    } else {

      if (this.pcView === true) {
        this.router.navigateByUrl('/signIn-web');
      } else {
        this.router.navigateByUrl('/signIn');
      }

    }

  }

  // 取得使用者選擇的帳號類型
  getAccountType (e) {
    this.editBody.newAccountType = +e + 1;
    this.checkAll(this.regCheck);
  }

  // 確認使用者信箱格式-kidin-1090511
  checkEmail (e) {
    if ((e.type === 'keypress' && e.code === 'Enter') || e.type === 'focusout') {
      const inputEmail = e.currentTarget.value;

      if (inputEmail.length === 0 || !this.regCheck.email.test(inputEmail)) {
        this.cue.email = 'universal_userAccount_emailFormat';
        this.regCheck.emailPass = false;
      } else {
        this.editBody.newEmail = inputEmail;
        this.cue.email = '';
        this.regCheck.emailPass = true;
      }

      this.checkAll(this.regCheck);
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
  onCodeChange (countryCode) {
    this.editBody.newCountryCode = +countryCode;
    this.regCheck.countryCodePass = true;

    this.checkAll(this.regCheck);
  }

  // 取得使用者輸入的電話號碼-kidin-
  getPhoneNum (phoneNum) {
    if (phoneNum.length === 0) {
      this.regCheck.phonePass = false;
    } else {
      this.editBody.newMobileNumber = phoneNum;
      this.regCheck.phonePass = true;
    }

    this.checkAll(this.regCheck);
  }

  // 確認是否填寫圖形驗證碼欄位-kidin-1090514
  checkImgCaptcha (e) {
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
  checkAll (check) {
    if (this.editBody.newAccountType === 1) {

      if (!check.emailPass
          || !check.passwordPass
          || (this.imgCaptcha.show && this.imgCaptcha.code.length === 0)
      ) {
        this.dataIncomplete = true;
      } else {
        this.dataIncomplete = false;
      }

    } else {

      if (!check.countryCodePass
          || !check.phonePass
          || !check.passwordPass
          || (this.imgCaptcha.show && this.imgCaptcha.code.length === 0)
      ) {
        this.dataIncomplete = true;
      } else {
        this.dataIncomplete = false;
      }

    }
  }

  // 進行變更帳號流程-kidin-1090518
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
          this.imgCaptcha.cue = 'universal_userAccount_errorCaptcha';
          this.sending = false;
        }

      });
    } else {
      this.sendFormInfo();
    }

  }

  // 傳送變更表單-kidin-1090514
  sendFormInfo () {

    this.userInfoService.fetchEditAccountInfo(this.editBody, this.ip).subscribe(res => {
      if (res.processResult.resultCode !== 200) {

        switch (res.processResult.apiReturnMessage) {
          case 'Change account is existing.':

            if (this.editBody.newAccountType === 1) {
              this.cue.email = 'accountRepeat';
            } else {
              this.cue.phone = 'accountRepeat';
            }

            break;
          case 'Change account fail, old password is not correct.':
            this.cue.password = 'universal_userAccount_notSamePassword';
            break;
          case 'Found attack, update status to lock!':
          case 'Found lock!':
            const captchaBody = {
              unlockFlow: 1,
              imgLockCode: res.processResult.imgLockCode
            };

            this.signupService.fetchCaptcha(captchaBody, this.ip).subscribe(captchaRes => {
              this.imgCaptcha.show = true;
              this.imgCaptcha.imgCode = `data:image/png;base64,${captchaRes.captcha.randomCodeImg}`;
            });

            break;
        }

      } else {
        this.newToken = res.editAccount.newToken;
        this.utils.writeToken(this.newToken);  // 直接在瀏覽器幫使用者登入
        this.authService.setLoginStatus(true);

        if (this.appSys === 1) {
          (window as any).webkit.messageHandlers.registerSuccess.postMessage(this.newToken);
        } else if (this.appSys === 2) {
          (window as any).android.registerSuccess(this.newToken);
        }

        const N = '\n';
        this.dialog.open(MessageBoxComponent, {
          hasBackdrop: true,
          disableClose: true,
          data: {
            title: 'Message',
            body: `${this.translate.instant('universal_operating_modify')} ${this.translate.instant('universal_status_success')} ${
              N} ${this.translate.instant('universal_popUpMessage_continueExecution')} ${
              this.translate.instant('universal_deviceSetting_switch')} ${this.translate.instant('universal_userAccount_account')}?
            `,
            confirmText: this.translate.instant(
              'universal_operating_confirm'
            ),
            cancelText: this.translate.instant(
              'universal_operating_cancel'
            ),
            onCancel: this.turnBack.bind(this),
            onConfirm: this.toEnableAccount.bind(this)
          }
        });

      }

      this.sending = false;
    });

  }

  // 轉導至啟用帳號頁面-kidin-1090513
  toEnableAccount () {
    this.utils.setHideNavbarStatus(false);
    if (this.pcView === true) {
      this.router.navigateByUrl(`/enableAccount-web`);
    } else {
      this.router.navigateByUrl(`/enableAccount`);
    }

  }

  // 離開頁面則取消隱藏navbar-kidin-1090514
  ngOnDestroy () {
    this.utils.setHideNavbarStatus(false);
  }


}
