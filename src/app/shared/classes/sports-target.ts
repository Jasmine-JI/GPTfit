import {
  SportTarget,
  TargetCondition,
  TargetConditionMap,
} from '../../core/models/api/api-common/sport-target.model';
import { GroupLevel } from '../enum/professional';
import { mathRounding } from '../utils/index';
import { DateUnit } from '../enum/report';
import { SportTargetSymbols } from '../../core/enums/sports';
import { of } from 'rxjs';
import { map } from 'rxjs/operators';

/**
 * 處理運動目標
 */
export class SportsTarget {
  /**
   * 繼承目標的群組階層，若階層等於自身，則代表為自訂目標
   */
  private _reference: string; // 其值為groupLevel字串

  /**
   * 將目標篩選重複並整理過後的內容
   */
  private _arrangeCondition: Map<DateUnit, TargetConditionMap>;

  constructor(target: SportTarget | Record<string, never>) {
    const { name, condition } = target;
    if (name) this._reference = name;
    of(condition)
      .pipe(
        map((condition) => this.arrangeCondition(condition)),
        map((arrangeCondition) => this.checkAllcycle(arrangeCondition))
      )
      .subscribe((res) => {
        this._arrangeCondition = res;
      });
  }

  /**
   * 儲存套用的目標其群組階層
   * @param reference {string | GroupLevel}-套用目標的群組階層
   */
  set reference(reference: string | GroupLevel) {
    this._reference = `${reference}`;
  }

  /**
   * 取得套用的目標其群組階層
   */
  get reference() {
    return this._reference;
  }

  /**
   * 將運動目標依日期單位進行整理，
   * 包含過濾重複cycle且重複filedName，
   * 以及將同cycle的目標整理在一起
   * @param condition {TargetCondition}-運動目標的內容
   */
  arrangeCondition(condition: Array<TargetCondition> | undefined) {
    if (!condition) return this.getDefaultCondition();

    const resultMap = new Map();
    condition.forEach((_condition) => {
      const { cycle, filedName, filedValue, symbols } = _condition;
      // 避免api回傳cycle為null值
      if (cycle) {
        const content = resultMap.get(cycle) ?? new Map();
        content.set(filedName, { filedValue, symbols });
        resultMap.set(cycle, content);
      }
    });

    return resultMap;
  }

  /**
   * 確認是否所有日期單位皆有目標條件
   */
  checkAllcycle(targetMap: Map<DateUnit, TargetConditionMap>) {
    for (let cycle = 1; cycle <= 5; cycle++) {
      const content = targetMap.get(cycle);
      if (!content) targetMap.set(cycle, this.getDefaultContent(cycle));
    }

    return targetMap;
  }

  /**
   * 取得指定日期的目標內容
   * @param cycle {DateUnit}-目標日期單位
   */
  getArrangeCondition(cycle: DateUnit) {
    const condition = this._arrangeCondition.get(cycle);
    return condition ?? this.getDefaultContent(cycle);
  }

  /**
   * 取得預設運動目標
   */
  getDefaultCondition() {
    const resultMap = new Map();
    for (let cycle = 1; cycle <= 5; cycle++) {
      resultMap.set(cycle, this.getDefaultContent(cycle));
    }

    return resultMap;
  }

  /**
   * 取得指定日期單位的運動目標內容
   * @param cycle {DateUnit}-目標日期單位
   */
  getDefaultContent(cycle: DateUnit) {
    const dayTotalTime = 20 * 60; // 暫定一天運動目標為20分鐘
    const weekTotalTime = 150 * 60; // 以一週運動150分鐘為基準
    const monthTotalTime = weekTotalTime * 4; // 一個月以4週計算
    const seasonTotalTime = monthTotalTime * 3;
    const yearTotalTime = seasonTotalTime * 4;
    const defaultTotalTime = [
      dayTotalTime,
      weekTotalTime,
      monthTotalTime,
      seasonTotalTime,
      yearTotalTime,
    ];
    const assignTotalTime = defaultTotalTime[cycle - 1];
    const content = new Map();
    content.set('totalTime', {
      symbols: SportTargetSymbols.greaterOrEqual,
      filedValue: assignTotalTime,
    });
    content.set('pai', { symbols: SportTargetSymbols.greaterOrEqual, filedValue: 100 }); // pai已有時間概念在內，故皆設為100
    return content as TargetConditionMap;
  }

  /**
   * 變更指定時間單位的目標條件
   * @param cycle {DateUnit}-目標日期單位
   * @param content {TargetConditionMap}-目標條件的Map物件
   */
  changeAllCondition(cycle: DateUnit, content: TargetConditionMap) {
    this._arrangeCondition.set(cycle, content);
  }

  /**
   * 取得日期範圍單位轉換係數
   * @param reportUnit {DateUnit}-報告所選的呈現時間單位
   * @param cycle {DateUnit}-報告所選的目標時間單位
   */
  getDateTransformCoefficient(reportUnit: DateUnit, cycle: DateUnit) {
    const denominator = SportsTarget.getUnitDays(cycle);
    const numerator = SportsTarget.getUnitDays(reportUnit);
    return mathRounding(numerator / denominator, 5);
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

  /**
   * 取得api可接受格式的運動目標
   */
  getReductionTarget() {
    const result = {
      name: this._reference ?? '',
      condition: <Array<TargetCondition>>[],
    };

    this._arrangeCondition.forEach((_content, cycle) => {
      _content.forEach((_value, filedName) => {
        const { symbols, filedValue } = _value;
        result.condition.push({ cycle, filedName, symbols, filedValue });
      });
    });

    return result;
  }
}
