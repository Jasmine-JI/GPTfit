// exercise-habits.service.ts
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, switchMap, tap } from 'rxjs/operators';
import { checkRxFlowResponse, throwRxError } from '../../../core/utils';
import { BehaviorSubject, Observable, ReplaySubject, of, throwError } from 'rxjs';

export interface latest_two_weeks_days {
  start_time: string;
  avg_effect_value: number;
  year_week_num: string;
  day_of_week: string;
}

export interface latest_two_month_response {
  year_week_num: string;
  effect_value: number;
  year_month: string;
}

export interface typePercent {
  type: string[];
  sum_effect_time: number[];
  type_percent: number[];
}
export interface weekGroup {
  filter(arg0: (item: any) => boolean): unknown;
  year_week_num: string[];
  sum_calories: number[];
  effect_value: number[];
  avg_sport_day: number[];
  avg_sport_time: number[];
}
export interface monthGroup {
  year_month: string[];
  sum_calories: number[];
  effect_value: number[];
  avg_sport_day: number[];
  avg_sport_time: number[];
}

export interface subData {
  name: string;
  this_week: number;
  last_week: number;
  this_month: number;
  last_month: number;
}

// API 回傳資料定義
export interface Api531Response {
  latest_two_weeks_days?: latest_two_weeks_days[] | null;
  latest_two_month_response?: latest_two_month_response[] | null;
  type_percent?: typePercent | null;
  week_group?: weekGroup | null;
  month_group?: monthGroup | null;
  sub_data?: subData[] | null;
}

export interface Api531Post {
  filterStartTime?: string;
  filterEndTime?: string;
  group_id?: string;
  targetUserId?: number[];
  token?: string;
  select_type?: number;
  calculateType: string; // 531 333 w150(150min/週)
}

@Injectable({
  providedIn: 'root',
})
export class ExerciseHabitsService {
  private api531Response$: BehaviorSubject<Api531Response | null>;
  private originalApiRequest: Api531Post;
  calculateType = '531'; //531 333 w150
  private ifNoDataSubject: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

  constructor(private http: HttpClient) {
    this.api531Response$ = new BehaviorSubject<Api531Response>(null);
  }

  setIfNoData(value: boolean) {
    this.ifNoDataSubject.next(value);
  }

  // 获取 ifNoData 的可观察对象
  getIfNoDataObservable() {
    return this.ifNoDataSubject.asObservable();
  }

  /**
   * 取得變更部分條件前的 ApiRequest
   * @returns
   */
  getOriginalApiRequest() {
    return this.originalApiRequest;
  }

  /**
   * 更新目標531/333/w150計算方式
   * @param newType
   */
  updateCalculateType(newCalculateType: string) {
    this.calculateType = newCalculateType;
  }

  /**
   * 更新目標531/333/w150計算方式
   * @param newType
   */
  getCalculateType() {
    return this.calculateType;
  }

  // updateCalculateType(newType: string) {
  //   this.calculateTypeSubject.next(newType);
  // }

  /**
   * 更新趨勢圖日期區間回應資料
   * @param newType
   */

  // // 取得531運動習慣數據的方法，(模擬呼叫API)
  // getExerciseHabits(){
  //   // 回傳假資料，模擬API回應
  //   return this.ApiResponse;
  // }

  // 儲存 API 回應到變數
  set531Response(response: Api531Response) {
    this.api531Response$.next(response);
  }

  // 從變數獲取儲存的 API 回應
  get531Response(): Observable<Api531Response | null> {
    return this.api531Response$;
  }

  // 呼叫 API 並回傳結果
  fetchExerciseHabits(body: Api531Post): Observable<Api531Response> {
    if (body.select_type == 0) {
      this.originalApiRequest = body;
    }
    return this.http.post<Api531Response>('/api/v2/sport/CalculatePercentage531', body).pipe(
      catchError((error: HttpErrorResponse) => {
        return throwRxError(error);
      })
    );
  }
}
