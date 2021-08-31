import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, ReplaySubject } from 'rxjs';
import { EditMode } from '../models/personal';

@Injectable()
export class UserInfoService {
  editMode$ = new ReplaySubject<EditMode>(1); // 是否進入編輯模式或建立模式
  targetUserInfo$ = new ReplaySubject<any>(1); // 個人頁面的使用者資訊
  userIcon$ = new BehaviorSubject<string>('');
  updatedImg$ = new BehaviorSubject<string>('');

  constructor(
    private http: HttpClient
  ) { }

  /**
   * Api-v2 1002-啟用帳號
   */
  fetchEnableAccount (body, ip) {
    const httpOptions = {
      headers: new HttpHeaders({
        'remoteAddr': `${ip}`,
      })
    };

    return this.http.post<any>('/api/v2/user/enableAccount', body, httpOptions);
  }

  /**
   * Api-v2 1004-忘記密碼
   */
  fetchForgetpwd (body, ip) {
    const httpOptions = {
      headers: new HttpHeaders({
        'remoteAddr': `${ip}`,
      })
    };

    return this.http.post<any>('/api/v2/user/resetPassword', body, httpOptions);
  }

  /**
   * Api-v2 1004-編輯帳密
   */
  fetchEditAccountInfo (body, ip) {  // v2 1005
    const httpOptions = {
      headers: new HttpHeaders({
        'remoteAddr': `${ip}`,
      })
    };

    return this.http.post<any>('/api/v2/user/editAccount', body, httpOptions);
  }

  getUpdatedImgStatus(): Observable<string> {
    return this.updatedImg$;
  }

  /**
   * 設置編輯模式以傳達給父組件
   * @param mode {EditMode}-是否進入編輯模式或完成編輯
   * @author kidin-1100812
   */
  setRxEditMode(mode: EditMode) {
    this.editMode$.next(mode);
  }

  /**
   * 取得現在的編輯模式
   * @author kidin-1100812
   */
  getRxEditMode(): Observable<EditMode> {
    return this.editMode$;
  }

  /**
   * 儲存目標userProfile供個人子頁面使用
   * @param info {any}-是否進入編輯模式或完成編輯
   * @author kidin-1100816
   */
   setRxTargetUserInfo(info: any) {
    this.targetUserInfo$.next(info);
  }

  /**
   * 取得目標userProfile供個人子頁面使用
   * @author kidin-1100816
   */
  getRxTargetUserInfo(): Observable<any> {
    return this.targetUserInfo$;
  }

}
