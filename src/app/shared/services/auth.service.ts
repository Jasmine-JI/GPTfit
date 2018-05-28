import {
  HttpClient,
  HttpHeaders,
  HttpErrorResponse
} from '@angular/common/http';

import { Injectable, Injector } from '@angular/core';
import { environment } from '../../../environments/environment';

const { API_SERVER } = environment.url;
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { User } from '../models/user';
import { Response } from '../models/response';
import { Observable } from 'rxjs/Observable';
import { of } from 'rxjs/observable/of';
import { UtilsService, TOKEN } from '@shared/services/utils.service';
import { Router } from '@angular/router';
import * as moment from 'moment';

@Injectable()
export class AuthService {
  loginStatus$ = new BehaviorSubject<boolean>(false);
  currentUser$ = new BehaviorSubject<User>(null);
  backUrl = '';
  constructor(
    private http: HttpClient,
    private utils: UtilsService,
    private injector: Injector // private router: Router
  ) {}

  loginServer(body) {
    const headers = new HttpHeaders();
    const httpOptions = {
      headers: new HttpHeaders({
        Accept: 'application/json',
        'Content-Type': 'application/json',
        chartset: 'utf-8',
        Authorization: 'required',
        deviceType: '0',
        deviceName: 'Chrome',
        deviceOSVersion: 'chrome',
        deviceID: 'IMEIxxxxxxx',
        appVersionCode: '4.4.14',
        appVersionName: 'v1.0.0',
        language: 'zh',
        regionCode: 'TW',
        appName: 'AlaCloudRun'
      })
    };
    return this.http.post<any>('/api/v1/user/login', body, httpOptions);
  }
  login(loginData): Observable<boolean> {
    return this.loginServer(loginData).map(
      (res: Response) => {
        if (res.resultCode === 200) {
          const { name, token, tokenTimeStamp } = res.info;
          this.loginStatus$.next(true);
          this.currentUser$.next(name);
          this.utils.writeToken(token);
          this.utils.setLocalStorageObject('ala_token_time', tokenTimeStamp);
          const router = this.injector.get(Router);
          if (this.backUrl.length > 0) {
            router.navigate([this.backUrl]);
          } else {
            router.navigate(['/dashboard']);
          }
          return true;
        } else {
          return false; // can not login
        }
      },
      (err: HttpErrorResponse) => {
        if (err.error instanceof Error) {
          console.log('client-side error');
        } else {
          console.log('server-side error');
        }
        return of(false);
      }
    );
  }
  logout() {
    this.loginStatus$.next(false);
    this.currentUser$.next(null);
    this.utils.removeToken();
    this.utils.removeLocalStorageObject('ala_token_time');
    this.backUrl = '';
  }
  getLoginStatus(): Observable<boolean> {
    return this.loginStatus$;
  }
  getCurrentUser(): Observable<User> {
    return this.currentUser$;
  }
  isTokenExpired(token: string = TOKEN): boolean {
    const alaToken = this.utils.getToken(token);
    if (alaToken) {
      const tokenTimeStamp = this.utils.getLocalStorageObject('ala_token_time');
      return this.calcTokenTime(tokenTimeStamp);
    } else {
      return true; // no token
    }
  }
  calcTokenTime(time) {
    const nowTimeStamp = moment().unix();
    const periodTime = nowTimeStamp - time;
    const isExpiredTime = periodTime > 604800 ? true : false; // 超過七天不讓他登入，要他再次登入去更新時間，刷新token交給app
    if (isExpiredTime) {
      return true;
    } else {
      return false;
    }
  }
  // when startup
  checkUser(): Observable<boolean> {
    if (!this.isTokenExpired()) {
      this.loginStatus$.next(true);
      return of(true);
    } else { // 'no token or token is expired'
      this.utils.removeToken();
      this.utils.removeLocalStorageObject('ala_token_time');
      return of(false);
    }
  }
}
