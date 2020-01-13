import { Component, OnInit } from '@angular/core';
import { QrcodeService } from '../../../../portal/services/qrcode.service';
import { HttpParams } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { NgProgress, NgProgressRef } from '@ngx-progressbar/core';
import { UtilsService } from '@shared/services/utils.service';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MessageBoxComponent } from '@shared/components/message-box/message-box.component';
import { fitPairText } from './fitPairText';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-product-info',
  templateUrl: './product-info.component.html',
  styleUrls: ['./product-info.component.css', '../../../group/group-style.scss']
})
export class ProductInfoComponent implements OnInit {
  groupImg = 'http://app.alatech.com.tw/app/public_html/products/img/t0500.png';
  progressRef: NgProgressRef;
  isLoading = false;
  noProductImg: string;
  deviceInfo: any;
  deviceSN: string;
  productInfo: any;
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
  token: string;
  fitPairTip: string;
  qrURL: string;
  isAdminMode = false;
  deviceBondUserName: string;
  deviceBondUserId: string;
  deviceImgUrl: string;
  constructor(
    private qrCodeService: QrcodeService,
    private progress: NgProgress,
    private route: ActivatedRoute,
    private utilsService: UtilsService,
    private router: Router,
    public dialog: MatDialog,
    private translate: TranslateService
  ) {}

  ngOnInit() {
    if (location.pathname.indexOf('/system/device/info') > -1) {
      this.isAdminMode = true;
    }
    const langName = this.utilsService.getLocalStorageObject('locale');
    this.fitPairTip = fitPairText[langName];
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
    this.token = this.utilsService.getToken();
    const body = {
      token: this.token,
      myEquipmentSN: this.deviceSN
    };
    const body2 = {
      'token': '',
      'queryType': '1',
      'queryArray': [this.deviceSN]
    }
    this.qrCodeService.getDeviceDetail(body).subscribe(res => {
      this.fitPairStatus = res.info.fitPairStatus;
      if (res.resultCode === 200) {
        this.deviceBondUserName = res.info.deviceBondUserName;
        this.deviceBondUserId = res.info.deviceBondUserId;
        this.generate();
        this.qrCodeService.getProductInfo(body2).subscribe(response => {
          this.progressRef.complete();
          this.isLoading = false;
          this.deviceInfo = response.info.productInfo[0];
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
            confirmText: this.translate.instant('SH.determine')
          }
        });
        setTimeout(() => this.router.navigateByUrl('dashboard/device'), 3000);
      }
    });
  }
  // 新增西班牙語-kidin-1081106
  handleProductInfo(lang) {
    if (lang === 'zh-cn') {
      this.productInfo = this.deviceInfo.informations['relatedLinks_zh-CN'];
    } else if (lang === 'en-us') {
      this.productInfo = this.deviceInfo.informations['relatedLinks_en-US'];
    } else if (lang === 'es-es') {
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
    } else if (lang === 'es-es') {
      this.productManual = this.deviceInfo.informations['relatedLinks_es-ES'];
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
            body: this.translate.instant('Dashboard.ProductInfo.changeFailed'),
            confirmText: this.translate.instant('SH.determine')
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
            body: `${this.translate.instant('Dashboard.MyDevice.unbind')}${this.translate.instant('Dashboard.MyDevice.success')}`,
            confirmText: this.translate.instant('SH.determine')
          }
        });
        setTimeout(() => history.back(), 3000);
      } else {
        this.dialog.open(MessageBoxComponent, {
          hasBackdrop: true,
          data: {
            title: 'message',
            body: `${this.translate.instant('Dashboard.MyDevice.unbind')}${this.translate.instant('Dashboard.MyDevice.failure')}`,
            confirmText: this.translate.instant('SH.determine')
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
        body: `${this.translate.instant('Dashboard.MyDevice.continueExecution')}${
          this.deviceBondUserName
        }${this.translate.instant('Dashboard.MyDevice.unbind')} sn: ${this.deviceSN} ?`,
        confirmText: this.translate.instant('SH.determine'),
        onConfirm: () => this.unBondDeviceDialog(),
        cancelText: 'cancel'
      }
    });
  }
}
