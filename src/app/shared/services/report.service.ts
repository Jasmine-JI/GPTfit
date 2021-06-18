import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ReportConditionOpt } from '../models/report-condition'
import { Observable, BehaviorSubject, ReplaySubject } from 'rxjs';
import { paiCofficient, dayPaiTarget } from '../models/sports-report';
import { MuscleCode, MuscleGroup } from '../models/weight-train';
import moment from 'moment';

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

  setPeriod (status: string) {
    this.period$.next(status);
  }

  setReportCategory (status: string) {
    this.reportCategory$.next(status);
  }

  setReportTime (startTime: string, endTime: string) {
    this.reportStartTime$.next(startTime);
    this.reportEndTime$.next(endTime);
    this.setReportAddition();
  }

  setReportAddition () {
    this.addition$.next([this.reportStartTime$, this.reportEndTime$, this.period$]);
  }

  setTypeAllData (
    dataAll: Object,
    dataRun: Object,
    dataCycle: Object,
    dataWeightTrain: Object,
    dataSwim: Object,
    dataAerobic: Object,
    dataRow: Object,
    dataBall: Object,
  ) {
    this.typeAllData$.next(dataAll);
    this.typeRunData$.next(dataRun);
    this.typeCycleData$.next(dataCycle);
    this.typeWeightTrainData$.next(dataWeightTrain);
    this.typeSwimData$.next(dataSwim);
    this.typeAerobicData$.next(dataAerobic);
    this.typeRowData$.next(dataRow);
    this.typeBallData$.next(dataBall);
  }

  getreportCategory (): Observable<string> {
    return this.reportCategory$;
  }

  getReportAddition (): Observable<Array<BehaviorSubject<string>>> {
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

  getTypeData (type: number) {
    switch (type) {
      case 1:
        return this.typeRunData$;
      case 2:
        return this.typeCycleData$;
      case 3:
        return this.typeWeightTrainData$;
      case 4:
        return this.typeSwimData$;
      case 5:
        return this.typeAerobicData$;
      case 6:
        return this.typeRowData$;
      case 7:
        return this.typeBallData$;
      default:
        return this.typeAllData$;
    }
  }

  /**
   * 根據心率區間計算PAI，PAI公式=((加權後運動秒數 / 週數) / 週目標時間)*100
   * @param hrZone {Array<number>}-心率區間
   * @param weekNum {number}-選擇期間的週數
   * @returns pai {number}
   * @author kidin-1100423
   */
  countPai(hrZone: Array<number>, weekNum: number) {
    const { z0, z1, z2, z3, z4, z5 } = paiCofficient,
          [zone0, zone1, zone2, zone3, zone4, zone5] = [...hrZone],
          weightedValue = z0 * zone0 + z1 * zone1 + z2 * zone2 + z3 * zone3 + z4 * zone4 + z5 * zone5;
    return parseFloat((((weightedValue / (dayPaiTarget * 7)) * 100) / weekNum).toFixed(1));
  }

  /**
   * 畢氏定理
   * @param valueArr {Array<number>}
   * @author kidin-1100514
   */
  pythagorean(valueArr: Array<number>) {
    const countPowTotal = (preVal: number, currentVal: number) => {
      return preVal + (Math.abs(currentVal) ** 2);
    }

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
   * 回傳肌肉所屬肌群
   * @param muscleCode {MuscleCode}-肌肉部位編碼
   * @return MusecleGroup
   * @author kidin-1100526
   */
  getBelongMuscleGroup(muscleCode: MuscleCode): MuscleGroup {
    switch (muscleCode) {
      case MuscleCode.bicepsInside:
      case MuscleCode.triceps:
      case MuscleCode.wristFlexor:
        return MuscleGroup.armMuscle;
      case MuscleCode.pectoralsMuscle:
      case MuscleCode.pectoralisUpper:
      case MuscleCode.pectoralisLower:
      case MuscleCode.pectoralsInside:
      case MuscleCode.pectoralsOutside:
      case MuscleCode.frontSerratus:
        return MuscleGroup.pectoralsMuscle;
      case MuscleCode.shoulderMuscle:
      case MuscleCode.deltoidMuscle:
      case MuscleCode.deltoidAnterior:
      case MuscleCode.deltoidLateral:
      case MuscleCode.deltoidPosterior:
      case MuscleCode.trapezius:
        return MuscleGroup.shoulderMuscle;
      case MuscleCode.backMuscle:
      case MuscleCode.latissimusDorsi:
      case MuscleCode.erectorSpinae:
        return MuscleGroup.backMuscle;
      case MuscleCode.abdominalMuscle:
      case MuscleCode.rectusAbdominis:
      case MuscleCode.rectusAbdominisUpper:
      case MuscleCode.rectusAbdominisLower:
      case MuscleCode.abdominisOblique:
        return MuscleGroup.abdominalMuscle;
      case MuscleCode.legMuscle:
      case MuscleCode.hipMuscle:
      case MuscleCode.quadricepsFemoris:
      case MuscleCode.hamstrings:
      case MuscleCode.ankleFlexor:
      case MuscleCode.gastrocnemius:
        return MuscleGroup.legMuscle;
    }
    
  }

  /**
   * 計算BMI
   * @param height {number}-身高(m)
   * @param weight {number}-體重(kg)
   * @return {number}-BMI
   * @author kidin-1100618
   */
  countBMI(height: number, weight: number): number {
    const bmi = weight / Math.sqrt(height / 100);
    return parseFloat(bmi.toFixed(1));
  }

  /**
   * 計算年齡
   * @param birthday {string}-YYYYMMDD
   * @author kidin-1100618
   */
  countAge(birthday: string) {
    const todayMoment = moment(),
          birthMoment = moment(birthday, 'YYYYMMDD');
    return todayMoment.diff(birthMoment, 'year');
  }
  
}
