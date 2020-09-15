import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../../../../shared/services/auth.service';
import { SignupService } from '../../../services/signup.service';
import { UtilsService } from '@shared/services/utils.service';
import { MessageBoxComponent } from '@shared/components/message-box/message-box.component';
import { GetClientIpService } from '../../../../../shared/services/get-client-ip.service';

import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { formTest } from '../../../models/form-test';

interface RegCheck {
  email: RegExp;
  emailPass: boolean;
  password: RegExp;
  passwordPass: boolean;
  nickname: RegExp;
  nicknamePass: boolean;
  phone: RegExp;
  phonePass: boolean;
  countryCodePass: boolean;
}

@Component({
  selector: 'app-app-signup',
  templateUrl: './app-signup.component.html',
  styleUrls: ['./app-signup.component.scss']
})
export class AppSignupComponent implements OnInit, AfterViewInit, OnDestroy {

  private ngUnsubscribe = new Subject();

  readonly formReg = formTest;

  i18n = {
    email: '',
    password: '',
    nickname: ''
  };
  appSys = 0;  // 0:web, 1:ios, 2:android
  focusForm = '';
  displayPW = false;
  sending = false;
  dataIncomplete = true;
  needImgCaptcha = false;
  newToken: string;
  ip = '';
  pcView = false;

  // 驗證用
  regCheck: RegCheck = {
    email: this.formReg.email,
    emailPass: false,
    password: this.formReg.password,
    passwordPass: false,
    nickname: this.formReg.nickname,
    nicknamePass: false,
    phone: this.formReg.phone,
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
    private router: Router,
    public getClientIp: GetClientIpService,
    private authService: AuthService
  ) {
    translate.onLangChange.pipe(
      takeUntil(this.ngUnsubscribe)
    ).subscribe(() => {
      this.getTranslate();
    });

  }

  ngOnInit(): void {
    this.getClientIpaddress();
    this.getTranslate();

    if (location.pathname.indexOf('web') > 0) {
      this.pcView = true;
      this.utils.setHideNavbarStatus(false);
    } else {
      this.pcView = false;
      this.utils.setHideNavbarStatus(true);

    }
  }

  /**
   * 因應ios嵌入webkit物件時間點較後面，故在此生命週期才判斷裝置平台
   * @author kidin-1090710
   */
  ngAfterViewInit(): void {
    if (this.pcView === false) {
      this.getAppId(location.search);
    }

  }

  /**
   * 待套件載入完成再取得多國語系翻譯
   * @author kidin-1090717
   */
  getTranslate(): void {
    this.translate.get('hollo word').pipe(
      takeUntil(this.ngUnsubscribe)
    ).subscribe(() => {
      this.i18n = {
        email: this.translate.instant('universal_userAccount_email'),
        password: this.translate.instant('universal_userAccount_password'),
        nickname: this.translate.instant('universal_userAccount_nickname')
      };

    });

  }

  /**
   * 返回app或導回登入頁
   * @author kidin-1090717
   */
  turnBack(): void {
    if (this.appSys === 1) {
      (window as any).webkit.messageHandlers.closeWebView.postMessage('Close');
    } else if (this.appSys === 2) {
      (window as any).android.closeWebView('Close');
    } else {

      if (this.pcView) {
        this.router.navigateByUrl('/signIn-web');
      } else {
        this.router.navigateByUrl('/signIn');
      }


    }

  }

