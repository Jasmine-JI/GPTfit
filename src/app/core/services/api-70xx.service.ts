import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { catchError } from 'rxjs/operators';
import { throwRxError } from '../utils';

@Injectable({
  providedIn: 'root',
})
export class Api70xxService {
  constructor(private http: HttpClient) {}

  /**
   * api 7007-上傳裝置日誌，及觸發裝置啟用(不代表保固註冊)
   * @param body {any}-api 7007 request body
   * @param sn {string}-裝置sn碼
   */
  fetchUploadDeviceInfo(body: any, sn: string) {
    const httpOptions = {
      headers: new HttpHeaders({
        equipmentSN: sn,
      }),
    };

    return this.http
      .post<any>('/api/v1/device/uploadDeviceInfo', body, httpOptions)
      .pipe(catchError((err) => throwRxError(err)));
  }

  /**
   * api 7008-更新設備與會員綁定資訊(保固註冊)
   * @param body {any}-api 7008 request body
   */
  fetchUpdateDeviceBonding(body: any) {
    return this.http
      .post<any>('/api/v1/device/updateDeviceBonding', body)
      .pipe(catchError((err) => throwRxError(err)));
  }

  /**
   * api 7010-取得我的設備列表
   * @param body {any}-api 7010 request body
   */
  fetchGetDeviceList(body: any) {
    return this.http
      .post<any>('/api/v1/device/getDeviceList', body)
      .pipe(catchError((err) => throwRxError(err)));
  }

  /**
   * api 7011-取得我的設備詳細資訊
   * @param body {any}-api 7011 request body
   */
  fetchGetDeviceDetail(body: any) {
    return this.http
      .post<any>('/api/v1/device/getDeviceDetail', body)
      .pipe(catchError((err) => throwRxError(err)));
  }

  /**
   * api 7012-學員執行單次FitPair
   * @param body {any}-api 7012 request body
   */
  fetchFitPairSetting(body: any) {
    return this.http
      .post<any>('/api/v1/device/fitPairSetting', body)
      .pipe(catchError((err) => throwRxError(err)));
  }

  /**
   * api 7013-編輯我的裝置Fitpair設定
   * @param body {any}-api 7013 request body
   */
  fetchEditDeviceInfo(body: any) {
    return this.http
      .post<any>('/api/v1/device/editDeviceInfo', body)
      .pipe(catchError((err) => throwRxError(err)));
  }

  /**
   * api-7014 取得FitPair的學員資訊
   * @param body {any}
   */
  fetchFitPairInfo(body: any) {
    return this.http
      .post<any>('/api/v1/device/getFitPairInfo', body)
      .pipe(catchError((err) => throwRxError(err)));
  }

  /**
   * api 7015-取得商品資訊
   * @param body {any}-api 7015 request body
   */
  fetchGetProductInfo(body: any) {
    return this.http
      .post<any>('/api/v1/device/getProductInfo', body)
      .pipe(catchError((err) => throwRxError(err)));
  }

  /**
   * api 7018-建立FitPair網址
   * @param body {any}-api 7018 request body
   */
  fetchGetQRFitPairURL(body: any) {
    return this.http
      .post<any>('/api/v1/device/getQRFitPairURL', body)
      .pipe(catchError((err) => throwRxError(err)));
  }

  /**
   * api 7021-取得設備資訊(日誌)
   * @param body {Object}
   */
  fetchGetEquipmentLog(body: any) {
    return this.http
      .post<any>('/api/v1/device/getEquipmentLog', body)
      .pipe(catchError((err) => throwRxError(err)));
  }

  /**
   * api 7023-從管理群組(課程)中，可將註冊裝置從群組加入或移除
   * @param body {Object}
   */
  fetchUpdateGroupDeviceList(body: any) {
    return this.http
      .post<any>('/api/v1/device/updateGroupDeviceList', body)
      .pipe(catchError((err) => throwRxError(err)));
  }
}
