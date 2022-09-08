import { HttpClient } from '@angular/common/http';

import { Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';

const { API_SERVER } = environment.url;

@Injectable()
export class InnerAdminService {
  constructor(private http: HttpClient) {}

  uploadGpxFile(body) {
    return this.http.post<any>(API_SERVER + 'gpx/upload', body);
  }
  downloadGpxFile() {
    return this.http.post(
      API_SERVER + 'gpx/download',
      {},
      {
        responseType: 'blob', // 注意這邊要選 `blob`
      }
    );
  }
}
