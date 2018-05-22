import { Component, OnInit } from '@angular/core';
import { getUrlQueryStrings } from '@shared/utils/';
import { QrcodeService } from '../../services/qrcode.service';
import { HttpParams } from '@angular/common/http';
import { NgProgress } from 'ngx-progressbar';
import * as moment from 'moment';

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
        this.handleUpload();
      }
      this.progress.done();
      this.isLoading = false;
    });
  }
  handleUpload() {
    const { cs, device_sn } = this.displayQr;
    const year = device_sn.slice(0, 1).charCodeAt() + 1952;
    const firstDay = `${year}0101`;
    const weekStr = moment(firstDay)
      .locale('en')
      .format('dddd');
    const week = {
      'Monday': 6,
      'Tuesday': 5,
      'Wednesday': 4,
      'Thursday': 3,
      'Friday': 2,
      'Saturday': 1,
      'Sunday': 7
    };
    const weekNum = week[weekStr];
      const day = +(((device_sn.slice(1, 3)) - 1) * 7) + weekNum;
      const dateTimeStamp = moment(firstDay, 'YYYY-MM-DD')
        .add(day, 'days')
        .unix();
    if (dateTimeStamp * 1000 < Date.now()) {
      this.uploadDevice();
    } else {
      this.handleCScode(cs, device_sn);
    }
  }
  handleCScode(code, sn) {
    const weights = [2, 2, 6, 1, 8, 3, 4, 1, 1, 1, 1, 1, 1];
    const arr = sn.split('').map((_str, idx) => _str.charCodeAt() * weights[idx]);
    let evenNum = 0;
    let oddNum = 0;
    arr.forEach((_arr, idx) => {
      if ((idx + 1) % 2 === 0) {
        evenNum += _arr;
      } else {
        oddNum += _arr;
      }
    });
    let finalStr = (evenNum * oddNum).toString();
    finalStr = finalStr.slice(finalStr.length - 4, finalStr.length);
    if (finalStr === code) {
      this.isWrong = false;
    } else {
      this.isWrong = true;
    }
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
    }, err => this.isWrong = true);
  }
  swithMainApp() {
    this.isMainAppOpen = !this.isMainAppOpen;
  }
  swithSecondApp() {
    this.isSecondAppOpen = !this.isSecondAppOpen;
  }
}
