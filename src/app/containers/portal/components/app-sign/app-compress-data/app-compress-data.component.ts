import { Component, OnInit, AfterViewInit, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { AppCode } from '../../../models/app-webview';
import { Router } from '@angular/router';
import dayjs from 'dayjs';
import { AuthService, Api10xxService, GlobalEventsService } from '../../../../../core/services';
import { Subject, Subscription, fromEvent } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { TFTViewMinWidth } from '../../../models/app-webview';
import { AlaApp } from '../../../../../shared/models/app-id';
import { headerKeyTranslate, getUrlQueryStrings } from '../../../../../core/utils';

enum CompressStatus {
  request,
  processing,
  complete,
  prohibited,
}

@Component({
  selector: 'app-app-compress-data',
  templateUrl: './app-compress-data.component.html',
  styleUrls: ['./app-compress-data.component.scss'],
})
export class AppCompressDataComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('dataLink') dataLink: ElementRef;

  private ngUnsubscribe = new Subject();
  private resizeSubscription = new Subscription();

  readonly CompressStatus = CompressStatus;

  // ui用到的各種flag
  uiFlag = {
    progress: 100,
    copied: false,
    tftDevice: false,
  };

  appSys: AppCode = 0;
  token: string;
  mobileSize = window.innerWidth < TFTViewMinWidth;
  requestHeader = {};

  compressResp = {
    status: CompressStatus.request,
    archiveLink: '',
    archiveFakeLink: '',
    archiveLinkDate: null,
    archiveLinkTime: null,
    cooldownTimestamp: null,
    cooldownDate: null,
    cooldownTime: null,
  }; // api 1012 response

  constructor(
    private router: Router,
    private api10xxService: Api10xxService,
    private auth: AuthService,
    private globalEventsService: GlobalEventsService
  ) {}

  ngOnInit(): void {
    this.subscribeResizeEvent();
  }

  /**
   * 因應ios嵌入webkit物件時間點較後面，故在此生命週期才判斷裝置平台
   * @author kidin-1090710
   */
  ngAfterViewInit() {
    this.checkQueryString(location.search);
    this.getDeviceSys();
    this.getUserToken();
  }

  /**
   * 訂閱頁面尺寸改變事件
   * @author kidin-1101230
   */
  subscribeResizeEvent() {
    const resizeEvent = fromEvent(window, 'resize');
    this.resizeSubscription = resizeEvent.pipe(takeUntil(this.ngUnsubscribe)).subscribe((e) => {
      this.mobileSize = window.innerWidth < TFTViewMinWidth;
    });
  }

  /**
   * 確認是否有query string
   * @author kidin-1100120
   */
  checkQueryString(queryString: string) {
    const query = getUrlQueryStrings(queryString);
    this.requestHeader = {
      ...this.requestHeader,
      ...headerKeyTranslate(query),
    };

    const { p: appId, code } = query;
    this.uiFlag.tftDevice = appId && appId == AlaApp.tft;
    if (code) {
      const downloadPort = location.hostname === 'www.gptfit.com' ? '6443' : '5443',
        downloadUrl = `https://${location.hostname}:${downloadPort}/archive/click?code=${code}`;
      location.href = downloadUrl;
    }
  }

  /**
   * 取得裝置平台
   * @author kidin-1091216
   */
  getDeviceSys() {
    this.setPageStyle(true);
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

  /**
   * 根據裝置設定頁面樣式
   * @param isPcView {boolean}-是否非行動裝置或TFT
   * @author kidin-1110113
   */
  setPageStyle(isPcView: boolean) {
    this.globalEventsService.setHideNavbarStatus(isPcView);
    this.globalEventsService.setDarkModeStatus(isPcView);
  }

  /**
   * 取得使用者的token
   * @author kidin-1091217
   */
  getUserToken() {
    if (this.appSys === 0) {
      this.token = this.auth.token;
    } else {
      const { search } = location;
      const { tk } = getUrlQueryStrings(search);
      this.token = tk ? tk : '';
    }

    if (this.token.length === 0) {
      this.auth.backUrl = location.href;
      this.router.navigateByUrl('/signIn');
    } else {
      this.checkCompressStatus();
    }
  }

  /**
   * 點擊按鈕請求資料索取或下載資料
   * @author kidin-1091217
   */
  handleClickBtn() {
    if (this.compressResp.status === CompressStatus.request) {
      this.applyCompress();
    } else if (this.compressResp.status === CompressStatus.complete) {
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
        flow: 1,
      };

      this.uiFlag.progress = 30;
      this.api10xxService.fetchCompressData(body, this.requestHeader).subscribe((res) => {
        this.uiFlag.progress = 100;
        const processResult = res.processResult;
        if (processResult.resultCode !== 200) {
          console.error(
            `${processResult.resultCode}: Api ${processResult.apiCode} ${processResult.resultMessage}`
          );
        } else {
          this.compressResp.status = res.status;

          if (res.status === CompressStatus.complete) {
            this.compressResp.archiveLink =
              location.hostname === 'www.gptfit.com'
                ? res.archiveLink.replace('5443', '6443')
                : res.archiveLink;
            this.compressResp.archiveFakeLink = `https://${location.hostname}/compressData?${
              res.archiveLink.split('?')[1]
            }`;
            this.compressResp.archiveLinkDate = dayjs(res.archiveLinkTimestamp * 1000).format(
              'YYYY-MM-DD'
            );
            this.compressResp.archiveLinkTime = dayjs(res.archiveLinkTimestamp * 1000).format(
              'HH:mm'
            );
          } else if (res.status === CompressStatus.prohibited) {
            this.compressResp.cooldownTimestamp = res.cooldownTimestamp;
            this.compressResp.cooldownDate = dayjs(res.cooldownTimestamp * 1000).format(
              'YYYY-MM-DD'
            );
            this.compressResp.cooldownTime = dayjs(res.cooldownTimestamp * 1000).format('HH:mm');
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
      flow: 2,
    };

    this.uiFlag.progress = 30;
    this.api10xxService.fetchCompressData(body, this.requestHeader).subscribe((res) => {
      this.uiFlag.progress = 100;
      const processResult = res.processResult;
      if (processResult.resultCode !== 200) {
        console.error(
          `${processResult.resultCode}: Api ${processResult.apiCode} ${processResult.resultMessage}`
        );
      } else {
        this.compressResp.status = res.status;
      }
    });
  }

  /**
   * 回上一頁或返回app
   * @author kidin-1091216
   */
  turnBack() {
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
    this.setPageStyle(false);
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }
}
