import { HttpClient, HttpHeaders } from '@angular/common/http';

import { Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';

const { API_SERVER } = environment.url;

@Injectable()
export class QrcodeService {
  constructor(private http: HttpClient) {}

  getDeviceInfo(params) {
    return this.http.get(API_SERVER + 'qrPair', { params });
  }

  uploadDeviceInfo(body, sn) {
    const headers = new HttpHeaders();
    const httpOptions = {
      headers: new HttpHeaders({
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'chartset': 'utf-8',
        'Authorization': 'required',
        'deviceType': '0',
        'deviceName': 'Chrome',
        'deviceOSVersion': 'chrome',
        'deviceID': 'IMEIxxxxxxx',
        'appVersionCode': '4.4.14',
        'appVersionName': 'v1.0.0',
        'language': 'zh',
        'regionCode': 'TW',
        'appName': 'AlaCloudRun',
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
}
