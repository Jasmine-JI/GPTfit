import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { UtilsService } from './utils.service';
import { environment } from '../../../environments/environment';
import { throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { SportCode } from '../models/report-condition';

const { API_SERVER } = environment.url;

@Injectable()
export class ActivityService {

  constructor(
    private http: HttpClient,
    private utils: UtilsService
  ) {}

  /**
   * 使用nodejs先將數據下載成文件再上傳至server
   * @param body {any}
   * @author kidin-1090421
   */
  uploadSportFile (body: any) {
    return this.http.post<any>(API_SERVER + 'uploadSportFile', body).pipe(
      catchError(err => throwError(err))
    );
  }

  fetchTestData() {
    return this.http.get<any>('https://data.jianshukeji.com/jsonp?filename=json/activity.json');
  }

  /**
   * api-2102
   * @param body {any}
   * @author kidin-1100308
   */
  fetchSportList(body: any) {
    return this.http.post<any>('/api/v2/sport/getSportList', body).pipe(
      catchError(err => throwError(err))
    );
  }

  /**
   * api-2103
   * @param body {any}
   * @author kidin-1100308
   */
  fetchSportListDetail(body: any) {
    return this.http.post<any>('/api/v2/sport/getSportListDetail', body).pipe(
      catchError(err => throwError(err))
    );
  }

  /**
   * api-2108
   * @param body {any}
   * @author kidin-1100308
   */
  fetchEditActivityProfile(body: any) {
    return this.http.post<any>('/api/v2/sport/editActivityProfile', body).pipe(
      catchError(err => throwError(err))
    );
  }

  /**
   * api-2111
   * @param body {any}
   * @author kidin-1100308
   */
  fetchMultiActivityData(body: any) {
    return this.http.post<any>('/api/v2/sport/getMultiActivityData', body).pipe(
      catchError(err => throwError(err))
    );
  }

  /**
   * api-2109
   * @param body {any}
   * @author kidin-1100308
   */
  deleteActivityData (body: any) {
    return this.http.post<any>('/api/v2/sport/deleteActivityData', body).pipe(
      catchError(err => throwError(err))
    );
  }

  /**
   * 根據運動類別顯示佈景圖
   * @param type {number}-運動類別
   * @author kidin-1100105
   */
  handleSceneryImg(type: number, subtype: number) {
    let sportType: string;
    switch (type) {
      case SportCode.run:
        sportType = 'run';
        break;
      case SportCode.cycle:
        sportType = 'cycle';
        break;
      case SportCode.weightTrain:
        sportType = 'weightTraining';
        break;
      case SportCode.swim:
        sportType = 'swim';
        break;
      case SportCode.aerobic:
        sportType = 'aerobic';
        break;
      case SportCode.row:
        sportType = 'rowing';
        break;
      case SportCode.ball:
        sportType = 'ball';
        break;
    }

    if (subtype) {
      return `/app/public_html/img/${sportType}_${subtype}.jpg`;
    } else {
      return `/app/public_html/img/${sportType}_0.jpg`;
    }
    
  }

}
