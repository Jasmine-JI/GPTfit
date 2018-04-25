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
    headers.append('Accept', 'application/json');
    headers.append('Accept-Encoding', 'gzip/deflate');
    headers.append('Content-Type', 'application/json');
    headers.append('chartset', 'utf-8');
    headers.append('Authorization', 'required');
    headers.append('deviceType', '2');
    headers.append('deviceName', 'htc one');
    headers.append('deviceOSVersion', 'android');
    headers.append('deviceID', 'IMEIxxxxxxx');
    headers.append('appVersionCode', '4.4.14');
    headers.append('appVersionName', 'v1.0.0');
    headers.append('language', 'zh');
    headers.append('regionCode', 'TW');
    headers.append('appName', 'AlaCloudRun');
    headers.append('equipmentSN', 'tradmill');
    return this.http.post<any>('/race_test', body, {
      headers
    });
  }
}
