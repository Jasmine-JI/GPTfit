import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { QrcodeService } from '../../../../portal/services/qrcode.service';
import { ActivatedRoute } from '@angular/router';
import { NgProgress, NgProgressRef } from '@ngx-progressbar/core';
import { UtilsService } from '@shared/services/utils.service';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MessageBoxComponent } from '@shared/components/message-box/message-box.component';
import { TranslateService } from '@ngx-translate/core';
import { UserProfileService } from '../../../../../shared/services/user-profile.service';
import { Subject } from 'rxjs';
import { takeUntil, map } from 'rxjs/operators';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import moment from 'moment';
import { BreakpointObserver } from '@angular/cdk/layout';
import { MatDatepickerInputEvent } from '@angular/material/datepicker';

@Component({
  selector: 'app-product-info',
  templateUrl: './product-info.component.html',
  styleUrls: ['./product-info.component.scss', '../../../group/group-style.scss']
})
export class ProductInfoComponent implements OnInit, OnDestroy {

  private ngUnsubscribe = new Subject();
  @ViewChild('paginatorA', {static: false}) paginatorA: MatPaginator;

  @ViewChild('paginatorB', {static: false}) paginatorB: MatPaginator;

  currentPage: PageEvent;

  uiFlag = {
    isTableLoading: false,
    noTableData: true,
    page: 'productInfo',
    totalCount: 0
  };

  userMaxAccessRight = 99;
  groupImg = 'http://app.alatech.com.tw/app/public_html/products/img/t0500.png';
  progressRef: NgProgressRef;
  isLoading = false;
  noProductImg: string;
  deviceInfo: any;
  deviceSN: string;
  productInfo: any;
  modelTypeName: string;
  productManual: any;
  isMainAppOpen = false;
  isSecondAppOpen = false;
  isDisplayBox = false;
  _options = {
    min: 8,
    max: 100,
    ease: 'linear',
    speed: 200,
    trickleSpeed: 400,
    meteor: true,
    spinner: true,
    spinnerPosition: 'right',
    direction: 'ltr+',
    color: '#108bcd',
    thick: false
  };
  fitPairStatus: string;
  deviceEnableDate: string;
  deviceBondDate: string;
  totalUseTime: string;
  totalUseKiloMeter: number;
  token: string;
  fitPairTip: string;
  qrURL: string;
  isAdminMode = false;
  deviceBondUserName: string;
  deviceBondUserId: string;
  deviceImgUrl: string;
  logTimeSelect = {
    filterStartTime: moment().subtract(1, 'year').format('YYYY-MM-DDT00:00:00.000Z'),
    filterEndTime: moment().format('YYYY-MM-DDT23:59:59Z')
  };

  productErrorLog: Array<any> = [];
  logList: any;

  constructor(
    private qrCodeService: QrcodeService,
    private progress: NgProgress,
    private route: ActivatedRoute,
    private utilsService: UtilsService,
    private userProfileService: UserProfileService,
    private router: Router,
    public dialog: MatDialog,
    private translate: TranslateService,
    private breakpointObserver: BreakpointObserver
  ) {}

  // Check if device is phone or tablet
  get isMobile() {
    return this.breakpointObserver.isMatched('(max-width: 768px)');
  }

  ngOnInit() {
    this.getTranslate();
    this.getUserAccessRight();
    if (location.pathname.indexOf('/system/device/info') > -1) {
      this.isAdminMode = true;
    }
    const langName = this.utilsService.getLocalStorageObject('locale');
    this.deviceSN = this.route.snapshot.paramMap.get('deviceSN');
    let snNumbers = this.utilsService.getLocalStorageObject('snNumber');
    if (snNumbers && snNumbers.findIndex(_num => _num === this.deviceSN) > -1) {
      snNumbers = snNumbers.filter(_sn => _sn !== this.deviceSN);
      this.utilsService.setLocalStorageObject('snNumber', snNumbers);
    }
    if (snNumbers && snNumbers.length === 0) {
      this.utilsService.removeLocalStorageObject('snNumber');
    }

    this.progressRef = this.progress.ref();
    this.progressRef.start();
    this.isLoading = true;
    this.token = this.utilsService.getToken() || '';
    const body = {
      token: this.token,
      myEquipmentSN: this.deviceSN
    };
    const body2 = {
      'token': '',
      'queryType': '1',
      'queryArray': [this.deviceSN]
    };
    this.qrCodeService.getDeviceDetail(body).subscribe(res => {
      this.fitPairStatus = res.info.fitPairStatus;
      this.deviceBondDate = res.info.deviceBondDate;
      this.deviceEnableDate = res.info.deviceEnableDate;

      if (res.info.equipmentInfo.totalUseTimeSecond) {
        this.totalUseTime = this.ConvertTime(res.info.equipmentInfo.totalUseTimeSecond);
      }

      if (res.info.equipmentInfo.totalUseMeter) {
        this.totalUseKiloMeter = Math.round(res.info.equipmentInfo.totalUseMeter / 1000);
      }

      if (res.resultCode === 200) {
        this.deviceBondUserName = res.info.deviceBondUserName;
        this.deviceBondUserId = res.info.deviceBondUserId;
        this.generate();
        this.qrCodeService.getProductInfo(body2).subscribe(response => {
          this.progressRef.complete();
          this.isLoading = false;
          this.deviceInfo = response.info.productInfo[0];
          this.modelTypeName = this.deviceInfo.modelTypeName;
          if (location.hostname === '192.168.1.235') {
            this.deviceImgUrl = `http://app.alatech.com.tw/app/public_html/products${this.deviceInfo.modelImg}`;
          } else {
            this.deviceImgUrl = `http://${location.hostname}/app/public_html/products${this.deviceInfo.modelImg}`;
          }
          this.handleProductInfo(langName);
          this.handleProductManual(langName);
        });
      } else {
        this.dialog.open(MessageBoxComponent, {
          hasBackdrop: true,
          data: {
            title: 'message',
            body: res.resultMessage,
            confirmText: this.translate.instant('universal_operating_confirm')
          }
        });
        setTimeout(() => this.router.navigateByUrl('dashboard/device'), 3000);
      }
    });
  }

