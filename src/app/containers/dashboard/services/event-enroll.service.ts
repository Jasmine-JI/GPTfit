import { HttpClient, HttpHeaders } from '@angular/common/http';

import { Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { CONTENT_TYPE } from '@shared/utils/';

const { API_SERVER } = environment.url;

@Injectable()
export class EventEnrollService {
  constructor(private http: HttpClient) {}

  uploadFile(body) {
    const headers = new HttpHeaders();
    headers.append('Content-Type', 'application/form-data');
    headers.append('Accept', 'application/json');
    console.log('body', body);
    console.log('API_SERVER: ', API_SERVER);
    return this.http.post(API_SERVER + 'raceEnroll/upload', body, { headers });
  }
}
