import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { AuthService } from '../../../../../shared/services/auth.service';
import { UtilsService } from '../../../../../shared/services/utils.service';
import { SignupService } from '../../../services/signup.service';
import { UserProfileService } from '../../../../../shared/services/user-profile.service';
import { MessageBoxComponent } from '../../../../../shared/components/message-box/message-box.component';
import { GetClientIpService } from '../../../../../shared/services/get-client-ip.service';
import { Subject, Subscription, fromEvent, of } from 'rxjs';
import { takeUntil, tap, switchMap } from 'rxjs/operators';
import { TranslateService } from '@ngx-translate/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import moment from 'moment';
import { TFTViewMinWidth } from '../../../models/app-webview';

enum QrSignInFlow {
  submitGuid = 1,
  polling,
  login
}

type QrLoginStatus = 'check' | 'logging' | 'success';
const errorMsg = 'Error. Try again later.';

@Component({
  selector: 'app-app-qrcode-login',
  templateUrl: './app-qrcode-login.component.html',
  styleUrls: ['./app-qrcode-login.component.scss']
})
export class AppQrcodeLoginComponent implements OnInit, AfterViewInit, OnDestroy {
  private ngUnsubscribe = new Subject();
  private resizeSubscription = new Subscription();

  qrLoginStatus: QrLoginStatus = 'check';
  displayPage = 'login'; // login: 進行登入 ; showQrcode: 顯示qrcode;
  qrcodeTimeout = false;
  cue = '';
  guid = '';
  qrURL = '';
  ip = '';
  callIpCount = 0;
  currentTimeStamp = moment().valueOf();
  pcView = false;
  appSys = 0;
  mobileSize = window.innerWidth < TFTViewMinWidth;
  requestHeader = {};

  userInfo = {
    icon: '',
    name: ''
  };

  loginBody = {
    qrSignInFlow: QrSignInFlow.login,
    guid: '',
    token: ''
  };

  constructor(
    private translate: TranslateService,
    private utils: UtilsService,
    private signupService: SignupService,
    private userProfileService: UserProfileService,
    private auth: AuthService,
    private dialog: MatDialog,
    private router: Router,
    private getClientIp: GetClientIpService
  ) { }

  ngOnInit() {
    this.loginBody.token = this.utils.getToken() || '';
    this.getQueryString();
    this.checkPage(location.pathname);
    this.subscribeResizeEvent();
  }

  ngAfterViewInit() {
    if (this.pcView === false) {
      this.getAppId();
    }

  }

  /**
   * 從url取得header
   * @author kidin-1110114
   */
  getQueryString() {
    const query = this.utils.getUrlQueryStrings(location.search);
    this.requestHeader = {
      ...this.requestHeader,
      ...this.utils.headerKeyTranslate(query)
    };

  }

  /**
   * 訂閱頁面尺寸改變事件
   * @author kidin-1101230
   */
  subscribeResizeEvent() {
    const resizeEvent = fromEvent(window, 'resize');
    this.resizeSubscription = resizeEvent.pipe(
      takeUntil(this.ngUnsubscribe)
    ).subscribe(e => {
      this.mobileSize = window.innerWidth < TFTViewMinWidth;
    });

  }

