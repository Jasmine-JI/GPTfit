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
  fetchRegister (body: any, newHeader: any) {
    const httpOptions = this.setNewHeader(newHeader);
    return <any> this.http.post('/api/v2/user/register', body, httpOptions).pipe(
      catchError(err => throwError(err))
    );
  }

  /**
   * api-v2 1002
   * @param body {any}-api 所需參數
   * @param ip {string}-使用者ip位置
   */
  fetchEnableAccount (body: any, newHeader: any) {
    const httpOptions = this.setNewHeader(newHeader);
    return <any> this.http.post('/api/v2/user/enableAccount', body, httpOptions).pipe(
      catchError(err => throwError(err))
    );
  }

  /**
   * Api-v2 1004-忘記密碼
   */
  fetchForgetpwd (body, newHeader: any) {
    const httpOptions = this.setNewHeader(newHeader);
    return this.http.post<any>('/api/v2/user/resetPassword', body, httpOptions);
  }

  /**
   * Api-v2 1005-編輯帳密
   */
  fetchEditAccountInfo (body, newHeader: any) {
    const httpOptions = this.setNewHeader(newHeader);
    return this.http.post<any>('/api/v2/user/editAccount', body, httpOptions);
  }

  /**
   * api-v2 1006
   * @param body {any}-api 所需參數
   * @param ip {string}-使用者ip位置
   */
  fetchCaptcha (body: any, newHeader: any) {
    const httpOptions = this.setNewHeader(newHeader);
    return <any> this.http.post('/api/v2/user/captcha', body, httpOptions).pipe(
      catchError(err => throwError(err))
    );
  }

  /**
   * api-v2 1007
   * @param body {any}-api 所需參數
   * @param ip {string}-使用者ip位置
   */
  fetchQrcodeLogin (body: any, newHeader: any) {
    const httpOptions = this.setNewHeader(newHeader);
    return <any> this.http.post('/api/v2/user/qrSignIn', body, httpOptions).pipe(
      catchError(err => throwError(err))
    );
  }


  /**
   * api-v2 1012
   * @param body {any}-api 所需參數
   * @author kidin-1091217
   */
  fetchCompressData (body: any, newHeader: any) {
    const httpOptions = this.setNewHeader(newHeader);
    return <any> this.http.post('/api/v2/archive/startCompressData', body, httpOptions).pipe(
      catchError(err => throwError(err))
    );
  }

  /**
   * api-v2 1013
   * @param body {any}-api 所需參數
   * @author kidin-1091217
   */
  fetchDestroyAccount (body: any, newHeader: any) {
    const httpOptions = this.setNewHeader(newHeader);
    return <any> this.http.post('/api/v2/archive/destroyMe', body, httpOptions).pipe(
      catchError(err => throwError(err))
    );
  }

  /**
   * 回傳欲添加的header物件
   * @param options {any}-欲設置之header
   * @author kidin-1110114
   */
  setNewHeader(options: any) {
    return options ? { headers: new HttpHeaders(options)} : undefined;
  }

}
