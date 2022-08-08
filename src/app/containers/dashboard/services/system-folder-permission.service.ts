import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class SystemFolderPermissionService {
  constructor(private http: HttpClient) {}

  /**
   * api 0001-建立系統帳號
   * @param body {any}
   * @author kidin-1100302
   */
  createSysAccount(body: any) {
    return this.http
      .post<any>('/privilege/addRdUser', body)
      .pipe(catchError((err) => throwError(err)));
  }

  /**
   * api 0002-建立專案資料夾
   * @param body {any}
   * @author kidin-1100302
   */
  createSysFolder(body: any) {
    return this.http
      .post<any>('/privilege/createProject', body)
      .pipe(catchError((err) => throwError(err)));
  }

  /**
   * api 0003-取得可存取資料夾或使用者列表
   * @param body {any}
   * @author kidin-1100302
   */
  getSysList(body: any) {
    return this.http
      .post<any>('/privilege/getUserDataList', body)
      .pipe(catchError((err) => throwError(err)));
  }

  /**
   * api 0004-設定使用者加入資料夾的權限
   * @param body {any}
   * @author kidin-1100302
   */
  setUserAccessRight(body: any) {
    return this.http
      .post<any>('/privilege/setFolderAccessRight', body)
      .pipe(catchError((err) => throwError(err)));
  }

  /**
   * api 0005-刪除帳號
   * @param body {any}
   * @author kidin-1100302
   */
  delSysAccount(body: any) {
    return this.http
      .post<any>('/privilege/deleteRdUser', body)
      .pipe(catchError((err) => throwError(err)));
  }
}
