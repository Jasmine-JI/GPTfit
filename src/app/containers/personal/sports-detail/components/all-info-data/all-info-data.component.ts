import { Component, OnChanges, SimpleChanges, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { ActivityInfo } from '../../../../../core/models/api/api-21xx';
import {
  SportTimePipe,
  SportPaceSibsPipe,
  SpeedPaceUnitPipe,
  SpeedSibsPipe,
  WeightSibsPipe,
  DistanceSibsPipe,
} from '../../../../../core/pipes';
import { SportType } from '../../../../../core/enums/sports';
import { DataUnitType } from '../../../../../core/enums/common';
import { UserService } from '../../../../../core/services';
import {
  mathRounding,
  transformDistance,
  speedToPaceSecond,
  paceSecondTimeFormat,
  getPaceUnit,
} from '../../../../../core/utils';
import { mi } from '../../../../../core/models/const';

@Component({
  selector: 'app-all-info-data',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    SportTimePipe,
    SportPaceSibsPipe,
    SpeedPaceUnitPipe,
    SpeedSibsPipe,
    WeightSibsPipe,
    DistanceSibsPipe,
  ],
  templateUrl: './all-info-data.component.html',
  styleUrls: ['./all-info-data.component.scss'],
})
export class AllInfoDataComponent implements OnChanges {
  /**
   * 是否為基準檔案
   */
  @Input() isBaseFile = true;

  /**
   * 基準運動檔案概要資訊
   */
  @Input() activityInfo: ActivityInfo;

  /**
   * 是否為比較模式
   */
  @Input() isCompareMode = false;

  /**
   * 比較運動檔案概要資訊
   */
  @Input() compareActivityInfo: ActivityInfo;

  /**
   * 基準和比較檔案概要資訊差值
   */
  diffData: { [key: string]: number } | null = null;

  readonly SportType = SportType;

  readonly DataUnitType = DataUnitType;

  constructor(private userService: UserService) {}

  /**
   * 使用者使用的單位類別
   */
  get userUnit() {
    return this.userService.getUser().unit;
  }

  /**
   * 取得爬升與下降使用distanceSibsPipe的設定
   */
  get elevPipeOption() {
    return {
      unitType: this.userUnit,
      showUnit: false,
      convertKiloAlways: false,
    };
  }

  /**
   * 取得爬升與下降的距離單位
   */
  get elevUnit() {
    return this.userUnit === DataUnitType.metric ? 'm' : 'ft';
  }

  /**
   * 取得 weightSibsPipe 的設定
   */
  get weightPipeOption() {
    return { unitType: this.userUnit, showUnit: false };
  }

  /**
   * 如果有比較檔案就計算差值
   * @param e
   */
  ngOnChanges(e: SimpleChanges) {
    const { compareActivityInfo } = e;
    if (compareActivityInfo) this.diffData = this.getDiffData();
  }

  /**
   * 取得卡路里數據，超過千卡以千卡顯示
   */
  getCalories() {
    const calories = this.activityInfo?.calories ?? 0;
    let value = calories;
    let unit = 'cal';
    if (calories > 1000) {
      value = mathRounding(calories / 1000, 2);
      unit = 'kcal';
    }

    return {
      title: 'universal_activityData_totalCalories',
      value,
      unit,
    };
  }

  /**
   * 取得基準和比較檔案概要資訊所需差值
   */
  getDiffData() {
    const { activityInfo, compareActivityInfo } = this;
    if (!compareActivityInfo) return null;
    const includeKey = new Set([
      'totalSecond',
      'totalActivitySecond',
      'totalRestSecond',
      'totalDistanceMeters',
      'elevGain',
      'elevLoss',
      'avgHeartRateBpm',
      'maxHeartRateBpm',
      'avgSpeed',
      'maxSpeed',
      'calories',
      'cycleAvgCadence',
      'cycleMaxCadence',
      'cycleAvgWatt',
      'cycleMaxWatt',
      'totalFeedbackEnergy',
      'runAvgCadence',
      'runMaxCadence',
      'totalActivityLapOrSet',
      'totalWeightKg',
      'totalReps',
      'swimAvgCadence',
      'swimMaxCadence',
      'avgSwolf',
      'bestSwolf',
      'totalStrokes',
      'rowingAvgWatt',
      'rowingMaxWatt',
      'rowingAvgCadence',
      'rowingMaxCadence',
    ]);
    const result: { [key: string]: number } = {};
    for (const _key in activityInfo) {
      if (!includeKey.has(_key)) continue;
      const _baseValue = +(activityInfo[_key] ?? 0);
      const _compareValue = +(compareActivityInfo[_key] ?? 0);
      const _diffValue = mathRounding(_baseValue - _compareValue, 2);
      Object.assign(result, { [_key]: _diffValue });
    }

    return result;
  }

