import { Component, OnInit, OnDestroy } from '@angular/core';
import { QrcodeService } from '../../../../portal/services/qrcode.service';
import { HttpParams } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { NgProgress, NgProgressRef } from '@ngx-progressbar/core';
import { GlobalEventsManager } from '@shared/global-events-manager';
import { UtilsService } from '@shared/services/utils.service';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MessageBoxComponent } from '@shared/components/message-box/message-box.component';

@Component({
  selector: 'app-product-info',
  templateUrl: './product-info.component.html',
  styleUrls: ['./product-info.component.css', '../../../group/group-style.css']
})
export class ProductInfoComponent implements OnInit, OnDestroy {
  groupImg = 'http://app.alatech.com.tw/app/public_html/products/img/t0500.png';
  progressRef: NgProgressRef;
  isLoading = false;
  noProductImg: string;
  deviceInfo: any;
  deviceSN: string;
  productInfo: any;
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
  constructor(
    private qrCodeService: QrcodeService,
    private progress: NgProgress,
    private route: ActivatedRoute,
    private globalEventsManager: GlobalEventsManager,
    private utilsService: UtilsService,
    private router: Router,
    public dialog: MatDialog
  ) {}

  ngOnInit() {
    this.globalEventsManager.setFooterRWD(2); // 為了讓footer長高85px
    this.deviceSN = this.route.snapshot.paramMap.get('deviceSN');
    let snNumbers = this.utilsService.getLocalStorageObject('snNumber');
    if (snNumbers && snNumbers.findIndex(_num => _num === this.deviceSN) > -1) {
      snNumbers = snNumbers.filter(_sn => _sn !== this.deviceSN);
      this.utilsService.setLocalStorageObject('snNumber', snNumbers);
    }
    if (snNumbers && snNumbers.length === 0) {
      this.utilsService.removeLocalStorageObject('snNumber');
    }
    let params = new HttpParams();
    params = params.set('device_sn', this.deviceSN);
    this.progressRef = this.progress.ref();
    this.progressRef.start();
    this.isLoading = true;
    this.token = this.utilsService.getToken();
    const body = {
      token: this.token,
      myEquipmentSN: this.deviceSN
    };
    this.qrCodeService.getDeviceDetail(body).subscribe(res => {
      this.fitPairStatus = res.info.fitPairStatus;
      if (res.resultCode === 200) {
        this.qrCodeService.getDeviceInfo(params).subscribe(response => {
          this.progressRef.complete();
          this.isLoading = false;
          this.deviceInfo = response;
          const langName = this.utilsService.getLocalStorageObject('locale');
          this.handleProductInfo(langName);
        });
      } else {
        this.router.navigateByUrl('dashboard/device');
      }
    });
  }
  ngOnDestroy() {
    this.globalEventsManager.setFooterRWD(0); // 為了讓footer自己變回去預設值
  }
  handleProductInfo(lang) {
    if (lang === 'zh-cn') {
      this.productInfo = this.deviceInfo.informations['relatedLinks_zh-CN'];
    } else if (lang === 'en-us') {
      this.productInfo = this.deviceInfo.informations['relatedLinks_en-US'];
    } else {
      this.productInfo = this.deviceInfo.informations['relatedLinks_zh-TW'];
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
            body: '變更失敗',
            confirmText: '確定'
          }
        });
      }
    });
  }
}
