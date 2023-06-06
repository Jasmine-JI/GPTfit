import { Injectable } from '@angular/core';
import { Api21xxService } from './api-21xx.service';
import { deepCopy } from '../utils/index';
import { Observable, BehaviorSubject, ReplaySubject } from 'rxjs';
import { ReportConditionOpt } from '../models/compo/report-condition.model';

@Injectable({
  providedIn: 'root',
})
export class ReportService {
  reportCondition$ = new ReplaySubject<ReportConditionOpt>(1);
  reportLoading$ = new ReplaySubject<boolean>(1);

  /**
   * 儲存api 2104回傳之基準運動數據，
   * 供僅切換報告運動類別時直接存取不call api
   */
  baseActivityData: Array<any>;

  /**
   * 儲存api 2104回傳之比較運動數據，
   * 供僅切換報告運動類別時直接存取不call api
   */
  compareActivityData: Array<any>;

  /**
   * 儲存api 2107回傳之基準運動數據，
   * 供僅切換報告運動類別時直接存取不call api
   */
  baseLifeTracking: Array<any>;

  /**
   * 儲存api 2107回傳之比較運動數據，
   * 供僅切換報告運動類別時直接存取不call api
   */
  compareLifeTracking: Array<any>;

  constructor(private api21xxService: Api21xxService) {}

  /**
   * 儲存基準數據
   * @param data {Array<any>}
   * @author kidin-1110321
   */
  saveBaseActivitiesData(data: Array<any>) {
    this.baseActivityData = deepCopy(data);
  }

  /**
   * 取得先前儲存的基準數據
   * @author kidin-1110321
   */
  getBaseActivitiesData() {
    return this.baseActivityData;
  }

  /**
   * 儲存比較數據
   * @param data {Array<any>}
   * @author kidin-1110321
   */
  saveCompareActivitiesData(data: Array<any>) {
    this.compareActivityData = deepCopy(data);
  }

  /**
   * 取得先前儲存的比較數據
   * @author kidin-1110321
   */
  getCompareActivitiesData() {
    return this.compareActivityData;
  }

  /**
   * 儲存基準數據
   * @param data {Array<any>}
   * @author kidin-1110321
   */
  saveBaseLifeTracking(data: Array<any>) {
    this.baseLifeTracking = deepCopy(data);
  }

  /**
   * 取得先前儲存的基準數據
   * @author kidin-1110321
   */
  getBaseLifeTracking() {
    return this.baseLifeTracking;
  }

  /**
   * 儲存比較數據
   * @param data {Array<any>}
   * @author kidin-1110321
   */
  saveCompareLifeTracking(data: Array<any>) {
    this.compareLifeTracking = deepCopy(data);
  }

  /**
   * 取得先前儲存的比較數據
   * @author kidin-1110321
   */
  getCompareLifeTracking() {
    return this.compareLifeTracking;
  }

  /**
   * 儲存篩選器條件
   * @param status {ReportConditionOpt}-篩選器條件
   * @author kidin-1091210
   */
  setReportCondition(status: ReportConditionOpt) {
    this.reportCondition$.next(status);
  }

  /**
   * 取得篩選器條件
   * @author kidin-1091210
   */
  getReportCondition(): Observable<ReportConditionOpt> {
    return this.reportCondition$;
  }

  /**
   * 儲存loading狀態
   * @param status {boolean}-loading狀態
   * @author kidin-1091210
   */
  setReportLoading(status: boolean) {
    this.reportLoading$.next(status);
  }

  /**
   * 取得loading狀態
   * @author kidin-1091210
   */
  getReportLoading(): Observable<boolean> {
    return this.reportLoading$;
  }
}
