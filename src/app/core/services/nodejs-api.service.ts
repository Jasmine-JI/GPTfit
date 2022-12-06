import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { Observable, throwError, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { HintDialogService } from '../../core/services';

const { API_SERVER } = environment.url;

@Injectable({
  providedIn: 'root',
})
export class NodejsApiService {
  /**
   * 雲跑地圖清單
   */
  mapList: any;

  constructor(private http: HttpClient, private hintDialogService: HintDialogService) {}

  /**
   * 使用nodejs取得指定資訊
   * @param body {any}
   */
  getAssignInfo(body: any): Observable<any> {
    return this.http
      .post<any>(API_SERVER + 'user/alaql', body)
      .pipe(catchError((err) => throwError(err)));
  }

  /**
   * 使用nodejs尋找關鍵字相關暱稱
   * @param body {any}
   */
  searchNickname(body: any): Observable<any> {
    return this.http
      .post<any>(API_SERVER + 'user/search_nickname', body)
      .pipe(catchError((err) => throwError(err)));
  }

  /**
   * 使用nodejs確認暱稱是否重複
   * @param body {any}
   */
  checkNickname(body: any): Observable<any> {
    return this.http
      .post<any>(API_SERVER + 'user/checkNickname', body)
      .pipe(catchError((err) => throwError(err)));
  }

  /**
   * 使用nodejs取得指定的使用者列表
   * @param body {any}
   */
  getUserList(body: any): Observable<any> {
    return this.http
      .post<any>(API_SERVER + 'user/getUserList', body)
      .pipe(catchError((err) => throwError(err)));
  }

  /**
   * 取得所有地圖資訊
   */
  getAllMapInfo() {
    if (this.mapList) {
      return of(this.mapList);
    } else {
      const errMsg = 'Get map information fail.<br>Please try again later.';
      return this.http.post<any>(API_SERVER + 'cloudrun/getAllMapInfo', {}).pipe(
        map((res) => {
          if (res.resultCode !== 200) return throwError(errMsg);

          this.mapList = res.resInfo;
          return this.mapList;
        }),
        catchError((err) => {
          this.hintDialogService.openAlert(errMsg);
          return throwError(err);
        })
      );
    }
  }

  /**
   * 取得指定地圖的經緯度與海拔數據
   * @param body {any}
   */
  getMapGpx(body: any) {
    const errMsg = 'Get map GPX fail.<br>Please try again later.';
    return this.http.post<any>(`${API_SERVER}cloudrun/getMapGpx`, body).pipe(
      map((res) => {
        if (res.resultCode !== 200) return throwError(errMsg);
        return res.info;
      }),
      catchError((err) => {
        this.hintDialogService.openAlert(errMsg);
        return throwError(err);
      })
    );
  }

  /**
   * 透過nodejs取得api-2016 （取得其他排行榜統計資料）資料
   * （競賽主機憑證為自簽憑證，故需透過中介程式）
   * @param body {any}
   */
  getLeaderboardStatistics(body: any) {
    return this.http
      .post<any>(`${API_SERVER}cloudrun/getLeaderboardStatistics`, body)
      .pipe(catchError((err) => throwError(err)));
  }

  /**
   * 使用nodejs先將數據下載成文件再上傳至server
   * @param body {any}
   */
  uploadSportFile(body: any) {
    return this.http
      .post<any>(API_SERVER + 'uploadSportFile', body)
      .pipe(catchError((err) => throwError(err)));
  }

  /**
   * 取得使用者頭像(base64)
   * @param body {any}
   */
  fetchUserAvartar(body: any) {
    return this.http.post<any>(API_SERVER + 'user/userAvartar', body);
  }

  /**
   * 取得系統管理員列表
   */
  getInnerAdmin() {
    return this.http.get<any>(API_SERVER + 'center/innerAdmin');
  }

  /**
   * 更新系統管理員
   * @param body {any}
   */
  updateInnerAdmin(body: any) {
    return this.http.post<any>(API_SERVER + 'center/innerAdmin', body);
  }

  /**
   * 使用nodejs取得群組名稱列表
   * @param body {any}
   */
  getGroupNameList(body: any) {
    return this.http.post<any>(API_SERVER + 'group/getGroupNameList', body);
  }

  /**
   * nodejs middleware-取得群組清單
   */
  getGroupList() {
    return this.http.get<any>(API_SERVER + 'center/getGroupList');
  }

  /**
   * nodejs middleware-取得群組清單
   */
  searchGroup(body: any) {
    return this.http.post<any>(API_SERVER + 'group/searchGroup', body);
  }

  /**
   * nodejs middleware
   */
  searchMember(params) {
    return this.http.get<any>(API_SERVER + 'center/searchMember', { params });
  }
}
