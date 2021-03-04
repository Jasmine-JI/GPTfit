import { Component, OnInit, AfterViewInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { AppCode } from '../../../models/app-webview';
import { Router } from '@angular/router';
import { UtilsService } from '../../../../../shared/services/utils.service';
import { SignupService } from '../../../services/signup.service';
import moment from 'moment';
import { UserProfileInfo } from '../../../../dashboard/models/userProfileInfo';
import { UserProfileService } from '../../../../../shared/services/user-profile.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../../../../shared/services/auth.service';

@Component({
  selector: 'app-app-destroy-account',
  templateUrl: './app-destroy-account.component.html',
  styleUrls: ['./app-destroy-account.component.scss']
})
export class AppDestroyAccountComponent implements OnInit, AfterViewInit {

  private ngUnsubscribe = new Subject();

  // ui用到的各種flag
  uiFlag = {
    isLoading: false,
    isAnyGroupAdmin: false,
    cancelDestroyLoading: false,
    cancelDestroy: false,
    checkCompress: false,
    sendPhoneCaptcha: false,
    Countdown: false,
    verifyCodeError: false
  };

  appSys: AppCode = 0;
  token: string;
  user: any;
  verifyCode = '';
  timeCount = 30;
  deleteApplySuccessText = '';

  /**
   * 儲存api 1013相關資訊
   */
  destroyResp = {
    status: 0,
    destroyTimestamp: null
  };

  constructor(
    private utils: UtilsService,
    private router: Router,
    private signupService: SignupService,
    private userProfileService: UserProfileService,
    private translate: TranslateService,
    private auth: AuthService
  ) {}

  ngOnInit(): void {}

  /**
   * 因應ios嵌入webkit物件時間點較後面，故在此生命週期才判斷裝置平台
   * @author kidin-1090710
   */
  ngAfterViewInit () {
    this.getDeviceSys();
    this.getUserToken();
  }

  /**
   * 取得裝置平台
   * @author kidin-1091216
   */
  getDeviceSys () {
    this.utils.setHideNavbarStatus(true);
    if ((window as any).webkit) {
      this.appSys = 1;
    } else if ((window as any).android) {
      this.appSys = 2;
    } else {
      this.appSys = 0;
    }

  }

  /**
   * 取得使用者的token
   * @author kidin-1091217
   */
  getUserToken() {
    if (this.appSys === 0) {
      this.token = this.utils.getToken() || '';
    } else {
      
      if (location.search.indexOf('tk') > -1) {
        this.token = location.search.split('?tk=')[1];
      } else {
        this.token = '';
      }

    }

    if (this.token.length === 0) {
      this.auth.backUrl = location.href;
      this.router.navigateByUrl('/signIn');
    } else {
      this.getUserProfile();
      this.checkQueryString();
    }

  }

  /**
   * 確認是否為驗證信link轉導過來進行驗證流程
   * @author kidin-1091223
   */
  checkQueryString() {
    const queryString = location.search;
    if (queryString.length !== 0) {
      const queryArr = queryString.split('?')[1].split('&');
      let isVeificationFlow = false;
      for (let i = 0, queryLen = queryArr.length; i < queryLen; i++) {
        const str = queryArr[i].split('=')[0];
        if(str === 'vc') {
          isVeificationFlow = true;
          this.uiFlag.checkCompress = true;
          this.verifyIdentidy(queryArr[i].split('=')[1]);
          break;
        }

      };

      
      if (!isVeificationFlow) {
        this.checkDestroyStatus();
      }

    } else {
      this.checkDestroyStatus();
    }

  }

  /**
   * 取得使用者userProfile
   * @author kidin-1091223
   */
  getUserProfile() {
    if (this.appSys === 0) {
      this.userProfileService.getRxUserProfile().pipe(
        takeUntil(this.ngUnsubscribe)
      ).subscribe(res => {
        this.user = (res as UserProfileInfo);
      });

    } else {
      this.uiFlag.isLoading = true;
      this.userProfileService.getUserProfile({token: this.token}).subscribe(res => {
        this.uiFlag.isLoading = false;
        const processResult = res.processResult;
        if (processResult.resultCode !== 200) {
          console.log(`${processResult.resultCode}: Api ${processResult.apiCode} ${processResult.resultMessage}`);
        } else {
          this.user = res.userProfile;
        }

      });

    }

  }

  /**
   * 確認刪除帳號狀態
   * @author kidin-1091223
   */
  checkDestroyStatus() {
    if (this.token.length === 0) {
      this.turnBack();
    } else {
      const body = {
        token: this.token,
        flow: 1
      };

      this.uiFlag.isLoading = true;
      this.signupService.fetchDestroyAccount(body).subscribe(res => {
        this.uiFlag.isLoading = false;
        const processResult = res.processResult;
        if (processResult.resultCode !== 200) {
          console.log(`${processResult.resultCode}: Api ${processResult.apiCode} ${processResult.resultMessage}`);
        } else {
          this.destroyResp.status = res.status;

          if (res.status === 0) {
            this.checkoutIsGroupAdmin();
          } else if (res.status === 2) {
            this.destroyResp.destroyTimestamp = res.destroyTimestamp;
            const destroyDate = moment(res.destroyTimestamp * 1000).format('YYYY-MM-DD'),
                  destroyTime = moment(res.destroyTimestamp * 1000).format('HH:mm');
            this.getTranslate(destroyDate, destroyTime);
          }

        }

      });

    }

  }

  /**
   * 確認是否有任何群組管理員的身份，若無才可刪除帳號
   * @author kidin-1091223
   */
  checkoutIsGroupAdmin() {
    this.uiFlag.isLoading = true;
    this.userProfileService.getMemberAccessRight({token: this.token}).subscribe(res => {
      this.uiFlag.isLoading = false;
      if (res.resultCode !== 200) {
        console.log(`${res.resultCode}: Api ${res.apiCode} ${res.resultMessage}`);
      } else {

        if (
          res.info.groupAccessRight.some(_list => +_list.accessRight < 90)
        ) {
          this.translate.get('hellow world').pipe(
            takeUntil(this.ngUnsubscribe)
          ).subscribe(() => {
            const msg = this.translate.instant('universal_userAccount_adminDeleteAccount');
            this.utils.openAlert(msg);
          });

        }

      }

    });
    
  }

  /**
   * 申請撤銷帳號
   * @author kidin-1091223
   */
  applyDestroy() {
    const body = {
      token: this.token,
      flow: 2
    };

    this.uiFlag.isLoading = true;
    this.signupService.fetchDestroyAccount(body).subscribe(res => {
      this.uiFlag.isLoading = false;
      const processResult = res.processResult;
      if (processResult.resultCode !== 200) {
        console.log(`${processResult.resultCode}: Api ${processResult.apiCode} ${processResult.resultMessage}`);
      } else {
        this.destroyResp.status = res.status;

        if (this.user.countryCode) {
          this.translate.get('hellow world').pipe(
            takeUntil(this.ngUnsubscribe)
          ).subscribe(() => {
            const msg = this.translate.instant('universal_userAccount_sendSmsSuccess');
            this.utils.openAlert(msg);
          });

          this.countDown();
        } else {
          this.translate.get('hellow world').pipe(
            takeUntil(this.ngUnsubscribe)
          ).subscribe(() => {
            const msg = this.translate.instant('universal_userAccount_sendCaptchaChackEmail');
            this.utils.openAlert(msg);
          })
          
        }

      }

    });

  }

  /**
   * 點擊帳號驗證
   * @author kidin-1091228
   */
  submitVerifyCode() {
    this.verifyIdentidy(this.verifyCode);
  }

  /**
   * 驗證帳號
   * @param code {string}-驗證碼
   * @author kidin-1091223
   */
  verifyIdentidy(code: string) {
      const body = {
        token: this.token,
        flow: 3,
        verificationCode: code
      };

      this.uiFlag.isLoading = true;
      this.signupService.fetchDestroyAccount(body).subscribe(res => {
        this.uiFlag.isLoading = false;
        const processResult = res.processResult;
        if (!processResult && res.info.rtnMsg.indexOf('Exception: invalid literal for int() with base 10:') > -1) {
          this.uiFlag.verifyCodeError = true;
        } else if (!processResult && res.resultCode === 400) {
          const msg = 'Error! Please try again later.'
          this.utils.openAlert(msg);
        } else if (processResult.resultCode !== 200) {
          console.log(`${processResult.resultCode}: Api ${processResult.apiCode} ${processResult.resultMessage}`);
          if (processResult.apiReturnMessage === 'Destroy me fail, code was verified.') {
            this.uiFlag.checkCompress = false;
            this.translate.get('hellow world').pipe(
              takeUntil(this.ngUnsubscribe)
            ).subscribe(() => {
              const msg = this.translate.instant('universal_userAccount_linkHasExpired');
              this.utils.openAlert(msg);
            });

          } else if (processResult.apiReturnMessage === 'Destroy me fail, found verification code error.') {
            this.uiFlag.verifyCodeError = true;
          } else {
            this.checkDestroyStatus();
          }
          
        } else {
          this.uiFlag.verifyCodeError = false;
          this.destroyResp = {
            status: res.status,
            destroyTimestamp: res.destroyTimestamp,
          };

          const destroyDate = moment(res.destroyTimestamp * 1000).format('YYYY-MM-DD'),
                destroyTime = moment(res.destroyTimestamp * 1000).format('HH:mm');
          this.getTranslate(destroyDate, destroyTime);
        }

      });

  }

  /**
   * 取消銷毀帳號
   * @author kidin-1091223
   */
  cancelDestroy() {
    const body = {
      token: this.token,
      flow: 4
    };

    this.uiFlag.cancelDestroyLoading = true;
    this.signupService.fetchDestroyAccount(body).subscribe(res => {
      this.uiFlag.cancelDestroyLoading = false;
      const processResult = res.processResult;
      if (processResult.resultCode !== 200) {
        console.log(`${processResult.resultCode}: Api ${processResult.apiCode} ${processResult.resultMessage}`);
      } else {
        this.destroyResp.status = 0;
        this.uiFlag.cancelDestroy = true;
      }

    });

  }

  /**
   * 回上一頁或返回app
   * @author kidin-1091216
   */
  turnBack () {
    if (this.appSys === 1) {
      (window as any).webkit.messageHandlers.closeWebView.postMessage('Close');
    } else if (this.appSys === 2) {
      (window as any).android.closeWebView('Close');
    } else {
      window.close();
    }

  }

  /**
   * 使用者確認資料封存
   */
  handleCheckCompress() {
    this.uiFlag.checkCompress = !this.uiFlag.checkCompress;
  }

  /**
   * 儲存使用者輸入的驗證碼
   * @param e {Event}
   * @author kidin-1091224
   */
  handleVerifyCode(e: Event) {
    this.verifyCode = (e as any).target.value;
  }

  // 倒數計時倒數計時並取得server手機驗證碼-kidin-1090519
  countDown() {
    const btnInterval = setInterval(() => {
      this.timeCount--;

      if (this.timeCount === 0) {
        this.uiFlag.Countdown = false;
        this.timeCount = 30;

        // 設any處理typescript報錯：Argument of type 'Timer' is not assignable to parameter of type 'number'-kidin-1090515
        window.clearInterval(btnInterval as any);
      }

    }, 1000);

  }

  /**
   * 待多國語系套件載完後再取得翻譯
   * @param date {string}-刪除帳號的日期
   * @param time {string}-刪除帳號的時間
   * @author kidin-1091228
   */
  getTranslate(date: string, time: string) {
    this.translate.get('hellow world').pipe(
      takeUntil(this.ngUnsubscribe)
    ).subscribe(() => {
      this.deleteApplySuccessText = `${this.translate.instant('universal_userAccount_successfullyRequestedToDeleteAccount', {
        'yyyy-mm-dd': `<span class="date__time__warn">${date}</span>`,
        'HH:MM': `<span class="date__time__warn">${time}</span>`
      })}`;

    })

  }

  /**
   * 取消訂閱rxjs
   * @author kidin-1091223
   */
  ngOndestroy() {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

}