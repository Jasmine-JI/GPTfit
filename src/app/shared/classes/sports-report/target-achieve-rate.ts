import { SportsParameter } from '../../models/sports-report';
import { of } from 'rxjs';
import { map } from 'rxjs/operators';
import { TemporaryCount } from '../sports-report/temporary-count';
import { ReportDateUnit } from '../report-date-unit';
import { getSameRangeDate, countBenefitTime, mathRounding } from '../../../core/utils';
import { SportType } from '../../enum/sports';
import { TargetConditionMap } from '../../../core/models/api/api-common/sport-target.model';
import { PAI_COFFICIENT, DAY_PAI_TARGET } from '../../models/sports-report';
import { DAY } from '../../models/utils-constant';
import { BenefitTimeStartZone } from '../../../core/enums/common';

/**
 * 主要用來處理群組報告個人分析運動目標總達成率計算
 * 計算各日期範圍單位的達成率後再進行均化
 */
export class SportsTargetAchieveRate {
  /**
   * 目標總達成率
   */
  private _avgAcheieveRate = 0;

  /**
   * @param parameter {SportsParameter}-計算運動目標總達成率所需資訊
   */
  constructor(parameter: SportsParameter) {
    this.countTargetAchieveRate(parameter);
  }

  /**
   * 計算運動目標總達成率
   * @param parameter {SportsParameter}-計算運動目標總達成率所需資訊
   */
  countTargetAchieveRate(parameter: SportsParameter) {
    const { openPrivacy, targetCondition, condition, data, benefitTimeStartZone, timeType } =
      parameter;
    const { sportType, dateUnit } = condition;
    if (openPrivacy) {
      of(data)
        .pipe(
          map((originData) => this.filterInvalidType(originData, sportType)),
          map((filterData) => this.mergeSameRangeData(filterData, dateUnit)),
          map((sameRangeData) =>
            this.countAchieveRate(sameRangeData, {
              targetCondition,
              dateUnit,
              benefitTimeStartZone,
            })
          )
        )
        .subscribe((totalTargetAchieveRate) => {
          const dateUnitRangeKey = timeType === 'base' ? 'baseTime' : 'compareTime';
          const dateUnitRangeNumber = condition[dateUnitRangeKey].getDiffRange(
            dateUnit.getUnitString()
          );
          this._avgAcheieveRate = mathRounding(totalTargetAchieveRate / dateUnitRangeNumber, 1);
        });
    }
  }

  /**
   * 過濾非運動報告指定的運動類別數據，並扁平化且反轉陣列讓時間呈現由舊到新排序
   * @param data {Array<any>}-運動陣列數據
   * @param conditionType {SportType}-運動報告指定的運動類別
   */
  filterInvalidType(data: Array<any>, conditionType: SportType) {
    const result = [];
    data.forEach((_data) => {
      const { startTime, endTime, activities: _activities } = _data;
      _activities.forEach((_activity) => {
        const sportType = +_activity.type;
        if (this.isEffectType(conditionType, sportType)) {
          result.push({ startTime, endTime, activities: _activity });
        }
      });
    });

    return result;
  }

  /**
   * 根據報告日期單位合併計算達成率所需的數據
   * @param data {Array<any>}-所選時間範圍之運動報告數據
   * @param dateUnit {ReportDateUnit}-報告所選擇的時間單位
   */
  mergeSameRangeData(data: Array<any>, dateUnit: ReportDateUnit) {
    const temporaryCount = new TemporaryCount();
    const result = [];
    data.forEach((_data, _index) => {
      const { startTime: _startTime, endTime: _endTime, activities: _activities } = _data;
      const { start: _start, end: _end } = getSameRangeDate(_startTime, _endTime, dateUnit);
      const { startTime } = temporaryCount.dateRange;
      const isFirstData = _index === 0;
      const isLastData = _index + 1 === data.length;
      if (isFirstData) {
        temporaryCount.saveDate(_start, _end);
        temporaryCount.countData(_activities);
        if (isLastData) result.push(temporaryCount.result);
      } else if (_start === startTime) {
        temporaryCount.countData(_activities);
        if (isLastData) result.push(temporaryCount.result);
      } else {
        result.push(temporaryCount.result);
        temporaryCount.init();
        temporaryCount.saveDate(_start, _end);
        temporaryCount.countData(_activities);
        if (isLastData) result.push(temporaryCount.result);
      }
    });

    return result;
  }

