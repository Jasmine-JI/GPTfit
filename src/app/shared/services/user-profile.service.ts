import { HttpClient } from '@angular/common/http';

import { UserInfoService } from '../../containers/dashboard/services/userInfo.service';
import { Injectable } from '@angular/core';
import { ReplaySubject, Observable } from 'rxjs';
import { tap, switchMap, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

const { API_SERVER } = environment.url;

@Injectable()
export class UserProfileService {
  constructor(
    private http: HttpClient,
    private userInfoService: UserInfoService
  ) {}

  userProfile$ = new ReplaySubject(1);

  /**
   * api 1010-取得會員資料
   * @param body {object}
   * @method post
   * @author kidin-1090721
   */
  getUserProfile(body: any) {
    return this.http.post<any>('/api/v2/user/getUserProfile',  body);
  }

  /**
   * api 1113-取得個人所有群組的權限值
   * @param body {object}
   * @method post
   * @author kidin-1090721
   */
  getMemberAccessRight(body: any) {
    return this.http.post<any>('/api/v1/center/getMemberAccessRight', body);
  }

  /**
   * 重新call api 1010和1113，並儲存會員資料，
   * 當使用者進行登入（不管手動登入或token自動登入），
   * 或任何修改user profile/group access right，皆需執行此function
   * @param body {object}
   * @author kidin-1090721
   */
  refreshUserProfile(body: any) {
    this.getUserProfile(body).pipe(
      switchMap(res => this.getMemberAccessRight(body).pipe(
        map(resp => Object.assign(
          res.userProfile,
          {groupAccessRightList: resp.info.groupAccessRight},
          {systemAccessRight: this.getAllAccessRight(resp.info.groupAccessRight)}
        ))
      )),
      switchMap(res => this.userInfoService.getUpdatedImgStatus().pipe(
        map(response => {
          if (response.length !== 0) {
            const newImage = `${res.avatarUrl}${response}`;
            Object.assign(res, {avatarUrl: newImage});  // 使用者更新頭像強迫觸發瀏覽器取得新圖片
          }

          return res;
        })

      )),
      tap(result => {
        this.userProfile$.next(result);
      })
    ).subscribe();

  }

  /**
   * 取得儲存的會員資料
   * @author kidin-1090721
   */
  getRxUserProfile(): Observable<any> {
    return this.userProfile$;
  }

  /**
   * 取得使用者所有的權限
   * @param groupAccessRight {object}
   * @author kidin-1090722
   */
  getAllAccessRight(groupAccessRight: Array<Object>): Array<number> {
    const accessRight = new Set<number>();
    for (let i = 0; i < groupAccessRight.length; i++) {
      if (groupAccessRight[i]['groupId'] === '0-0-0-0-0-0') {
        accessRight.add(+groupAccessRight[i]['accessRight']);
      }

    }

    return Array.from(accessRight).sort((a, b) => a - b);
  }

  /**
   * 使用nodejs尋找關鍵字相關暱稱
   * @param body {any}
   * @author kidin-1090902
   */
  searchNickname(body: any) {
    return this.http.post<any>(API_SERVER + 'user/search_nickname', body);
  }

  /**
   * 使用nodejs取得指定的使用者列表
   * @param body {any}
   * @author kidin-1090902
   */
  getUserList(body: any) {
    return this.http.post<any>(API_SERVER + 'user/getUserList', body);
  }

  /**
   * 清除userProfile資料
   * @author kidin-1090909
   */
  clearUserProfile() {
    this.userProfile$.next(undefined);
  }

}
