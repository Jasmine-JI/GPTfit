import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError } from 'rxjs/operators';
import { throwRxError } from '../utils';

@Injectable({
  providedIn: 'root',
})
export class ConfigJsonService {
  constructor(private http: HttpClient) {}

  /**
   * 取得重訓安裝檔
   */
  getWeightTrainingConfig() {
    return <any>(
      this.http
        .get('/app/public_html/fitness/configs/weight_training.json')
        .pipe(catchError((err) => throwRxError(err)))
    );
  }
}
