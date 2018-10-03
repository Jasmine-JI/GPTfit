import { Component, OnInit } from '@angular/core';
import { getUrlQueryStrings } from '@shared/utils/';
import { QrcodeService } from '../../services/qrcode.service';
import { HttpParams } from '@angular/common/http';
// import { NgProgress, NgProgressRef } from '@ngx-progressbar/core';
import { NgProgress } from 'ngx-progressbar';
import * as moment from 'moment';
import { UtilsService } from '@shared/services/utils.service';
import { TranslateService } from '@ngx-translate/core';
import { MatDialog } from '@angular/material/dialog';
import { MessageBoxComponent } from '@shared/components/message-box/message-box.component';
import { AuthService } from '@shared/services/auth.service';
import { Router } from '@angular/router';

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
  productInfo: any;
  productManual: any;
  // progressRef: NgProgressRef;
  isShowBindingBtn = false;
  isShowFitPairBtn = false;
  fitPairType: string;
  isFitPaired: boolean;
  imgClass = 'product-photo--landscape';
  constructor(
    private qrcodeService: QrcodeService,
    private progress: NgProgress,
    private utilsService: UtilsService,
    private translateService: TranslateService,
    private dialog: MatDialog,
    private authService: AuthService,
    private router: Router
  ) { }

  ngOnInit() {
    const queryStrings = getUrlQueryStrings(location.search);
    this.displayQr = queryStrings;

    this.fitPairType = this.utilsService.getLocalStorageObject('fitPairType');
    if (this.fitPairType) {
      this.handleFitPair();
      this.utilsService.removeLocalStorageObject('fitPairType');
    }
    const langName = this.utilsService.getLocalStorageObject('locale');
    this.translateService.onLangChange.subscribe(e => {
      if (this.deviceInfo) {
        this.handleProductInfo(e.lang);
        this.handleProductManual(e.lang);
      }
    });
    let params = new HttpParams();
    params = params.set('device_sn', this.displayQr.device_sn);
    // this.progressRef = this.progress.ref();
    this.progress.start();
    this.isLoading = true;
    this.qrcodeService.getDeviceInfo(params).subscribe(res => {
      if (typeof res === 'string') {
        this.noProductImg = `http://${
          location.hostname
          }/app/public_html/products/img/unknown.png`;
        this.progress.done();
        this.isLoading = false;
      } else {
        this.deviceInfo = res;
        const image = new Image();
        image.addEventListener('load', e => this.handleImageLoad(e));
        image.src = this.deviceInfo.modelImgUrl;
        this.handleProductInfo(langName);
        this.handleProductManual(langName);
        this.handleUpload();
      }
    });
  }
  handleImageLoad(event): void {
    const width = event.target.width;
    const height = event.target.height;
    this.imgClass =
      width > height ? 'product-photo--landscape' : 'product-photo--portrait';
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
  handleProductManual(lang) {
    if (lang === 'zh-cn') {
      this.productManual = this.deviceInfo.informations['manual_zh-CN'];
    } else if (lang === 'en-us') {
      this.productManual = this.deviceInfo.informations['manual_en-US'];
    } else {
      this.productManual = this.deviceInfo.informations['manual_zh-TW'];
    }
  }
  handleUpload() {
    const { cs, device_sn } = this.displayQr;
    const year = device_sn.slice(0, 1).charCodeAt() + 1952;
    const firstDay = `${year}0101`;
    const weekStr = moment(firstDay)
      .locale('en')
      .format('dddd');
    const week = {
      Monday: 6,
      Tuesday: 5,
      Wednesday: 4,
      Thursday: 3,
      Friday: 2,
      Saturday: 1,
      Sunday: 7
    };
    const weekNum = week[weekStr];
    const day = +((device_sn.slice(1, 3) - 1) * 7) + weekNum;
    const dateTimeStamp = moment(firstDay, 'YYYY-MM-DD')
      .add(day, 'days')
      .unix();
    if (dateTimeStamp * 1000 < Date.now()) {
      this.uploadDevice();
    } else {
      this.handleCScode(cs, device_sn);
      this.progress.done();
      this.isLoading = false;
    }
  }
  handleCScode(code, sn) {
    const weights = [2, 2, 6, 1, 8, 3, 4, 1, 1, 1, 1, 1, 1, 1];
    const arr = sn
      .split('')
      .map((_str, idx) => _str.charCodeAt() * weights[idx]);
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
    this.isShowBindingBtn = false; // 無論是否正確，出廠日期前，皆不顯示登錄產品btn
  }
  uploadDevice() {
    const types = ['Wearable', 'Treadmill', 'Spin Bike', 'Rowing machine'];
    const { modelType } = this.deviceInfo;
    const { cs, device_sn } = this.displayQr;
    const typeIdx = types.findIndex(
      _type => _type.toLowerCase() === modelType.toLowerCase()
    );
    const body = {
      token: '',
      uploadEquipmentSN: device_sn,
      verifyCode: this.displayQr.cs,
      deviceType: typeIdx,
      deviceDistance: '',
      deviceUsage: '',
      deviceFWVer: '',
      deviceRFVer: ''
    };
    this.qrcodeService.uploadDeviceInfo(body, device_sn).subscribe(
      res => {
        this.progress.done();
        this.isLoading = false;
        const result = res;
        const {
          resultCode,
          info: { warrantyStatus, fitPairStatus, isFitPaired }
        } = result;
        this.isFitPaired = isFitPaired;
        if (resultCode !== 200) {
          this.isShowBindingBtn = false; // 驗證失敗，不顯示登錄產品btn
          this.isShowFitPairBtn = false;
          this.isWrong = true;
        } else {
          this.isShowBindingBtn = warrantyStatus !== '2'; // 驗證成功，判斷是否已綁訂
          this.isShowFitPairBtn = fitPairStatus === '3';
          this.isWrong = false;
        }
      },
      err => (this.isWrong = true)
    );
  }
  swithMainApp() {
    this.isMainAppOpen = !this.isMainAppOpen;
  }
  swithSecondApp() {
    this.isSecondAppOpen = !this.isSecondAppOpen;
  }
  handleBindingInfo() {
    const localSN = this.utilsService.getLocalStorageObject('snNumber');
    if (localSN) {
      localSN.push(this.displayQr.device_sn);
      this.utilsService.setLocalStorageObject('snNumber', localSN);
      this.utilsService.setLocalStorageObject('updateIdx', localSN.length - 1);
    } else {
      this.utilsService.setLocalStorageObject('snNumber', [
        this.displayQr.device_sn
      ]);
      this.utilsService.setLocalStorageObject('updateIdx', '0'); // 因為防止0 number為falsey值，妨礙判斷式
    }
    this.utilsService.setLocalStorageObject('bondStatus', '1'); // 先狀態是綁訂，之後解綁訂再加判斷
  }
  handleGoLoginPage(type: number) {
    if (type === 1) {
      this.authService.backUrl = '/dashboard/device';
      this.handleBindingInfo();
    } else {
      this.authService.backUrl = location.pathname + location.search;
      this.utilsService.setLocalStorageObject('fitPairType', this.fitPairType);
    }
    this.router.navigateByUrl(`signin`);
  }
  goBinding() {
    const token = this.utilsService.getToken();
    if (!token) {
      this.dialog.open(MessageBoxComponent, {
        hasBackdrop: true,
        data: {
          title: 'message',
          body: `如果要登入產品，請登入，系統將會自動完成登錄產品的流程`,
          confirmText: '確定',
          cancelText: '取消',
          onConfirm: this.handleGoLoginPage.bind(this, 1)
        }
      });
    } else {
      this.handleBindingInfo();
      this.router.navigateByUrl(`dashboard/device`);
    }
  }
  fitPair(type) {
    this.fitPairType = type;
    const token = this.utilsService.getToken();
    if (!token) {
      this.dialog.open(MessageBoxComponent, {
        hasBackdrop: true,
        data: {
          title: 'message',
          body: `如果要Fit Pair產品，請登入，系統將會自動完成Fit Pair產品的流程`,
          confirmText: '確定',
          cancelText: '取消',
          onConfirm: this.handleGoLoginPage.bind(this, 2)
        }
      });
    } else {
      this.handleFitPair();
    }
  }
  handleFitPair() {
    const token = this.utilsService.getToken();
    const { device_sn } = this.displayQr;
    const body = {
      token,
      fitPairType: this.fitPairType,
      pairEquipmentSN: [device_sn]
    };
    this.qrcodeService.fitPairSetting(body).subscribe(res => {
      if (res.resultCode === 200) {
        if (this.fitPairType === '2') {
          return this.dialog.open(MessageBoxComponent, {
            hasBackdrop: true,
            data: {
              title: 'message',
              body: `完成解除Fit Pairt`,
              confirmText: '確定',
              onConfirm: this.uploadDevice.bind(this)
            }
          });
        } else {
          this.dialog.open(MessageBoxComponent, {
            hasBackdrop: true,
            data: {
              title: 'message',
              body: `Fit Pairt成功`,
              confirmText: '確定',
              onConfirm: this.uploadDevice.bind(this)
            }
          });
        }
      } else {
        this.dialog.open(MessageBoxComponent, {
          hasBackdrop: true,
          data: {
            title: 'message',
            body: `Fit Pair失敗`,
            confirmText: '確定',
            onConfirm: this.uploadDevice.bind(this)
          }
        });
      }
    });
  }
}