  /**
   * 是否為報告條件中有效運動類別的數據
   * @param conditionType {SportType}-運動報告指定類別
   * @param type {SportType}-運動類別
   */
  isEffectType(conditionType: SportType, type: SportType) {
    return conditionType === SportType.all || type === conditionType;
  }

  /**
   * 計算各週目標達成率後再計算總目標達成率
   * @param data {any}-經篩選有效的運動類別且扁平化後的數據
   * @param option {
   *  { targetCondition: TargetConditionMap; dateUnit: ReportDateUnit; benefitTimeStartZone: BenefitTimeStartZone; }
   * }-依報告時間單位轉換的群組目標內容、報告日期單位、效益時間設定範圍
   *
   */
  countAchieveRate(
    data: any,
    option: {
      targetCondition: TargetConditionMap;
      dateUnit: ReportDateUnit;
      benefitTimeStartZone: BenefitTimeStartZone;
    }
  ) {
    const { targetCondition, dateUnit, benefitTimeStartZone } = option;
    const targetConditionSize = targetCondition.size;
    if (targetConditionSize === 0) return 1;
    const totalAchieveRate = data.reduce((_prevValue, _current) => {
      let currentAchieveRate = 0;
      const {
        totalActivities,
        totalSecond,
        totalHrZone0Second,
        totalHrZone1Second,
        totalHrZone2Second,
        totalHrZone3Second,
        totalHrZone4Second,
        totalHrZone5Second,
        calories,
        avgHeartRateBpm,
      } = _current.activities;
      const hrZone = [
        totalHrZone0Second ?? 0,
        totalHrZone1Second ?? 0,
        totalHrZone2Second ?? 0,
        totalHrZone3Second ?? 0,
        totalHrZone4Second ?? 0,
        totalHrZone5Second ?? 0,
      ];

      targetCondition.forEach((_value, _filedName) => {
        const _filedValue = +_value.filedValue;
        switch (_filedName) {
          case 'totalActivities': {
            const proportion = this.getProportion(totalActivities, _filedValue);
            currentAchieveRate += proportion / targetConditionSize;
            break;
          }
          case 'totalTime': {
            const proportion = this.getProportion(totalSecond, _filedValue);
            currentAchieveRate += proportion / targetConditionSize;
            break;
          }
          case 'benefitTime': {
            const benefitTime = countBenefitTime(hrZone, benefitTimeStartZone);
            const proportion = this.getProportion(benefitTime, _filedValue);
            currentAchieveRate += proportion / targetConditionSize;
            break;
          }
          case 'pai': {
            const { z0, z1, z2, z3, z4, z5 } = PAI_COFFICIENT;
            const [zone0, zone1, zone2, zone3, zone4, zone5] = hrZone;
            const datePeroid = dateUnit.reportDatePeroid / DAY;
            const weightedValue =
              zone0 * z0 + zone1 * z1 + zone2 * z2 + zone3 * z3 + zone4 * z4 + zone5 * z5;
            const pai = (weightedValue / DAY_PAI_TARGET / datePeroid) * 100;
            const proportion = this.getProportion(pai, _filedValue);
            currentAchieveRate += proportion / targetConditionSize;
            break;
          }
          case 'calories': {
            const proportion = this.getProportion(calories, _filedValue);
            currentAchieveRate += proportion / targetConditionSize;
            break;
          }
          case 'avgHeartRate': {
            const proportion = this.getProportion(avgHeartRateBpm, _filedValue);
            currentAchieveRate += proportion / targetConditionSize;
            break;
          }
        }
      });

      return _prevValue + currentAchieveRate;
    }, 0);

    return totalAchieveRate * 100;
  }

  /**
   * 取得運動數據對於運動目標之佔比，最高佔比為1，超過則回覆1
   * @param molecular {number}-分子(運動數據)
   * @param denominator {number}-分母(運動目標)
   */
  getProportion(molecular: number, denominator: number) {
    const proportion = mathRounding((molecular ?? 0) / denominator, 4);
    return proportion >= 1 ? 1 : proportion;
  }

  /**
   * 取得平均目標達成率
   */
  get avgAcheieveRate() {
    return this._avgAcheieveRate;
  }
}
