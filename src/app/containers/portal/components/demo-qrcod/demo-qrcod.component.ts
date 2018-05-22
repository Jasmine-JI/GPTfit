import { Component, OnInit } from '@angular/core';
import { getUrlQueryStrings } from '@shared/utils/';
import { QrcodeService } from '../../services/qrcode.service';
import { HttpParams } from '@angular/common/http';
import { NgProgress } from 'ngx-progressbar';

@Component({
  selector: 'app-demo-qrcod',
  templateUrl: './demo-qrcod.component.html',
  styleUrls: ['./demo-qrcod.component.css']
})
export class DemoQrcodComponent implements OnInit {
  displayQr: any;
  deviceInfo: any;
  isMainAppOpen = false;
  isSecondAppOpen = false;
  isWrong = false;
  noProductImg: string;
  isLoading: boolean;
  constructor(
    private qrcodeService: QrcodeService,
    private progress: NgProgress
  ) {}

  ngOnInit() {
    const queryStrings = getUrlQueryStrings(location.search);
    this.displayQr = queryStrings;
    let params = new HttpParams();
    params = params.set('device_sn', this.displayQr.device_sn);
    this.progress.start();
    this.isLoading = true;
    this.qrcodeService.getDeviceInfo(params).subscribe(res => {
      if (typeof res === 'string') {
        this.noProductImg = `http://${
          location.hostname
        }/app/public_html/products/img/unknown.png`;
      } else {
        this.deviceInfo = res;
        this.uploadDevice();
      }
      this.progress.done();
      this.isLoading = false;
    });
  }
  uploadDevice() {
    const types = ['Wearable', 'Treadmill', 'Spin Bike', 'Rowing machine'];
    const { modeType } = this.deviceInfo;
    const { cs, device_sn } = this.displayQr;
    const typeIdx = types.findIndex(
      _type => _type.toLowerCase() === modeType.toLowerCase()
    );
    const body = {
      token: '',
      verifyCode: this.displayQr.cs,
      deviceType: typeIdx,
      deviceDistance: '',
      deviceUsage: '',
      deviceFWVer: '',
      deviceRFVer: ''
    };
    this.qrcodeService.uploadDeviceInfo(body, device_sn).subscribe(res => {
      const result = res;
      if (result.resultCode !== 200) {
        this.isWrong = true;
      } else {
        this.isWrong = false;
      }
    });
  }
  swithMainApp() {
    this.isMainAppOpen = !this.isMainAppOpen;
  }
  swithSecondApp() {
    this.isSecondAppOpen = !this.isSecondAppOpen;
  }
}
