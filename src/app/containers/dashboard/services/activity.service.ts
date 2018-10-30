import { HttpClient, HttpHeaders } from '@angular/common/http';

import { Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';

const { API_SERVER } = environment.url;
@Injectable()
export class ActivityService {
  constructor(private http: HttpClient) {}
  fetchTestData() {
    return this.http.get<any>('https://data.jianshukeji.com/jsonp?filename=json/activity.json');
  }

  // fetchSportList(params) {
  //   return this.http.get<any>(API_SERVER + 'sport/sportList', { params });
  // }
  fetchSportList(body) {
    return this.http.post<any>('/api/v2/sport/getSportList', body);
  }
  fetchSportListDetail(params) {
    return this.http.get<any>(API_SERVER + 'sport/sportListDetail', { params });
  }
}
