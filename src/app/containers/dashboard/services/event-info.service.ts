import { HttpClient, HttpHeaders } from '@angular/common/http';

import { Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';

const { API_SERVER } = environment.url;

@Injectable()
export class EventInfoService {
  constructor(private http: HttpClient) {}

  fetchEventInfo(params) {
    return this.http.get(API_SERVER + 'raceEventInfo', { params });
  }
  fetchTodayRank(params) {
    return this.http.get(API_SERVER + 'rankForm/todayRank', { params });
  }
  createEvent(body) {
    return this.http.post(API_SERVER + 'raceEventInfo/create', body);
  }
  removeEvent(id) {
    return this.http.delete(API_SERVER + 'raceEventInfo/' + id);
  }
  updateEvent(body) {
    return this.http.put(API_SERVER + 'raceEventInfo/edit', body);
  }
}
