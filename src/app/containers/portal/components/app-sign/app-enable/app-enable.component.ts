import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { UtilsService } from '@shared/services/utils.service';
import { SignupService } from '../../../services/signup.service';
import { UserProfileService } from '../../../../../shared/services/user-profile.service';
import { UserInfoService } from '../../../../dashboard/services/userInfo.service';
import { MessageBoxComponent } from '@shared/components/message-box/message-box.component';
import { GetClientIpService } from '../../../../../shared/services/get-client-ip.service';
import { AuthService } from '@shared/services/auth.service';

import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';

const errorMsg = 'Error!<br /> Please try again later.';

@Component({
  selector: 'app-app-enable',
  templateUrl: './app-enable.component.html',
  styleUrls: ['./app-enable.component.scss']
})
export class AppEnableComponent implements OnInit, AfterViewInit, OnDestroy {

  private ngUnsubscribe = new Subject();

  sending = false;
  ip = '';
  pcView = false;

  accountInfo = {
    type: 1,  // 1：信箱 2：手機
    account: 'Please wait...',
    id: 0
  };

  appInfo = {
    sys: 0,  // 0: web, 1: ios, 2: android
    token: '',
    project: 0  // 0.webCenter、1.alaConnect、2alaCloudRun、3.alaTrainLive、4.alaFitness
  };

  phoneCaptcha = {
    cue: '',
    value: '',
    placeholder: ''
  };

  logMessage = {
    enable: '',
    success: '',
    confirm: ''
  };

  // 由email連結得到的參數
  emailLinkString = {
    enableAccountFlow: 0,
    userId: 0,
    verificationCode: '',
    project: 0
  };

  // 惡意攻擊圖碼解鎖
  imgCaptcha = {
    show: false,
    imgCode: '',
    cue: '',
    code: ''
  };

  timeCount = 30;
  sendingPhoneCaptcha = false;

  constructor(
    private translate: TranslateService,
    private utils: UtilsService,
    private signupService: SignupService,
    private authService: AuthService,
    private userProfileService: UserProfileService,
    private userInfoService: UserInfoService,
    private dialog: MatDialog,
    private router: Router,
    public getClientIp: GetClientIpService
  ) {
    translate.onLangChange.pipe(
      takeUntil(this.ngUnsubscribe)
    ).subscribe(() => {
      this.createPlaceholder();
    });
  }

