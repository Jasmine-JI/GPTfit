import { HttpClient, HttpHeaders } from '@angular/common/http';

import { Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';

const { API_SERVER } = environment.url;

@Injectable()
export class QrcodeService {
  constructor(private http: HttpClient) {}

  uploadDeviceInfo(body, sn) {
    const httpOptions = {
      headers: new HttpHeaders({
        'equipmentSN': sn,
      })
    };
    return this.http.post<any>('/api/v1/device/uploadDeviceInfo', body, httpOptions); // 7007
  }
  updateDeviceBonding(body) {
    return this.http.post<any>('/api/v1/device/updateDeviceBonding', body); // 7008
  }
  getDeviceList(body) {
    return this.http.post<any>('/api/v1/device/getDeviceList', body); // 7010
  }
  getDeviceDetail(body) {
    return this.http.post<any>('/api/v1/device/getDeviceDetail', body); // 7011
  }
  fitPairSetting(body) {
    return this.http.post<any>('/api/v1/device/fitPairSetting', body); // 7012
  }
  editDeviceInfo(body) {
    return this.http.post<any>('/api/v1/device/editDeviceInfo', body); // 7013
  }
  getProductInfo(body) {
    return this.http.post<any>('/api/v1/device/getProductInfo', body); // 7015
  }
  getQRFitPairURL(body) {
    return this.http.post<any>('/api/v1/device/getQRFitPairURL', body); // 7018
  }

  /**
   * 取得設備資訊-7021
   * @param body {Object}
   * @author kidin-1090924
   */
  getEquipmentLog(body: any) {
    return this.http.post<any>('/api/v1/device/getEquipmentLog', body);
  }

}
