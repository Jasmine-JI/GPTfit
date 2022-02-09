import { Injectable } from '@angular/core';
import { HttpClient  } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError, of } from 'rxjs';
import { catchError } from 'rxjs/operators';


@Injectable({
  providedIn: 'root'
})
export class GetClientIpService {

  ip$ = new BehaviorSubject<string>('');

  constructor(private http: HttpClient) {}

  /**
   * 藉由外部網址取得Jsonp資訊
   * @param url {string}-外部網址
   * @param params {string}-query string
   * @param callback {any}
   * @author kidin-1100119
   */
  requestJsonp(url, params, callback = 'callback') {
    // options.params is an HttpParams object
    return this.http.jsonp(`${url}?${params}`, callback).pipe(
      catchError(err => throwError(err))
    );
  }

  /**
   * 藉由外部網址取得ip和country資訊
   * @author kidin-1110207
   */
  requestIpAddress() {
    // 備用 ip 查詢用 api https://api.ipify.org (無country)
    const getIpApiUrl = 'https://get.geojs.io/v1/ip/country.js';
    return this.http.jsonp(`${getIpApiUrl}?format=jsonp`, 'callback').pipe(
      catchError(err => {
        console.error(err);
        // 避免無法連上外部網站api造成頁面無法使用
        const replaceResult = {
          country: null,
          country_3: null,
          ip: '',
          name: null
        };

        return of(replaceResult);
      })

    );

  }

}
