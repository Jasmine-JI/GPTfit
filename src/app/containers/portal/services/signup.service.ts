import { HttpClient } from '@angular/common/http';

import { Injectable } from '@angular/core';

@Injectable()
export class SignupService {
  constructor(private http: HttpClient) {}

  getSMSVerifyCode(body) {
    return this.http.post('/api/v1/user/getSMSVerifyCode', body);
  }
  register(body) {
    return this.http.post('/api/v1/user/register', body);
  }

  fetchRegister (body) {  // v2-1001
    return <any> this.http.post('/api/v2/user/register', body);
  }

  fetchEnableAccount (body) {  // v2-1002
    return <any> this.http.post('/api/v2/user/enableAccount', body);
  }

  fetchCaptcha (body) {  // v2-1006
    return <any> this.http.post('/api/v2/user/captcha', body);
  }
}
