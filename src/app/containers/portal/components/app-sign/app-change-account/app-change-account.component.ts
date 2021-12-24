import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { UtilsService } from '../../../../../shared/services/utils.service';
import { AuthService } from '../../../../../shared/services/auth.service';
import { UserProfileService } from '../../../../../shared/services/user-profile.service';
import { SignupService } from '../../../services/signup.service';
import { MessageBoxComponent } from '../../../../../shared/components/message-box/message-box.component';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { formTest } from '../../../../../shared/models/form-test';
import { AccountTypeEnum } from '../../../../dashboard/models/userProfileInfo';
import { GetClientIpService } from '../../../../../shared/services/get-client-ip.service';

@Component({
  selector: 'app-app-change-account',
  templateUrl: './app-change-account.component.html',
  styleUrls: ['./app-change-account.component.scss']
})
export class AppChangeAccountComponent implements OnInit, AfterViewInit, OnDestroy {

  private ngUnsubscribe = new Subject();

  readonly formReg = formTest;

  i18n = {
    account: '',
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
    account: ''
  };

  accountInfo = {
    oldType: 1,
    oldAccount: ''
  };

  // 驗證用
  regCheck = {
    email: this.formReg.email,
    emailPass: false,
    password: this.formReg.password,
    passwordPass: false,
    countryCodePass: false
  };

  // 惡意註冊圖碼解鎖
  imgCaptcha = {
    show: false,
    imgCode: '',
    code: '',
    cue: '',
    placeholder: ''
  };

  accountType = AccountTypeEnum.email;
  constructor(
    private translate: TranslateService,
    private utils: UtilsService,
    private authService: AuthService,
    private signupService: SignupService,
    private userProfileService: UserProfileService,
    private dialog: MatDialog,
    private router: Router,
    private getClientIp: GetClientIpService
  ) {
    translate.onLangChange.pipe(
      takeUntil(this.ngUnsubscribe)
    ).subscribe(() => {
      this.getTranslate();
    });

  }

