import { HttpClient } from '@angular/common/http';

import { Injectable } from '@angular/core';
import { ReplaySubject, Observable } from 'rxjs';
import { tap, switchMap, map } from 'rxjs/operators';

@Injectable()
export class UserProfileService {
  constructor(private http: HttpClient) {}

  userProfile$ = new ReplaySubject(1);

  /**
   * api 1010-取得會員資料
   * @param body {object}
   * @author kidin-1090721
   */
  getUserProfile(body: any) {
    return this.http.post<any>('/api/v2/user/getUserProfile',  body);
  }

  /**
   * api 1113-取得個人所有群組的權限值
   * @param body {object}
   * @author kidin-1090721
   */
  getMemberAccessRight(body: any) {
    return this.http.post<any>('/api/v1/center/getMemberAccessRight', body);
  }

  /**
   * 重新call api 1010和1113，並儲存會員資料
   * @param body {object}
   * @author kidin-1090721
   */
  refreshUserProfile(body: any): void {
    this.getUserProfile(body).pipe(
      switchMap(res => this.getMemberAccessRight(body).pipe(
        map(resp => Object.assign(
          res.userProfile,
          {groupAccessRightList: resp.info.groupAccessRight},
          {systemAccessRight: this.getAllAccessRight(resp.info.groupAccessRight)}
        ))
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
   * @groupAccessRight {object}
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

}
