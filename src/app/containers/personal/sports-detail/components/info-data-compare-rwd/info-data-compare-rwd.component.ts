import { Component, OnChanges, SimpleChanges, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivityInfo } from '../../../../../core/models/api/api-21xx';
import { UserService } from '../../../../../core/services';
import {
  mathRounding,
  transformDistance,
  speedToPaceSecond,
  paceSecondTimeFormat,
  getPaceUnit,
} from '../../../../../core/utils';
import { TranslateModule } from '@ngx-translate/core';
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
import { mi } from '../../../../../core/models/const';

@Component({
  selector: 'app-info-data-compare-rwd',
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
  templateUrl: './info-data-compare-rwd.component.html',
  styleUrls: ['./info-data-compare-rwd.component.scss'],
})
export class InfoDataCompareRwdComponent implements OnChanges {
  /**
   * 基準檔案概要資訊
   */
  @Input() baseInfo: ActivityInfo;

  /**
   * 比較檔案概要資訊
   */
  @Input() compareInfo: ActivityInfo;

  /**
   * 基準檔案與比較檔案之差值
   */
  diffData?: { [key: string]: number };

  /**
   * 運動類別 enum
   */
  readonly SportType = SportType;

  constructor(private userService: UserService) {}

  /**
   * 取得使用者使用公或英制
   */
  get userUnit() {
    return this.userService.getUser().unit as DataUnitType;
  }

  /**
   * 取得運動類別
   */
  get sportsType() {
    return +this.baseInfo?.type ?? SportType.all;
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
   * 取得重訓重量單位
   */
  get weightUnit() {
    return this.userUnit === DataUnitType.metric ? 'kg' : 'lb';
  }

  /**
   * 取得 weightSibsPipe 的設定
   */
  get weightPipeOption() {
    return { unitType: this.userUnit, showUnit: false };
  }

  ngOnChanges(e: SimpleChanges): void {
    const { baseInfo } = this;
    const { compareInfo } = e;
    if (baseInfo && compareInfo) this.diffData = this.getDiffData();
  }

  /**
   * 取得基準檔案與比較檔案間的差值
   */
  getDiffData() {
    const { baseInfo, compareInfo } = this;
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
    for (const _key in baseInfo) {
      if (!includeKey.has(_key)) continue;
      const _baseValue = +(baseInfo[_key] ?? 0);
      const _compareValue = +(compareInfo[_key] ?? 0);
      const _diffValue = mathRounding(_baseValue - _compareValue, 2);
      Object.assign(result, { [_key]: _diffValue });
    }

    return result;
  }

  /**
   * 取得目前運動檔案類別是否含在開放類別清單中
   * @param typeList 運動類別清單
   */
  includeSportsType(typeList: Array<SportType>) {
    return typeList.includes(this.sportsType);
  }

  /**
   * 依據公英制及距離長度是否過千，進行轉換取得相關顯示數據
   */
  getDistanceContext() {
    const baseDistance = this.baseInfo?.totalDistanceMeters ?? 0;
    const compareDistance = this.compareInfo?.totalDistanceMeters ?? 0;
    const diffDistance = this.diffData?.totalDistanceMeters ?? 0;
    const { userUnit } = this;
    const isOverThousand = (distance: number) => distance >= 1000;
    const showByThousand =
      isOverThousand(baseDistance) ||
      isOverThousand(compareDistance) ||
      isOverThousand(diffDistance);
    const { value: baseValue, unit } = transformDistance(baseDistance, userUnit, showByThousand);
    const { value: compareValue } = transformDistance(compareDistance, userUnit, showByThousand);
    const { value: diffValue } = transformDistance(diffDistance, userUnit, showByThousand);
    return {
      title: 'universal_activityData_distance',
      icon: 'icon-svg_web-icon_p2_018-distance',
      baseValue,
      compareValue,
      diffValue,
      isPositiveDiff: diffValue >= 0,
      dataUnit: unit,
    };
  }

  /**
   * 根據運動類別取得配速相關顯示數據
   * @param key 平均速度/最大速度的數據名稱
   */
  getPaceContext(key: string) {
    const { sportsType, userUnit, baseInfo, compareInfo } = this;
    const isAvgData = key !== 'maxSpeed';
    const baseSpeed = baseInfo[key] ?? 0;
    const compareSpeed = compareInfo[key] ?? 0;
    const basePaceSecond = speedToPaceSecond(baseSpeed, sportsType, userUnit);
    const comparePaceSecond = speedToPaceSecond(compareSpeed, sportsType, userUnit);
    const diffSecond = basePaceSecond - comparePaceSecond;

    return {
      title: this.getPaceTitle(isAvgData, sportsType),
      icon: 'icon-svg_web-icon_p1_025-speed',
      baseValue: paceSecondTimeFormat(basePaceSecond),
      compareValue: paceSecondTimeFormat(comparePaceSecond),
      diffValue: paceSecondTimeFormat(diffSecond),
      dataUnit: getPaceUnit(sportsType, userUnit),
      isPositiveDiff: diffSecond >= 0,
    };
  }

  /**
   * 根據取得速度相關顯示數據
   * @param key 平均速度/最大速度的數據名稱
   */
  getSpeedContext(key: string) {
    const { sportsType, userUnit, baseInfo, compareInfo, diffData } = this;
    const isAvgData = key !== 'maxSpeed';
    const isMetric = userUnit === DataUnitType.metric;
    const getSpeedByUnit = (speed: number, isMetric: boolean) => {
      return mathRounding(isMetric ? speed : speed / mi, 2);
    };

    const baseSpeed = baseInfo[key] ?? 0;
    const compareSpeed = compareInfo[key] ?? 0;
    const diffSpeed = diffData ? diffData[key] : 0;
    return {
      title: this.getPaceTitle(isAvgData, sportsType),
      icon: 'icon-svg_web-icon_p1_025-speed',
      baseValue: getSpeedByUnit(baseSpeed, isMetric),
      compareValue: getSpeedByUnit(compareSpeed, isMetric),
      diffValue: getSpeedByUnit(diffSpeed, isMetric),
      dataUnit: isMetric ? 'kph' : 'mph',
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
   * 取得百米平均划水次數相關顯示數據
   */
  getAvgStrokeContext() {
    const { baseInfo, compareInfo } = this;
    const baseStrokes = baseInfo.totalStrokes ?? 0;
    const compareStrokes = compareInfo.totalStrokes ?? 0;
    const baseDistance = baseInfo.totalDistanceMeters ?? 0;
    const compareDistance = compareInfo.totalDistanceMeters ?? 0;
    const countAvgStroke = (strokes: number, dist: number) => {
      const denominator = dist || Infinity;
      return mathRounding(strokes / (denominator / 100), 2);
    };

    const baseAvgStorkes = countAvgStroke(baseStrokes, baseDistance);
    const compareAvgStrokes = countAvgStroke(compareStrokes, compareDistance);
    const diffAvgStrokes = mathRounding(baseAvgStorkes - compareAvgStrokes, 2);
    return {
      title: '平均百米划水數',
      icon: 'icon-svg_web-icon_p2_062-open_water_swim',
      baseValue: baseAvgStorkes,
      compareValue: compareAvgStrokes,
      diffValue: diffAvgStrokes,
      isPositiveDiff: diffAvgStrokes >= 0,
      dataUnit: 'spm',
    };
  }
}
