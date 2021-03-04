import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class InnerSystemService {

  constructor(
    private http: HttpClient
  ) { }

  /**
   * 取得系統日誌
   * @param body {any}
   * @author kidin-1100303
   */
  getSystemLog(body: any) {
    return <any>this.http.post('/api/v1/app/getSystemLog', body).pipe(
      catchError(err => throwError(err))
    );
  }

}