  // 返回app-kidin-1090513
  turnBack () {
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
   * 根據url顯示該頁面
   * @param pathname {string}
   * @author kidin-1090720
   */
  checkPage(pathname: string): void {
    if (pathname === '/signInQrcode' || pathname === '/signInQrcode-web') {
      this.displayPage = 'showQrcode';
      if (this.checkFrequency()) {
        this.createLoginQrcode();
        this.waitQrcodeLogin();
      } else {
        this.translate.get('hello.world').pipe(
          takeUntil(this.ngUnsubscribe)
        ).subscribe(() => {
          this.cue = 'universal_userAccount_improperOperation';
        });

      }

    } else {
      this.setPageStyle(true);
      this.displayPage = 'login';
      if (this.loginBody.token.length === 0) {
        this.auth.backUrl = location.href;
        this.router.navigateByUrl('/signIn');
      } else {
        this.getUrlString(location.search);
        this.getUserInfo();
      }

    }

    if (pathname.indexOf('web') > 0) {
      this.pcView = true;
      this.setPageStyle(false);
    } else {
      this.pcView = false;
      this.setPageStyle(true);
    }

  }

  /**
   * 根據裝置設定頁面樣式
   * @param isPcView {boolean}-是否非行動裝置或TFT
   * @author kidin-1110113
   */
  setPageStyle(isPcView: boolean) {
    this.utils.setHideNavbarStatus(isPcView);
    this.utils.setDarkModeStatus(isPcView);
  }

  // 取得註冊來源平台、類型和ID-kidin-1090512
  getAppId () {
    if ((window as any).webkit) {
      this.appSys = 1;
    } else if ((window as any).android) {
      this.appSys = 2;
    } else {
      this.appSys = 0;
    }

    this.requestHeader = {
      deviceType: this.appSys,
      ...this.requestHeader
    };

  }

  // 取得使用者ip位址-kidin-1090521
  getClientIpaddress () {
    const { remoteAddr } = this.requestHeader as any;
    if (!remoteAddr) {
      return this.getClientIp.requestJsonp('https://api.ipify.org', 'format=jsonp', 'callback').pipe(
        tap(res => {
          this.ip = (res as any).ip;
          this.requestHeader = {
            ...this.requestHeader,
            remoteAddr: this.ip
          };
        })
      );

    } else {
      return of(this.requestHeader);
    }

  }

  // 創建qrcode並發送guid給server進行長輪詢-kidin-1090527
  createLoginQrcode () {
    this.createGuid();
    this.qrURL = `${location.origin}/qrSignIn?qsf=1&g=${this.guid}`;
  }

  // 創建guid-kidin-1090527
  createGuid () {
    const hexadecimalTimeStamp = this.currentTimeStamp.toString(16);
    let guid = '';
    for (let i = 0; i < 32 - hexadecimalTimeStamp.length; i++) {
      guid += (Math.floor(Math.random() * 16)).toString(16);
    }

    guid += hexadecimalTimeStamp;
    this.guid = `${guid.slice(0, 8)}-${guid.slice(8, 12)}-${guid.slice(12, 16)}-${guid.slice(16, 20)}-${guid.slice(20, 32)}`;
  }

  // 確認是否開啟過多次qrcode頁面-kidin-1090528
  checkFrequency () {
    const timeStampCount = this.utils.getLocalStorageObject('count');
    if (!timeStampCount) {
      this.utils.setLocalStorageObject('count', `${this.currentTimeStamp}1`);
      return true;
    } else {
      const timeStamp = +timeStampCount.slice(0, timeStampCount.length - 1),
            count = +timeStampCount.slice(timeStampCount.length - 1, timeStampCount.length);

      if (this.currentTimeStamp - timeStamp >= 3 * 60 * 1000) {  // 超過三分鐘前端解瑣
        this.utils.setLocalStorageObject('count', `${this.currentTimeStamp}1`);
        return true;
      } else if (count > 4) {  // 操作超過五次前端上鎖
        this.cue = 'universal_userAccount_improperOperation';
        return false;
      } else {
        this.utils.setLocalStorageObject('count', `${timeStamp} ${count + 1}`);
        return true;
      }

    }

  }

  // 等待B裝置登入-kidin-1090527
  waitQrcodeLogin () {
    if (this.ip.length === 0 && this.callIpCount < 3) {

      setTimeout(() => {
        this.callIpCount++;
        this.waitQrcodeLogin();
      }, 1000);

    } else {
      const body = {
        qrSignInFlow: QrSignInFlow.submitGuid,
        guid: this.guid
      };

      this.getClientIpaddress().pipe(
        switchMap(ipResult => this.signupService.fetchQrcodeLogin(body, this.requestHeader))
      ).subscribe((res: any) => {
        if (res.processResult.resultCode !== 200) {

          switch (res.processResult.apiReturnMessage) {  // 不寫死方便新增回應訊息
            default:
              this.showMsg(errorMsg, true);
              console.error(`${res.processResult.resultCode}: ${res.processResult.apiReturnMessage}`);
              break;

          }

        } else {
          const waitBody = {
            qrSignInFlow: QrSignInFlow.polling,
            guid: this.guid
          };

          this.getClientIpaddress().pipe(
            switchMap(ipResult => this.signupService.fetchQrcodeLogin(waitBody, this.requestHeader))
          ).subscribe((response: any) => {
            if (response.processResult.resultCode !== 200) {

              switch (response.processResult.apiReturnMessage) {
                case 'Waiting for QR sign in time out.':
                  this.cue = 'universal_userAccount_idleForTooLong';
                  break;
                default:
                  this.showMsg(errorMsg, true);
                  console.error(`${res.processResult.resultCode}: ${res.processResult.apiReturnMessage}`);
                  break;
              }

            } else {
              this.cue = 'universal_userAccount_signSuceesfully';
              const token = response.qrSignIn.token;
              this.userLogin(token);
            }

          });

        }

      });
    }
  }

  // 使用者登入-kidin-1090714
  userLogin (token: string) {
    if (this.appSys === 1) {
      (window as any).webkit.messageHandlers.returnToken.postMessage(token);
      (window as any).webkit.messageHandlers.closeWebView.postMessage('Close');
    } else if (this.appSys === 2) {
      (window as any).android.returnToken(token);
      (window as any).android.closeWebView('Close');
    } else {
      this.utils.writeToken(token);
      this.userProfileService.refreshUserProfile({token});
      this.auth.setLoginStatus(true);
      if (this.auth.backUrl.length > 0) {
        location.href = this.auth.backUrl;
      } else {
        location.href = '/dashboard';
      }

    }

  }

  // 取得url query string-kidin-1090514
  getUrlString (urlStr: string) {
    const { g } = this.utils.getUrlQueryStrings(urlStr);
    if (g) this.loginBody.guid = g;
  }

  // 使用token取得使用者帳號資訊-kidin-1090514
  getUserInfo () {
    const body = {
      token: this.utils.getToken() || ''
    };

    this.userProfileService.getUserProfile(body).subscribe(res => {
      const profile = res.userProfile;
      this.userInfo.name = profile.nickname;
      this.userInfo.icon = `${profile.avatarUrl}`;
    });

  }

  // 登入-kidin-1090522
  qrcodeLogin () {
    this.qrLoginStatus = 'logging';
    if (this.loginBody.guid.length === 0) {
      const msg = this.translate.instant('universal_userAccount_linkHasExpired');
      this.showMsg(msg);
      this.qrLoginStatus = 'check';
    } else {
      this.getClientIpaddress().pipe(
        switchMap(ipResult => this.signupService.fetchQrcodeLogin(this.loginBody, this.requestHeader))
      ).subscribe((res: any) => {
        if (res.processResult.resultCode !== 200) {

          switch (res.processResult.apiReturnMessage) {
            case `Post fail, found parameter 'guid' error.`:
              const msg = this.translate.instant('universal_userAccount_linkHasExpired');
              this.showMsg(msg);
              break;
            default:
              this.showMsg(errorMsg);
              console.error(`${res.processResult.resultCode}: ${res.processResult.apiReturnMessage}`);
              break;
          }

          this.qrLoginStatus = 'check';
        } else {
          this.qrLoginStatus = 'success';
        }

      });

    }

  }

  /**
   * 根據裝置類別以不同方式顯示訊息
   * @param msg {string}-欲顯示之訊息
   * @author kidin-1110113
   */
  showMsg(msg: string, leavePage: boolean = false) {
    if (this.pcView) {
      const data = {
        title: 'Message',
        body: msg,
        confirmText: this.translate.instant('universal_operating_confirm')
      };

      if (leavePage) {
        Object.assign(data, { onConfirm: this.turnBack.bind(this) });
      }

      this.dialog.open(MessageBoxComponent, { hasBackdrop: true, data });
    } else {
      this.utils.showSnackBar(msg);
      if (leavePage) {
        setTimeout(this.turnBack.bind(this), 2000);
      }

    }

  }

  // 離開頁面則取消隱藏navbar-kidin-1090514
  ngOnDestroy () {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

}
