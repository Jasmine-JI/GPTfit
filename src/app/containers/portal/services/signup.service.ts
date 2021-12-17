import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable()
export class SignupService {
  constructor(
    private http: HttpClient
  ) {}

  /**
   * api-v2 1001
   * @param body {any}-api 所需參數
   * @param ip {string}-使用者ip位置
   */
  fetchRegister (body: any, ip: string, regionCode: string) {
    const httpOptions = {
      headers: new HttpHeaders({
        'remoteAddr': ip,
        'regionCode': regionCode || 'US'
      })
    };

    return <any> this.http.post('/api/v2/user/register', body, httpOptions).pipe(
      catchError(err => throwError(err))
    );
  }

  /**
   * api-v2 1002
   * @param body {any}-api 所需參數
   * @param ip {string}-使用者ip位置
   */
  fetchEnableAccount (body: any, ip: string) {
    const httpOptions = {
      headers: new HttpHeaders({
        'remoteAddr': ip,
      })
    };

    return <any> this.http.post('/api/v2/user/enableAccount', body, httpOptions).pipe(
      catchError(err => throwError(err))
    );
  }

  /**
   * api-v2 1006
   * @param body {any}-api 所需參數
   * @param ip {string}-使用者ip位置
   */
  fetchCaptcha (body: any, ip: string) {
    const httpOptions = {
      headers: new HttpHeaders({
        'remoteAddr': ip,
      })
    };

    return <any> this.http.post('/api/v2/user/captcha', body, httpOptions).pipe(
      catchError(err => throwError(err))
    );
  }

  /**
   * api-v2 1007
   * @param body {any}-api 所需參數
   * @param ip {string}-使用者ip位置
   */
  fetchQrcodeLogin (body: any, ip: string) {
    const httpOptions = {
      headers: new HttpHeaders({
        'remoteAddr': ip,
      })
    };

    return <any> this.http.post('/api/v2/user/qrSignIn', body, httpOptions).pipe(
      catchError(err => throwError(err))
    );
  }


  /**
   * api-v2 1012
   * @param body {any}-api 所需參數
   * @author kidin-1091217
   */
  fetchCompressData (body: any) {
    return <any> this.http.post('/api/v2/archive/startCompressData', body).pipe(
      catchError(err => throwError(err))
    );
  }

  /**
   * api-v2 1013
   * @param body {any}-api 所需參數
   * @author kidin-1091217
   */
  fetchDestroyAccount (body: any) {
    return <any> this.http.post('/api/v2/archive/destroyMe', body).pipe(
      catchError(err => throwError(err))
    );
  }

}
