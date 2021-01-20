import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { UtilsService } from '@shared/services/utils.service';
import { AuthService } from '../../../../../shared/services/auth.service';
import { MessageBoxComponent } from '@shared/components/message-box/message-box.component';

import { Subscription } from 'rxjs';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { formTest } from '../../../models/form-test';


@Component({
  selector: 'app-app-signin',
  templateUrl: './app-signin.component.html',
  styleUrls: ['./app-signin.component.scss']
})
export class AppSigninComponent implements OnInit, AfterViewInit, OnDestroy {

  readonly formReg = formTest;

  subscription: Subscription[] = [];
  i18n = {
    account: '',
    email: '',
    password: ''
  };
  loginStatus = 'check';  // check: 等待登入; logging：登入中; success： 成功;
  displayPW = false;
  dataIncomplete = true;
  pcView = false;

  loginBody: any = {
    signInType: 1, // 1. 信箱 2. 手機 3. Token
    password: '',
  };

  cue = {
    account: '',
    password: '',
    signResult: ''
  };

  // 驗證用
  regCheck = {
    email: this.formReg.email,
    emailPass: false,
    countryCodePass: false,
    password: this.formReg.password,
    passwordPass: false
  };

  @ViewChild('accountInput') accountInput: ElementRef;
  @ViewChild('accountInput_web') accountInput_web: ElementRef;
  @ViewChild('password') passwordInput: ElementRef;
  @ViewChild('password_web') passwordInput_web: ElementRef;

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