  /**
   * 依據公英制及距離長度是否過千，進行轉換取得相關顯示數據
   */
  getDistanceContext() {
    const totalDistanceMeters = this.activityInfo.totalDistanceMeters ?? 0;
    const { userUnit } = this;
    const diffDistance = this.diffData?.totalDistanceMeters ?? 0;
    const isOverThousand = (distance: number) => distance >= 1000;
    const showByThousand = isOverThousand(totalDistanceMeters) || isOverThousand(diffDistance);
    const { value, unit } = transformDistance(totalDistanceMeters, userUnit, showByThousand);
    const diff = transformDistance(diffDistance, userUnit, showByThousand).value;
    return {
      title: 'universal_activityData_limit_totalDistance',
      value,
      unit,
      diff,
      isPositiveDiff: diffDistance >= 0,
    };
  }

  /**
   * 根據運動類別取得配速相關顯示數據
   * @param key 平均速度/最大速度的數據名稱
   */
  getPaceContext(key: string) {
    const {
      activityInfo: { type },
      userUnit,
    } = this;
    const isAvgData = key !== 'maxSpeed';
    const speed = this.activityInfo[key] ?? 0;
    const compareSpeed = this.compareActivityInfo ? this.compareActivityInfo[key] : 0;
    const paceSecond = speedToPaceSecond(speed, +type, userUnit);
    const comparePaceSecond = speedToPaceSecond(compareSpeed, +type, userUnit);
    const diffSecond = paceSecond - comparePaceSecond;

    return {
      title: this.getPaceTitle(isAvgData, +type),
      value: paceSecondTimeFormat(paceSecond),
      unit: getPaceUnit(+type, userUnit),
      diff: paceSecondTimeFormat(diffSecond),
      isPositiveDiff: diffSecond >= 0,
    };
  }

  /**
   * 根據取得速度相關顯示數據
   * @param key 平均速度/最大速度的數據名稱
   */
  getSpeedContext(key: string) {
    const {
      activityInfo: { type },
      userUnit,
    } = this;
    const isAvgData = key !== 'maxSpeed';
    const isMetric = userUnit === DataUnitType.metric;
    const getSpeedByUnit = (speed: number, isMetric: boolean) => {
      return mathRounding(isMetric ? speed : speed / mi, 2);
    };

    const speed = this.activityInfo[key] ?? 0;
    const diffSpeed = this.diffData ? this.diffData[key] ?? 0 : 0;
    return {
      title: this.getPaceTitle(isAvgData, +type),
      value: getSpeedByUnit(speed, isMetric),
      unit: isMetric ? 'kph' : 'mph',
      diff: getSpeedByUnit(diffSpeed, isMetric),
      isPositiveDiff: diffSpeed >= 0,
    };
  }

