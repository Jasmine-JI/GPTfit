import { HttpClient, HttpHeaders } from '@angular/common/http';

import { Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';

const { API_SERVER } = environment.url;

@Injectable()
export class DeviceLogService {
  constructor(private http: HttpClient) {}
  fetchLists() {
      return this.http.get(API_SERVER + 'deviceLog/lists'); // 注意這邊要選 `blob`
  }
}
