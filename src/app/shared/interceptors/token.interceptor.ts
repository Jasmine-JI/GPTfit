import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor
} from '@angular/common/http';
import { UtilsService } from '../services/utils.service';
import { Observable } from 'rxjs';
import { version } from '../version';
import moment from 'moment';

@Injectable()
export class TokenInterceptor implements HttpInterceptor {

  constructor(
    public utils: UtilsService
  ) {}

  /**
   * 根據不同環境顯示版本號和設置api header
   * @param request {HttpRequest<any>}
   * @param next {HttpHandler}
   */
  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    let appVersion;
    if (
      location.hostname.indexOf('cloud.alatech.com.tw') > -1
      || location.hostname.indexOf('www.gptfit.com') > -1
    ) {
      appVersion = version.master;
    } else if (location.hostname.indexOf('app.alatech.com.tw') > -1) {
      appVersion = version.release;
    } else {
      appVersion = version.develop;
    }

    const token = this.utils.getToken() || '',
          // 取瀏覽器語系若為日語，則只會回'ja'
          regionCode = navigator.language.toUpperCase().split('-')[1]
            || navigator.language.toUpperCase().split('-')[0]
            || 'US';

    let newRequest = request.clone({
      setHeaders: {
        Accept: 'application/json',
        charset: 'utf-8',
        Authorization: 'required',
        deviceType: '0',
        deviceName: 'Web',
        deviceOSVersion: this.utils.detectBrowser(),
        // deviceID: '0', // browser沒有唯一碼
        appName: 'AlaCenter',
        appVersionCode: appVersion,
        appVersionName: appVersion,
        language: this.utils.getLocalStorageObject('locale') || 'en-us',
        regionCode,
        utcZone: moment().format('Z')
      }

    });

    if (token) {
      newRequest = newRequest.clone({
        setHeaders: {
          Authorization: token
        }
      });
    }

    return next.handle(newRequest);
  }
}
