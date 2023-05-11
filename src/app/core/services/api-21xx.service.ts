import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { throwError, Observable, of } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import {
  Api2103Post,
  Api2103Response,
  Api2104Post,
  Api2104Response,
  Api2116Post,
  Api2116Response,
  Api2108Post,
  Api2108Response,
  Api2109Post,
  Api2109Response,
  Api2114Post,
  Api2114Response,
} from '../models/api/api-21xx';
import { checkRxFlowResponse } from '../utils';

@Injectable({
  providedIn: 'root',
})
export class Api21xxService {
  constructor(private http: HttpClient) {}

  /**
   * api-v2 2102 取得運動資料列表
   * @param body api 所需參數
   */
  fetchSportList(body: any): Observable<any> {
    return <any>this.http.post('/api/v2/sport/getSportList', body).pipe(
      catchError((err) => throwError(err)),
      switchMap((res) => checkRxFlowResponse(res))
    );
  }

  /**
   * api-v2 2103 取得運動詳細資料
   * @param body api 所需參數
   */
  fetchSportListDetail(body: Api2103Post): Observable<Api2103Response> {
    return this.http.post('/api/v2/sport/getSportListDetail', body).pipe(
      catchError((err) => throwError(err)),
      switchMap((res) => checkRxFlowResponse(res))
    ) as Observable<Api2103Response>;
  }

  /**
   * api-v2 2104 取得運動資料概要陣列資料
   * @param body api 所需參數
   */
  fetchSportSummaryArray(body: Api2104Post): Observable<Api2104Response> {
    return this.http.post('/api/v2/sport/getSportSummaryArray', body).pipe(
      catchError((err) => throwError(err)),
      switchMap((res) => checkRxFlowResponse(res))
    ) as Observable<Api2104Response>;
  }

  /**
   * api-v2 2106 取得生活追蹤每日詳細資料
   * @param body api 所需參數
   */
  fetchTrackingDayDetail(body: any): Observable<any> {
    return <any>this.http.post('/api/v2/sport/getTrackingDayDetail', body).pipe(
      catchError((err) => throwError(err)),
      switchMap((res) => checkRxFlowResponse(res))
    );
  }

  /**
   * api-v2 2107 取得生活追蹤概要陣列資料
   * @param body api 所需參數
   */
  fetchTrackingSummaryArray(body: any): Observable<any> {
    return <any>this.http.post('/api/v2/sport/getTrackingSummaryArray', body).pipe(
      catchError((err) => throwError(err)),
      switchMap((res) => checkRxFlowResponse(res))
    );
  }

  /**
   * api-v2 2108 編輯活動資訊
   * @param body api 所需參數
   */
  fetchEditActivityProfile(body: Api2108Post): Observable<Api2108Response> {
    return this.http.post('/api/v2/sport/editActivityProfile', body).pipe(
      catchError((err) => throwError(err)),
      switchMap((res) => checkRxFlowResponse(res))
    ) as Observable<Api2108Response>;
  }

  /**
   * api-v2 2109 刪除活動或生活追蹤資料
   * @param body api 所需參數
   */
  fetchDeleteActivityData(body: Api2109Post): Observable<Api2109Response> {
    return this.http.post('/api/v2/sport/deleteActivityData', body).pipe(
      catchError((err) => throwError(err)),
      switchMap((res) => checkRxFlowResponse(res))
    ) as Observable<Api2109Response>;
  }

  /**
   * api-v2 2111 依條件需求取得多筆運動檔案
   * @param body api 所需參數
   */
  fetchMultiActivityData(body: any, fake = false): Observable<any> {
    return <any>this.http.post('/api/v2/sport/getMultiActivityData', body).pipe(
      catchError((err) => throwError(err)),
      switchMap((res) => checkRxFlowResponse(res))
    );
  }

  /**
   * api-v2 2114 編輯運動或生活追蹤檔案及報告隱私權
   * @param body api 所需參數
   */
  fetchEditPrivacy(body: Api2114Post): Observable<Api2114Response> {
    return this.http.post('/api/v2/sport/editPrivacy', body).pipe(
      catchError((err) => throwError(err)),
      switchMap((res) => checkRxFlowResponse(res))
    ) as Observable<Api2114Response>;
  }

  /**
   * api-v2 2116 取得運動資料列表，有排序功能
   * @param body api 所需參數
   */
  fetchGetSportListSort(body: Api2116Post): Observable<Api2116Response> {
    return this.http.post('/api/v2/sport/getSportListSort', body).pipe(
      catchError((err) => throwError(err)),
      switchMap((res) => checkRxFlowResponse(res))
    ) as Observable<Api2116Response>;
  }
}
