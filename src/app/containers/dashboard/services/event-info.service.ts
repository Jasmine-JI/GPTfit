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

}
