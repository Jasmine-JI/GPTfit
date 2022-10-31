import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ReportConditionOpt } from '../models/report-condition';
import { Observable, BehaviorSubject, ReplaySubject } from 'rxjs';
import { PAI_COFFICIENT, DAY_PAI_TARGET } from '../models/sports-report';
import { MuscleCode, MuscleGroup } from '../enum/weight-train';
import dayjs from 'dayjs';

@Injectable()
export class ReportService {
  period$ = new BehaviorSubject<string>('');
  addition$ = new BehaviorSubject<any>(['99', '', '', '']);
  reportCategory$ = new BehaviorSubject<string>('99');
  reportStartTime$ = new BehaviorSubject<string>('');
  reportEndTime$ = new BehaviorSubject<string>('');
  typeAllData$ = new BehaviorSubject<any>({});
  typeRunData$ = new BehaviorSubject<any>({});
  typeCycleData$ = new BehaviorSubject<any>({});
  typeWeightTrainData$ = new BehaviorSubject<any>({});
  typeSwimData$ = new BehaviorSubject<any>({});
  typeAerobicData$ = new BehaviorSubject<any>({});
  typeRowData$ = new BehaviorSubject<any>({});
  typeBallData$ = new BehaviorSubject<any>({});
  reportCondition$ = new ReplaySubject<ReportConditionOpt>(1);
  reportLoading$ = new ReplaySubject<boolean>(1);

  constructor(private http: HttpClient) {}

  fetchSportSummaryArray(body) {
    return this.http.post<any>('/api/v2/sport/getSportSummaryArray', body);
  }

  fetchTrackingSummaryArray(body) {
    return this.http.post<any>('/api/v2/sport/getTrackingSummaryArray', body);
  }

  setPeriod(status: string) {
    this.period$.next(status);
  }

  setReportTime(startTime: string, endTime: string) {
    this.reportStartTime$.next(startTime);
    this.reportEndTime$.next(endTime);
    this.setReportAddition();
  }

  setReportAddition() {
    this.addition$.next([this.reportStartTime$, this.reportEndTime$, this.period$]);
  }

  getReportAddition(): Observable<Array<BehaviorSubject<string>>> {
    return this.addition$;
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

  /**
   * 根據心率區間計算PAI，PAI公式=((加權後運動秒數 / 週數) / 週目標時間)*100
   * @param hrZone {Array<number>}-心率區間
   * @param weekNum {number}-選擇期間的週數
   * @returns pai {number}
   * @author kidin-1100423
   */
  countPai(hrZone: Array<number>, weekNum: number) {
    const { z0, z1, z2, z3, z4, z5 } = PAI_COFFICIENT,
      [zone0, zone1, zone2, zone3, zone4, zone5] = [...hrZone],
      weightedValue = z0 * zone0 + z1 * zone1 + z2 * zone2 + z3 * zone3 + z4 * zone4 + z5 * zone5;
    return parseFloat((((weightedValue / (DAY_PAI_TARGET * 7)) * 100) / weekNum).toFixed(1));
  }

  /**
   * 畢氏定理
   * @param valueArr {Array<number>}
   * @author kidin-1100514
   */
  pythagorean(valueArr: Array<number>) {
    const countPowTotal = (preVal: number, currentVal: number) => {
      return preVal + Math.abs(currentVal) ** 2;
    };

    return parseFloat(Math.sqrt(valueArr.reduce(countPowTotal, 0)).toFixed(1));
  }

  /**
   * 將最大的g值，乘上係數，使其較接近原始平面最大加速度
   * @param max {number}最大g值
   * @param vertical {number}-該最大g值其垂直方向之g值
   * @author kidin-1100514
   */
  countMaxPlaneGForce(max: number, vertical: number) {
    const coefficient = this.pythagorean([max, vertical / 2]) / max;
    return max * coefficient;
  }

  /**
   * 計算BMI
   * @param height {number}-身高(cm)
   * @param weight {number}-體重(kg)
   * @return {number}-BMI
   * @author kidin-1100618
   */
  countBMI(height: number, weight: number): number {
    const bmi = weight / (height / 100) ** 2;
    return parseFloat(bmi.toFixed(1));
  }

  /**
   * 計算年齡
   * @param birthday {string}-生日
   * @author kidin-1100618
   */
  countAge(birthday: string) {
    const todayMoment = dayjs();
    const birthMoment = dayjs(birthday, 'YYYYMMDD');
    return todayMoment.diff(birthMoment, 'year');
  }

  /**
   * 計算FFMI
   * @param height {number}-身高
   * @param weight {number}-體重
   * @param fatRate {number}-脂肪率
   * @author kidin-1100621
   */
  countFFMI(height: number, weight: number, fatRate: number) {
    // 體脂率為0亦當作null
    if (fatRate) {
      const FFMI = (weight * (1 - fatRate / 100)) / (height / 100) ** 2;
      if (height > 180) {
        return parseFloat((FFMI + (6 * (height - 180)) / 100).toFixed(1));
      } else {
        return parseFloat(FFMI.toFixed(1));
      }
    } else {
      return null;
    }
  }
}
