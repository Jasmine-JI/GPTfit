import { Component, OnInit, OnDestroy } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { UtilsService } from '@shared/services/utils.service';
import { SignupService } from '../../../services/signup.service';
import { UserInfoService } from '../../../../dashboard/services/userInfo.service';

import { MatSnackBar } from '@angular/material';
import { Router } from '@angular/router';

@Component({
  selector: 'app-app-modifypw',
  templateUrl: './app-modifypw.component.html',
  styleUrls: ['./app-modifypw.component.scss']
})
export class AppModifypwComponent implements OnInit, OnDestroy {

  appSys = 1; // 0: web 1: ios 2: android
  dataIncomplete = true;
  newToken = '';
  sending = false;

  displayPW = {
    oldPassword: false,
    newPassword: false
  };

  editBody: any = {
    editType: 1,
    token: '',
    oldPassword: '',
    newAccountType: 0,
    newPassword: ''
  };

  // 欄位提示
  placeholder = {
    oldPassword: '',
    newPassword: ''
  };

  // 輸入錯誤提示
  cue = {
    oldPassword: '',
    newPassword: ''
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
    private signupService: SignupService,
    private userInfoService: UserInfoService,
    private router: Router,
    private snackbar: MatSnackBar
  ) { }

  ngOnInit() {
    this.utils.setHideNavbarStatus(true);
    this.createPlaceholder();
    this.getDeviceSys();
    this.getUrlString(location.search);
    this.getUserInfo();
  }

  // 確認ngx translate套件已經載入再產生翻譯-kidin-1090430
  createPlaceholder () {

    this.translate.get('hello.world').subscribe(() => {
      this.placeholder.oldPassword = this.translate.instant('Portal.keyInPassword');
      this.placeholder.newPassword = this.translate.instant('other.keyInNewPassword');
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
        case 'tk':  // 不寫死避免新增參數
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
      signInType: 3,
      token: this.utils.getToken() || ''
    };

    this.userInfoService.fetchUserInfo(body).subscribe(res => {

      const profile = res.userProfile;
      if (profile.email) {
        this.editBody.editType = 1;
        this.editBody.newEmail = profile.email;
      } else {
        this.editBody.editType = 2;
        this.editBody.newCountryCode = profile.countryCode;
        this.editBody.newMobileNumber = profile.mobileNumber;
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
      this.router.navigateByUrl('/signIn');
    }

  }

  // 將使用者輸入的密碼進行隱藏-kidin-1090430
  hidePassword (id) {
    const pwInputType = (<HTMLInputElement>document.getElementById(id));

    if (this.displayPW[id] === true) {
      pwInputType.type = 'text';
    } else {
      pwInputType.type = 'password';
    }

  }

  // 顯示密碼-kidin-1090429
  toggleDisplayPW (id) {
    if (this.displayPW[id] === false) {
      this.displayPW[id] = true;
    } else {
      this.displayPW[id] = false;
    }

    this.hidePassword(id);
  }

  // 確認密碼格式-kidin-1090511
  checkPassword (e, obj) {
    if ((e.type === 'keypress' && e.code === 'Enter') || e.type === 'focusout') {
      const inputPassword = e.currentTarget.value,
            regPWD = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[^]{8,20}$/;

      if (!regPWD.test(inputPassword)) {
        this.cue[obj] = this.translate.instant('Portal.passwordFormat');
      } else {
        this.editBody[obj] = inputPassword;
        this.cue[obj] = '';
      }

      if (
        this.editBody.oldPassword.length > 0
        && this.editBody.newPassword.length > 0
        && this.cue.oldPassword.length === 0
        && this.cue.newPassword.length === 0
      ) {
        this.dataIncomplete = false;
      } else {
        this.dataIncomplete = true;
      }
    }

  }

  // 確認是否填寫圖形驗證碼欄位-kidin-1090514
  checkImgCaptcha (e) {
    if ((e.type === 'keypress' && e.code === 'Enter') || e.type === 'focusout') {
      const inputImgCaptcha = e.currentTarget.value;

      if (inputImgCaptcha.length === 0) {
        this.imgCaptcha.cue = this.translate.instant('Portal.errorCaptcha');
      } else {
        this.imgCaptcha.code = inputImgCaptcha;
        this.imgCaptcha.cue = '';
      }
    }

  }

  // 送出修改密碼-kidin-1090519
  submit () {

    this.sending = true;

    if (this.imgCaptcha.show) {
      const releaseBody = {
        unlockFlow: 2,
        unlockKey: this.imgCaptcha.code
      };

      this.signupService.fetchCaptcha(releaseBody).subscribe(res => {
        if (res.processResult.resultCode === 200) {
          this.imgCaptcha.show = false;
          this.submit();
        } else {
          this.imgCaptcha.cue = this.translate.instant('Portal.errorCaptcha');
          this.sending = false;
        }

      });
    } else {
      this.sendFormInfo();
    }

  }

  // 傳送變更表單-kidin-1090514
  sendFormInfo () {

    this.userInfoService.fetchEditAccountInfo(this.editBody).subscribe(res => {
      if (res.processResult.resultCode !== 200) {

        switch (res.processResult.apiReturnMessage) {
          case 'Edit account fail, old password is not correct.':
            this.cue.oldPassword = this.translate.instant('Portal.notSamePassword');
            break;
          case 'Found attack, update status to lock!':
          case 'Found lock!':
            const captchaBody = {
              unlockFlow: 1,
              imgLockCode: res.processResult.imgLockCode
            };

            this.signupService.fetchCaptcha(captchaBody).subscribe(captchaRes => {
              this.imgCaptcha.show = true;
              this.imgCaptcha.imgCode = `data:image/png;base64,${captchaRes.captcha.randomCodeImg}`;
            });

            break;
        }

        this.sending = false;
      } else {
        this.newToken = res.editAccount.newToken;
        this.utils.writeToken(this.newToken);  // 直接在瀏覽器幫使用者登入
        this.finishEdit(this.newToken);
        this.sending = false;

        this.snackbar.open(
          `${this.translate.instant('other.modify')} ${this.translate.instant('Dashboard.MyDevice.success')}`,
          'OK',
          { duration: 1000 }
        );

        setTimeout(() => {
          this.turnBack();
        }, 1000);

      }

    });

  }

  // 返回app並回傳新token-kidin-1090518
  finishEdit (token) {
    if (this.appSys === 1) {
      (window as any).webkit.messageHandlers.refreshToken.postMessage(token);
    } else if (this.appSys === 2) {
      (window as any).android.refreshToken(token);
    }

  }

  // 離開頁面則取消隱藏navbar-kidin-1090514
  ngOnDestroy () {
    this.utils.setHideNavbarStatus(false);
  }

}