    if (location.pathname.indexOf('web') > 0 || location.pathname.indexOf('signin') > 0) {
      this.pcView = true;
      this.utils.setHideNavbarStatus(false);
    } else {
      this.pcView = false;
      this.utils.setHideNavbarStatus(true);
    }

  }

  ngAfterViewInit() {
    if (this.pcView) {
      this.accountInput_web.nativeElement.focus();
    } else {
      this.accountInput.nativeElement.focus();
    }

  }

  // 取得多國語系翻譯-kidin-1090620
  getTranslate() {
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
  turnBack() {
    this.router.navigateByUrl('/');
  }

  // 判斷使用者輸入的帳號切換帳號類型-kidin-1090518
  determineAccountType(e: KeyboardEvent) {
    let account: string;
    if (this.pcView) {
      account = this.accountInput_web.nativeElement.value;
    } else {
      account = this.accountInput.nativeElement.value;
    }

    // 當使用者按下enter，則聚焦下一個欄位(使用e.key.length === 1 過濾功能鍵)
    if (e.key.length === 1 || e.key === 'Enter' || e.key === 'Backspace') {

      if (e.key === 'Enter') {
        this.handleNext({code: 'Enter'}, 'account');
      } else if (e.key === 'Backspace') {
        const value = account.slice(0, account.length - 1);
        if (value.length > 0 && this.formReg.number.test(value)) {
          this.loginBody.signInType = 2;
        } else {
          this.loginBody.signInType = 1;
        }

      } else if (this.formReg.number.test(account) && this.formReg.number.test(e.key)) {
        this.loginBody.signInType = 2;
      } else if (!this.formReg.number.test(e.key)) {
        this.loginBody.signInType = 1;
      }

    }

  }

  /**
   * 儲存使用者輸入的帳號
   * @param e {ChangeEvent}
   * @author kidin-1091006
   */
  saveAccount(e: Event) {
    let account: string;
    if (this.pcView) {
      account = this.accountInput_web.nativeElement.value;
    } else {
      account = this.accountInput.nativeElement.value;
    }

    if (account.length > 0) {
      if (this.formReg.number.test(account)) {
        this.loginBody.signInType = 2;
        this.cue.account = '';
        this.loginBody.mobileNumber = account;
        this.checkAll();

        if (this.loginBody.email) {
          delete this.loginBody.email;
        }

      } else {
        this.loginBody.signInType = 1;
        this.loginBody.email = account;
        this.checkEmail(this.loginBody.email);

        if (this.loginBody.mobileNumber) {
          delete this.loginBody.mobileNumber;
        }

      }

    } else {
      this.loginBody.signInType = 1;
      this.cue.account = 'universal_status_wrongFormat';
    }

  }

  /**
   * 去除手機號碼首個0
   * @author kidin-1091006
   */
  trimPhoneNumZero() {
    const phone =  this.loginBody.mobileNumber;
    if (this.loginBody.signInType === 2 && phone[0] === '0') {
      this.loginBody.mobileNumber = +phone.slice(1, phone.length);
    }
    
  }

  // 確認使用者信箱格式-kidin-1090511
  checkEmail(email: string) {
    if (this.loginBody.email.length === 0 || !this.regCheck.email.test(this.loginBody.email)) {
      this.cue.account = 'universal_status_wrongFormat';
      this.regCheck.emailPass = false;
    } else {
      this.cue.account = '';
      this.regCheck.emailPass = true;
    }

    this.checkAll();
  }

  // 取得使用者輸入的國碼-kidin-1090504
  onCodeChange(countryCode) {
    this.loginBody.countryCode = +countryCode;
    this.cue.account = '';
    this.regCheck.countryCodePass = true;

    this.checkAll();
  }

  // 將使用者輸入的密碼進行隱藏-kidin-1090430
  hidePassword() {
    const pwInputType = (<HTMLInputElement>document.getElementById('signupPW'));

    if (this.displayPW === true) {
      pwInputType.type = 'text';
    } else {
      pwInputType.type = 'password';
    }

  }

  // 顯示密碼-kidin-1090429
  toggleDisplayPW() {
    if (this.displayPW === false) {
      this.displayPW = true;
    } else {
      this.displayPW = false;
    }

    this.hidePassword();
  }

  // 確認密碼格式-kidin-1090511
  checkPassword(e) {
    if ((e.type === 'keypress' && e.code === 'Enter') || e.type === 'focusout' || e.type === 'change') {
      this.loginBody.password = e.currentTarget.value;
      if (!this.regCheck.password.test(this.loginBody.password)) {
        this.cue.password = 'universal_userAccount_passwordFormat';
        this.regCheck.passwordPass = false;
      } else {
        this.cue.password = '';
        this.regCheck.passwordPass = true;
      }
    }

    this.checkAll();
  }

  // 確認是否所有欄位皆已完成-kidin-1090512
  checkAll() {

    if (this.loginBody.signInType === 1 && !this.regCheck.emailPass) {
      this.dataIncomplete = true;
    } else if (this.loginBody.signInType === 2 && !this.regCheck.countryCodePass) {
      this.cue.account = 'universal_userAccount_countryRegionCode';
      this.dataIncomplete = true;
    } else if (!this.regCheck.passwordPass) {
      this.dataIncomplete = true;
    } else {
      this.trimPhoneNumZero();
      this.dataIncomplete = false;
    }

  }

  /**
   * 針對自動填入多檢查一次
   * @returns boolean
   * @author -kidin-1090810
   */
  doulbleCheck(): boolean {
    let pass = true;
    if (!this.formReg.password.test(this.loginBody.password)) {
      pass = false;
    }

    if (this.loginBody.email && this.formReg.email.test(this.loginBody.email)) {
      this.loginBody.signInType = 1;
    } else if (this.loginBody.mobileNumber && this.formReg.phone.test(this.loginBody.mobileNumber)) {
      this.loginBody.signInType = 2;
    } else {
      pass = false;
    }

    return pass;
  }

  // 登入-kidin-1090527
  login() {
    this.checkAll();
    if (this.doulbleCheck() || !this.dataIncomplete) {
      this.loginStatus = 'logging';
      this.authService.loginServerV2(this.loginBody).subscribe(res => {

        if (res.processResult.resultCode === 200) {
          this.cue.signResult = '';
          const token = res.signIn.token;
          this.utils.writeToken(token);
          this.authService.setLoginStatus(true);
          this.loginStatus = 'success';

          // 儲存國碼方便使用者下次登入
          if (this.loginBody.signInType === 2) {
            this.utils.setLocalStorageObject('countryCode', this.loginBody.countryCode);
          }

          if (location.search.indexOf('action') > -1) {
            this.navigateAssignPage(location.search);
          } else if (res.signIn.counter <= 1) {
            this.router.navigateByUrl('/firstLogin-web');
          } else if (this.authService.backUrl.length > 0) {
            location.href = this.authService.backUrl;
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
                  body: `Error.<br />Please try again later.`,
                  confirmText: this.translate.instant(
                    'universal_operating_confirm'
                  ),
                  onConfirm: this.turnBack.bind(this)
                }
              });

              break;
          }

          this.loginStatus = 'check';
        }

      });

    }

  }

  // 轉導至qrcode sign頁面-kidin-1090527
  navigateToQrcodeSign() {

    if (this.pcView === true) {
      this.router.navigateByUrl('/signInQrcode-web');
    } else {
      this.router.navigateByUrl('/signInQrcode');
    }

  }

  /**
   * 跳轉至指定頁面
   * @param queryString {string}
   */
  navigateAssignPage(queryString: string) {
    const queryArr = queryString.replace('?', '').split('&');
    if (queryArr.some(_query => _query.indexOf('action') > -1 && _query.indexOf('applyActivity') > -1)) {
      let fileName: string;
      queryArr.forEach(_query => {
        if (_query.indexOf('activity') > -1) {
          fileName = _query.split('=')[1];
        }

      });

      this.router.navigateByUrl(`/official-activity?file=${fileName}&action=applyActivity`);
    }

  }

  // 顯示註冊條款-kidin-1090529
  showPrivateMsg(e) {
    e.preventDefault();

    let text = '';
    if (navigator.language.toLowerCase() === 'pt-br') {
      text = `${this.translate.instant('universal_userAccount_clauseContentPage1')
        }<a target="_blank" href="${location.origin}/app/public_html/appHelp/pt-BR/termsConditions.html">『${
          this.translate.instant('universal_userAccount_clause')
        }』</a>、<a target="_blank" href="${location.origin}/app/public_html/appHelp/pt-BR/privacyPolicy.html">『${
          this.translate.instant('universal_userAccount_privacyStatement')
        }』</a>
        ${this.translate.instant('universal_userAccount_clauseContentPage2')
      }`.replace(/\n/gm, '');

    } else {

      const lan = this.utils.getLocalStorageObject('locale');
      switch (lan) {
        case 'zh-tw':
          text = `${this.translate.instant('universal_userAccount_clauseContentPage1')
            }<a target="_blank" href="${location.origin}/app/public_html/appHelp/zh-TW/termsConditions.html">『${
              this.translate.instant('universal_userAccount_clause')
            }』</a>、<a target="_blank" href="${location.origin}/app/public_html/appHelp/zh-TW/privacyPolicy.html">『${
              this.translate.instant('universal_userAccount_privacyStatement')}』</a>${
            this.translate.instant('universal_userAccount_clauseContentPage2')
          }`.replace(/\n/gm, '');
          break;
        case 'zh-cn':
          text = `${this.translate.instant('universal_userAccount_clauseContentPage1')
            }<a target="_blank" href="${location.origin}/app/public_html/appHelp/zh-CN/termsConditions.html">『${
              this.translate.instant('universal_userAccount_clause')
            }』</a>、<a target="_blank" href="${location.origin}/app/public_html/appHelp/zh-CN/privacyPolicy.html">『${
              this.translate.instant('universal_userAccount_privacyStatement')}』</a>${
            this.translate.instant('universal_userAccount_clauseContentPage2')
          }`.replace(/\n/gm, '');
          break;
        default:
          text = `${this.translate.instant('universal_userAccount_clauseContentPage1')
            }<a target="_blank" href="${location.origin}/app/public_html/appHelp/en-US/termsConditions.html">『${
            this.translate.instant('universal_userAccount_clause')
          }』</a>、<a target="_blank" href="${location.origin}/app/public_html/appHelp/en-US/privacyPolicy.html">『${
            this.translate.instant('universal_userAccount_privacyStatement')}』</a>${
            this.translate.instant('universal_userAccount_clauseContentPage2')
          }`.replace(/\n/gm, '');
          break;
      };

    }

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
  navigateToSignup() {
    this.router.navigateByUrl('/register-web');
  }

  /**
   * 當使用者按下enter時，進行下一步
   * @event keypress
   * @param e {KeyboardEvent}
   * @param column {string}-欄位
   * @author kidin-1090817
   */
  handleNext(e: any, column: string) {
    if (e !== null && e.code === 'Enter') {

      if (column !== 'password') {

        if (!this.pcView) {
          this.passwordInput.nativeElement.focus();
        } else {
          this.passwordInput_web.nativeElement.focus();
        }
  
      } else {

        const password = e.currentTarget.value;
        if (password.length > 0) {

          if (!this.pcView) {
            this.passwordInput.nativeElement.blur();
          } else {
            this.passwordInput_web.nativeElement.blur();
          }

          this.login();
        }

      }

    }

  }

  // 離開頁面則取消隱藏navbar和清除Interval-kidin-1090514
  ngOnDestroy() {
    this.utils.setHideNavbarStatus(false);
    this.subscription.forEach(_subscription => _subscription.unsubscribe());
  }

}
