import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import {
  AuthService,
  Api10xxService,
  GetClientIpService,
  GlobalEventsService,
  HintDialogService,
} from '../../../../../core/services';
import { MessageBoxComponent } from '../../../../../shared/components/message-box/message-box.component';
import { Subject, Subscription, fromEvent, of } from 'rxjs';
import { takeUntil, tap, switchMap } from 'rxjs/operators';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import dayjs from 'dayjs';
import { TFTViewMinWidth } from '../../../models/app-webview';
import { AlaApp, QueryString } from '../../../../../core/enums/common';
import {
  headerKeyTranslate,
  getUrlQueryStrings,
  setLocalStorageObject,
  getLocalStorageObject,
} from '../../../../../core/utils';
import { appPath } from '../../../../../app-path.const';
import { SafeHtmlPipe } from '../../../../../core/pipes/safe-html.pipe';
import { QRCodeModule } from 'angularx-qrcode';
import { NgIf, NgClass, NgTemplateOutlet } from '@angular/common';

enum QrSignInFlow {
  submitGuid = 1,
  polling,
  login,
}

type QrLoginStatus = 'check' | 'logging' | 'success';
const errorMsg = 'Error. Try again later.';

@Component({
  selector: 'app-app-qrcode-login',
  templateUrl: './app-qrcode-login.component.html',
  styleUrls: ['./app-qrcode-login.component.scss'],
  standalone: true,
  imports: [NgIf, QRCodeModule, NgClass, NgTemplateOutlet, TranslateModule, SafeHtmlPipe],
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
  currentTimeStamp = dayjs().valueOf();
  pcView = false;
  tftView = false;
  appSys = 0;
  mobileSize = window.innerWidth < TFTViewMinWidth;
  requestHeader = {};

  userInfo = {
    icon: '',
    name: '',
  };

  loginBody = {
    qrSignInFlow: QrSignInFlow.login,
    guid: '',
    token: '',
  };

  constructor(
    private translate: TranslateService,
    private hintDialogService: HintDialogService,
    private api10xxService: Api10xxService,
    private auth: AuthService,
    private dialog: MatDialog,
    private router: Router,
    private getClientIp: GetClientIpService,
    private globalEventsService: GlobalEventsService
  ) {}

  ngOnInit() {
    this.loginBody.token = this.auth.token;
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
   */
  getQueryString() {
    const query = getUrlQueryStrings(location.search);
    this.tftView = query.p == AlaApp.tft;
    this.requestHeader = {
      ...this.requestHeader,
      ...headerKeyTranslate(query),
    };
  }

  /**
   * 訂閱頁面尺寸改變事件
   */
  subscribeResizeEvent() {
    const resizeEvent = fromEvent(window, 'resize');
    this.resizeSubscription = resizeEvent.pipe(takeUntil(this.ngUnsubscribe)).subscribe((e) => {
      this.mobileSize = window.innerWidth < TFTViewMinWidth;
    });
  }

  // 返回app
  turnBack() {
    if (this.appSys === 1) {
      (window as any).webkit.messageHandlers.closeWebView.postMessage('Close');
    } else if (this.appSys === 2) {
      (window as any).android.closeWebView('Close');
    } else {
      const { portal } = appPath;
      if (this.pcView) {
        this.router.navigateByUrl(`/${portal.signInWeb}`);
      } else {
        this.router.navigateByUrl(`/${portal.signIn}`);
      }
    }
  }

  /**
   * 根據url顯示該頁面
   * @param pathname {string}
   * @author kidin-1090720
   */
  checkPage(pathname: string): void {
    const [, firstPath] = pathname.split('/');
    const { signInQrcode, signInQrcodeWeb, signIn } = appPath.portal;

    // qrcode 顯示畫面
    if (firstPath === signInQrcode || firstPath === signInQrcodeWeb) {
      this.displayPage = 'showQrcode';
      if (this.checkFrequency()) {
        this.createLoginQrcode();
        this.waitQrcodeLogin();
      } else {
        this.translate
          .get('hello.world')
          .pipe(takeUntil(this.ngUnsubscribe))
          .subscribe(() => {
            this.cue = 'universal_userAccount_improperOperation';
          });
      }
    } else {
      // 掃描 qrcode 後的顯示畫面
      this.setPageStyle(true);
      this.displayPage = 'login';
      if (this.loginBody.token.length === 0) {
        this.auth.backUrl = location.href;
        this.router.navigateByUrl(`/${signIn}`);
      } else {
        this.getUrlString(location.search);
        this.getUserInfo();
      }
    }

    if (pathname.indexOf('-web') > -1) {
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
    this.globalEventsService.setHideNavbarStatus(isPcView);
    this.globalEventsService.setDarkModeStatus(isPcView);
  }

  // 取得註冊來源平台、類型和ID-kidin-1090512
  getAppId() {
    if ((window as any).webkit) {
      this.appSys = 1;
    } else if ((window as any).android) {
      this.appSys = 2;
    } else {
      this.appSys = 0;
    }

    this.requestHeader = {
      deviceType: this.appSys,
      ...this.requestHeader,
    };
  }

  // 取得使用者ip位址-kidin-1090521
  getClientIpaddress() {
    const { remoteAddr } = this.requestHeader as any;
    if (!remoteAddr) {
      return this.getClientIp.requestIpAddress().pipe(
        tap((res) => {
          this.ip = (res as any).ip;
          this.requestHeader = {
            ...this.requestHeader,
            remoteAddr: this.ip,
          };
        })
      );
    } else {
      return of(this.requestHeader);
    }
  }

  // 創建qrcode並發送guid給server進行長輪詢
  createLoginQrcode() {
    this.createGuid();
    const pathName = `${location.origin}/${appPath.portal.qrSignIn}`;
    const query = `?${QueryString.qrSignInFlow}=1&${QueryString.guid}=${this.guid}`;
    this.qrURL = pathName + query;
  }

  // 創建guid
  createGuid() {
    const hexadecimalTimeStamp = this.currentTimeStamp.toString(16);
    let guid = '';
    for (let i = 0; i < 32 - hexadecimalTimeStamp.length; i++) {
      guid += Math.floor(Math.random() * 16).toString(16);
    }

    guid += hexadecimalTimeStamp;
    this.guid = `${guid.slice(0, 8)}-${guid.slice(8, 12)}-${guid.slice(12, 16)}-${guid.slice(
      16,
      20
    )}-${guid.slice(20, 32)}`;
  }

  // 確認是否開啟過多次qrcode頁面-kidin-1090528
  checkFrequency() {
    const timeStampCount = getLocalStorageObject('count');
    if (!timeStampCount) {
      setLocalStorageObject('count', `${this.currentTimeStamp}1`);
      return true;
    } else {
      const timeStamp = +timeStampCount.slice(0, timeStampCount.length - 1),
        count = +timeStampCount.slice(timeStampCount.length - 1, timeStampCount.length);

      if (this.currentTimeStamp - timeStamp >= 3 * 60 * 1000) {
        // 超過三分鐘前端解瑣
        setLocalStorageObject('count', `${this.currentTimeStamp}1`);
        return true;
      } else if (count > 4) {
        // 操作超過五次前端上鎖
        this.cue = 'universal_userAccount_improperOperation';
        return false;
      } else {
        setLocalStorageObject('count', `${timeStamp} ${count + 1}`);
        return true;
      }
    }
  }

  // 等待B裝置登入-kidin-1090527
  waitQrcodeLogin() {
    const body = {
      qrSignInFlow: QrSignInFlow.submitGuid,
      guid: this.guid,
    };

    this.getClientIpaddress()
      .pipe(switchMap((ipResult) => this.api10xxService.fetchQrcodeLogin(body, this.requestHeader)))
      .subscribe((res: any) => {
        if (res.processResult.resultCode !== 200) {
          switch (
            res.processResult.apiReturnMessage // 不寫死方便新增回應訊息
          ) {
            default:
              this.showMsg(errorMsg, true);
              console.error(
                `${res.processResult.resultCode}: ${res.processResult.apiReturnMessage}`
              );
              break;
          }
        } else {
          const waitBody = {
            qrSignInFlow: QrSignInFlow.polling,
            guid: this.guid,
          };

          this.getClientIpaddress()
            .pipe(
              switchMap((ipResult) =>
                this.api10xxService.fetchQrcodeLogin(waitBody, this.requestHeader)
              )
            )
            .subscribe((response: any) => {
              if (response.processResult.resultCode !== 200) {
                switch (response.processResult.apiReturnMessage) {
                  case 'Waiting for QR sign in time out.':
                    // tft 裝置常駐qrcode，故過時就更新qrcode
                    if (this.tftView) {
                      this.createLoginQrcode();
                      this.waitQrcodeLogin();
                    }
                    this.cue = 'universal_userAccount_idleForTooLong';
                    break;
                  default:
                    this.showMsg(errorMsg, true);
                    console.error(
                      `${res.processResult.resultCode}: ${res.processResult.apiReturnMessage}`
                    );
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

  // 使用者登入-kidin-1090714
  userLogin(token: string) {
    if (this.appSys === 1) {
      (window as any).webkit.messageHandlers.returnToken.postMessage(token);
      (window as any).webkit.messageHandlers.closeWebView.postMessage('Close');
    } else if (this.appSys === 2) {
      (window as any).android.returnToken(token);
      (window as any).android.closeWebView('Close');
    } else {
      this.auth.setToken(token);
      this.auth.tokenLogin();

      const { backUrl } = this.auth;
      location.href = backUrl ? backUrl : `/${appPath.dashboard.home}`;
    }
  }

  // 取得url query string-kidin-1090514
  getUrlString(urlStr: string) {
    const { g } = getUrlQueryStrings(urlStr);
    if (g) this.loginBody.guid = g;
  }

  // 使用token取得使用者帳號資訊-kidin-1090514
  getUserInfo() {
    const body = { token: this.auth.token };
    this.api10xxService.fetchGetUserProfile(body).subscribe((res) => {
      const profile = res.userProfile;
      this.userInfo.name = profile.nickname;
      this.userInfo.icon = `${profile.avatarUrl}`;
    });
  }

  // 登入-kidin-1090522
  qrcodeLogin() {
    this.qrLoginStatus = 'logging';
    if (this.loginBody.guid.length === 0) {
      const msg = this.translate.instant('universal_userAccount_linkHasExpired');
      this.showMsg(msg);
      this.qrLoginStatus = 'check';
    } else {
      this.getClientIpaddress()
        .pipe(
          switchMap((ipResult) =>
            this.api10xxService.fetchQrcodeLogin(this.loginBody, this.requestHeader)
          )
        )
        .subscribe((res: any) => {
          if (res.processResult.resultCode !== 200) {
            switch (res.processResult.apiReturnMessage) {
              case `Post fail, found parameter 'guid' error.`: {
                const msg = this.translate.instant('universal_userAccount_linkHasExpired');
                this.showMsg(msg);
                break;
              }
              default:
                this.showMsg(errorMsg);
                console.error(
                  `${res.processResult.resultCode}: ${res.processResult.apiReturnMessage}`
                );
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
  showMsg(msg: string, leavePage = false) {
    if (this.pcView) {
      const data = {
        title: 'Message',
        body: msg,
        confirmText: this.translate.instant('universal_operating_confirm'),
      };

      if (leavePage) {
        Object.assign(data, { onConfirm: this.turnBack.bind(this) });
      }

      this.dialog.open(MessageBoxComponent, { hasBackdrop: true, data });
    } else {
      this.hintDialogService.showSnackBar(msg);
      if (leavePage) {
        setTimeout(this.turnBack.bind(this), 2000);
      }
    }
  }

  // 離開頁面則取消隱藏navbar-kidin-1090514
  ngOnDestroy() {
    this.setPageStyle(false); // 避免回到首頁仍吃到會員系統頁面樣式
    this.ngUnsubscribe.next(null);
    this.ngUnsubscribe.complete();
  }
}
