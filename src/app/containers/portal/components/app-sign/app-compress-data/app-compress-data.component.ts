import { Component, OnInit, AfterViewInit, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { AppCode } from '../../../models/app-webview';
import { Router } from '@angular/router';
import { UtilsService } from '../../../../../shared/services/utils.service';
import { SignupService } from '../../../services/signup.service';
import moment from 'moment';
import { AuthService } from '../../../../../shared/services/auth.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-app-compress-data',
  templateUrl: './app-compress-data.component.html',
  styleUrls: ['./app-compress-data.component.scss']
})
export class AppCompressDataComponent implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild('dataLink') dataLink: ElementRef;

  private ngUnsubscribe = new Subject();

  // ui用到的各種flag
  uiFlag = {
    isLoading: false,
    copied: false
  };

  appSys: AppCode = 0;
  token: string;

  compressResp = {
    status: 0,
    archiveLink: '',
    archiveFakeLink: '',
    archiveLinkDate: null,
    archiveLinkTime: null,
    cooldownTimestamp: null,
    cooldownDate: null,
    cooldownTime: null
  }; // api 1012 response

  constructor(
    private router: Router,
    private utils: UtilsService,
    private signupService: SignupService,
    private auth: AuthService,
    private translate: TranslateService
  ) { }

  ngOnInit(): void {
  }

  /**
   * 因應ios嵌入webkit物件時間點較後面，故在此生命週期才判斷裝置平台
   * @author kidin-1090710
   */
  ngAfterViewInit () {
    this.checkQueryString(location.search);
    this.getDeviceSys();
    this.getUserToken();
  }

  /**
   * 確認是否有query string
   * @author kidin-1100120
   */
  checkQueryString(queryString: string) {
    if (queryString.length > 0 && queryString.split('?')[1].split('=')[0] === 'code') {
      const downloadPort = location.hostname === 'www.gptfit.com' ? '6443' : '5443',
            downloadUrl = `https://${location.hostname}:${downloadPort}/archive/click?${queryString.split('?')[1]}`;
      location.href = downloadUrl;
    }

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
      this.checkCompressStatus();
    }

  }

  /**
   * 點擊藍色按鈕事件
   * @author kidin-1091217
   */
  handleClickBtn() {
    if (this.compressResp.status === 0) {
      this.applyCompress();
    } else if (this.compressResp.status === 2) {
      window.open(`${this.compressResp.archiveLink}`, '_self', 'noopener=yes,noreferrer=yes');
    }

  }

  /**
   * 幫使用者複製連結至剪貼簿(因瀏覽器支援度暫時廢棄)
   * @author kidin-1091217
  handleCopyLink() {
    const dataLinkSpan = this.dataLink.nativeElement;
    dataLinkSpan.select();
    document.execCommand('copy');
    this.uiFlag.copied = true;
    this.translate.get('hellow world').pipe(
      takeUntil(this.ngUnsubscribe)
    ).subscribe(() => {
      const msg = `${this.translate.instant('universal_userAccount_copyLink')} ${this.translate.instant('universal_status_success')}`
      this.utils.openAlert(msg);
    });
    
  }
  */

  /**
   * 串接api 1012確認封存狀態
   * @author kidin-1091217
   */
  checkCompressStatus() {
    if (this.token.length === 0) {
      this.turnBack();
    } else {
      const body = {
        token: this.token,
        flow: 1
      };

      this.uiFlag.isLoading = true;
      this.signupService.fetchCompressData(body).subscribe(res => {
        this.uiFlag.isLoading = false;
        const processResult = res.processResult;
        if (processResult.resultCode !== 200) {
          console.error(`${processResult.resultCode}: Api ${processResult.apiCode} ${processResult.resultMessage}`);
        } else {
          this.compressResp.status = res.status;

          if (res.status === 2) {
            this.compressResp.archiveLink = location.hostname === 'www.gptfit.com' ? res.archiveLink.replace('5443', '6443') : res.archiveLink;
            this.compressResp.archiveFakeLink = `https://${location.hostname}/compressData?${res.archiveLink.split('?')[1]}`;
            this.compressResp.archiveLinkDate = moment(res.archiveLinkTimestamp * 1000).format('YYYY-MM-DD');
            this.compressResp.archiveLinkTime = moment(res.archiveLinkTimestamp * 1000).format('HH:mm');
          } else if (res.status === 3) {
            this.compressResp.cooldownTimestamp = res.cooldownTimestamp;
            this.compressResp.cooldownDate = moment(res.cooldownTimestamp * 1000).format('YYYY-MM-DD');
            this.compressResp.cooldownTime = moment(res.cooldownTimestamp * 1000).format('HH:mm');
          }

        }

      });

    }

  }

  /**
   * 串接api 1012申請資料封存
   * @author kidin-1091217
   */
  applyCompress() {
    const body = {
      token: this.token,
      flow: 2
    };

    this.uiFlag.isLoading = true;
    this.signupService.fetchCompressData(body).subscribe(res => {
      this.uiFlag.isLoading = false;
      const processResult = res.processResult;
      if (processResult.resultCode !== 200) {
        console.error(`${processResult.resultCode}: Api ${processResult.apiCode} ${processResult.resultMessage}`);
      } else {
        this.compressResp.status = res.status;
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
   * 取消rxjs訂閱
   * @author kidin-1100309
   */
   ngOnDestroy() {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

}
