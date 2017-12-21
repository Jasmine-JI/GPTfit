import { HttpClient } from '@angular/common/http';

import { Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';

const domain = environment.domain;

@Injectable()
export class RankFormService {
  constructor(private http: HttpClient) {}

  getRank(params) {
    return this.http.get(domain + 'rankform', { params });
  }
  getMapOptions() {
    return this.http.get(domain + 'rankform/rankInfo/map');
  }
  getMonths() {
    return this.http.get(domain + 'rankform/rankInfo/month');
  }
  getMapInfos(params) {
    return this.http.get(domain + 'rankform/mapInfo', { params });
  }
  getEmail(params) {
    return this.http.get(domain + 'rankform/rankInfo/email', { params });
  }
}
