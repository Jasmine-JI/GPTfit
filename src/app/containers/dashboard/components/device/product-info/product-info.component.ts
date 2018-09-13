import { Component, OnInit, OnDestroy } from '@angular/core';
import { QrcodeService } from '../../../../portal/services/qrcode.service';
import { HttpParams } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { NgProgress, NgProgressRef } from '@ngx-progressbar/core';
import { GlobalEventsManager } from '@shared/global-events-manager';

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

  constructor(
    private qrCodeService: QrcodeService,
    private progress: NgProgress,
    private route: ActivatedRoute,
    private globalEventsManager: GlobalEventsManager
  ) {}

  ngOnInit() {
    this.globalEventsManager.setFooterRWD(2); // 為了讓footer長高85px
    this.deviceSN = this.route.snapshot.paramMap.get('deviceSN');
    let params = new HttpParams();
    params = params.set('device_sn', this.deviceSN);
    this.progressRef = this.progress.ref();
    this.progressRef.start();
    this.isLoading = true;
    this.qrCodeService.getDeviceInfo(params).subscribe(res => {
      if (typeof res === 'string') {
        this.noProductImg = `http://${
          location.hostname
        }/app/public_html/products/img/unknown.png`;
      } else {
        this.deviceInfo = res;
        this.handleProductInfo('');
        // this.handleUpload();
      }
      this.progressRef.complete();
      this.isLoading = false;
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
}
