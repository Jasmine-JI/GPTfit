import { HttpClient } from '@angular/common/http';

import { Injectable } from '@angular/core';

@Injectable()
export class ResetPasswordService {
  constructor(private http: HttpClient) {}

  resetPassword(body) {
    return this.http.post('/api/v1/user/resetPWD', body);
  }
  getEmail(code) {
    return this.http.get('http://alatechapp.alatech.com.tw:3000/resetPassword/getEmail?code=' + code);
  }
}
