import { HttpClient } from '@angular/common/http';

import { Injectable } from '@angular/core';

@Injectable()
export class ResetPasswordService {
  constructor(private http: HttpClient) {}

  resetPassword(body) {
    return this.http.post('/api/v1/user/resetPWD', body);
  }
  getEmail(code) {
    return this.http.get('http://192.168.1.235:3000/resetPassword/getEmail?code=' + code);
  }
}
