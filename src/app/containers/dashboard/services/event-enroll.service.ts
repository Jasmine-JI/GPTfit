import { HttpClient, HttpHeaders } from '@angular/common/http';

import { Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { CONTENT_TYPE } from '@shared/utils/';

const { API_SERVER } = environment.url;

@Injectable()
export class EventEnrollService {
  constructor(private http: HttpClient) {}

  fetchEnrollData() {
    return this.http.get(API_SERVER + 'raceEnroll');
  }
  getEmail(params) {
    return this.http.get(API_SERVER + 'raceEnroll/emailsValidate', { params });
  }
  getPhone(params) {
    return this.http.get(API_SERVER + 'raceEnroll/phoneValidate', { params });
  }
  getIDNum(params) {
    return this.http.get(API_SERVER + 'raceEnroll/idNumberValidate', { params });
  }
  enroll(body) {
    return this.http.post(API_SERVER + 'raceEnroll/enroll', body);
  }
  uploadFile(body) {
    const headers = new HttpHeaders();
    // headers.append('Content-Type', 'application/form-data');
    // headers.append('Accept', 'application/json');
    return this.http.post(API_SERVER + 'raceEnroll/upload', body, { headers });
  }
}
