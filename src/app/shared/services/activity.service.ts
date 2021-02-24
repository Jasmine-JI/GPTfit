import { HttpClient, HttpHeaders } from '@angular/common/http';

import { Injectable } from '@angular/core';
import { UtilsService } from './utils.service';
import { environment } from '../../../environments/environment';

const { API_SERVER } = environment.url;

@Injectable()
export class ActivityService {

  constructor(
    private http: HttpClient,
    private utils: UtilsService
  ) {}

  // 使用nodejs先將數據下載成文件再上傳至server-kidin-1090421
  uploadSportFile (body) {
    return this.http.post<any>(API_SERVER + 'uploadSportFile', body);
  }

  fetchTestData() {
    return this.http.get<any>('https://data.jianshukeji.com/jsonp?filename=json/activity.json');
  }
  fetchSportList(body) {
    return this.http.post<any>('/api/v2/sport/getSportList', body);
  }
  fetchSportListDetail(body) {
    return this.http.post<any>('/api/v2/sport/getSportListDetail', body);
  }
  fetchEditActivityProfile(body) {
    return this.http.post<any>('/api/v2/sport/editActivityProfile', body);
  }
  fetchMultiActivityData(body) {
    return this.http.post<any>('/api/v2/sport/getMultiActivityData', body);
  }

  deleteActivityData (body) {
    return this.http.post<any>('/api/v2/sport/deleteActivityData', body);
  }

}
