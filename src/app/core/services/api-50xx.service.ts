import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { throwError, Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';


@Injectable({
  providedIn: 'root'
})
export class Api50xxService {

  constructor(private http: HttpClient) { }

  /**
   * api 5001 取得常用聯絡人資訊
   * @param body {any}-api 所需參數
   */
  fetchAddressBook(body: any): Observable<any> {
    return <any> this.http.post('/api/v1/system/getAddressBook', body).pipe(
      catchError(err => throwError(err))
    );
  }

  /**
   * api 5002 取得訊息列表
   * @param body {any}-api 所需參數
   */
  fetchMessageList(body: any): Observable<any> {
    return <any> this.http.post('/api/v1/system/getMessageList', body).pipe(
      catchError(err => throwError(err))
    );
  }

  /**
   * api 5003 取得訊息內容
   * @param body {any}-api 所需參數
   */
  fetchMessageContent(body: any): Observable<any> {
    return <any> this.http.post('/api/v1/system/getMessageContent', body).pipe(
      catchError(err => throwError(err))
    );
  }

  /**
   * api 5004 發送訊息內容
   * @param body {any}-api 所需參數
   */
  fetchSendMessage(body: any): Observable<any> {
    return <any> this.http.post('/api/v1/system/sendMessage', body).pipe(
      catchError(err => throwError(err))
    );
  }

  /**
   * api 5005 取得黑名單
   * @param body {any}-api 所需參數
   */
  fetchBlackList(body: any): Observable<any> {
    return <any> this.http.post('/api/v1/system/getBlackList', body).pipe(
      catchError(err => throwError(err))
    );
  }

  /**
   * api 5006 編輯聯絡人清單
   * @param body {any}-api 所需參數
   */
  fetchEditContactList(body: any): Observable<any> {
    return <any> this.http.post('/api/v1/system/editContactList', body).pipe(
      catchError(err => throwError(err))
    );
  }

  /**
   * api 5007 刪除訊息內容
   * @param body {any}-api 所需參數
   */
  fetchDeleteMessage(body: any): Observable<any> {
    return <any> this.http.post('/api/v1/system/deleteMessage', body).pipe(
      catchError(err => throwError(err))
    );
  }

  /**
   * api 5008 取得個人訊息通知旗標狀態
   * @param body {any}-api 所需參數
   */
  fetchMessageNotifyFlagStatus(body: any): Observable<any> {
    return <any> this.http.post('/api/v1/system/getMessageNotifyFlagStatus', body).pipe(
      catchError(err => throwError(err))
    );
  }


}
