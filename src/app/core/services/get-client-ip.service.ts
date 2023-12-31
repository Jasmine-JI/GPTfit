import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { throwRxError } from '../utils';

@Injectable({
  providedIn: 'root',
})
export class GetClientIpService {
  ipInfo: any = null;

  constructor(private http: HttpClient) {}

  /**
   * 藉由外部網址取得Jsonp資訊
   * @param url {string}-外部網址
   * @param params {string}-query string
   * @param callback {any}
   */
  requestJsonp(url: string, params: string, callback = 'callback') {
    // options.params is an HttpParams object
    return this.http
      .jsonp(`${url}?${params}`, callback)
      .pipe(catchError((err) => throwRxError(err)));
  }

  /**
   * 藉由外部網址取得ip和country資訊
   */
  requestIpAddress() {
    // 備用 ip 查詢用 api https://api.ipify.org (無country)
    if (this.ipInfo) return of(this.ipInfo);

    const getIpApiUrl = 'https://get.geojs.io/v1/ip/country.js';
    return this.http.jsonp(`${getIpApiUrl}?format=jsonp`, 'callback').pipe(
      tap((ipResult) => (this.ipInfo = ipResult)),
      catchError((err) => {
        console.error(err);
        // 避免無法連上外部網站api造成頁面無法使用
        const replaceResult = {
          country: null,
          country_3: null,
          ip: '',
          name: null,
        };

        return of(replaceResult);
      })
    );
  }
}
