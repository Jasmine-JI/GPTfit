import { HttpClient } from '@angular/common/http';

import { Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';

const { API_SERVER } = environment.url;

@Injectable()
export class ResetPasswordService {
  constructor(private http: HttpClient) {}

  resetPassword(body) {
    return this.http.post('/api/v1/user/resetPWD', body);
  }
  getEmail(code) {
    return this.http.get(API_SERVER + 'resetPassword/getEmail?code=' + code);
  }
}
