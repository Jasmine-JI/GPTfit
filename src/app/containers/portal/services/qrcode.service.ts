import { HttpClient } from '@angular/common/http';

import { Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';

const { API_SERVER } = environment.url;

@Injectable()
export class QrcodeService {
  constructor(private http: HttpClient) {}

  getDeviceInfo(params) {
    return this.http.get(API_SERVER + 'qrPair', { params });
  }
}
