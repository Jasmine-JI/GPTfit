import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { throwError, Observable } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import {
  Api8001Post,
  Api8001Response,
  Api8002Post,
  Api8002Response,
  Api8003Post,
  Api8003Response,
} from '../models/api/api-80xx';
import { checkRxFlowResponse } from '../utils';

@Injectable({
  providedIn: 'root',
})
export class Api80xxService {
  constructor(private http: HttpClient) {}

  /**
   * api-v1 8001 新增圖片
   * @param body api 所需參數
   */
  fetchAddimg(body: Api8001Post): Observable<Api8001Response> {
    return this.http.post('/api/v1/img/addimg', body).pipe(
      catchError((err) => throwError(err)),
      switchMap((res) => checkRxFlowResponse(res))
    ) as Observable<Api8001Response>;
  }

  /**
   * api-v1 8002 移除圖片
   * @param body api 所需參數
   */
  fetchDeleteimg(body: Api8002Post): Observable<Api8002Response> {
    return this.http.post('/api/v1/img/deleteimg', body).pipe(
      catchError((err) => throwError(err)),
      switchMap((res) => checkRxFlowResponse(res))
    ) as Observable<Api8002Response>;
  }

  /**
   * api-v2 8003 取得圖片列表
   * @param body api 所需參數
   */
  fetchGetimglist(body: Api8003Post): Observable<Api8003Response> {
    return this.http.post('/api/v1/img/getimglist', body).pipe(
      catchError((err) => throwError(err)),
      switchMap((res) => checkRxFlowResponse(res))
    ) as Observable<Api8003Response>;
  }
}
