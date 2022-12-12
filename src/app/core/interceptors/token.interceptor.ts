import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor } from '@angular/common/http';
import { Observable } from 'rxjs';
import { version } from '../version';
import dayjs from 'dayjs';
import { AuthService } from '../services';
import { getLocalStorageObject } from '../utils';

@Injectable()
export class TokenInterceptor implements HttpInterceptor {
  constructor(private authService: AuthService) {}

  /**
   * 根據不同環境顯示版本號和設置api header
   * @param request {HttpRequest<any>}
   * @param next {HttpHandler}
   */
  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // 取瀏覽器語系若為日語，則只會回'ja'
    const regionCode =
      navigator.language.toUpperCase().split('-')[1] ||
      navigator.language.toUpperCase().split('-')[0] ||
      'US';

    let setHeaders: any = {
      Accept: 'application/json',
      charset: 'utf-8',
      Authorization: 'required',
      deviceOSVersion: this.detectBrowser(),
      // deviceID: '0', // browser沒有唯一碼
      language: getLocalStorageObject('locale') || 'en-us',
      regionCode,
      utcZone: dayjs().format('Z'),
    };

    const token = this.authService.token;
    if (token) {
      setHeaders = {
        ...setHeaders,
        Authorization: token,
      };
    }

    setHeaders = { ...this.checkHeader(request.headers), ...setHeaders };
    const newRequest = request.clone({ setHeaders });
    return next.handle(newRequest);
  }

  /**
   * 確認是否已設置部份header，避免覆蓋
   * @author kidin-1110117
   */
  checkHeader(headers: any) {
    const appVersion = this.getWebVersion();
    let defaultHeader = {};
    const checkKey = [
      ['deviceType', '0'],
      ['deviceName', 'Web'],
      ['appName', 'AlaCenter'],
      ['appVersionCode', appVersion],
      ['appVersionName', appVersion],
    ];

    checkKey.forEach(([_key, _value]) => {
      const haveKey = headers.has(_key);
      if (!haveKey) {
        defaultHeader = {
          [_key]: _value,
          ...defaultHeader,
        };
      }
    });

    return defaultHeader;
  }

  /**
   * 根據環境取得對應版本
   * @author kidin-1110117
   */
  getWebVersion() {
    if (
      location.hostname.indexOf('cloud.alatech.com.tw') > -1 ||
      location.hostname.indexOf('www.gptfit.com') > -1
    ) {
      return version.master;
    } else if (location.hostname.indexOf('app.alatech.com.tw') > -1) {
      return version.release;
    } else {
      return version.develop;
    }
  }

  detectBrowser() {
    const sUsrAg = navigator.userAgent;
    if (sUsrAg.indexOf('Firefox') > -1) {
      return 'Mozilla Firefox';
    } else if (sUsrAg.indexOf('Opera') > -1) {
      return 'Opera';
    } else if (sUsrAg.indexOf('Trident') > -1) {
      return 'Microsoft Internet Explorer';
    } else if (sUsrAg.indexOf('Edge') > -1) {
      return 'Microsoft Edge';
    } else if (sUsrAg.indexOf('Chrome') > -1 || sUsrAg.indexOf('CriOS') > -1) {
      // CriOS為首機版的
      return 'Google Chrome or Chromium';
    } else if (sUsrAg.indexOf('Safari') > -1) {
      return 'Apple Safari';
    } else {
      return 'unknown';
    }
  }
}