  ngOnInit() {
    this.getUrlString(location.search);
    this.getUserInfo();
    this.getTranslate();
    this.getClientIpaddress();
    if (location.pathname.indexOf('web') > 0) {
      this.pcView = true;
      this.utils.setHideNavbarStatus(false);
    } else {
      this.pcView = false;
      this.utils.setHideNavbarStatus(true);
    }

    // 在首次登入頁面按下登出時，跳轉回登入頁-kidin-1090109(bug575)
    this.authService.getLoginStatus().pipe(
      takeUntil(this.ngUnsubscribe)
    ).subscribe(res => {
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

  // 取得多國語系翻譯-kidin-1090620
  getTranslate () {
    this.translate.get('hollo word').pipe(
      takeUntil(this.ngUnsubscribe)
    ).subscribe(() => {
      this.i18n = {
        account: this.translate.instant('universal_userAccount_emailPerPhone'),
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

  // 取得使用者ip位址-kidin-1090521
  getClientIpaddress () {
    this.getClientIp.requestJsonp('https://api.ipify.org', 'format=jsonp', 'callback').subscribe(res => {
      this.ip = (res as any).ip;
    });

  }

  // 使用token取得使用者帳號資訊-kidin-1090514
  getUserInfo () {
    const body = {
      token: this.editBody.token || ''
    };

    this.userProfileService.getUserProfile(body).subscribe(res => {
      if (this.utils.checkRes(res)) {
        const { signIn: { accountType }, userProfile } = res;
        this.accountType = accountType;
        if (accountType === AccountTypeEnum.email) {
          this.accountInfo = {
            oldType: 1,
            oldAccount: userProfile.email
          };
        } else {
          this.accountInfo = {
            oldType: 2,
            oldAccount: `+${userProfile.countryCode} ${userProfile.mobileNumber}`
          };

        }

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

      window.close();
      // 若無法關閉視窗就導回登入頁
      if (this.pcView === true) {
        this.router.navigateByUrl('/signIn-web');
      } else {
        this.router.navigateByUrl('/signIn');
      }

    }

  }

  /**
   * 變更帳號成功後關閉視窗並重新整理
   * @author kidin-1091229
   */
  closeWindow() {
    if (this.appSys === 1) {
      (window as any).webkit.messageHandlers.closeWebView.postMessage('Close');
    } else if (this.appSys === 2) {
      (window as any).android.closeWebView('Close');
    } else {

      window.close();
      window.opener.location.reload();
      // 若無法關閉視窗就導回登入頁
      if (this.pcView === true) {
        this.router.navigateByUrl('/signIn-web');
      } else {
        this.router.navigateByUrl('/signIn');
      }

    }

  }

  // 判斷使用者輸入的帳號切換帳號類型-kidin-1090518
  determineAccountType(e: KeyboardEvent) {
    const account = (e as any).currentTarget.value;
    if (e.key.length === 1 || e.key === 'Backspace') {
     
      if (e.key === 'Backspace') {
        const value = account.slice(0, account.length - 1);
        if (value.length > 0 && this.formReg.number.test(value)) {
          this.editBody.newAccountType = 2;
        } else {
          this.editBody.newAccountType = 1;
        }
  
      } else if (this.formReg.number.test(account) && this.formReg.number.test(e.key)) {
        this.editBody.newAccountType = 2;
      } else if (!this.formReg.number.test(e.key)) {
        this.editBody.newAccountType = 1;
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
        this.editBody.newAccountType = 2;
        this.cue.account = '';
        this.editBody.newMobileNumber = account;
        this.checkAll(this.regCheck);
      } else {
        this.editBody.newAccountType = 1;
        this.editBody.newEmail = account;
        this.checkEmail(this.editBody.newEmail);
      }

    } else {
      this.editBody.newAccountType = 1;
      this.cue.account = 'universal_status_wrongFormat';
    }

  }

  // 確認使用者信箱格式-kidin-1090511
  checkEmail (email: string) {
    if (email.length === 0 || !this.regCheck.email.test(email)) {
      this.cue.account = 'universal_status_wrongFormat';
      this.regCheck.emailPass = false;
    } else {
      this.cue.account = '';
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
    this.cue.account = '';
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

      if (!check.countryCodePass) {
        this.cue.account = 'universal_userAccount_countryRegionCode';
        this.dataIncomplete = true;
      } else if (!check.passwordPass || (this.imgCaptcha.show && this.imgCaptcha.code.length === 0)) {
        this.dataIncomplete = true;
      } else {
        this.cue.account = '';
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
        const {
          processResult,
          resultCode: resCode,
          apiCode: resApiCode,
          resultMessage: resMsg
        } = res as any;
        if (!processResult) {
          this.utils.handleError(resCode, resApiCode, resMsg);
        } else {
          const { resultCode, apiReturnMessage } = processResult;
          if (resultCode === 200) {
            this.imgCaptcha.show = false;
            this.submit();
          } else {

            switch (apiReturnMessage) {
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

                console.error(`${resultCode}: ${apiReturnMessage}`);
                break;
            }
            
          }

        }

      });
    } else {
      this.sendFormInfo();
    }

  }

  // 傳送變更表單-kidin-1090514
  sendFormInfo () {
    this.userProfileService.fetchEditAccountInfo(this.editBody, this.ip).subscribe(res => {
      const {
        processResult,
        resultCode: resCode,
        apiCode: resApiCode,
        resultMessage: resMsg
      } = res as any;
      if (!processResult) {
        this.utils.handleError(resCode, resApiCode, resMsg);
      } else {
        const { resultCode, apiReturnMessage, imgLockCode } = processResult;
        if (resultCode !== 200) {

          switch (apiReturnMessage) {
            case 'Change account is existing.':
              this.cue.account = 'accountRepeat';
              break;
            case 'Change account fail, old password is not correct.':
              this.cue.password = 'universal_userAccount_notSamePassword';
              break;
            case 'Found attack, update status to lock!':
            case 'Found lock!':
              const captchaBody = {
                unlockFlow: 1,
                imgLockCode: imgLockCode
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

              console.error(`${resultCode}: ${apiReturnMessage}`);
              break;
          }

        } else {
          this.newToken = res.editAccount.newToken;
          this.utils.writeToken(this.newToken);  // 直接在瀏覽器幫使用者登入
          this.userProfileService.refreshUserProfile({token: this.newToken});
          this.authService.setLoginStatus(true);

          if (this.appSys === 1) {
            (window as any).webkit.messageHandlers.returnToken.postMessage(this.newToken);
          } else if (this.appSys === 2) {
            (window as any).android.returnToken(this.newToken);
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
              onCancel: this.closeWindow.bind(this),
              onConfirm: this.toEnableAccount.bind(this)
            }
          });

        }

      }

      this.sending = false;
    });

  }

  // 轉導至啟用帳號頁面-kidin-1090513
  toEnableAccount () {
    this.utils.setHideNavbarStatus(false);
    this.router.navigateByUrl(`/enableAccount`);
  }

  // 離開頁面則取消隱藏navbar-kidin-1090514
  ngOnDestroy () {
    this.utils.setHideNavbarStatus(false);
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }


}
