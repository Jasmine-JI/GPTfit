import { Component, OnInit, OnDestroy } from '@angular/core';
import { QrcodeService } from '../../services/qrcode.service';
import { HttpParams } from '@angular/common/http';
import { NgProgress, NgProgressRef } from '@ngx-progressbar/core';
import moment from 'moment';
import { UtilsService } from '../../../../shared/services/utils.service';
import { TranslateService } from '@ngx-translate/core';
import { MatDialog } from '@angular/material/dialog';
import { MessageBoxComponent } from '../../../../shared/components/message-box/message-box.component';
import { AuthService } from '../../../../shared/services/auth.service';
import { Router } from '@angular/router';
import { UserProfileService } from '../../../../shared/services/user-profile.service';
import { Subscription, Subject, of } from 'rxjs';
import { takeUntil, switchMap, map } from 'rxjs/operators';

@Component({
  selector: 'app-demo-qrcod',
  templateUrl: './demo-qrcod.component.html',
  styleUrls: ['./demo-qrcod.component.scss']
})
export class DemoQrcodComponent implements OnInit, OnDestroy {
  private ngUnsubscribe = new Subject;
  i18n = {
    confirm: '',
    bindSuccess: '',
    bindFailed: ''
  };
  displayQr: any;
  deviceInfo: any;
  isMainAppOpen = [];
  isSecondAppOpen = [];
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
  secondaryAppList = [];
  imageStoragePlace = `http://${location.hostname}/app/public_html/products`;
  constructor(
    private qrcodeService: QrcodeService,
    private progress: NgProgress,
    private utilsService: UtilsService,
    private translateService: TranslateService,
    private dialog: MatDialog,
    private authService: AuthService,
    private router: Router,
    private userProfileService: UserProfileService
  ) {}

