import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

const { API_SERVER } = environment.url;

@Injectable()
export class QrcodeService {

  showFitPairSetting = false;

  constructor(private http: HttpClient) {}

  /**
   * api 7007-上傳裝置日誌，及觸發裝置啟用(不代表保固註冊)
   * @param body {any}-api 7007 request body
   * @param sn {string}-裝置sn碼
   */
  uploadDeviceInfo(body: any, sn: string) {
    const httpOptions = {
      headers: new HttpHeaders({
        'equipmentSN': sn,
      })
    };

    return this.http.post<any>('/api/v1/device/uploadDeviceInfo', body, httpOptions).pipe(
      catchError(err => throwError(err))
    );

  }

  /**
   * api 7008-更新設備與會員綁定資訊(保固註冊)
   * @param body {any}-api 7008 request body
   */
  updateDeviceBonding(body: any) {
    return this.http.post<any>('/api/v1/device/updateDeviceBonding', body).pipe(
      catchError(err => throwError(err))
    );

  }
  
  /**
   * api 7010-取得我的設備列表
   * @param body {any}-api 7010 request body
   */
  getDeviceList(body: any) {
    return this.http.post<any>('/api/v1/device/getDeviceList', body).pipe(
      catchError(err => throwError(err))
    );

  }

  /**
   * api 7011-取得我的設備詳細資訊
   * @param body {any}-api 7011 request body
   */
  getDeviceDetail(body: any) {
    return this.http.post<any>('/api/v1/device/getDeviceDetail', body).pipe(
      catchError(err => throwError(err))
    );

  }

  /**
   * api 7012-學員執行單次FitPair
   * @param body {any}-api 7012 request body
   */
  fitPairSetting(body: any) {
    return this.http.post<any>('/api/v1/device/fitPairSetting', body).pipe(
      catchError(err => throwError(err))
    );

  }

  /**
   * api 7013-編輯我的裝置Fitpair設定
   * @param body {any}-api 7013 request body
   */
  editDeviceInfo(body: any) {
    return this.http.post<any>('/api/v1/device/editDeviceInfo', body).pipe(
      catchError(err => throwError(err))
    );

  }

  /**
   * api 7015-取得商品資訊
   * @param body {any}-api 7015 request body
   */
  getProductInfo(body: any) {
    return this.http.post<any>('/api/v1/device/getProductInfo', body).pipe(
      catchError(err => throwError(err))
    );

  }

  /**
   * api 7018-建立FitPair網址
   * @param body {any}-api 7018 request body
   */
  getQRFitPairURL(body: any) {
    return this.http.post<any>('/api/v1/device/getQRFitPairURL', body).pipe(
      catchError(err => throwError(err))
    );

  }

  /**
   * api 7021-取得設備資訊(日誌)
   * @param body {Object}
   * @author kidin-1090924
   */
  getEquipmentLog(body: any) {
    return this.http.post<any>('/api/v1/device/getEquipmentLog', body).pipe(
      catchError(err => throwError(err))
    );
    
  }

  /**
   * api 7023-從管理群組(課程)中，可將註冊裝置從群組加入或移除
   * @param body {Object}
   * @author kidin-1090924
   */
   updateGroupDeviceList(body: any) {
    return this.http.post<any>('/api/v1/device/updateGroupDeviceList', body).pipe(
      catchError(err => throwError(err))
    );
    
  }

  /**
   * 設定是否顯示fitPair設定框
   * @param show {boolean}-是否顯示fitPair設定框
   * @author kidin-1100709
   */
  setFitPairSettingMsg(show: boolean) {
    this.showFitPairSetting = show;
  }

  /**
   * 是否顯示fitPair設定框
   * @returns {boolean}
   * @author kidin-1100709
   */
  getFitPairSettingMsg(): boolean {
    return this.showFitPairSetting;
  }

  /**
   * 建立裝置日誌checksum
   * @param sn {string}-sn碼
   * @author kidin-1100716
   */
  createDeviceChecksum(sn: string): string {
    const weighted = [2, 2, 6, 1, 8, 3, 4, 1, 1, 1, 1, 1, 1, 1];
    let oddTotal = 0,
        evenTotal = 0;
    for (let i = 0, len = sn.length; i < len; i++) {
      const weightedValue = sn.charCodeAt(i) * weighted[i];
      if ((i + 1) % 2 === 0) {
        evenTotal += weightedValue;
      } else {
        oddTotal += weightedValue;
      }
    }

    const multiplyStr = `${evenTotal * oddTotal}`,
          multiplyStrLen = multiplyStr.length,
          checkSum = multiplyStr.slice(multiplyStrLen - 4, multiplyStrLen);
    return checkSum;
  }

}