  // 待多國語系套件載入後再生成翻譯-kidin-1090623
  getTranslate () {
    this.translate.get('hellow world').subscribe(() => {
      this.fitPairTip = this.translate.instant('universal_uiFitpair_fitpairDetailDescription');
    });

  }

  /**
   * 取得使用者系統最高權限
   * @author kidin-1090729
   */
  getUserAccessRight() {
    this.userProfileService.getRxUserProfile().pipe(
      map(res => res.systemAccessRight),
      takeUntil(this.ngUnsubscribe)
    ).subscribe(res => {
      this.userMaxAccessRight = res[0];
    });

  }

  // 新增西班牙語-kidin-1081106
  handleProductInfo(lang) {
    if (lang === 'zh-cn') {
      this.productInfo = this.deviceInfo.informations['relatedLinks_zh-CN'];
    } else if (lang === 'en-us') {
      this.productInfo = this.deviceInfo.informations['relatedLinks_en-US'];
    } else if (lang === 'es-es' && this.deviceInfo.informations['relatedLinks_es-ES']) {
      this.productInfo = this.deviceInfo.informations['relatedLinks_es-ES'];
    } else {
      this.productInfo = this.deviceInfo.informations['relatedLinks_zh-TW'];
    }
  }

  // 新增西班牙語-kidin-1081106
  handleProductManual(lang) {
    if (lang === 'zh-cn') {
      this.productManual = this.deviceInfo.informations['manual_zh-CN'];
    } else if (lang === 'en-us') {
      this.productManual = this.deviceInfo.informations['manual_en-US'];
    } else if (lang === 'es-es' && this.deviceInfo.informations['manual_es-ES']) {
      this.productManual = this.deviceInfo.informations['manual_es-ES'];
    } else {
      this.productManual = this.deviceInfo.informations['manual_zh-TW'];
    }
  }

  swithMainApp() {
    this.isMainAppOpen = !this.isMainAppOpen;
  }

  swithSecondApp() {
    this.isSecondAppOpen = !this.isSecondAppOpen;
  }

  mouseEnter() {
    this.isDisplayBox = true;
  }

  mouseLeave() {
    this.isDisplayBox = false;
  }

  manage() {
    const body = {
      token: this.token,
      myEquipmentSN: this.deviceSN,
      fitPairStatus: this.fitPairStatus,
      deviceSettingJson: ''
    };
    this.qrCodeService.editDeviceInfo(body).subscribe(res => {
      if (res.resultCode === 200) {
        this.router.navigateByUrl('dashboard/device');
      } else {
        this.dialog.open(MessageBoxComponent, {
          hasBackdrop: true,
          data: {
            title: 'message',
            body: this.translate.instant('universal_popUpMessage_changeFailed'),
            confirmText: this.translate.instant('universal_operating_confirm')
          }
        });
      }
    });
  }

  generate() {
    const body = {
      token: this.token,
      equipmentSN: this.deviceSN
    };
    this.qrCodeService.getQRFitPairURL(body).subscribe(res => {
      this.qrURL = res.info.qrURL;
    });
  }

  goBack() {
    if (history.state.navigationId >= 2) {
      history.back();
    } else {
      this.router.navigateByUrl('/dashboard/device');
    }
  }

