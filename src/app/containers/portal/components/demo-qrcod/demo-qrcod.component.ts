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
    this.qrcodeService
      .getDeviceInfo(params)
      .subscribe(res => {
        this.deviceInfo = res;
        this.progress.done();
      });
  }
  swithMainApp() {
    this.isMainAppOpen = !this.isMainAppOpen;
  }
  swithSecondApp() {
    this.isSecondAppOpen = !this.isSecondAppOpen;
  }
}
