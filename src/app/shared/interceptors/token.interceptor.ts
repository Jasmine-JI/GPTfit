import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor
} from '@angular/common/http';
import { UtilsService } from '../services/utils.service';
import { Observable } from 'rxjs/Observable';
import { version } from '../version';

@Injectable()
export class TokenInterceptor implements HttpInterceptor {
  constructor(public utils: UtilsService) {}
  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    let appVersion;
    if (location.hostname.indexOf('cloud.alatech.com.tw') > -1) {
      appVersion = version.master;
    } else if (location.hostname.indexOf('app.alatech.com.tw') > -1) {
      appVersion = version.release;
    } else {
      appVersion = version.develop;
    }
    const token = this.utils.getToken();
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
        regionCode: 'TW'
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
