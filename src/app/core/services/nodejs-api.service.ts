import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';

const { API_SERVER } = environment.url;

@Injectable({
  providedIn: 'root',
})
export class NodejsApiService {
  constructor(private http: HttpClient) {}

  /**
   * 使用nodejs取得指定資訊
   * @param body {any}
   */
  getAssignInfo(body: any): Observable<any> {
    return this.http.post<any>(API_SERVER + 'user/alaql', body);
  }

  /**
   * 使用nodejs尋找關鍵字相關暱稱
   * @param body {any}
   */
  searchNickname(body: any): Observable<any> {
    return this.http.post<any>(API_SERVER + 'user/search_nickname', body);
  }

  /**
   * 使用nodejs確認暱稱是否重複
   * @param body {any}
   */
  checkNickname(body: any): Observable<any> {
    return this.http.post<any>(API_SERVER + 'user/checkNickname', body);
  }

  /**
   * 使用nodejs取得指定的使用者列表
   * @param body {any}
   */
  getUserList(body: any): Observable<any> {
    return this.http.post<any>(API_SERVER + 'user/getUserList', body);
  }
}