  /**
   * 取得註冊來源平台、類型和ID
   * @param urlStr {string}
   * @author kidin-1090512
   */
  getAppId(urlStr: string): void {
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

  /**
   * 取得使用者ip位址
   * @author kidin-1090521
   */
  getClientIpaddress(): void {
    this.getClientIp.requestJsonp('https://api.ipify.org', 'format=jsonp', 'callback').subscribe(res => {
      this.ip = (res as any).ip;
    });

  }

  /**
   * 取得使用者選擇的帳號類型
   * @param e {string}
   * @author kidin-1090717
   */
  getAccountType(e: string): void {
    this.signupData.type = +e + 1;
    this.checkAll(this.regCheck);
  }

  /**
   * 確認使用者信箱格式
   * @param e {MouseEvent | KeyboardEvent}
   * @author kidin-1090511
   */
  checkEmail(e: any): void {
    if ((e.type === 'keypress' && e.code === 'Enter') || e.type === 'focusout') {
      const inputEmail = e.currentTarget.value;

      if (inputEmail.length === 0 || !this.regCheck.email.test(inputEmail)) {
        this.signupCue.email = 'errorFormat';
        this.regCheck.emailPass = false;
      } else {
        this.signupData.email = inputEmail;
        this.signupCue.email = '';
        this.regCheck.emailPass = true;
      }

      this.checkAll(this.regCheck);
    }

  }

  /**
   * 將使用者輸入的密碼進行隱藏
   * @author kidin-1090430
   */
  hidePassword(): void {
    const pwInputType = (<HTMLInputElement>document.getElementById('signupPW'));

    if (this.displayPW === true) {
      pwInputType.type = 'text';
    } else {
      pwInputType.type = 'password';
    }

  }

  /**
   * 顯示密碼
   * @author kidin-1090429
   */
  toggleDisplayPW(): void {
    if (this.displayPW === false) {
      this.displayPW = true;
    } else {
      this.displayPW = false;
    }

    this.hidePassword();
  }

  /**
   * 確認密碼格式
   * @param e {MouseEvent | KeyboardEvent}
   * @author kidin-1090511
   */
  checkPassword(e: any): void {
    if ((e.type === 'keypress' && e.code === 'Enter') || e.type === 'focusout') {
      const inputPassword = e.currentTarget.value;

      if (!this.regCheck.password.test(inputPassword)) {
        this.signupCue.password = 'errorFormat';
        this.regCheck.passwordPass = false;
      } else {
        this.signupData.password = inputPassword;
        this.signupCue.password = '';
        this.regCheck.passwordPass = true;
      }

      this.checkAll(this.regCheck);
    }

  }

  /**
   * 取得使用者輸入的國碼
   * @param countryCode {string}
   * @author kidin-1090504
   */
  onCodeChange(countryCode: string): void {
    this.signupData.countryCode = +countryCode;
    this.regCheck.countryCodePass = true;

    this.checkAll(this.regCheck);
  }

  /**
   * 取得使用者輸入的電話號碼
   * @param phoneNum {string}
   * @author kidin-1090717
   */
  getPhoneNum (phoneNum: string): void {
    if (phoneNum.length === 0) {
      this.regCheck.phonePass = false;
    } else {
      this.signupData.phone = +phoneNum;
      this.regCheck.phonePass = true;
    }

    this.checkAll(this.regCheck);
  }

  /**
   * 確認暱稱格式
   * @param e MouseEvent | KeyboardEvent
   * @author kidin-1090511
   */
  checkNickname (e: any) {
    if ((e.type === 'keypress' && e.code === 'Enter') || e.type === 'focusout') {
      this.signupData.nickname = this.trimWhiteSpace(e.currentTarget.value);

      if (!this.regCheck.nickname.test(this.signupData.nickname)) {
        this.signupCue.nickname = 'errorFormat';
        this.regCheck.nicknamePass = false;
      } else {
        this.signupCue.nickname = '';
        this.regCheck.nicknamePass = true;
      }

      this.checkAll(this.regCheck);
    }

  }

  /**
   * 去除前後空白
   * @param str {string}
   * @returns {string}
   * @author kidin-1090803
   */
  trimWhiteSpace(str: string): string {
    return str.replace(/(^[\s]*)|([\s]*$)/g, '');
  }

  /**
   * 確認是否填寫圖形驗證碼欄位
   * @param e {MouseEvent | KeyboardEvent}
   * @author kidin-1090514
   */
  checkImgCaptcha (e: any) {
    if ((e.type === 'keypress' && e.code === 'Enter') || e.type === 'focusout') {
      const inputImgCaptcha = e.currentTarget.value;

      if (inputImgCaptcha.length === 0) {
        this.signupCue.imgCaptcha = 'errorValue';
      } else {
        this.signupData.imgCaptcha = inputImgCaptcha;
        this.signupCue.imgCaptcha = '';
      }

      this.checkAll(this.regCheck);
    }

  }

  /**
   * 確認是否所有欄位皆已完成
   * @param check {object}
   * @author kidin-1090512
   */
  checkAll(check: RegCheck): void {
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

  /**
   * 進行註冊流程
   * @author kidin-1090429
   */
  submit(): void {
    this.sending = true;

    if (this.imgCaptcha.show) {
      const releaseBody = {
        unlockFlow: 2,
        unlockKey: this.signupData.imgCaptcha
      };

      this.signupService.fetchCaptcha(releaseBody, this.ip).subscribe(res => {
        if (res.processResult && res.processResult.resultCode === 200) {
          this.imgCaptcha.show = false;
          this.submit();
        } else {

          if (res.processResult) {

            switch (res.processResult.apiReturnMessage) {
              case 'Found a wrong unlock key.':
                this.signupCue.imgCaptcha = 'errorValue';
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

          } else {

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

            console.log(`${res.resultCode}: ${res.info}`);
          }

        }

      });
    } else {
      this.sendFormInfo();
    }

  }

  /**
   * 傳送註冊表單
   * @author kidin-1090514
   */
  sendFormInfo(): void {
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

    this.signupService.fetchRegister(body, this.ip).subscribe(res => {

      if (res.processResult && res.processResult.resultCode !== 200) {

        switch (res.processResult.apiReturnMessage) {
          case 'Register account is existing.':

            if (this.signupData.type === 1) {
              this.signupCue.email = 'accountRepeat';
            } else {
              this.signupCue.phone = 'accountRepeat';
            }

            break;
          case 'Register name is existing.':
            this.signupCue.nickname = 'nicknameRepeat';
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
                imgCode: `data:image/png;base64,${captchaRes.captcha.randomCodeImg}`
              };
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
            break;
        }

      } else if (res.resultCode && res.resultCode === 400) {
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

        console.log(`${res.resultCode}: ${res.info}`);
      } else {
        this.newToken = res.register.token;
        this.saveToken(this.newToken);
        this.authService.setLoginStatus(true);

        // web先強迫要啟用帳號，待app v2上架後拿掉此判斷-kidin-1090724
        if (!this.pcView) {
          const N = '\n';
          this.dialog.open(MessageBoxComponent, {
            hasBackdrop: true,
            disableClose: true,
            data: {
              title: 'Message',
              body: `${this.translate.instant('universal_status_success')} ${this.translate.instant('universal_userAccount_signUp')} ${
                N} ${this.translate.instant('universal_popUpMessage_continueExecution')} ${
                this.translate.instant('universal_deviceSetting_switch')} ${this.translate.instant('universal_userAccount_account')}?
              `,
              confirmText: this.translate.instant(
                'universal_operating_confirm'
              ),
              cancelText: this.translate.instant(
                'universal_operating_cancel'
              ),
              onCancel: this.finishSignup.bind(this),
              onConfirm: this.toEnableAccount.bind(this)
            }

          });

        } else {
          this.router.navigateByUrl(`/enableAccount-web`);
        }

      }

      this.sending = false;
    });

  }

  /**
   * 返回app並回傳token或導引至第一次登入頁面
   * @author kidin-1090513
   */
  finishSignup(): void {
    if (this.appSys === 1) {
      (window as any).webkit.messageHandlers.returnToken.postMessage(this.newToken);
      this.turnBack();
    } else if (this.appSys === 2) {
      (window as any).android.returnToken(this.newToken);
      this.turnBack();
    } else {

      if (this.pcView) {
        this.router.navigateByUrl('/firstLogin-web');
      } else {
        this.router.navigateByUrl('/firstLogin');
      }

    }

  }

  /**
   * 儲存token或將token傳回app
   * @param token {string}
   * @author kidin-1090717
   */
  saveToken(token: string): void {
    this.utils.writeToken(token);  // 直接在瀏覽器幫使用者登入

    if (this.appSys === 1) {
      (window as any).webkit.messageHandlers.returnToken.postMessage(token);
    } else if (this.appSys === 2) {
      (window as any).android.returnToken(token);
    }

  }

  /**
   * 轉導至啟用帳號頁面
   * @author kidin-1090513
   */
  toEnableAccount(): void {
    this.utils.setHideNavbarStatus(false);

    if (this.pcView === true) {
      this.router.navigateByUrl(`/enableAccount-web`);
    } else {
      this.router.navigateByUrl(`/enableAccount`);
    }

  }

  /**
   * 離開頁面則取消隱藏navbar和取消訂閱
   * @author kidin-1090717
   */
  ngOnDestroy(): void {
    this.utils.setHideNavbarStatus(false);
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();

  }


}
