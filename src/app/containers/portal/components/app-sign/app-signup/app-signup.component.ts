import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../../../../shared/services/auth.service';
import { SignupService } from '../../../services/signup.service';
import { UtilsService } from '@shared/services/utils.service';
import { MessageBoxComponent } from '@shared/components/message-box/message-box.component';
import { GetClientIpService } from '../../../../../shared/services/get-client-ip.service';

import { fromEvent, Subscription, Subject } from 'rxjs';
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
    account: '',
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
  agreeTerms = false;
  termsText = '';
  showTerms = <'termsConditions' | 'privacyPolicy' | null>null;
  termsRxEvent = new Subscription();
  privacyRxEvent = new Subscription();
  termsLink: string;
  debounce = false;

  // 驗證用
  regCheck: RegCheck = {
    email: this.formReg.email,
    emailPass: false,
    password: this.formReg.password,
    passwordPass: false,
    nickname: this.formReg.nickname,
    nicknamePass: false,
    countryCodePass: false
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
    account: '',
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
    this.translate.get('hellow world').pipe(
      takeUntil(this.ngUnsubscribe)
    ).subscribe(() => {
      this.i18n = {
        account: this.translate.instant('universal_userAccount_emailPerPhone'),
        password: this.translate.instant('universal_userAccount_password'),
        nickname: this.translate.instant('universal_userAccount_nickname')
      };

      this.createMainContent();
    });

  }

  /**
   * 建立條款顯示內容
   * @author kidin-1091216
   */
  createMainContent() {
    const mainContent = document.getElementById('mainContent');
    if (mainContent) {
      mainContent.innerHTML = `${this.translate.instant('universal_userAccount_clauseContentPage1')
        }<span id="terms" style="color: rgba(0, 123, 255, 1);">『${
          this.translate.instant('universal_userAccount_clause')
        }』</span>、<span id="privacy" style="color: rgba(0, 123, 255, 1);">『${
          this.translate.instant('universal_userAccount_privacyStatement')
        }』</span>${
          this.translate.instant('universal_userAccount_clauseContentPage2')
        }`.replace(/\n/gm, '');

      this.listenClickTerms();

    }

  }

  /**
   * 監聽條款、隱私權點擊事件
   * @author kidin-1091209
   */
  listenClickTerms() {

    setTimeout(() => {
      const termsLink = document.getElementById('terms'),
            privacyLink = document.getElementById('privacy'),
            termsClickEvent = fromEvent(termsLink, 'click'),
            privacyClickEvent = fromEvent(privacyLink, 'click');
      
      this.termsRxEvent = termsClickEvent.pipe(
        takeUntil(this.ngUnsubscribe)
      ).subscribe(e => {
        this.handleShowTerms('termsConditions');
      })

      this.privacyRxEvent = privacyClickEvent.pipe(
        takeUntil(this.ngUnsubscribe)
      ).subscribe(e => {
        this.handleShowTerms('privacyPolicy');
      })

    });

  }

  /**
   * 處理顯示條款或隱私選詳細頁面
   * @param action {'termsConditions' | 'privacyPolicy' | null}
   * @author kidin-1091208
   */
  handleShowTerms(action: 'termsConditions' | 'privacyPolicy' | null) {
    if (action !== null) {

      let lang: string;
      if ((window as any).android) {
        lang = this.getUrlLanguageString(location.search);
      } else {
        lang = navigator.language.toLowerCase();
      }

      switch(lang) {
        case 'zh-tw':
          this.termsLink = `${location.origin}/app/public_html/appHelp/zh-TW/${action}.html`;
          break;
        case 'zh-cn':
          this.termsLink = `${location.origin}/app/public_html/appHelp/zh-CN/${action}.html`;
          break;
        case 'pt-br':
          this.termsLink = `${location.origin}/app/public_html/appHelp/pt-BR/${action}.html`;
          break;
        default:
          this.termsLink = `${location.origin}/app/public_html/appHelp/en-US/${action}.html`;
          break;
      }

    }

    this.showTerms = action;
    return false;
  }

  /**
   * 從網址取得語系
   * @param str {string}-query string
   * @author kidin-1091222
   */
  getUrlLanguageString(str: string) {
    if (navigator && navigator.language) {
      return navigator.language.toLowerCase();
    } else if (str.indexOf('l=') > -1) {
      const tempStr = str.split('l=')[1];
      let lan: string;
      if (tempStr.indexOf('&') > -1) {
        lan = tempStr.split('&')[0].toLowerCase();
      } else {
        lan = tempStr.toLowerCase();
      }

      switch (lan) {
        case 'zh-tw':
        case 'zh-cn':
        case 'en-us':
        case 'es-es':
        case 'de-de':
        case 'fr-fr':
        case 'it-it':
        case 'pt-pt':
        case 'pt-br':
          return lan;
        default:
          return 'en-us';
      }

    } else {
      return 'en-us';
    }

  }

  /**
   * 返回app或導回登入頁
   * @author kidin-1090717
   */
  turnBack(): void {
    if (this.showTerms !== null) {
      this.showTerms = null;

      // 避免關閉條款時，不小心連點而關閉webview
      this.debounce = true;
      setTimeout(() => {
        this.debounce = false
      }, 250);

    } else if (!this.debounce) {

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

  // 判斷使用者輸入的帳號切換帳號類型-kidin-1090518
  determineAccountType(e: any) {
    const account = e.currentTarget.value;

    if (e.key.length === 1 || e.key === 'Backspace') {

      if (e.key === 'Backspace') {
        const value = account.slice(0, account.length - 1);
        if (value.length > 0 && this.formReg.number.test(value)) {
          this.signupData.type = 2;
        } else {
          this.signupData.type = 1;
        }
  
      } else if (this.formReg.number.test(account) && this.formReg.number.test(e.key)) {
        this.signupData.type = 2;
      } else if (!this.formReg.number.test(e.key)) {
        this.signupData.type = 1;
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
        this.signupData.type = 2;
        this.signupCue.account = '';
        this.signupData.phone = account;
        this.checkAll(this.regCheck);
      } else {
        this.signupData.type = 1;
        this.signupData.email = account;
        this.checkEmail(this.signupData.email);
      }

    } else {
      this.signupData.type = 1;
      this.signupCue.account = 'universal_status_wrongFormat';
    }

  }

  /**
   * 確認使用者信箱格式
   * @param email {string}
   * @author kidin-1090511
   */
  checkEmail(email: string): void {
    if (email.length === 0 || !this.regCheck.email.test(email)) {
      this.signupCue.account = 'universal_status_wrongFormat';
      this.regCheck.emailPass = false;
    } else {
      this.signupData.email = email;
      this.signupCue.account = '';
      this.regCheck.emailPass = true;
    }

    this.checkAll(this.regCheck);
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
    this.signupCue.account = '';

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

      if (!check.countryCodePass) {
        this.signupCue.account = 'universal_userAccount_countryRegionCode';
        this.dataIncomplete = true;
      } else if (!check.passwordPass
        || !check.nicknamePass
        || (this.imgCaptcha.show && this.signupData.imgCaptcha.length === 0)
      ) {
        this.dataIncomplete = true;
      } else {
        this.signupCue.account = '';
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
            this.signupCue.account = 'accountRepeat';
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

        // 若有目標導向網址，則跳過詢問啟用步驟
        if (this.authService.backUrl.length > 0) {
          this.dialog.open(MessageBoxComponent, {
            hasBackdrop: true,
            disableClose: true,
            data: {
              title: 'Message',
              body: `${this.translate.instant('universal_status_success')} ${this.translate.instant('universal_userAccount_signUp')}`,
              confirmText: this.translate.instant(
                'universal_operating_confirm'
              ),
              onConfirm: this.finishSignup.bind(this)
            }

          });
          
        } else {
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
   * 處理使用者點選同意或不同意條款和隱私權聲明
   * @param action {boolean}-同意/不同意
   * @author kidin-1091208
   */
  handleAgreeTerms(action: boolean) {
    this.agreeTerms = action;
    if (!action) {
      this.turnBack();
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
