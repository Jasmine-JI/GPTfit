import { HttpClient } from '@angular/common/http';

import { Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';

const { API_SERVER } = environment.url;

@Injectable()
export class SignupService {
  constructor(private http: HttpClient) {}

  getSMSVerifyCode(body) {
    return this.http.post('/api/v1/user/getSMSVerifyCode', body);
  }
  register(body) {
    return this.http.post('/api/v1/user/register', body);
  }
}