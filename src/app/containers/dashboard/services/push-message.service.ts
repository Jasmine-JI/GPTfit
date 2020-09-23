import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PushMessageService {

  constructor(private http: HttpClient) { }

  /**
   * api 9002-建立推播訊息
   * @param body {object}
   * @author kidin-1090916
   */
  createPushMessage(body: any): Observable<any> {
    return this.http.post<any>('/api/v1/notification/pushNotification', body);
  }

  /**
   * api 9003-取得系統推播列表
   * @param body {object}
   * @author kidin-1090916
   */
  getPushMessageList(body: any): Observable<any> {
    return this.http.post<any>('/api/v1/notification/getNotificationList', body);
  }

  /**
   * api 9004-取得系統推播內容
   * @param body {object}
   * @author kidin-1090916
   */
  getPushMessageDetail(body: any): Observable<any> {
    return this.http.post<any>('/api/v1/notification/getNotificationDetail', body);
  }

  /**
   * api 9005-中止發送推播內容
   * @param body {object}
   * @author kidin-1090916
   */
  cancelPushMessage(body: any): Observable<any> {
    return this.http.post<any>('/api/v1/notification/cancelNotification', body);
  }

}
