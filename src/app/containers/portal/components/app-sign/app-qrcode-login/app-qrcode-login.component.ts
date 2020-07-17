import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';

import { AuthService } from '../../../../../shared/services/auth.service';
import { UtilsService } from '@shared/services/utils.service';
import { SignupService } from '../../../services/signup.service';
import { UserInfoService } from '../../../../dashboard/services/userInfo.service';
import { MessageBoxComponent } from '@shared/components/message-box/message-box.component';
import { GetClientIpService } from '../../../../../shared/services/get-client-ip.service';

import { TranslateService } from '@ngx-translate/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import * as moment from 'moment';

@Component({
  selector: 'app-app-qrcode-login',
  templateUrl: './app-qrcode-login.component.html',
  styleUrls: ['./app-qrcode-login.component.scss']
})
export class AppQrcodeLoginComponent implements OnInit, AfterViewInit, OnDestroy {

  qrLoginStatus = 'check';  // check: 等待登入; logging：登入中; success： 成功;
  loggingDot = '';
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

  userInfo = {
    icon: '',
    name: ''
  };

  loginBody = {
    qrSignInFlow: 3,
    guid: '',
    token: ''
  };

  constructor(
    private translate: TranslateService,
    private utils: UtilsService,
    private signupService: SignupService,
    private userInfoService: UserInfoService,
    private auth: AuthService,
    private dialog: MatDialog,
    private router: Router,
    private getClientIp: GetClientIpService
  ) { }

  ngOnInit() {
    this.loginBody.token = this.utils.getToken() || '';
    this.getClientIpaddress();

    if (location.pathname === '/signInQrcode' || location.pathname === '/signInQrcode-web') {

      this.getClientIpaddress();
      this.displayPage = 'showQrcode';

      if (this.checkFrequency()) {
        this.createLoginQrcode();
        this.waitQrcodeLogin();
      } else {
        this.translate.get('hello.world').subscribe(() => {
          this.cue = 'universal_userAccount_improperOperation';
        });

      }

    } else {
      this.utils.setHideNavbarStatus(true);
      this.displayPage = 'login';

      if (this.loginBody.token.length === 0) {
        this.auth.backUrl = location.href;
        this.router.navigateByUrl('/signIn');
      } else {
        this.getUrlString(location.search);
        this.getUserInfo();
      }

    }

  }

  ngAfterViewInit() {
    if (location.pathname.indexOf('web') > 0) {
      this.pcView = true;
      this.utils.setHideNavbarStatus(false);
    } else {
      this.pcView = false;
      this.utils.setHideNavbarStatus(true);
      this.getAppId();
    }

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

  // 取得註冊來源平台、類型和ID-kidin-1090512
  getAppId () {
    if ((window as any).webkit) {
      this.appSys = 1;
    } else if ((window as any).android) {
      this.appSys = 2;
    } else {
      this.appSys = 0;
    }

  }

  // 取得使用者ip位址-kidin-1090521
  getClientIpaddress () {
    this.getClientIp.requestJsonp('https://api.ipify.org', 'format=jsonp', 'callback').subscribe(res => {
      this.ip = (res as any).ip;
    });

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
        qrSignInFlow: 1,
        guid: this.guid
      };

      this.signupService.fetchQrcodeLogin(body, this.ip).subscribe(res => {
        if (res.processResult.resultCode !== 200) {

          switch (res.processResult.apiReturnMessage) {  // 不寫死方便新增回應訊息
            default:
              this.dialog.open(MessageBoxComponent, {
                hasBackdrop: true,
                data: {
                  title: 'Message',
                  body: `Server error.<br />Please try again later.`,
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
          const waitBody = {
            qrSignInFlow: 2,
            guid: this.guid
          };

          this.signupService.fetchQrcodeLogin(waitBody, this.ip).subscribe(response => {
            if (response.processResult.resultCode !== 200) {

              switch (response.processResult.apiReturnMessage) {
                case 'Waiting for QR sign in time out.':
                  this.cue = 'universal_userAccount_idleForTooLong';
                  break;
                default:
                  this.dialog.open(MessageBoxComponent, {
                    hasBackdrop: true,
                    data: {
                      title: 'Message',
                      body: `Server error.<br />Please try again later.`,
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
      this.auth.setLoginStatus(true);
      if (this.auth.backUrl.length > 0) {
        location.href = this.auth.backUrl;
      } else {
        location.href = '/dashboard';
      }

    }

  }

  // 取得url query string-kidin-1090514
  getUrlString (urlStr) {

    const query = urlStr.replace('?', '').split('&');

    for (let i = 0; i < query.length; i++) {

      const queryKey = query[i].split('=')[0];
      switch (queryKey) {
        case 'g':  // 不寫死避免之後加更多參數
          this.loginBody.guid = query[i].split('=')[1];
          break;
      }

    }

  }

  // 使用token取得使用者帳號資訊-kidin-1090514
  getUserInfo () {
    const body = {
      token: this.utils.getToken() || ''
    };

    this.userInfoService.fetchUserInfo(body).subscribe(res => {
      const profile = res.userProfile;
      this.userInfo.name = profile.nickname;
      this.userInfo.icon = `${profile.avatarUrl}?${profile.editTimestamp}`;
    });

  }

  // 登入-kidin-1090522
  qrcodeLogin () {
    this.qrLoginStatus = 'logging';
    this.processingDot();

    if (this.loginBody.guid.length === 0) {
      this.dialog.open(MessageBoxComponent, {
        hasBackdrop: true,
        data: {
          title: 'Message',
          body: `Guid Error`,
          confirmText: this.translate.instant(
            'universal_operating_confirm'
          )
        }
      });

      this.qrLoginStatus = 'check';
    } else {
      this.signupService.fetchQrcodeLogin(this.loginBody, this.ip).subscribe(res => {
        if (res.processResult.resultCode !== 200) {

          switch (res.processResult.apiReturnMessage) {
            case `Post fail, found parameter 'guid' error.`:
              this.dialog.open(MessageBoxComponent, {
                hasBackdrop: true,
                data: {
                  title: 'Message',
                  body: `Guid Error`,
                  confirmText: this.translate.instant(
                    'universal_operating_confirm'
                  )
                }
              });

              break;
            default:
              this.dialog.open(MessageBoxComponent, {
                hasBackdrop: true,
                data: {
                  title: 'Message',
                  body: `Server error.<br />Please try again later.`,
                  confirmText: this.translate.instant(
                    'universal_operating_confirm'
                  ),
                  onConfirm: this.turnBack.bind(this)
                }
              });

              console.log(`${res.processResult.resultCode}: ${res.processResult.apiReturnMessage}`);
              break;

          }

          this.qrLoginStatus = 'check';
        } else {
          this.qrLoginStatus = 'success';
        }

      });

    }

  }

  // 登入中按鈕顯示動態效果-kidin-1090525
  processingDot () {
    const dot = setInterval(() => {
      this.loggingDot += '.';
      if (this.loggingDot === '....' || this.qrLoginStatus === 'check' || this.qrLoginStatus === 'success') {
        this.loggingDot = '';

        if (this.qrLoginStatus === 'check' || this.qrLoginStatus === 'success') {
          window.clearInterval(dot as any);
        }

      }

    }, 500);

  }

  // 離開頁面則取消隱藏navbar-kidin-1090514
  ngOnDestroy () {
    this.utils.setHideNavbarStatus(false);
  }

}
