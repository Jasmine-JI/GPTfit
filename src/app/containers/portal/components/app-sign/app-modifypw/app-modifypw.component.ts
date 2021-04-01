import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../../../../shared/services/auth.service';
import { UtilsService } from '@shared/services/utils.service';
import { SignupService } from '../../../services/signup.service';
import { UserProfileService } from '../../../../../shared/services/user-profile.service';
import { UserInfoService } from '../../../../dashboard/services/userInfo.service';
import { GetClientIpService } from '../../../../../shared/services/get-client-ip.service';

import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MessageBoxComponent } from '@shared/components/message-box/message-box.component';
import { formTest } from '../../../models/form-test';

@Component({
  selector: 'app-app-modifypw',
  templateUrl: './app-modifypw.component.html',
  styleUrls: ['./app-modifypw.component.scss']
})
export class AppModifypwComponent implements OnInit, AfterViewInit, OnDestroy {

  readonly passwordReg = formTest.password;

  appSys = 0; // 0: web 1: ios 2: android
  dataIncomplete = true;
  newToken = '';
  sending = false;
  ip = '';
  pcView = false;

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
    private authService: AuthService,
    private signupService: SignupService,
    private userProfileService: UserProfileService,
    private userInfoService: UserInfoService,
    private router: Router,
    private snackbar: MatSnackBar,
    private getClientIp: GetClientIpService,
    private dialog: MatDialog
  ) { }

  ngOnInit() {
    this.getUrlString(location.search);
    this.getUserInfo();
    this.getClientIpaddress();

    if (location.pathname.indexOf('web') > 0) {
      this.pcView = true;
      this.utils.setHideNavbarStatus(false);
    } else {
      this.pcView = false;
      this.utils.setHideNavbarStatus(true);
    }

    // 在首次登入頁面按下登出時，跳轉回登入頁-kidin-1090109(bug575)
    this.authService.getLoginStatus().subscribe(res => {
      if (res === false && this.pcView === true) {
        return this.router.navigateByUrl('/signIn-web');
      }
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

  // 取得使用者ip位址-kidin-1090521
  getClientIpaddress () {
    this.getClientIp.requestJsonp('https://api.ipify.org', 'format=jsonp', 'callback').subscribe(res => {
      this.ip = (res as any).ip;
    });

  }

  // 使用token取得使用者帳號資訊-kidin-1090514
  getUserInfo () {
    const body = {
      token: this.utils.getToken() || ''
    };

    this.userProfileService.getUserProfile(body).subscribe(res => {

      const profile = res.userProfile;
      if (profile.email) {
        this.editBody.newAccountType = 1;
        this.editBody.newEmail = profile.email;
      } else {
        this.editBody.newAccountType = 2;
        this.editBody.newCountryCode = profile.countryCode;
        this.editBody.newMobileNumber = profile.mobileNumber;
      }

    });

  }

  // 返回app-kidin-1090513
  turnBack () {
    if (this.appSys === 1) {
      (window as any).webkit.messageHandlers.closeWebView.postMessage('Close');
    } else if (this.appSys === 2) {
      (window as any).android.closeWebView('Close');
    } else {
      this.router.navigateByUrl('/dashboard/settings/account-info');
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
            regPWD = this.passwordReg;

      if (!regPWD.test(inputPassword)) {
        this.cue[obj] = 'universal_userAccount_passwordFormat';
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
        this.imgCaptcha.cue = 'universal_userAccount_errorCaptcha';
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

      this.signupService.fetchCaptcha(releaseBody, this.ip).subscribe(res => {
        if (res.processResult.resultCode === 200) {
          this.imgCaptcha.show = false;
          this.submit();
        } else {

          switch (res.processResult.apiReturnMessage) {
            case 'Found a wrong unlock key.':
              this.imgCaptcha.cue = 'universal_userAccount_errorCaptcha';
              this.sending = false;
              break;
            default:
              this.dialog.open(MessageBoxComponent, {
                hasBackdrop: true,
                data: {
                  title: 'Message',
                  body: `Error.<br />Please try again later.`,
                  confirmText: this.translate.instant(
                    'universal_operating_confirm'
                  ),
                  onConfirm: this.turnBack.bind(this)
                }
              });

              console.log(`${res.processResult.resultCode}: ${res.processResult.apiReturnMessage}`);
              break;
          }

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
          case 'Edit account fail, old password is not correct.':
            this.cue.oldPassword = 'universal_userAccount_notSamePassword';
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
          default:
            this.dialog.open(MessageBoxComponent, {
              hasBackdrop: true,
              data: {
                title: 'Message',
                body: `Error.<br />Please try again later.`,
                confirmText: this.translate.instant(
                  'universal_operating_confirm'
                ),
                onConfirm: this.turnBack.bind(this)
              }
            });

            console.log(`${res.processResult.resultCode}: ${res.processResult.apiReturnMessage}`);
        }

        this.sending = false;
      } else {
        this.newToken = res.editAccount.newToken;
        this.utils.writeToken(this.newToken);  // 直接在瀏覽器幫使用者登入
        this.userProfileService.refreshUserProfile({token: this.newToken});
        this.authService.setLoginStatus(true);
        this.finishEdit(this.newToken);
        this.sending = false;

        this.snackbar.open(
          `${this.translate.instant('universal_operating_modify')} ${this.translate.instant('universal_status_success')}`,
          'OK',
          { duration: 1000 }
        );

        setTimeout(() => {
          window.close();
          this.turnBack();
        }, 1000);

      }

    });

  }

  // 回傳新token-kidin-1090518
  finishEdit (token) {
    if (this.appSys === 1) {
      (window as any).webkit.messageHandlers.returnToken.postMessage(token);
    } else if (this.appSys === 2) {
      (window as any).android.returnToken(token);
    }

  }

  // 離開頁面則取消隱藏navbar-kidin-1090514
  ngOnDestroy () {
    this.utils.setHideNavbarStatus(false);
  }

}
