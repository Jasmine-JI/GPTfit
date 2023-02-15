import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { throwError, Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class Api41xxService {
  constructor(private http: HttpClient) {}

  /**
   * api 4101-取得系統營運分析概要
   * @param body {any}-api 所需參數
   */
  fetchGetSystemOperationInfo(body: any): Observable<any> {
    return <any>(
      this.http
        .post('/api/v2/operationAnalysis/getSystemOperationInfo', body)
        .pipe(catchError((err) => throwError(err)))
    );
  }

  /**
   * api 4102-取得系統營運分析趨勢
   * @param body {any}-api 所需參數
   */
  fetchGetSystemOperationTrend(body: any): Observable<any> {
    return <any>(
      this.http
        .post('/api/v2/operationAnalysis/getSystemOperationTrend', body)
        .pipe(catchError((err) => throwError(err)))
    );
  }

  /**
   * api 4103-取得品牌群組分析概要列表
   * @param body {any}-api 所需參數
   */
  fetchGetBrandOperationInfoList(body: any): Observable<any> {
    return <any>(
      this.http
        .post('/api/v2/operationAnalysis/getBrandOperationInfoList', body)
        .pipe(catchError((err) => throwError(err)))
    );
  }

  /**
   * api 4104-取得群組營運分析詳細
   * @param body {any}-api 所需參數
   */
  fetchGetGroupOperationDetail(body: any): Observable<any> {
    return <any>(
      this.http
        .post('/api/v2/operationAnalysis/getGroupOperationDetail', body)
        .pipe(catchError((err) => throwError(err)))
    );
  }

  /**
   * api 4105-取得群組營運分析趨勢
   * @param body {any}-api 所需參數
   */
  fetchGetGroupOperationTrend(body: any): Observable<any> {
    return <any>(
      this.http
        .post('/api/v2/operationAnalysis/getGroupOperationTrend', body)
        .pipe(catchError((err) => throwError(err)))
    );
  }

  /**
   * api 4106-取得課程階群組人員分析概要列表
   * @param body {any}-api 所需參數
   */
  fetchGetGroupMemberAnalysisList(body: any): Observable<any> {
    return <any>(
      this.http
        .post('/api/v2/operationAnalysis/getGroupMemberAnalysisList', body)
        .pipe(catchError((err) => throwError(err)))
    );
  }

  /**
   * api 4107-更新營運統計與分析資料
   * @param body {any}-api 所需參數
   */
  fetchUpdateAnalysisData(body: any): Observable<any> {
    return <any>(
      this.http
        .post('/api/v2/operationAnalysis/updateAnalysisData', body)
        .pipe(catchError((err) => throwError(err)))
    );
  }

  /**
   * api 4108-取得更新營運統計與分析資料之狀態
   * @param body {any}-api 所需參數
   */
  fetchGetUpdateAnalysisDataStatus(body: any): Observable<any> {
    return <any>(
      this.http
        .post('/api/v2/operationAnalysis/getUpdateAnalysisDataStatus', body)
        .pipe(catchError((err) => throwError(err)))
    );
  }
}
