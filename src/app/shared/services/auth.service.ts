import { UserProfileService } from './user-profile.service';
import { HttpClient} from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, BehaviorSubject, combineLatest } from 'rxjs';
import { User } from '../models/user';
import { map, switchMap } from 'rxjs/operators';
import { UtilsService } from './utils.service';
import { TOKEN } from '../models/utils-constant';
import { SignTypeEnum } from '../models/utils-type';

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
    private router: Router
  ) {}

  /**
   * api v2 1003-登入帳號使用，可用帳號或原權杖做登入與基本資料取得，
   * 成功登入後將token儲存至localstroage，
   * 失敗則強置登出。
   * @param body {object}
   * @param navigate {boolean}-登入失敗是否導回gptfit登入頁面
   * @author kidin-1090721
   */
  loginServerV2(body: any, navigate: boolean = true): Observable<any> {
    return this.http.post<any>('/api/v2/user/signIn', body).pipe(
      map(res => {
        const { processResult, resultCode, signIn } = res;
        if (resultCode && resultCode !== 200) {

          if (navigate) {
            const msg = 'Login failed.';
            this.utils.openAlert(msg);
          }

        } else {

          switch (processResult.resultCode) {
            case 200:
              const { token } = signIn;
              this.loginSuccess(token, res);
              break;
            case 402: // 刷新權杖
              const { token: newToken } = signIn;
              this.loginSuccess(newToken, res);
              break;
            default:
              this.logout();
              if (navigate) this.router.navigateByUrl('/signIn-web');
              break;
          }

        }

        return res;
      })

    );

  }

  /**
   * 登入成功後紀錄token與countryCode，並更新userProfile
   * @param token {string}-登入權杖
   * @param loginResponse {any}-api v2 1003 response
   * @author kidin-1101111
   */
  loginSuccess(token: string, loginResponse: any) {
    const { signIn: { accountType }, userProfile } = loginResponse;
    this.utils.writeToken(token);
    this.setLoginStatus(true);
    this.userProfileService.refreshUserProfile({ token });

    // 儲存國碼方便使用者下次登入
    if (accountType === SignTypeEnum.phone) {
      const { countryCode } = userProfile;
      this.utils.setLocalStorageObject('countryCode', countryCode);
    }

  }

  /**
   * 使用token登入並取得userprofile和accessright
   * @param body 
   * @author kidin-1101004 
   */
  loginCheck(body: any) {
    let msg = 'Login error!<br> Please login again.';
    const getDashboardNeedInfo = (token: string) => combineLatest([
      this.userProfileService.getUserProfile({token}),
      this.userProfileService.getMemberAccessRight({token})
    ]);

    return this.http.post<any>('/api/v2/user/signIn', body).pipe(
      switchMap(res => {
        const { processResult, resultCode, signIn } = res;
        if (resultCode) {
          this.utils.openAlert(msg);
        } else {

          switch (processResult.resultCode) {
            case 200:
              const { token } = body;
              return getDashboardNeedInfo(token);
            case 402: // 刷新權杖
              const { token: newToken } = signIn;
              this.utils.writeToken(newToken);
              return getDashboardNeedInfo(newToken);
            default:
              this.utils.openAlert(msg);
              this.logout();
              this.router.navigateByUrl('/signIn-web');
              return [];
          }

        }

      })

    );

  }

  logout() {
    this.userProfileService.clearUserProfile();
    this.loginStatus$.next(false);
    this.currentUser$.next(null);
    this.hadAlertEnableAccount = false;
    this.backUrl = '';
    this.utils.removeToken();
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