  ngOnInit() {
    this.createPlaceholder();
    this.getClientIpaddress();

    if (location.pathname.indexOf('web') > 0) {
      this.pcView = true;
      this.utils.setHideNavbarStatus(false);
    } else {
      this.pcView = false;
      this.utils.setHideNavbarStatus(true);
    }

    this.getUrlString(location.search);
    this.getUserInfo();
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

  // 確認ngx translate套件已經載入再產生翻譯-kidin-1090430
  createPlaceholder () {

    this.translate.get('hellow world').pipe(
      takeUntil(this.ngUnsubscribe)
    ).subscribe(() => {
      this.phoneCaptcha.placeholder = this.translate.instant('universal_userAccount_phoneCaptcha');
      this.logMessage = {
        enable: this.translate.instant('universal_deviceSetting_switch'),
        success: this.translate.instant('universal_status_success'),
        confirm: this.translate.instant('universal_operating_confirm')
      };

    });

  }

  // 取得裝置平台-kidin-1090518
  getDeviceSys () {
    if ((window as any).webkit) {
      this.appInfo.sys = 1;
    } else if ((window as any).android) {
      this.appInfo.sys = 2;
    } else {
      this.appInfo.sys = 0;
    }
  }

  // 取得url query string和token-kidin-1090514
  getUrlString (urlStr) {

    const query = urlStr.replace('?', '').split('&');

    for (let i = 0; i < query.length; i++) {

      const queryKey = query[i].split('=')[0];
      switch (queryKey) {
        case 'tk':
          this.appInfo.token = query[i].split('=')[1];
          break;
        case 'p':
          this.appInfo.project = +query[i].split('=')[1];
          this.emailLinkString.project = +query[i].split('=')[1];

          if (+query[i].split('=')[1] === 0) {
            this.pcView = true;
          }

          break;
        case 'eaf':
          this.emailLinkString.enableAccountFlow = +query[i].split('=')[1];
          break;
        case 'ui':
          this.emailLinkString.userId = +query[i].split('=')[1];
          break;
        case 'vc':
          this.emailLinkString.verificationCode = query[i].split('=')[1];
          break;
      }

    }

    if (this.appInfo.token === '') {
      this.appInfo.token = this.utils.getToken() || '';
    }

    if (this.emailLinkString.enableAccountFlow !== 0) {
      this.emailEnable(this.emailLinkString);
    }

  }

  // 使用token取得使用者帳號資訊-kidin-1090514
  getUserInfo () {
    if (this.appInfo.token !== '') {
      const body = {
        token: this.appInfo.token || ''
      };

      this.userProfileService.getUserProfile(body).subscribe(res => {

        const profile = res.userProfile;
        if (profile.email) {
          this.accountInfo = {
            type: 1,
            account: profile.email,
            id: profile.userIdk
          };
        } else {
          this.accountInfo = {
            type: 2,
            account: `+${profile.countryCode} ${profile.mobileNumber}`,
            id: profile.userId
          };

          this.reciprocal();
        }

      });

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
    if (this.appInfo.sys === 1) {
      (window as any).webkit.messageHandlers.closeWebView.postMessage('Close');
    } else if (this.appInfo.sys === 2) {
      (window as any).android.closeWebView('Close');
    } else {

      window.close();
      if (history.length >= 2) {  // 可能已編輯過帳號，故需重整頁面
        window.onunload = this.refreshParent;
      }

      // 若無法關閉視窗就導回登入頁
      if (this.pcView === true) {
        this.router.navigateByUrl('/signIn-web');
      } else {
        this.router.navigateByUrl('/signIn');
      }

    }

  }

  // 倒數計時倒數計時並取得server手機驗證碼-kidin-1090519
  reciprocal () {

    if (this.imgCaptcha.show) {
      this.removeCaptcha('reciprocal');
    } else {

      this.sendingPhoneCaptcha = true;

      const body = {
        enableAccountFlow: 1,
        token: this.appInfo.token,
        project: this.appInfo.project
      };

      this.userInfoService.fetchEnableAccount(body, this.ip).subscribe(res => {

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
                  code: ''
                };
              });

              this.sendingPhoneCaptcha = false;
              break;

            default:
              this.showMsgBox(errorMsg, 'turnBack');
              console.error(`${res.processResult.resultCode}: ${res.processResult.apiReturnMessage}`);
              break;
          }

        } else if (resultInfo.resultCode === 200) {
          this.translate.get('hellow world').pipe(
            takeUntil(this.ngUnsubscribe)
          ).subscribe(() => {
            const msg = this.translate.instant('universal_userAccount_sendSmsSuccess');
            this.showMsgBox(msg, 'none');

            const btnInterval = setInterval(() => {
              this.timeCount--;

              if (this.timeCount === 0) {
                this.sendingPhoneCaptcha = false;
                this.timeCount = 30;

                // 設any處理typescript報錯：Argument of type 'Timer' is not assignable to parameter of type 'number'-kidin-1090515
                window.clearInterval(btnInterval as any);
              }

            }, 1000);

          });

        }

      });

    }

  }

  // 確認手機驗證碼是否符合-kidin-1090515
  checkPhoneCaptcha (e) {
    if ((e.type === 'keypress' && e.code === 'Enter') || e.type === 'focusout') {
      const inputPhoneCaptcha = e.currentTarget.value;
      if (inputPhoneCaptcha.length < 6) {
        this.phoneCaptcha.cue = 'universal_userAccount_errorCaptcha';
      } else {
        this.phoneCaptcha.value = inputPhoneCaptcha;
        this.phoneCaptcha.cue = '';
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

  // 進行啟用帳號流程-kidin-1090515
  submit () {

    if (this.imgCaptcha.show) {
      this.removeCaptcha('submit');
    } else {
      this.sending = true;

      const body = {
        enableAccountFlow: 2,
        token: this.appInfo.token,
        userId: this.accountInfo.id,
        project: this.appInfo.project
      };

      if (this.accountInfo.type === 2) {
        (body as any).verificationCode = this.phoneCaptcha.value;
      } else {
        body.enableAccountFlow = 1;
      }

      this.signupService.fetchEnableAccount(body, this.ip).subscribe(res => {

        if (res.processResult.resultCode !== 200) {
          let msgBody;
          switch (res.processResult.apiReturnMessage) {
            case `Post fail, parmameter 'project' or 'token' or 'userId' error.`:
            case `Post fail, check 'userId' error with verification code.`:
              msgBody = this.translate.instant('universal_userAccount_errorCaptcha');
              this.showMsgBox(msgBody, 'none');
              break;
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
                  code: ''
                };
              });

              break;
            default:
              msgBody = errorMsg;
              console.error(`${res.processResult.resultCode}: ${res.processResult.apiReturnMessage}`);
              this.showMsgBox(errorMsg, 'turnBack');
              break;
          }

        } else {

          if (this.accountInfo.type === 1) {
            const msgBody = this.translate.instant('universal_userAccount_sendCaptchaChackEmail');
            this.showMsgBox(msgBody, 'enableSuccess');
          } else {
            const msgBody = `${this.logMessage.enable} ${this.logMessage.success}`;
            this.showMsgBox(msgBody, 'enableSuccess');
          }

        }

        this.sending = false;
      });

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
            this.imgCaptcha.cue = 'universal_userAccount_errorCaptcha';
            this.sending = false;
            break;
          default:
            this.dialog.open(MessageBoxComponent, {
              hasBackdrop: true,
              data: {
                title: 'Message',
                body: `Error.<br />Please try again later.`,
                confirmText: this.logMessage.confirm,
                onConfirm: this.turnBack.bind(this)
              }
            });

            console.error(`${res.processResult.resultCode}: ${res.processResult.apiReturnMessage}`);
            break;
        }

      }

    });

  }

  // 點擊email認證信後送出驗證碼給server驗證-kidin-1090518
  emailEnable (body) {
    if (
      this.logMessage.enable !== ''
      && this.logMessage.success !== ''
      && this.logMessage.confirm !== ''
    ) {
      this.sending = true;

      this.signupService.fetchEnableAccount(body, this.ip).subscribe(res => {

        let msgBody;
        if (res.processResult.resultCode !== 200) {

          switch (res.processResult.apiReturnMessage) {
            case 'Enable account fail, account was enabled.':  // 已啟用後再次點擊啟用信件，則當作啟用成功-kidin-1090520
              msgBody = `${this.logMessage.enable} ${this.logMessage.success}`;
              this.showMsgBox(msgBody, 'enableSuccess');
              break;
            default:
              msgBody = errorMsg;
              console.error(`${res.processResult.resultCode}: ${res.processResult.apiReturnMessage}`);
              this.showMsgBox(msgBody, 'turnBack');
              break;
          }

        } else {
          msgBody = `${this.logMessage.enable} ${this.logMessage.success}`;
          this.showMsgBox(msgBody, 'enableSuccess');
        }

        this.sending = false;
      });

    } else {
      setTimeout(() => {
        this.emailEnable(body);
      }, 500);

    }

  }

  /**
   * 顯示彈跳視窗訊息
   * @param msg {string}-欲顯示的訊息
   * @param action {'turnBack' | 'enableSuccess' | 'none'}
   * @author kidin-1091229
   */
  showMsgBox (msg: string, action: 'turnBack' | 'enableSuccess' | 'none') {
    switch (action) {
      case 'turnBack':
        this.dialog.open(MessageBoxComponent, {
          hasBackdrop: true,
          disableClose: true,
          data: {
            title: 'Message',
            body: msg,
            confirmText: this.logMessage.confirm,
            onConfirm: this.turnBack.bind(this)
          }
        });
        
        break;

      case 'enableSuccess':
        this.dialog.open(MessageBoxComponent, {
          hasBackdrop: true,
          disableClose: true,
          data: {
            title: 'Message',
            body: msg,
            confirmText: this.logMessage.confirm,
            onConfirm: this.turnFirstLoginOrBack.bind(this)
          }
        });

        break;

      case 'none':
        this.dialog.open(MessageBoxComponent, {
          hasBackdrop: true,
          disableClose: true,
          data: {
            title: 'Message',
            body: msg,
            confirmText: this.logMessage.confirm
          }
        });

        break;
    }

  }

  /**
   * 啟用成功後導回app或第一次登入頁面
   * @author kidin-1091222
   */
  turnFirstLoginOrBack () {
    if (this.appInfo.sys === 1) {
      (window as any).webkit.messageHandlers.closeWebView.postMessage('Close');
    } else if (this.appInfo.sys === 2) {
      (window as any).android.closeWebView('Close');
    } else {

      window.close();
      window.onunload = this.refreshParent;
      // 若無法關閉瀏覽器則導回登入頁
      if (this.pcView === true) {
        this.router.navigateByUrl(this.utils.getToken() ? '/firstLogin-web' : '/signIn-web');
      } else {
        this.router.navigateByUrl(this.utils.getToken() ? '/firstLogin' : '/signIn');
      }

    }

  }

  /**
   * 關閉子視窗後將頁面重新整理
   * @author kidin-1091229
   */
  refreshParent() {
    window.opener.location.reload();
  }

  // 離開頁面則取消隱藏navbar-kidin-1090514
  ngOnDestroy () {
    this.utils.setHideNavbarStatus(false);
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();

  }

}
