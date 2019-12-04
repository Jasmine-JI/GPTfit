import { Component, OnInit } from '@angular/core';
import { getUrlQueryStrings } from '@shared/utils/';
import { QrcodeService } from '../../services/qrcode.service';
import { HttpParams } from '@angular/common/http';
import { NgProgress, NgProgressRef } from '@ngx-progressbar/core';
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
  isMainAppOpen = [];
  isSecondAppOpen = false;
  isWrong = false;
  noProductImg: string;
  isLoading: boolean;
  productInfo: any;
  productManual: any;
  progressRef: NgProgressRef;
  isShowBindingBtn = false;
  isShowFitPairBtn = false;
  fitPairType: string; // 1:fit pair對應頭像與運動檔案， 2.解除fit pair 3:fit pair僅對應運動檔案
  isFitPaired: boolean;
  imgClass = 'product-photo--landscape';
  token: string;
  mainAppList = [];
  imageStoragePlace = `http://${location.hostname}/app/public_html/products`;
  constructor(
    private qrcodeService: QrcodeService,
    private progress: NgProgress,
    private utilsService: UtilsService,
    private translateService: TranslateService,
    private dialog: MatDialog,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.token = this.utilsService.getToken();
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
    // 改成串接後端api(7015)-kidin-1081203
    const body = {
      'token': '',
      'queryType': '1',
      'queryArray': [this.displayQr.device_sn]
    };
    this.progressRef = this.progress.ref();
    this.progressRef.start();
    this.isLoading = true;
    this.qrcodeService.getProductInfo(body).subscribe(res => {
      this.deviceInfo = res.info.productInfo[0];
      if (!this.deviceInfo.modelID) {
        this.noProductImg = `http://${location.hostname}/app/public_html/products/img/unknown.png`;
        this.progressRef.complete();
        this.isLoading = false;
      } else {
        const image = new Image();
        image.addEventListener('load', e => this.handleImageLoad(e));
        image.src = `http://${location.hostname}/app/public_html/products + ${this.deviceInfo.modelImg}`;
        this.handleProductInfo(langName);
        this.handleProductManual(langName);
        this.handleUpload();
        this.mainAppList = this.deviceInfo.mainApp;
      }
    });
  }
  handleImageLoad(event): void {
    const width = event.target.width;
    const height = event.target.height;
    this.imgClass =
      width > height ? 'product-photo--portrait' : 'product-photo--landscape';
  }
  // 新增西班牙語-kidin-1081106
  handleProductInfo(lang) {
    if (lang === 'zh-cn') {
      this.productInfo = this.deviceInfo['relatedLinks_zh-CN'];
    } else if (lang === 'en-us') {
      this.productInfo = this.deviceInfo['relatedLinks_en-US'];
    } else if (lang === 'es-es') {
      this.productInfo = this.deviceInfo['relatedLinks_es-ES'];
    } else {
      this.productInfo = this.deviceInfo['relatedLinks_zh-TW'];
    }
  }
  // 新增西班牙語-kidin-1081106
  handleProductManual(lang) {
    if (lang === 'zh-cn') {
      this.productManual = this.deviceInfo['manual_zh-CN'];
    } else if (lang === 'en-us') {
      this.productManual = this.deviceInfo['manual_en-US'];
    } else if (lang === 'es-es') {
      this.productManual = this.deviceInfo['manual_es-ES'];
    } else {
      this.productManual = this.deviceInfo['manual_zh-TW'];
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
      this.progressRef.complete();
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
    const types = ['Wearable', 'Treadmill', 'spinBike', 'rowMachine'];
    const { modelTypeID } = this.deviceInfo;  // 改成串接後端api，故更改該key-kidin-1081203
    const { cs, device_sn } = this.displayQr;
    const typeIdx = types.findIndex(
      _type => _type.toLowerCase() === modelTypeID.toLowerCase()
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
        this.progressRef.complete();
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
  swithMainApp(e) {
    const currentId = Number(e.target.id);
    if (this.isMainAppOpen.indexOf(currentId) < 0) {
      this.isMainAppOpen.push(currentId);
    } else {
      this.isMainAppOpen = this.isMainAppOpen.filter(id => {
        return id !== currentId;
      });
    }
  }
  swithSecondApp() {
    this.isSecondAppOpen = !this.isSecondAppOpen;
  }
  handleBindingInfo() {
    const localSN = this.utilsService.getLocalStorageObject('snNumber');
    // if (
    //   this.deviceInfo.modelType === '1' ||
    //   this.deviceInfo.modelType === '5' // 限定穿戴型類與感應器類裝置
    // ) {
      this.utilsService.setSessionStorageObject('bindingSN', this.displayQr.device_sn);
    // }
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
    if (!this.token) {
      return this.handleGoLoginPage(1);
    } else {
      this.handleBindingInfo();
      this.router.navigateByUrl(`dashboard/device`);
    }
  }
  fitPair(type) {
    this.fitPairType = type;
    if (this.fitPairType === '2' || (!this.isShowBindingBtn)) {
      return this.handleFitPair();
    }

    return this.dialog.open(MessageBoxComponent, {
      hasBackdrop: true,
      data: {
        title: 'message',
        body: this.translateService.instant('Portal.singleFitpairPrecautions'),
        confirmText: this.translateService.instant('Portal.productRegistration'),
        onConfirm: this.goBinding.bind(this, 1),
        cancelText: this.translateService.instant('Portal.singleFitpair'),
        onCancel: this.handleFitPair.bind(this)
      }
    });
}
  handleFitPair() {
    const { device_sn } = this.displayQr;
    const body = {
      token: this.token,
      fitPairType: this.fitPairType,
      pairEquipmentSN: [device_sn]
    };
    if (!this.token) {
      return this.handleGoLoginPage(2);
    }
    this.qrcodeService.fitPairSetting(body).subscribe(res => {
      if (res.resultCode === 200) {
        if (this.fitPairType === '2') {
          return this.dialog.open(MessageBoxComponent, {
            hasBackdrop: true,
            data: {
              title: 'message',
              body: this.translateService.instant(
                'Portal.undoFitpair'
              ),
              confirmText: this.translateService.instant('SH.determine'),
              onConfirm: this.uploadDevice.bind(this)
            }
          });
        } else {
          this.dialog.open(MessageBoxComponent, {
            hasBackdrop: true,
            data: {
              title: 'message',
              body: this.translateService.instant('Portal.bindSuccess'),
              confirmText: this.translateService.instant('SH.determine'),
              onConfirm: this.uploadDevice.bind(this)
            }
          });
        }
      } else {
        this.dialog.open(MessageBoxComponent, {
          hasBackdrop: true,
          data: {
            title: 'message',
            body: this.translateService.instant('Portal.pairFailed'),
            confirmText: this.translateService.instant('SH.determine'),
            onConfirm: this.uploadDevice.bind(this)
          }
        });
      }
    });
  }
}
