import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class Api20xxService {
  constructor(private http: HttpClient) {}

  /**
   * api-2002 取得運動課程房間列表
   * @param body {any}
   */
  fetchClassRoomList(body: any) {
    return this.http
      .post<any>('/api/v1/train/getClassRoomList', body)
      .pipe(catchError((err) => throwError(err)));
  }

  /**
   * api-2003 取得運動課程房間詳細資訊
   * @param body {any}
   */
  fetchClassRoomDetail(body: any) {
    return this.http
      .post<any>('/api/v1/train/getClassRoomDetail', body)
      .pipe(catchError((err) => throwError(err)));
  }

  /**
   * api-2004 開啟競賽
   * @param body {any}
   */
  createRace(body: any) {
    return this.http
      .post<any>('/api/v1/race/createRace', body)
      .pipe(catchError((err) => throwError(err)));
  }

  /**
   * api-2010 取得排行榜資料
   * @param body {any}
   */
  getRankData(body: any) {
    return this.http
      .post<any>('/api/v1/race/getRankData', body)
      .pipe(catchError((err) => throwError(err)));
  }
}
