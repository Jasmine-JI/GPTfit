
import { TargetField, GroupSportTarget, TargetCondition } from '../models/sport-target';
import { DateUnit } from '../enum/report';
import { mathRounding } from '../utils/index';
import { SportsTarget } from '../classes/sports-target';

/**
 * 處理 api 2104 response
 */
export class SportsReport {

  /**
   * 建立報告所需之內容
   * @param target {GroupSportTarget}-運動目標
   * @param reportUnit {DateUnit}-報告基準時間單位
   * @param data {Array<any>}-運動報告資料
   */
  constructor(target: GroupSportTarget, reportUnit: DateUnit, data: Array<any>) {
    this.createReport(target, reportUnit, data);
  }

  /**
   * 建立報告所需之內容
   * @param target {GroupSportTarget}-運動目標
   * @param dateUnit {DateUnit}-報告基準時間單位
   * @param data {Array<any>}-運動報告資料
   */
  createReport(target: GroupSportTarget, dateUnit: DateUnit, data: Array<any>) {
console.log('create', target, dateUnit, data);
    const sportTarget = new SportsTarget(target);
    
  }

}