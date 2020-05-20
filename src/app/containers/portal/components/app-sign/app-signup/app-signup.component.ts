import { Component, OnInit, OnDestroy } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { SignupService } from '../../../services/signup.service';
import { UtilsService } from '@shared/services/utils.service';
import { MessageBoxComponent } from '@shared/components/message-box/message-box.component';

import { Router } from '@angular/router';
import { MatDialog } from '@angular/material';

@Component({
  selector: 'app-app-signup',
  templateUrl: './app-signup.component.html',
  styleUrls: ['./app-signup.component.scss']
})
export class AppSignupComponent implements OnInit, OnDestroy {

  appSys = 0;  // 0:web, 1:ios, 2:android
  focusForm = '';
  displayPW = false;
  sending = false;
  dataIncomplete = true;
  needImgCaptcha = false;
  newToken: string;

  // 驗證用
  regCheck = {
    email: /^.{1,63}@[a-zA-Z0-9]{2,63}.[a-zA-Z]{2,63}(.[a-zA-Z]{2,63})?$/,
    emailPass: false,
    password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[^]{8,20}$/,
    passwordPass: false,
    nickname: /^[^!@#$%^&*()=|{}"?<>;:+-\/\\]{4,24}$/,
    nicknamePass: false,
    phone: /^([1-9][0-9]+)$/,
    phonePass: false,
    countryCodePass: false
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

  placeholder: object = {
    email: '',
    countryCode: '',
    phone: '',
    password: '',
    nickname: '',
    imgCaptcha: ''
  };

  // 儲存表單內容
  signupData = {
    type: 1, // 1：信箱 2：手機
    email: '',
    countryCode: 0, // 預設number type
    phone: 0, // 預設number type
    password: '',
    nickname: '',
    imgCaptcha: '',
    fromType: 1, // 預設number type
    fromId: ''
  };

  // 輸入錯誤各欄位提示內容
  signupCue = {
    email: '',
    phone: '',
    password: '',
    nickname: '',
    imgCaptcha: ''
  };

  // 惡意註冊圖碼解鎖
  imgCaptcha = {
    show: false,
    imgCode: ''
  };

  constructor(
    private translate: TranslateService,
    private signupService: SignupService,
    private utils: UtilsService,
    private dialog: MatDialog,
    private router: Router
  ) { }

  ngOnInit() {
    this.utils.setHideNavbarStatus(true);
    this.createPlaceholder();
    this.getAppId(location.search);
  }

  // 返回app-kidin-1090513
  turnBack () {
    if (this.appSys === 1) {
      (window as any).webkit.messageHandlers.webviewReturn.postMessage('Direct turn back!');
    } else if (this.appSys === 2) {
      (window as any).android.webviewReturn('Direct turn back!');
    } else {
      this.router.navigateByUrl('/signIn');
    }

  }

  // 確認ngx translate套件已經載入再產生翻譯-kidin-1090430
  createPlaceholder () {
      this.translate.get('hello.world').subscribe(() => {

        this.placeholder = {
          email: `${this.translate.instant('Portal.enterInfo')} ${this.translate.instant('Portal.email')}`,
          phone: `${this.translate.instant('Portal.enterInfo')} ${this.translate.instant('Portal.phone')}`,
          password: `${this.translate.instant('Portal.enterInfo')} ${this.translate.instant('Portal.password')}`,
          nickname: `${this.translate.instant('Portal.enterInfo')} ${this.translate.instant('Portal.nickname')}`,
          imgCaptcha: `${this.translate.instant('Portal.imgCaptcha')}`
        };
      });

  }

  // 取得註冊來源平台、類型和ID-kidin-1090512
  getAppId (urlStr) {
    if ((window as any).webkit) {
      this.appSys = 1;
    } else if ((window as any).android) {
      this.appSys = 2;
    } else {
      this.appSys = 0;
    }

    const query = urlStr.replace('?', '').split('&');

    for (let i = 0; i < query.length; i++) {

      const queryKey = query[i].split('=')[0];
      switch (queryKey) {  // 可能之後有更多參數，故不寫死
        case 'fi':
          this.signupData.fromId = query[i].split('=')[1];
          break;
      }

    }

  }

  // 取得使用者選擇的帳號類型
  getAccountType (e) {
    this.signupData.type = +e + 1;
    this.checkAll(this.regCheck);
  }

  // 確認使用者信箱格式-kidin-1090511
  checkEmail (e) {
    const inputEmail = e.currentTarget.value;

    if (inputEmail.length === 0 || !this.regCheck.email.test(inputEmail)) {
      this.signupCue.email = this.translate.instant('Portal.emailFormat');
      this.regCheck.emailPass = false;
    } else {
      this.signupData.email = inputEmail;
      this.signupCue.email = '';
      this.regCheck.emailPass = true;
    }

    this.checkAll(this.regCheck);
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
    const inputPassword = e.currentTarget.value;

    if (!this.regCheck.password.test(inputPassword)) {
      this.signupCue.password = this.translate.instant('Portal.passwordFormat');
      this.regCheck.passwordPass = false;
    } else {
      this.signupData.password = inputPassword;
      this.signupCue.password = '';
      this.regCheck.passwordPass = true;
    }

    this.checkAll(this.regCheck);
  }

  // 取得使用者輸入的國碼-kidin-1090504
  onCodeChange (countryCode) {
    this.signupData.countryCode = +countryCode;
    this.regCheck.countryCodePass = true;

    this.checkAll(this.regCheck);
  }

  // 取得使用者輸入的電話號碼-kidin-
  getPhoneNum (phoneNum) {
    if (phoneNum.length === 0) {
      this.regCheck.phonePass = false;
    } else {
      this.signupData.phone = phoneNum;
      this.regCheck.phonePass = true;
    }

    this.checkAll(this.regCheck);
  }

  // 確認暱稱格式-kidin-1090511
  checkNickname (e) {
    const inputNickname = e.currentTarget.value;

    if (!this.regCheck.nickname.test(inputNickname)) {
      this.signupCue.nickname = this.translate.instant('Portal.nameCharactersToLong');
      this.regCheck.nicknamePass = false;
    } else {
      this.signupData.nickname = inputNickname;
      this.signupCue.nickname = '';
      this.regCheck.nicknamePass = true;
    }

    this.checkAll(this.regCheck);
  }

  // 確認是否填寫圖形驗證碼欄位-kidin-1090514
  checkImgCaptcha (e) {
    const inputImgCaptcha = e.currentTarget.value;

    if (inputImgCaptcha.length === 0) {
      this.signupCue.imgCaptcha = this.translate.instant('Portal.errorCaptcha');
    } else {
      this.signupData.imgCaptcha = inputImgCaptcha;
      this.signupCue.imgCaptcha = '';
    }

    this.checkAll(this.regCheck);
  }

  // 確認是否所有欄位皆已完成-kidin-1090512
  checkAll (check) {
    if (this.signupData.type === 1) {

      if (!check.emailPass
          || !check.passwordPass
          || !check.nicknamePass
          || (this.imgCaptcha.show && this.signupData.imgCaptcha.length === 0)
      ) {
        this.dataIncomplete = true;
      } else {
        this.dataIncomplete = false;
      }

    } else {

      if (!check.countryCodePass
          || !check.phonePass
          || !check.passwordPass
          || !check.nicknamePass
          || (this.imgCaptcha.show && this.signupData.imgCaptcha.length === 0)
      ) {
        this.dataIncomplete = true;
      } else {
        this.dataIncomplete = false;
      }

    }
  }

  // 進行註冊流程-kidin-1090429
  submit () {
    this.sending = true;

    if (this.imgCaptcha.show) {
      const releaseBody = {
        unlockFlow: 2,
        unlockKey: this.signupData.imgCaptcha
      };

      this.signupService.fetchCaptcha(releaseBody).subscribe(res => {
        if (res.processResult.resultCode === 200) {
          this.imgCaptcha.show = false;
          this.submit();
        } else {
          this.signupCue.imgCaptcha = this.translate.instant('Portal.errorCaptcha');
          this.sending = false;
        }

      });
    } else {
      this.sendFormInfo();
    }

  }

  // 傳送註冊表單-kidin-1090514
  sendFormInfo () {
    const body: any = {
      registerType: this.signupData.type,
      name: this.signupData.nickname,
      password: this.signupData.password,
      fromType: this.signupData.fromType,
      fromId: this.signupData.fromId
    };

    if (this.signupData.type === 1) {
      body.email = this.signupData.email;
    } else {
      body.countryCode = this.signupData.countryCode;
      body.mobileNumber = this.signupData.phone;
    }

    this.signupService.fetchRegister(body).subscribe(res => {

      if (res.processResult.resultCode !== 200) {

        switch (res.processResult.apiReturnMessage) {
          case 'Register account is existing.':

            if (this.signupData.type === 1) {
              this.signupCue.email =
                `${this.translate.instant('Dashboard.Settings.account')} ${this.translate.instant('Dashboard.Settings.repeat')}`;
            } else {
              this.signupCue.phone =
                `${this.translate.instant('Dashboard.Settings.account')} ${this.translate.instant('Dashboard.Settings.repeat')}`;
            }

            break;
          case 'Register name is existing.':
            this.signupCue.nickname =
              `${this.translate.instant('Portal.nickname')} ${this.translate.instant('Dashboard.Settings.repeat')}`;
            break;
          case 'Found attack, update status to lock!':
          case 'Found lock!':
            const captchaBody = {
              unlockFlow: 1,
              imgLockCode: res.processResult.imgLockCode
            };

            this.signupService.fetchCaptcha(captchaBody).subscribe(captchaRes => {
              this.imgCaptcha = {
                show: true,
                imgCode: `data:image/png;base64,${captchaRes.captcha.randomCodeImg}`
              };
            });

            break;
        }

      } else {
        this.newToken = res.register.token;
        this.utils.writeToken(this.newToken);  // 直接在瀏覽器幫使用者登入

        const N = '\n';
        this.dialog.open(MessageBoxComponent, {
          hasBackdrop: true,
          data: {
            title: 'Message',
            body: `${this.translate.instant('Dashboard.MyDevice.success')} ${this.translate.instant('SH.signUp')}${
              N}${this.translate.instant('Dashboard.MyDevice.continueExecution')} ${
              this.translate.instant('other.switch')} ${this.translate.instant('Portal.account')}?
            `,
            confirmText: this.translate.instant(
              'SH.determine'
            ),
            cancelText: this.translate.instant(
              'SH.cancel'
            ),
            onCancel: this.finishSignup.bind(this),
            onConfirm: this.toEnableAccount.bind(this)
          }
        });

      }

      this.sending = false;
    });

  }

  // 返回app並回傳token-kidin-1090513
  finishSignup () {
    if (this.appSys === 1) {
      (window as any).webkit.messageHandlers.webviewReturn.postMessage(this.newToken);
    } else if (this.appSys === 2) {
      (window as any).android.webviewReturn(this.newToken);
    } else {
      this.router.navigateByUrl('/signIn');
    }

  }

  // 轉導至啟用帳號頁面-kidin-1090513
  toEnableAccount () {
    this.utils.setHideNavbarStatus(false);
    this.router.navigateByUrl(`/enableAccount`);
  }

  // 離開頁面則取消隱藏navbar-kidin-1090514
  ngOnDestroy () {
    this.utils.setHideNavbarStatus(false);
  }


}
