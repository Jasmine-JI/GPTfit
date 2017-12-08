import { HttpClient } from '@angular/common/http';

import { Injectable } from '@angular/core';

@Injectable()
export class RankFormService {
  constructor(private http: HttpClient) {}

  getRank(params) {
    return this.http.get('http://192.168.1.235:3000/rankform', { params });
  }
  getMapOptions() {
    return this.http.get('http://192.168.1.235:3000/rankform/rankInfo/map');
  }
  getMonths() {
    return this.http.get('http://192.168.1.235:3000/rankform/rankInfo/month');
  }
  getMapInfos(params) {
    return this.http.get('http://192.168.1.235:3000/rankform/mapInfo', { params });
  }
  getEmail(params) {
    return this.http.get('http://192.168.1.235:3000/rankform/rankInfo/email', { params });
  }
}
