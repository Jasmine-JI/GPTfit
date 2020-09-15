import { UserProfileService } from './user-profile.service';
import {
  HttpClient,
} from '@angular/common/http';

import { Injectable, Injector } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { User } from '../models/user';
import { tap, map } from 'rxjs/operators';
import { UtilsService, TOKEN } from '@shared/services/utils.service';


@Injectable()
export class AuthService {
  loginStatus$ = new BehaviorSubject<boolean>(false);
  currentUser$ = new BehaviorSubject<User>(null);
  hadAlertEnableAccount = false;
  backUrl = '';
  userName = '';
  constructor(
    private http: HttpClient,
    private utils: UtilsService,
    private userProfileService: UserProfileService,
    private router: Router,
    private injector: Injector // private router: Router
  ) {}

  /**
   * api v2 1003-登入帳號使用，可用帳號或原權杖做登入與基本資料取得，
   * 成功登入後將token儲存至localstroage，
   * 失敗則強置登出。
   * @param body {object}
   * @author kidin-1090721
   */
  loginServerV2(body: any): Observable<any> {
    return this.http.post<any>('/api/v2/user/signIn', body).pipe(
      tap(res => {

        switch (res.processResult.resultCode) {
          case 200:
          case 402: // 刷新權杖
            this.utils.writeToken(res.signIn.token);
            break;
          default:
            this.logout();
            this.router.navigateByUrl('/signIn-web');
            break;
        }

      }),
      map(res => {
        if (res.processResult.resultCode === 200) {
          Object.assign(res.signIn, {hadAlert: this.hadAlertEnableAccount});
        }

        return res;
      })

    );

  }

  logout() {
    this.userProfileService.clearUserProfile();
    this.loginStatus$.next(false);
    this.currentUser$.next(null);
    this.hadAlertEnableAccount = false;
    this.utils.removeToken();
    this.backUrl = '';
  }

  setLoginStatus(status) {
    this.loginStatus$.next(status);
  }

  getLoginStatus(): Observable<boolean> {
    return this.loginStatus$;
  }

  setCurrentUser(name) {
    this.currentUser$.next(name);
  }

  getCurrentUser(): Observable<User> {
    return this.currentUser$;
  }

  isLogin(token: string = TOKEN): boolean {
    const alaToken = this.utils.getToken(token);
    if (alaToken) {
      this.loginStatus$.next(true);
      return true; // found token
    } else {
      return false; // no token
    }
  }

}
