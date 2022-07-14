import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';


const { API_SERVER } = environment.url;

@Injectable()
export class OfficialActivityService {

  constructor(
    private http: HttpClient
  ) {}

  /**
   * 使用nodejs創建活動
   * @param body {any}
   * @author kidin-1090902
   */
  createOfficialActivity (body: any) {
    return this.http.post<any>(API_SERVER + 'officialActivity/create', body);
  }

  /**
   * 使用nodejs複製活動
   * @param body {any}
   * @author kidin-1090902
   */
  copyOfficialActivity (body: any) {
    return this.http.post<any>(API_SERVER + 'officialActivity/copy', body).pipe(
      catchError(err => throwError(err))
    );
  }

    /**
   * 使用nodejs取得活動
   * @param body {any}
   * @author kidin-1090902
   */
  getOfficialActivity (body: any) {
    return this.http.post<any>(API_SERVER + 'officialActivity/get', body);
  }

  /**
   * 使用nodejs更新活動
   * @param body {any}
   * @author kidin-1090902
   */
  updateOfficialActivity (body: any) {
    return this.http.post<any>(API_SERVER + 'officialActivity/update', body);
  }

  /**
   * 使用nodejs編輯活動
   * @param body {any}
   * @author kidin-1090902
   */
  editOfficialActivity (body: any) {
    return this.http.post<any>(API_SERVER + 'officialActivity/edit', body);
  }

  /**
   * 使用nodejs編輯活動
   * @param body {any}
   * @author kidin-1090902
   */
  applyOfficialActivity (body: any) {
    return this.http.post<any>(API_SERVER + 'officialActivity/apply', body);
  }

  /**
   * 使用nodejs取得所有活動
   * @param body {any}
   * @author kidin-1090902
   */
  getAllOfficialActivity (body: any) {
    return this.http.post<any>(API_SERVER + 'officialActivity/get-all', body);
  }

  /**
   * 使用nodejs創建活動
   * @param body {any}
   * @author kidin-1090902
   */
  updateRank (body: any) {
    return this.http.post<any>(API_SERVER + 'officialActivity/update-rank', body);
  }

  /**
   * 使用nodejs尋找該使用者參賽歷史紀錄
   * @param body {any}
   * @author kidin-1090902
   */
  getUserRecord (body: any) {
    return this.http.post<any>(API_SERVER + 'officialActivity/user-record', body);
  }

}
