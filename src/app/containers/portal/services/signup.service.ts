import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable()
export class SignupService {
  constructor(
    private http: HttpClient
  ) {}

  getSMSVerifyCode(body) {
    return this.http.post('/api/v1/user/getSMSVerifyCode', body);
  }

  register(body) {
    return this.http.post('/api/v1/user/register', body);
  }

  fetchRegister (body, ip) {  // v2-1001
    const httpOptions = {
      headers: new HttpHeaders({
        'remoteAddr': `${ip}`,
      })
    };

    return <any> this.http.post('/api/v2/user/register', body, httpOptions);
  }

  fetchEnableAccount (body, ip) {  // v2-1002
    const httpOptions = {
      headers: new HttpHeaders({
        'remoteAddr': `${ip}`,
      })
    };

    return <any> this.http.post('/api/v2/user/enableAccount', body, httpOptions);
  }

  fetchCaptcha (body, ip) {  // v2-1006
    const httpOptions = {
      headers: new HttpHeaders({
        'remoteAddr': `${ip}`,
      })
    };

    return <any> this.http.post('/api/v2/user/captcha', body, httpOptions);
  }

  fetchQrcodeLogin (body, ip) {  // v2-1007
    const httpOptions = {
      headers: new HttpHeaders({
        'remoteAddr': `${ip}`,
      })
    };

    return <any> this.http.post('/api/v2/user/qrSignIn', body, httpOptions);
  }

}