  /**
   * 根據運動類別與公英制取得速度/配速標題
   * @param isAvgData 是否為平均數據
   * @param sportsType 運動類別
   */
  getPaceTitle(isAvgData: boolean, sportsType: SportType) {
    const isMetric = this.userUnit === DataUnitType.metric;
    const avgTitleList = {
      [SportType.run]: isMetric
        ? 'universal_activityData_limit_avgKilometerPace'
        : 'universal_activityData_limit_avgMilePace',
      [SportType.swim]: 'universal_activityData_limit_avg100mPace',
      [SportType.row]: 'universal_activityData_limit_avg500mPace',
    };

    const maxTitleList = {
      [SportType.run]: isMetric
        ? 'universal_activityData_limit_bestKilometerPace'
        : 'universal_activityData_limit_bestMilePace',
      [SportType.swim]: 'universal_activityData_limit_bestMoving100mPace',
      [SportType.row]: 'universal_activityData_limit_bestMoving500mPace',
    };

    return isAvgData
      ? avgTitleList[sportsType] ?? 'universal_activityData_limit_avgSpeed'
      : maxTitleList[sportsType] ?? 'universal_activityData_limit_liveBestSpeed';
  }

  /**
   * 依運動類別取得平均功率相關顯示數據
   */
  getAvgPowerContext() {
    const { type } = this.activityInfo;
    const avgWattTranslateKey = 'universal_activityData_limit_avgPower';
    switch (+type) {
      case SportType.row:
        return {
          title: avgWattTranslateKey,
          value: mathRounding(this.activityInfo.rowingAvgWatt ?? 0, 2),
          unit: 'w',
          diff: this.diffData?.rowingAvgWatt ?? 0,
          isPositiveDiff: this.diffData?.rowingAvgWatt >= 0,
        };
      default:
        return {
          title: avgWattTranslateKey,
          value: mathRounding(this.activityInfo.cycleAvgWatt ?? 0, 2),
          unit: 'w',
          diff: this.diffData?.cycleAvgWatt ?? 0,
          isPositiveDiff: this.diffData?.cycleAvgWatt >= 0,
        };
    }
  }

  /**
   * 依運動類別取得最大功率相關顯示數據
   */
  getMaxPowerContext() {
    const { type } = this.activityInfo;
    const maxWattTranslateKey = 'universal_activityData_limit_maxPower';
    switch (+type) {
      case SportType.row:
        return {
          title: maxWattTranslateKey,
          value: mathRounding(this.activityInfo.rowingMaxWatt ?? 0, 2),
          unit: 'w',
          diff: this.diffData?.rowingMaxWatt ?? 0,
          isPositiveDiff: this.diffData?.rowingMaxWatt >= 0,
        };
      default:
        return {
          title: maxWattTranslateKey,
          value: mathRounding(this.activityInfo.cycleMaxWatt ?? 0, 2),
          unit: 'w',
          diff: this.diffData?.cycleMaxWatt ?? 0,
          isPositiveDiff: this.diffData?.cycleMaxWatt >= 0,
        };
    }
  }

  /**
   * 取得百米平均划水次數相關顯示數據
   */
  getAvgStrokeContext() {
    const { activityInfo, compareActivityInfo } = this;
    const totalStrokes = activityInfo.totalStrokes ?? 0;
    const distance = activityInfo.totalDistanceMeters ?? 0;
    const compareStrokes = compareActivityInfo?.totalStrokes ?? 0;
    const compareDistance = compareActivityInfo?.totalDistanceMeters ?? 0;
    const countAvgStroke = (strokes: number, dist: number) => {
      const denominator = dist || Infinity;
      return mathRounding(strokes / (denominator / 100), 2);
    };

    const baseAvgStorkes = countAvgStroke(totalStrokes, distance);
    const compareAvgStrokes = countAvgStroke(compareStrokes, compareDistance);
    const diffAvgStrokes = mathRounding(baseAvgStorkes - compareAvgStrokes, 2);
    return {
      title: '平均百米划水數',
      value: baseAvgStorkes,
      unit: 'spm',
      diff: diffAvgStrokes,
      isPositiveDiff: diffAvgStrokes >= 0,
    };
  }

  /**
   * 包含或排除部份運動類別
   * @param typeList 欲包含的運動類別
   */
  includeSportsType(typeList: Array<SportType>) {
    const type = +this.activityInfo.type;
    return typeList.includes(type);
  }

  /**
   * 包含或排除部份運動類別
   * @param typeList 欲排除的運動類別
   */
  excludeSportsType(typeList: Array<SportType>) {
    return !this.includeSportsType(typeList);
  }
}
