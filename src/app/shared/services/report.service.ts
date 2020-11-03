import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ReportConditionOpt } from '../models/report-condition'
import moment from 'moment';
import { Observable, BehaviorSubject, ReplaySubject } from 'rxjs';


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
  reportCondition$ = new ReplaySubject<ReportConditionOpt>();

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

  setReportCondition(status: ReportConditionOpt) {
    this.reportCondition$.next(status);
  }

  getReportCondition(): Observable<ReportConditionOpt> {
    return this.reportCondition$;
  }

  getTypeData (type: string) {
    switch (type) {
      case '1':
        return this.typeRunData$;
      case '2':
        return this.typeCycleData$;
      case '3':
        return this.typeWeightTrainData$;
      case '4':
        return this.typeSwimData$;
      case '5':
        return this.typeAerobicData$;
      case '6':
        return this.typeRowData$;
      case '7':
        return this.typeBallData$;
      default:
        return this.typeAllData$;
    }
  }

}
