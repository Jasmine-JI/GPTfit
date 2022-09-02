import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { throwError, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { UtilsService } from './utils.service';
import { environment } from '../../../environments/environment';

const { API_SERVER } = environment.url;

@Injectable({
  providedIn: 'root',
})
export class CloudrunService {
  /**
   * api-2004 開啟競賽
   * @param body {any}
   * @author kidin-1101117
   */
  createRace(body: any) {
    return this.http
      .post<any>('/api/v1/race/createRace', body)
      .pipe(catchError((err) => throwError(err)));
  }

  /**
   * api-2010 取得排行榜資料
   * @param body {any}
   * @author kidin-1090421
   */
  getRankData(body: any) {
    return this.http
      .post<any>('/api/v1/race/getRankData', body)
      .pipe(catchError((err) => throwError(err)));
  }

  /**
   * api-2015 編輯排程賽局
   * @param body {any}
   * @author kidin-1101117
   */
  editScheduleRace(body: any) {
    return this.http
      .post<any>('/api/v1/race/editScheduleRace', body)
      .pipe(catchError((err) => throwError(err)));
  }

  /**
   * 雲跑地圖清單
   */
  mapList: any;

  constructor(private http: HttpClient, private utils: UtilsService) {}

  /**
   * 取得所有地圖資訊
   * @author kidin-1100322
   */
  getAllMapInfo() {
    if (this.mapList) {
      return of(this.mapList);
    } else {
      return this.http.post<any>(API_SERVER + 'cloudrun/getAllMapInfo', {}).pipe(
        map((res) => {
          if (res.resultCode !== 200) {
            const msg = 'Get map information fail.<br>Please try again later.';
            return throwError(msg);
          } else {
            this.mapList = res.resInfo;
            return this.mapList;
          }
        }),
        catchError((err) => {
          const msg = 'Get map information fail.<br>Please try again later.';
          this.utils.openAlert(msg);
          return throwError(err);
        })
      );
    }
  }

  /**
   * 取得指定地圖的經緯度與海拔數據
   * @param body {any}
   * @author kidin-1100322
   */
  getMapGpx(body: any) {
    return this.http.post<any>(`${API_SERVER}cloudrun/getMapGpx`, body).pipe(
      map((res) => {
        if (res.resultCode !== 200) {
          const msg = 'Get map GPX fail.<br>Please try again later.';
          return throwError(msg);
        } else {
          return res.info;
        }
      }),
      catchError((err) => {
        const msg = 'Get map GPX fail.<br>Please try again later.';
        this.utils.openAlert(msg);
        return throwError(err);
      })
    );
  }

  /**
   * 透過nodejs取得api-2016 （取得其他排行榜統計資料）資料
   * （競賽主機憑證為自簽憑證，故需透過中介程式）
   * @param body {any}
   * @author kidin-1090421
   */
  getLeaderboardStatistics(body: any) {
    return this.http
      .post<any>(`${API_SERVER}cloudrun/getLeaderboardStatistics`, body)
      .pipe(catchError((err) => throwError(err)));
  }
}
