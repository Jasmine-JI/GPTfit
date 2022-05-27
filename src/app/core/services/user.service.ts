import { Injectable } from '@angular/core';
import { User } from '../../shared/classes/user-profile';
import { Api10xxService } from './api-10xx.service';
import { checkResponse } from '../../shared/utils/index';
import { of } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { TOKEN } from '../../shared/models/utils-constant';


@Injectable({
  providedIn: 'root'
})
export class UserService {

  /**
   * 使用者詳細資訊
   */
  private _user = new User();

  /**
   * 目標使用者之簡易資訊
   */
  private _targetUser: any;

  constructor(
    private api10xxService: Api10xxService
  ) {}

  /**
   * 重 call api 1010 取得最新 userProfile 資訊
   */
  refreshUserProfile() {
    this.api10xxService.fetchGetUserProfile({ token: this.getToken() }).pipe(
      tap(res => {
        if (checkResponse(res, false)) {
          this.saveUserProfile(res);
        }

      })
    ).subscribe();

  }

  /**
   * 儲存登入者個人資訊
   * @param userDetail {any}-使用者詳細資訊
   */
  saveUserProfile(userDetail: any) {
    const { signIn, userProfile } = userDetail;
    this._user.signInfo = signIn;
    this._user.userProfile = userProfile;
  }

  /**
   * 取得使用者相關資訊
   * @author kidin-1110314
   */
  getUser() {
    return this._user;
  }

  /**
   * 取得目標使用者之簡易資訊
   * @param targetUserId {number}-目標使用者
   */
  getTargetUserInfo(targetUserId: number) {
    const currentUserId = this._targetUser?.userId;
    return targetUserId === currentUserId ? of(this._targetUser) : this.fetchTargetUserInfo(targetUserId);
  }

  /**
   * 透過api取得目標使用者簡易資訊
   * @param targetUserId {number}-目標使用者
   */
  fetchTargetUserInfo(targetUserId: number) {
    if (targetUserId === this._user.userId) {
      return this._user.rxUserProfile;
    } else {
      const body = { targetUserId, token: this.getToken() };
      return this.api10xxService.fetchGetUserProfile(body).pipe(
        map((res: any) => checkResponse(res) ? res.userProfile : {} ),
        tap((res: any) => { this._targetUser = res; })
      );

    }

  }

  /**
   * 使用api 1011更新userprofile，同時更新已儲存的userProfile
   */
  updateUserProfile(content: any) {
    const body = {
      token: this.getToken(),
      userProfile: { ...content }
    };

    return this.api10xxService.fetchEditUserProfile(body).pipe(
      tap(res => {
        // 將更新的內容儲存
        if (checkResponse(res)) this._user.updatePartUserProfile(content);
      })

    );

  }

  /**
   * 確認目前頁面資訊持有人是否同登入者，使用 Observable 避免尚未取得登入者資訊即進行判斷
   * @param ownerId {number}-該頁面資訊持有人之userId
   */
  checkPageOwner(ownerId: number) {
    return this._user.rxUserProfile.pipe(
      map(userProfile => ownerId === userProfile.userId)
    );

  }

  /**
   * 不套用authService.token，避免circular inject
   */
  getToken() {
    return localStorage.getItem(TOKEN) || '';
  }

}
