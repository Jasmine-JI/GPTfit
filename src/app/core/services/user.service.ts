import { Injectable } from '@angular/core';
import { TOKEN } from '../../shared/models/utils-constant';
import { User } from '../../shared/classes/user-profile';
import { Api10xxService } from './api-10xx.service';


@Injectable({
  providedIn: 'root'
})
export class UserService {

  /**
   * GPTfit登入權杖
   */
  private _token = localStorage.getItem(TOKEN) || '';

  /**
   * 使用者詳細資訊
   */
  private _user = new User(this.api10xxService);


  constructor(private api10xxService: Api10xxService) {}

  /**
   * 取得token
   * @returns {string}
   * @author kidin-1110311
   */
  getToken(): string {
    return this._token;
  }

  /**
   * 儲存token
   * @param newToken {string}-從 api 取得之token
   * @author kidin-1110311
   */
  setToken(newToken: string): void {
    this._token = newToken;
    localStorage.setItem(TOKEN, newToken);
  }

  /**
   * 移除token
   * @author kidin-1110311
   */
  removeToken(): void {
    this._token = '';
    localStorage.remove(TOKEN);
  }

  /**
   * 使用token進行登入同時取得 user profile
   * @author kidin-1110314
   */
  tokenLogin() {
    this._user.tokenLogin(this._token);
  }

  /**
   * 登出
   * @author kidin-1110314
   */
  logout() {
    this._user.logout();
  }

  /**
   * 取得使用者相關資訊
   * @author kidin-1110314
   */
  getUser() {
    return this._user;
  }

}
