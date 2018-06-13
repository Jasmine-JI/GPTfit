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
        Accept: 'application/json', // 必要 為了不要讓他自動帶any mime type
        chartset: 'utf-8',
        deviceType: '0',
        deviceName: 'Chrome',
        deviceOSVersion: 'chrome',
        deviceID: 'IMEIxxxxxxx',
        appVersionCode: '1.0.0',
        appVersionName: '1.0.0',
        language: 'zh',
        regionCode: 'TW',
        appName: 'AlaCenter'
      }
    });
    if (token) {
      newRequest = request.clone({
        setHeaders: {
          Authorization: token,
        }
      });
    }
    return next.handle(newRequest);
  }
}
