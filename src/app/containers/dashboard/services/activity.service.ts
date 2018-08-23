import { HttpClient, HttpHeaders } from '@angular/common/http';

import { Injectable } from '@angular/core';

@Injectable()
export class ActivityService {
  constructor(private http: HttpClient) {}
  fetchTestData() {
    return this.http.get<any>('https://data.jianshukeji.com/jsonp?filename=json/activity.json');
  }
}