  unBondDeviceDialog() {
    const body = {
      token: this.token,
      targetUserId: this.deviceBondUserId,
      bondEquipmentSN: this.deviceSN,
      bondStatus: '2'
    };
    this.qrCodeService.updateDeviceBonding(body).subscribe((res) => {
      if (res.resultCode === 200) {
        this.dialog.open(MessageBoxComponent, {
          hasBackdrop: true,
          data: {
            title: 'message',
            body: `${this.translate.instant('universal_uiFitpair_unbind')} ${this.translate.instant('universal_status_success')}`,
            confirmText: this.translate.instant('universal_operating_confirm')
          }
        });
        setTimeout(() => history.back(), 3000);
      } else {
        this.dialog.open(MessageBoxComponent, {
          hasBackdrop: true,
          data: {
            title: 'message',
            body: `${this.translate.instant('universal_uiFitpair_unbind')} ${this.translate.instant('universal_status_failure')}`,
            confirmText: this.translate.instant('universal_operating_confirm')
          }
        });
      }
    });
  }

  openUnBondDeviceDialog() {
    this.dialog.open(MessageBoxComponent, {
      hasBackdrop: true,
      data: {
        title: 'message',
        body: `${this.translate.instant('universal_popUpMessage_continueExecution')} ${
          this.deviceBondUserName
        } ${this.translate.instant('universal_uiFitpair_unbind')} sn: ${this.deviceSN} ?`,
        confirmText: this.translate.instant('universal_operating_confirm'),
        onConfirm: () => this.unBondDeviceDialog(),
        cancelText: 'cancel'
      }

    });

  }

  /**
   * 切換顯示頁面
   * @event click
   * @param page {string}-切換的頁面
   * @author kidin-1090924
   */
  switchPage(page: string) {
    this.uiFlag.page = page;

    setTimeout(() => {
      this.checkCurrentPage();
      this.getProductLog();
    });

  }

  /**
   * 確認當前分頁
   * @author kidin-1090924
   */
  checkCurrentPage() {
    this.currentPage = {
      pageIndex: 0,
      pageSize: 10,
      length: null
    };

    // 分頁切換時，重新取得資料
    this.paginatorA.page.pipe(
      takeUntil(this.ngUnsubscribe)
    ).subscribe((page: PageEvent) => {
      this.currentPage = page;
      this.getProductLog();
    });

    this.paginatorB.page.pipe(
      takeUntil(this.ngUnsubscribe)
    ).subscribe((page: PageEvent) => {
      this.currentPage = page;
      this.getProductLog();
    });

  }

  /**
   * 取得設備日誌
   * @author kidin-1090924
   */
  getProductLog() {
    this.uiFlag.isTableLoading = true;
    const body = {
      token: this.utilsService.getToken(),
      queryEquipmentSN: this.deviceSN,
      filterStartTime: this.logTimeSelect.filterStartTime,
      filterEndTime: this.logTimeSelect.filterEndTime,
      page: this.currentPage.pageIndex,
      pageCounts: this.currentPage.pageSize
    };

    this.qrCodeService.getEquipmentLog(body).subscribe(res => {
      if (res.resultCode !== 200) {
        console.log(`${res.apiCode}：${res.resultMessage}`);
      } else {
        this.logList = res.info.equipmentErrorLog;
        this.uiFlag.totalCount = res.info.totalCounts;

        if (this.logList.length === 0) {
          this.uiFlag.noTableData = true;
        } else {
          this.uiFlag.noTableData = false;
        }

      }

      this.uiFlag.isTableLoading = false;
    });

  }

  /**
   * 取得使用者選擇的日期
   * @param $event {MatDatepickerInputEvent<moment.Moment>}
   * @param isStartTime {boolean}
   * @author kidin-1090924
   */
  handleDateChange(
    $event: MatDatepickerInputEvent<moment.Moment>,
    isStartTime: boolean
  ) {
    if (isStartTime) {
      this.logTimeSelect.filterStartTime = moment($event.value).format(
        'YYYY-MM-DDT00:00:00.000Z'
      );
    } else {
      this.logTimeSelect.filterEndTime = moment($event.value).format(
        'YYYY-MM-DDT23:59:59.000Z'
      );

    }

  }

  /**
   * 將秒數轉為小時制
   * @param second {number}-秒數
   * @author kidin-1090924
   */
  ConvertTime(second: number) {
    let hour: number,
        min: number,
        sec: number;
    if (second >= 3600) {
      hour = Math.floor(second / 3600);
      min = Math.floor((second - (hour * 3600)) / 60);
      sec = second - (hour * 3600) - (min * 60);
      return `${hour}:${min}:${sec}`;
    } else if (second >= 60) {
      min = Math.floor((second - (hour * 3600)) / 60);
      sec = second - (hour * 3600) - (min * 60);
      return `0:${min}:${sec}`;
    } else {
      return `0:00:${second}`;
    }

  }

  /**
   * 解除rxjs訂閱
   * @author kidin-1090722
   */
  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

}
