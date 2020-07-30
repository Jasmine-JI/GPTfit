import { HttpClient } from '@angular/common/http';

import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';


@Injectable()
export class SettingsService {
  constructor(private http: HttpClient) {}

  /**
   * api 1011-編輯會員資料
   * @param body {object}
   * @author kidin-1090723
   */
  updateUserProfile(body: any): Observable<any> {
    return this.http.post<any>('/api/v2/user/editUserProfile', body);
  }

  /**
   * api 1009-與第三方軟體連結同步運動資料。
   * @param body {object}
   * @author kidin-1090723
   */
  updateThirdParty(body: any): Observable<any> {
    return this.http.post<any>('/api/v2/user/thirdPartyAccess', body);
  }

  /**
   * api 2114-編輯運動或生活追蹤檔案及報告隱私權。
   * @param body {object}
   * @author kidin-1090723
   */
  editPrivacy (body: any): Observable<any> {
    return this.http.post<any>('/api/v2/sport/editPrivacy', body);
  }

}
