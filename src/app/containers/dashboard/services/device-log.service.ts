import { HttpClient, HttpHeaders } from '@angular/common/http';

import { Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';

const { API_SERVER } = environment.url;

@Injectable()
export class DeviceLogService {
  constructor(private http: HttpClient) {}
  fetchLists(params) {
    return this.http.get<any>(API_SERVER + 'deviceLog/lists', { params });
  }
  searchKeyword(params) {
    return this.http.get<any>(API_SERVER + 'deviceLog/search', { params });
  }
}
