import { Injectable } from '@angular/core';
import { LocalStorageKey } from '../../shared/enum/local-storage-key';
import { Api10xxService } from './api-10xx.service';
import { setLocalStorageObject, getLocalStorageObject } from '../utils/index';
import { combineLatest, Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { SignTypeEnum } from '../../shared/enum/account';
import { UserService } from './user.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  /**
   * GPTfit登入權杖
   */
  private _token = localStorage.getItem(LocalStorageKey.token) || '';

  /**
   * 登入後，欲轉導之頁面網址
   */
  private _backUrl = '';

  /**
   * 登入狀態
   */
  private _isLogin$ = new BehaviorSubject<boolean>((this._token && this._token !== '') as boolean);

  constructor(private api10xxService: Api10xxService, private userService: UserService) {}

  /**
   * 取得token
   */
  get token() {
    return this._token;
  }

  /**
   * 確認是否為登入狀態
   */
  get isLogin() {
    return this._isLogin$;
  }

  /**
   * 設定欲轉導的網址
   */
  set backUrl(url: string) {
    this._backUrl = url;
  }

  /**
   * 取得欲轉導的網址
   */
  get backUrl() {
    return this._backUrl;
  }

  /**
   * 取得登入時，帳號為手機之國碼，以便使用者登入
   */
  get loginCountryCode() {
    return getLocalStorageObject('countryCode') || 886;
  }

  /**
   * 儲存登入所使用之手機國碼
   * @param countryCode {number}-手機國碼
   */
  set loginCountryCode(countryCode: number) {
    setLocalStorageObject('countryCode', countryCode);
  }

  /**
   * 儲存token
   * @param newToken {string}-從 api 取得之token
   * @author kidin-1110311
   */
  setToken(newToken: string): void {
    this._token = newToken;
    localStorage.setItem(LocalStorageKey.token, newToken);
    this._isLogin$.next(true);
  }

  /**
   * 移除token
   * @author kidin-1110311
   */
  removeToken(): void {
    this._token = '';
    localStorage.removeItem(LocalStorageKey.token);
    this._isLogin$.next(false);
  }

  /**
   * 使用帳密進行登入
   * @param body {any}-api 1003 request body
   */
  accountLogin(body: any): Observable<any> {
    return this.api10xxService.fetchSignIn(body).pipe(
      tap((res) => {
        if (this.checkTokenValid(res)) {
          // 若登入帳號為手機，則將國碼儲存以方便日後登入
          const {
            signIn: { accountType },
            userProfile: { countryCode },
          } = res as any;
          if (accountType === SignTypeEnum.phone) this.loginCountryCode = countryCode;
          this._isLogin$.next(true);
        }
      })
    );
  }

  /**
   * 使用token進行登入同時取得 user profile
   * @author kidin-1110314
   */
  tokenLogin() {
    const { _token: token } = this;
    if (token) {
      const loginBody = { token, signInType: SignTypeEnum.token };
      const userProfileBody = { token };
      combineLatest([
        this.api10xxService.fetchSignIn(loginBody),
        this.api10xxService.fetchGetUserProfile(userProfileBody),
      ]).subscribe((resultArray) => {
        const [loginResult, userProfileResult] = resultArray;
        if (this.checkTokenValid(loginResult)) {
          const { thirdPartyAgency } = loginResult as any;
          this.userService.getUser().thirdPartyAgency = thirdPartyAgency;
          this.userService.saveUserProfile(userProfileResult);
          this._isLogin$.next(true);
        } else {
          this.logout();
        }
      });
    }
  }

  /**
   * 登出，清除token與個人資訊
   */
  logout() {
    this.removeToken();
    this._backUrl = '';
    this.userService.getUser().logout();
    this._isLogin$.next(false);
  }

  /**
   * 透過resultCode 判斷 token 是否有效
   * @param response {any}-api response
   */
  checkTokenValid(response: any) {
    const { processResult, resultCode, signIn } = response;
    if (resultCode && resultCode !== 200) return false; // api v2 resultCode 在 processResult 中

    switch (processResult.resultCode) {
      case 200:
        this.setToken(signIn.token);
        return true;
      case 402: // 刷新權杖
        this.setToken(signIn.newToken);
        return true;
      default:
        return false;
    }
  }
}
