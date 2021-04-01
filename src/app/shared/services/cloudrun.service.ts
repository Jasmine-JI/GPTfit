import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { throwError, of } from 'rxjs';
import { catchError, map, } from 'rxjs/operators';
import { UtilsService } from './utils.service';
import { environment } from '../../../environments/environment';

const { API_SERVER } = environment.url;

@Injectable({
  providedIn: 'root'
})
export class CloudrunService {

  /**
   * 雲跑地圖清單
   */
  mapList: any;

  constructor(
    private http: HttpClient,
    private utils: UtilsService
  ) { }

  /**
   * 取得所有地圖資訊
   * @author kidin-1100322
   */
  getAllMapInfo() {
    if (this.mapList) {
      return of(this.mapList);
    } else {

      return this.http.post<any>(API_SERVER + 'cloudrun/getAllMapInfo', {}).pipe(
        map(res => {
          if (res.resultCode !== 200) {
            const msg = 'Get map information fail.<br>Please try again later.';
            return throwError(msg);
          } else {
            this.mapList = res.resInfo;
            return this.mapList;
          }
        }),
        catchError(err => {
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
    return this.http.post<any>(API_SERVER + 'cloudrun/getMapGpx', body).pipe(
      map(res => {
        if (res.resultCode !== 200) {
          const msg = 'Get map GPX fail.<br>Please try again later.';
          return throwError(msg);
        } else {
          return res.info;
        }

      }),
      catchError(err => {
        const msg = 'Get map GPX fail.<br>Please try again later.';
        this.utils.openAlert(msg);
        return throwError(err);
      })

    );

  }

}
