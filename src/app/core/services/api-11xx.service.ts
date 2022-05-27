import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { throwError, Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class Api11xxService {

  constructor(
    private http: HttpClient
  ) { }

  /**
   * api-v1 1101 取得群組列表
   * @param body {any}-api 所需參數
   */
  fetchGroupList(body: any): Observable<any> {
    return <any> this.http.post('/api/v1/center/getGroupList', body).pipe(
      catchError(err => throwError(err))
    );
  }

  /**
   * api-v1 1102 取得群組詳細資料
   * @param body {any}-api 所需參數
   */
  fetchGroupListDetail(body: any): Observable<any> {
    return <any> this.http.post('/api/v1/center/getGroupListDetail', body).pipe(
      catchError(err => throwError(err))
    );
  }

  /**
   * api-v1 1103 取得群組內所有成員列表
   * @param body {any}-api 所需參數
   */
  fetchGroupMemberList(body: any): Observable<any> {
    return <any> this.http.post('/api/v1/center/getGroupMemberList', body).pipe(
      catchError(err => throwError(err))
    );
  }

  /**
   * api-v1 1104 會員加入或退出群組
   * @param body {any}-api 所需參數
   */
  fetchActionGroup(body: any): Observable<any> {
    return <any> this.http.post('/api/v1/center/actionGroup', body).pipe(
      catchError(err => throwError(err))
    );
  }

  /**
   * api-v1 1105 編輯群組資料
   * @param body {any}-api 所需參數
   */
  fetchEditGroup(body: any): Observable<any> {
    return <any> this.http.post('/api/v1/center/editGroup', body).pipe(
      catchError(err => throwError(err))
    );
  }

  /**
   * api-v1 1106 編輯群組會員內權限
   * @param body {any}-api 所需參數
   */
  fetchEditGroupMember(body: any): Observable<any> {
    return <any> this.http.post('/api/v1/center/editGroupMember', body).pipe(
      catchError(err => throwError(err))
    );
  }

  /**
   * api-v1 1107 變更群組狀態
   * @param body {any}-api 所需參數
   */
  fetchChangeGroupStatus(body: any): Observable<any> {
    return <any> this.http.post('/api/v1/center/changeGroupStatus', body).pipe(
      catchError(err => throwError(err))
    );
  }

  /**
   * api-v1 1108 指派新增群組會員
   * @param body {any}-api 所需參數
   */
  fetchAddGroupMember(body: any): Observable<any> {
    return <any> this.http.post('/api/v1/center/addGroupMember', body).pipe(
      catchError(err => throwError(err))
    );
  }

  /**
   * api-v1 1109 建立新群組
   * @param body {any}-api 所需參數
   */
  fetchCreateGroup(body: any): Observable<any> {
    return <any> this.http.post('/api/v1/center/createGroup', body).pipe(
      catchError(err => throwError(err))
    );
  }

  /**
   * api-v1 1110 更新加入群組狀態
   * @param body {any}-api 所需參數
   */
  fetchUpdateJoinStatus(body: any): Observable<any> {
    return <any> this.http.post('/api/v1/center/updateJoinStatus', body).pipe(
      catchError(err => throwError(err))
    );
  }

  /**
   * api-v1 1111 指派群組管理者
   * @param body {any}-api 所需參數
   */
  fetchAssignGroupManager(body: any): Observable<any> {
    return <any> this.http.post('/api/v1/center/assignGroupManager', body).pipe(
      catchError(err => throwError(err))
    );
  }

  /**
   * api-v1 1113 取得個人所有群組權限
   * @param body {any}-api 所需參數
   */
  fetchMemberAccessRight(body: any): Observable<any> {
    return <any> this.http.post('/api/v1/center/getMemberAccessRight', body).pipe(
      catchError(err => throwError(err))
    );
  }

  /**
   * api-v1 1114 刪除群組成員
   * @param body {any}-api 所需參數
   */
  fetchDeleteGroupMember(body: any): Observable<any> {
    return <any> this.http.post('/api/v1/center/deleteGroupMember', body).pipe(
      catchError(err => throwError(err))
    );
  }

  /**
   * api-v1 1115 取得經營權限管理資訊
   * @param body {any}-api 所需參數
   */
  fetchCommerceInfo(body: any): Observable<any> {
    return <any> this.http.post('/api/v1/center/getCommerceInfo', body).pipe(
      catchError(err => throwError(err))
    );
  }

  /**
   * api-v1 1116 編輯經營權限管理資訊
   * @param body {any}-api 所需參數
   */
  fetchEditCommerceInfo(body: any): Observable<any> {
    return <any> this.http.post('/api/v1/center/editCommerceInfo', body).pipe(
      catchError(err => throwError(err))
    );
  }

  /**
   * api-v1 1117 篩選相同群組成員
   * @param body {any}-api 所需參數
   */
  fetchFilterSameGroupMember(body: any): Observable<any> {
    return <any> this.http.post('/api/v1/center/filterSameGroupMember', body).pipe(
      catchError(err => throwError(err))
    );
  }

}
