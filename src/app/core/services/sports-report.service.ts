import { Injectable } from '@angular/core';
import { Api21xxService } from './api-21xx.service';
import { deepCopy } from '../../shared/utils/index';
import { ReportCondition } from '../../shared/models/report-condition';
import { of, combineLatest } from 'rxjs';


@Injectable({
  providedIn: 'root'
})
export class SportsReportService {

  /**
   * 儲存報告篩選條件用，用來與新條件進行比對
   */
  private _condition: ReportCondition;

  /**
   * 儲存api 2104回傳之基準運動數據，
   * 供僅切換報告運動類別時直接存取不call api
   */
  private _baseReport: Array<any>;

  /**
   * 儲存api 2104回傳之比較運動數據，
   * 供僅切換報告運動類別時直接存取不call api
   */
  private _compareReport: Array<any>;

  constructor(private api21xxService: Api21xxService) {}

  /**
   * 比對報告篩選條件，
   * 如為僅切換運動類別，則回傳已儲存之運動數據，
   * 否則重新call api 2104
   * @param condition {ReportCondition}-報告篩選條件
   */
  getSportsSummary(condition: ReportCondition) {


  }



}
