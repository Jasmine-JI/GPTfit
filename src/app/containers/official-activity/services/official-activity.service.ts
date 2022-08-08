import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { throwError, of, ReplaySubject, BehaviorSubject } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';

const { API_SERVER } = environment.url;

@Injectable({
  providedIn: 'root',
})
export class OfficialActivityService {
  allMapInfo$ = new ReplaySubject(1);
  routine$ = new ReplaySubject(1);
  screenSize$ = new ReplaySubject(1);
  carouselTime$ = new BehaviorSubject(new Date().getTime());
  constructor(private http: HttpClient) {}

  /**
   * api 6001-建立新官方賽事（限29權）
   * @param body {any}
   * @author kidin-1100928
   */
  createEvent(body: any) {
    return this.http.post<any>('api/v2/event/createEvent', body).pipe(
      catchError((err) => {
        return throwError(err);
      })
    );
  }

  /**
   * api 6002-取得官方賽事詳細資訊
   * @param body {any}
   * @author kidin-1100928
   */
  getEventDetail(body: any) {
    return this.http.post<any>('api/v2/event/getEventDetail', body).pipe(
      catchError((err) => {
        return throwError(err);
      })
    );
  }

  /**
   * api 6003-編輯官方賽事詳細資訊
   * @param body {any}
   * @author kidin-1100928
   */
  editEventDetail(body: any) {
    return this.http.post<any>('api/v2/event/editEventDetail', body).pipe(
      catchError((err) => {
        return throwError(err);
      })
    );
  }

  /**
   * api 6004-取得官方賽事列表
   * @param body {any}
   * @author kidin-1100928
   */
  getEventList(body: any) {
    return this.http.post<any>('api/v2/event/getEventList', body).pipe(
      catchError((err) => {
        return throwError(err);
      })
    );
  }

  /**
   * api 6005-使用者報名官方賽事
   * @param body {any}
   * @author kidin-1100928
   */
  applyEvent(body: any) {
    return this.http.post<any>('api/v2/event/applyEvent', body).pipe(
      catchError((err) => {
        return throwError(err);
      })
    );
  }

  /**
   * api 6006-取得參賽者名單
   * @param body {any}
   * @author kidin-1100928
   */
  getParticipantList(body: any) {
    return this.http.post<any>('api/v2/event/getParticipantList', body).pipe(
      catchError((err) => {
        return throwError(err);
      })
    );
  }

  /**
   * api 6007-編輯參賽者名單
   * @param body {any}
   * @author kidin-1100928
   */
  editParticipantList(body: any) {
    return this.http.post<any>('api/v2/event/editParticipantList', body).pipe(
      catchError((err) => {
        return throwError(err);
      })
    );
  }

  /**
   * api 6008-取得使用者歷史參賽紀錄
   * @param body {any}
   * @author kidin-1100928
   */
  getParticipantHistory(body: any) {
    return this.http.post<any>('api/v2/event/getParticipantHistory', body).pipe(
      catchError((err) => {
        return throwError(err);
      })
    );
  }

  /**
   * api 6009-取得指定賽事排行榜
   * @param body {any}
   * @author kidin-1100928
   */
  getEventLeaderboard(body: any) {
    return this.http.post<any>('api/v2/event/getEventLeaderboard', body).pipe(
      catchError((err) => {
        return throwError(err);
      })
    );
  }

  /**
   * api 6010-getEventUserProfile
   * @param body {any}
   * @author kidin-1100928
   */
  getEventUserProfile(body: any) {
    return this.http.post<any>('api/v2/event/getEventUserProfile', body).pipe(
      catchError((err) => {
        return throwError(err);
      })
    );
  }

  /**
   * api 6011-取得廣告資訊
   * @param body {any}
   * @author kidin-1100928
   */
  getEventAdvertise(body: any) {
    return this.http.post<any>('api/v2/event/getEventAdvertise', body).pipe(
      catchError((err) => {
        return throwError(err);
      })
    );
  }

  /**
   * api 6012-編輯廣告資訊
   * @param body {any}
   * @author kidin-1100928
   */
  updateEventAdvertise(body: any) {
    return this.http.post<any>('api/v2/event/updateEventAdvertise', body).pipe(
      catchError((err) => {
        return throwError(err);
      })
    );
  }

