import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor
} from '@angular/common/http';
import { UtilsService } from '../services/utils.service';
import { Observable } from 'rxjs/Observable';
@Injectable()
export class TokenInterceptor implements HttpInterceptor {
  constructor(public utils: UtilsService) {}
  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
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
        appVersionCode: 'v.1.0.0 beta',
        appVersionName: 'v.1.0.0 beta',
        language: this.utils.getLocalStorageObject('locale'),
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
