import { HttpClient, HttpHeaders } from '@angular/common/http';

import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

@Injectable()
export class ActivityService {
  constructor(private http: HttpClient) {}
  fetchTestData() {
    return this.http.get<any>('https://data.jianshukeji.com/jsonp?filename=json/activity.json');
  }
  fetchSportList(body) {
    return this.http.post<any>('/api/v2/sport/getSportList', body);
  }
  fetchSportListDetail(body) {
    return this.http.post<any>('/api/v2/sport/getSportListDetail', body);
  }
}
