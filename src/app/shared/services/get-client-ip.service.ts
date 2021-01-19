import { Injectable } from '@angular/core';
import { HttpClient  } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';

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
    return this.http.jsonp(`${url}?${params}`, callback);
  }

}
