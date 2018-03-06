import { HttpClient } from '@angular/common/http';

import { Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { Ranks, EventRanks } from '../models/ranks';

const { API_SERVER } = environment.url;

@Injectable()
export class RankFormService {
  constructor(private http: HttpClient) {}

  getRank(params) {
    return this.http.get<Ranks>(API_SERVER + 'rankform', { params });
  }
  getMapOptions() {
    return this.http.get(API_SERVER + 'rankform/rankInfo/map');
  }
  getMonths() {
    return this.http.get(API_SERVER + 'rankform/rankInfo/month');
  }
  getMapInfos(params) {
    return this.http.get(API_SERVER + 'rankform/mapInfo', { params });
  }
  getEmail(params) {
    return this.http.get(API_SERVER + 'rankform/rankInfo/email', { params });
  }
  getName(params) {
    return this.http.get(API_SERVER + 'rankform/rankInfo/userName', { params });
  }
  getPhone(params) {
    return this.http.get(API_SERVER + 'rankform/rankInfo/phone', { params });
  }
  getRealTimeEvent(params) {
    return this.http.get<EventRanks>(API_SERVER + 'rankform/eventRank', { params });
  }
  getRankTabs() {
    return this.http.get(API_SERVER + 'raceEventInfo/rankTab');
  }
}
