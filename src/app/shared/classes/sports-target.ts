import { TargetField, GroupSportTarget, PersonalTarget, TargetCondition } from '../models/sport-target';
import { ConditionSymbols } from '../enum/sport-target';
import { GroupLevel } from '../enum/professional';
import { deepCopy, mathRounding } from '../utils/index';
import { DateUnit } from '../enum/report';


/**
 * 處理運動目標
 */
export class SportsTarget {

  /**
   * 繼承目標的群組階層，若階層等於自身，則代表為自訂目標
   */
  private _reference: string;  // 其值為groupLevel字串

  /**
   * 目標的時間計算單位
   */
  private _cycle: DateUnit;

  /**
   * 目標設定清單
   */
  private _condition: Array<TargetCondition>;


  constructor(target: PersonalTarget | GroupSportTarget) {
    const { name, cycle, condition } = target as GroupSportTarget;
    if (name) this.reference = name;
    this.cycle = cycle;
    this.condition = condition;
  }

  /**
   * 取得群組運動目標資訊
   */
  get groupSportTarget(): GroupSportTarget {
    const { _reference: name, _cycle: cycle, _condition: condition } = this;
    return { name, cycle, condition };
  }

  /**
   * 取得個人運動目標資訊
   */
  get personalSportTarget() {
    const { _cycle: cycle, _condition: condition } = this;
    return { cycle, condition };
  }

  /**
   * 儲存套用的目標其群組階層
   * @param reference {string | GroupLevel}-套用目標的群組階層
   */
  set reference(reference: string | GroupLevel) {
    this._reference = `${reference}`;
  }

  /**
   * 儲存目標的時間範圍計算單位
   * @param cycle {DateUnit}-時間範圍單位
   */
  set cycle(cycle: DateUnit) {
    this._cycle = cycle;
  }

  /**
   * 儲存目標達成條件
   * @param condition {Array<TargetCondition>}-目標達成條件
   */
  set condition(condition: Array<TargetCondition>) {
    this._condition = deepCopy(condition);
  }

  /**
   * 移除指定條件
   * @param index {number}-欲刪除條件之序列
   */
  removeCondition(index: number) {
    this._condition.splice(index, 1);
  }

  /**
   * 加入指定條件
   * @param condition {TargetCondition}
   */
  addCondition(condition: TargetCondition) {
    this._condition.push(condition);
  }

  /**
   * 移除所有條件
   */
  clearCondition() {
    this._condition = [];
  }

  /**
   * 取得依報告所選時間單位進行換算的個人目標
   * @param reportUnit {DateUnit}-報告所選的時間單位
   */
  getTransformCondition(reportUnit: DateUnit) {
    const { _cycle, _condition } = this;
    const sameUnit = _cycle === reportUnit;
    const conditionNotSet = _condition.length === 0;
    if (sameUnit || conditionNotSet) return _condition;

    const coefficient = this.getDateTransformCoefficient(reportUnit);
    return _condition.map(_con => Math.round(_con.filedValue * coefficient));
  }

  /**
   * 取得日期範圍單位轉換係數
   * @param reportUnit {DateUnit}-報告所選的時間單位
   */
  getDateTransformCoefficient(reportUnit: DateUnit) {
    const { _cycle } = this;
    const denominator = SportsTarget.getUnitDays(_cycle);
    const molecular = SportsTarget.getUnitDays(reportUnit);
    return mathRounding(molecular / denominator, 2);
  }

  /**
   * 取得日期範圍橫跨天數
   * @param unit {DateUnit}-日期範圍
   */
  static getUnitDays(unit: DateUnit) {
    switch (unit) {
      case DateUnit.day:
        return 1;
      case DateUnit.week:
        return 7;
      case DateUnit.month:
        return 30;
      case DateUnit.season:
        return 90;
      case DateUnit.year:
        return 365;
    }
  }

}