import {
  HttpClient,
  HttpErrorResponse
} from '@angular/common/http';

import { Injectable, Injector } from '@angular/core';
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
  userName = '';
  constructor(
    private http: HttpClient,
    private utils: UtilsService,
    private injector: Injector // private router: Router
  ) {}

  loginServer(body) {
    return this.http.post<any>('/api/v1/user/login', body);
  }
  login(loginData): Observable<boolean> {
    return this.loginServer(loginData).map(
      (res: Response) => {
        if (res.resultCode === 200) {
          const { name, token, tokenTimeStamp } = res.info;
          this.loginStatus$.next(true);
          // to remove
          this.currentUser$.next(name);
          this.userName = name;
          this.utils.writeToken(token);
          this.utils.setLocalStorageObject('ala_token_time', tokenTimeStamp);
          const router = this.injector.get(Router);
          if (res.info.firstLogin === '2') {
            this.utils.setSessionStorageObject('isFirstLogin', true);
            router.navigate(['/first-login']);
          } else if (this.backUrl.length > 0) {
            location.href = this.backUrl; // 為了讓登入的api request payload清除掉
          } else {
            // router.navigate(['/dashboard']);
            location.href = '/dashboard'; // 為了讓登入的api request payload清除掉
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

  loginServerV2(body) {  // v2-1003
    return this.http.post<any>('/api/v2/user/signIn', body);
  }

  loginV2(loginData): Observable<boolean> {
    return this.loginServerV2(loginData).map(
      (res: any) => {
        if (res.processResult.resultCode === 200) {
          const name = res.userProfile.nickname,
                token = res.signIn.token;
          this.loginStatus$.next(true);
          // to remove
          this.currentUser$.next(name);
          this.userName = name;
          this.utils.writeToken(token);
          const router = this.injector.get(Router);
          if (res.signIn.counter <= 1) {
            this.utils.setSessionStorageObject('isFirstLogin', true);
            router.navigate(['/first-login']);
          } else if (this.backUrl.length > 0) {
            location.href = this.backUrl; // 為了讓登入的api request payload清除掉
          } else {
            // router.navigate(['/dashboard']);
            location.href = '/dashboard'; // 為了讓登入的api request payload清除掉
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
  updateUserProfile(body) {
    return this.http.post<any>('/api/v1/user/updateUserProfile', body);
  }
  isTokenExpired(token: string = TOKEN): boolean {
    const alaToken = this.utils.getToken(token);
    if (alaToken) {
      /*const tokenTimeStamp = this.utils.getLocalStorageObject('ala_token_time');
      return this.calcTokenTime(tokenTimeStamp);*/
      return false; // found token
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
    //讓此判斷機制終止，非由本機端自行判斷。已轉換由Server判斷Token是否過期(402)或失效(401)。 2019/9/25 by Vincent.
    if (!this.isTokenExpired()) {
      this.loginStatus$.next(true);
      return of(true);
    } else {
      // 'no token or token is expired'
      this.utils.removeToken();
      this.utils.removeLocalStorageObject('ala_token_time');
      return of(false);
    }
  }
}