  /**
   * api 6013-建立商品訂單
   * @param body {any}
   * @author kidin-1100928
   */
  createProductOrder(body: any) {
    return this.http.post<any>('api/v2/event/createProductOrder', body).pipe(
      catchError((err) => {
        return throwError(err);
      })
    );
  }

  /**
   * api 6014-更新商品訂單資訊
   * @param body {any}
   * @author kidin-1100928
   */
  updateProductOrder(body: any) {
    return this.http.post<any>('api/v2/event/updateProductOrder', body).pipe(
      catchError((err) => {
        return throwError(err);
      })
    );
  }

  /**
   * api 6015-更新使用者活動報名資訊
   * @param body {any}
   * @author kidin-1100928
   */
  updateEventUserProfile(body: any) {
    return this.http.post<any>('api/v2/event/updateEventUserProfile', body).pipe(
      catchError((err) => {
        return throwError(err);
      })
    );
  }

  /**
   * api N7001-寄送官方活動網"聯絡我們"訊息
   * @param body {any}-
   * @author kidin-1101213
   */
  fetchOfficialContactus(body: any) {
    return this.http.post<any>(API_SERVER + 'email/official-contactus', body).pipe(
      catchError((err) => {
        return throwError(err);
      })
    );
  }

  /**
   * api N7002-寄信通知管理員使用者申請或取消申請退賽
   * @param body {any}
   * @author kidin-1110302
   */
  notifyLeavingEvent(body: any) {
    return this.http.post<any>(API_SERVER + 'email/leave-event', body).pipe(
      catchError((err) => {
        return throwError(err);
      })
    );
  }

  /**
   * 儲存所有雲跑地圖資訊供子頁面使用
   * @param info {any}-cloudrun 所有地圖資訊
   * @author kidin-1101007
   */
  saveAllMapInfo(info: any) {
    this.allMapInfo$.next(info);
  }

  /**
   * 藉由rxjs取得已儲存之雲跑地圖資訊
   * @author kidin-1101007
   */
  getRxAllMapInfo() {
    return this.allMapInfo$;
  }

  /**
   * 儲存例行賽列表供子頁面使用
   * @param info {any}-cloudrun 所有地圖資訊
   * @author kidin-1101007
   */
  saveRoutine(info: any) {
    this.routine$.next(info);
  }

  /**
   * 藉由rxjs取得已儲存之例行賽列表
   * @author kidin-1101007
   */
  getRxRoutine() {
    return this.routine$;
  }

  /**
   * 儲存裝置大小是否為攜帶型裝置
   * @param screenSize {number}-裝置螢幕大小
   * @author kidin-1101012
   */
  setScreenSize(screenSize: number) {
    this.screenSize$.next(screenSize);
  }

  /**
   * 取得裝置螢幕大小
   * @author kidin-1101012
   */
  getScreenSize() {
    return this.screenSize$;
  }

  /**
   * 儲存更新輪播的時間作為判斷輪播刷新依據
   * @param time {number}-更新時間
   * @author kidin-1101012
   */
  setCarouselTime(time: number) {
    this.carouselTime$.next(time);
  }

  /**
   * 取得更新輪播的時間
   * @author kidin-1101012
   */
  getCarouselTime() {
    return this.carouselTime$;
  }

  /**
   * 根據群組數目分配分組代表色
   * @param length {number}-群組數目
   * @author kidin-1101123
   */
  assignGroupColor(length: number) {
    const hueRange = 360;
    const colorAssign = [];
    for (let i = 1; i <= length; i++) {
      const hue = Math.round((i / length) * hueRange);
      colorAssign.push(`hsla(${hue}, 100%, 85%, 1)`);
    }

    return colorAssign;
  }

  /**
   * 篩選無圖片或失效之輪播
   * @author kidin-1101228
   */
  filterInvalidCarousel(advertise: any) {
    const currentTimestamp = new Date().getTime();
    const { effectDate, img } = advertise;
    return effectDate * 1000 > currentTimestamp && img;
  }
}
