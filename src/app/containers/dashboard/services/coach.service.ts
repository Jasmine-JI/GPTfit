import { HttpClient, HttpHeaders } from '@angular/common/http';

import { Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';

const { API_SERVER } = environment.url;

@Injectable()
export class CoachService {
  constructor(private http: HttpClient) {}
  fetchExample(body) {
    return this.http.post<any>(API_SERVER + 'coach/example', body);
  }
  fetchFileName(params) {
    return this.http.get<any>(API_SERVER + 'coach/fileName', { params });
  }
  postFakeData(body) {
    return this.http.post<any>(API_SERVER + 'coach/fakeData', body);
  }
  fetchRaceList(body) {
    return this.http.post<any>('/api/v1/race/getRaceList', body);
  }
  fetchRealTimeData(params) {
    return this.http.get<any>(API_SERVER + 'coach/realTimeData', { params });
  }
  postRaceTest(body) {
    const headers = new HttpHeaders();
    const httpOptions = {
      headers: new HttpHeaders({
        Accept: 'application/json',
        'Content-Type': 'application/json',
        chartset: 'utf-8',
        Authorization: 'required',
        deviceType: '2',
        deviceName: 'htc one',
        deviceOSVersion: 'android',
        deviceID: 'IMEIxxxxxxx',
        appVersionCode: '4.4.14',
        appVersionName: 'v1.0.0',
        language: 'zh',
        regionCode: 'TW',
        appName: 'AlaCloudRun',
        equipmentSN: 'tradmill'
      })
    };

    return this.http.post<any>('/race_test', body, httpOptions);
  }
}
