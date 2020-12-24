import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';


/**
 * 圖床相關api
 */
@Injectable({
  providedIn: 'root'
})
export class ImageUploadService {

  constructor(
    private http: HttpClient
  ) {}

  /**
   * 8001-新增圖片
   * @param body {object}
   * @method post
   * @author kidin-1090715
   */
  addImg(body: object) {
    return this.http.post<any>('/api/v1/img/addimg', body).pipe(
      catchError(err => throwError(err))
    );
  }

  /**
   * 8002-移除圖片
   * @param body {object}
   * @method post
   * @author kidin-1090715
   */
  deleteImg(body: object) {
    return this.http.post<any>('/api/v1/img/deleteimg', body).pipe(
      catchError(err => throwError(err))
    );
  }

  /**
   * 8003-取得圖片列表
   * @param body {object}
   * @method post
   * @author kidin-1090715
   */
  getImgList(body: object) {
    return this.http.post<any>('/api/v1/img/getimglist', body).pipe(
      catchError(err => throwError(err))
    );
  }

}