  ngOnInit() {
    this.getTranslate();
    this.token = this.utilsService.getToken() || '';
    const queryStrings = this.utilsService.getUrlQueryStrings(location.search);
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
      'queryArray': [this.displayQr.device_sn.toUpperCase()]
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
        this.secondaryAppList = this.deviceInfo.secondaryApp;
      }
    });
  }


  /**
   * 待多國語系套件載入完成後再生成翻譯
   * @author kidin-1091015
   */
  getTranslate () {
    this.translateService.get('hellow world').subscribe(() => {
      this.i18n = {
        confirm: this.translateService.instant('universal_operating_confirm'),
        bindSuccess: this.translateService.instant('universal_btDevice_bindSuccess'),
        bindFailed: this.translateService.instant('universal_popUpMessage_pairFailed')
      }

    });

  }

  handleImageLoad(event): void {
    const width = event.target.width;
    const height = event.target.height;
    this.imgClass =
      width > height ? 'product-photo--portrait' : 'product-photo--landscape';
  }

  handleProductInfo(lang) {
    const lanArr = lang.split('-'),
          formatLang = `${lanArr[0].toLowerCase()}-${lanArr[1].toUpperCase()}`;

    this.productInfo = this.deviceInfo[`relatedLinks_${formatLang}`] || [];
  }

  handleProductManual(lang) {
    const lanArr = lang.split('-'),
          formatLang = `${lanArr[0].toLowerCase()}-${lanArr[1].toUpperCase()}`;

    this.productManual = this.deviceInfo[`manual_${formatLang}`] || [];
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
    this.qrcodeService.uploadDeviceInfo(body, device_sn).pipe(
      switchMap(res1 => {
        return this.userProfileService.getRxUserProfile().pipe(
          map(res2 => this.token ? [res1, res2.userId] : [res1])
        );
      }),
      takeUntil(this.ngUnsubscribe)
    ).subscribe(
      res => {
        const [result, userId] = [...res];
        this.progressRef.complete();
        this.isLoading = false;
        const {
          resultCode,
          info: { 
            warrantyStatus,
            fitPairStatus,
            isFitPaired,
            fitPairUserId
          }
        } = result;

        if (resultCode !== 200) {
          this.isShowBindingBtn = false; // 驗證失敗，不顯示登錄產品btn
          this.isShowFitPairBtn = false;
          this.isWrong = true;
        } else {
          this.isShowBindingBtn = warrantyStatus != '2'; // 驗證成功，判斷是否已綁訂
          this.isShowFitPairBtn = fitPairStatus === '3';
          this.isWrong = false;

          this.isFitPaired = isFitPaired;
          if (fitPairStatus == 3 && isFitPaired && fitPairUserId != userId) {
            this.openFitPairAlert();
          }

        }

      },
      err => (this.isWrong = true)
    );
  }

  /**
   * 若使用者非該裝置榜定者，則跳出訊息提示是否複寫fitpair對象
   * @author kidin-1100409
   */
  openFitPairAlert() {
    this.translateService.get('hellow world').pipe(
      takeUntil(this.ngUnsubscribe)
    ).subscribe(() => {
      return this.dialog.open(MessageBoxComponent, {
        hasBackdrop: true,
        data: {
          title: 'message',
          body: this.translateService.instant('universal_deviceSetting_overwrite'),
          confirmText: this.translateService.instant('universal_operating_confirm'),
          onConfirm: this.coverFitpair.bind(this),
          cancelText: this.translateService.instant('universal_operating_cancel')
        }
  
      });

    });

  }

  /**
   * 覆蓋fitpair對象
   * @author kidin-1100409
   */
  coverFitpair() {
    this.fitPair('2', false);
    this.fitPair('1');
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

  swithSecondApp(e) {
    const currentId = Number(e.target.id);
    if (this.isSecondAppOpen.indexOf(currentId) < 0) {
      this.isSecondAppOpen.push(currentId);
    } else {
      this.isSecondAppOpen = this.isSecondAppOpen.filter(id => {
        return id !== currentId;
      });
    }
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
    this.router.navigateByUrl(`signIn-web`);
  }

  goBinding() {
    if (!this.token) {
      return this.handleGoLoginPage(1);
    } else {
      this.handleBindingInfo();
      this.router.navigateByUrl(`dashboard/device`);
    }
  }

  fitPair(type: string, showMessage: boolean = true) {
    this.fitPairType = type;
    if (this.fitPairType === '2' || (!this.isShowBindingBtn)) {
      return this.handleFitPair();
    }

    return this.dialog.open(MessageBoxComponent, {
      hasBackdrop: true,
      data: {
        title: 'message',
        body: this.translateService.instant('universal_uiFitpair_singleFitpairPrecautions'),
        confirmText: this.translateService.instant('universal_deviceSetting_productRegistration'),
        onConfirm: this.goBinding.bind(this, 1),
        cancelText: this.translateService.instant('universal_uiFitpair_singleFitpair'),
        onCancel: this.handleFitPair.bind(this, showMessage)
      }
    });
  }

  handleFitPair(showMessage: boolean = true) {
    const { device_sn } = this.displayQr;
    const body = {
      token: this.token,
      fitPairType: this.fitPairType,
      pairEquipmentSN: [device_sn]
    };

    if (!this.token) {
      return this.handleGoLoginPage(2);
    }

    this.qrcodeService.fitPairSetting(body).pipe(
      switchMap(res => {
        // 確保多國語系載入
        return this.translateService.get('hellow world').pipe(
          map(resp => {
            return res;
          }),
          takeUntil(this.ngUnsubscribe),
        )
      })
    ).subscribe(res => {
      if (res.resultCode === 200) {
        if (this.fitPairType == '2' && showMessage) {
          return this.dialog.open(MessageBoxComponent, {
            hasBackdrop: true,
            data: {
              title: 'message',
              body: this.translateService.instant(
                'universal_uiFitpair_undoFitpair'
              ),
              confirmText: this.i18n.confirm,
              onConfirm: this.uploadDevice.bind(this)
            }
          });
        } else {
          this.dialog.open(MessageBoxComponent, {
            hasBackdrop: true,
            data: {
              title: 'message',
              body: this.i18n.bindSuccess,
              confirmText: this.i18n.confirm,
              onConfirm: this.uploadDevice.bind(this)
            }
          });
        }
      } else {
        this.dialog.open(MessageBoxComponent, {
          hasBackdrop: true,
          data: {
            title: 'message',
            body: this.i18n.bindFailed,
            confirmText: this.i18n.confirm,
            onConfirm: this.uploadDevice.bind(this)
          }
        });
      }
    });
  }

  /**
   * 取消rxjs訂閱
   * @author kidin-1100309
   */
  ngOnDestroy() {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

}
