import { HttpClient } from '@angular/common/http';

import { Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';

const { API_SERVER } = environment.url;

@Injectable()
export class GpxService {
  constructor(private http: HttpClient) {}
  downloadFile() {
    return this.http.post(
      API_SERVER + 'gpx/download',
      {},
      {
        responseType: 'blob', // 注意這邊要選 `blob`
      }
    );
  }
}
