import { ReportCondition, ReportDateType } from '../models/report-condition';
import { TargetConditionMap } from '../../core/models/api/api-common/sport-target.model';
import { BenefitTimeStartZone } from '../../core/enums/common';

/**
 * 各運動類別共通所需數據
 */
export const COMMON_DATA = [
  'avgHeartRateBpm',
  'avgMaxHeartRateBpm',
  'calories',
  'totalActivities',
  'totalHrZone0Second',
  'totalHrZone1Second',
  'totalHrZone2Second',
  'totalHrZone3Second',
  'totalHrZone4Second',
  'totalHrZone5Second',
  'totalSecond',
];

/**
 * 跑步類別所需數據
 */
export const RUN_DATA = [
  'avgMaxSpeed',
  'avgRunMaxCadence',
  'avgSpeed',
  'elevGain',
  'runAvgCadence',
  'totalDistanceMeters',
];

/**
 * 騎乘類別所需數據
 */
export const RIDE_DATA = [
  'avgCycleMaxCadence',
  'avgCycleMaxWatt',
  'avgMaxSpeed',
  'avgSpeed',
  'cycleAvgCadence',
  'cycleAvgWatt',
  'totalDistanceMeters',
  'totalFtpZone0Second',
  'totalFtpZone1Second',
  'totalFtpZone2Second',
  'totalFtpZone3Second',
  'totalFtpZone4Second',
  'totalFtpZone5Second',
  'totalFtpZone6Second',
];

/**
 * 重訓類別所需數據
 */
export const WEIGHT_TRAIN_DATA = ['totalReps', 'totalWeightKg', 'totalActivitySecond'];

/**
 * 游泳類別所需數據
 */
export const SWIM_DATA = [
  'avgMaxSpeed',
  'avgSpeed',
  'avgSwimMaxCadence',
  'avgSwolf',
  'bestSwolf',
  'swimAvgCadence',
  'totalDistanceMeters',
];

/**
 * 有氧類別所需數據(目前有氧所需數據同共通類別)
 export const aerobicData = [
];
 */

/**
 * 划船類別所需數據
 */
export const ROW_DATA = [
  'avgMaxSpeed',
  'avgRowingMaxCadence',
  'avgSpeed',
  'rowingAvgCadence',
  'rowingAvgWatt',
  'rowingMaxWatt',
  'totalDistanceMeters',
];

/**
 * 球類類別所需數據
 */
export const BALL_DATA = [
  'avgMaxSpeed',
  'avgSpeed',
  'totalDistanceMeters',
  'totalMinusGforceX',
  'totalMinusGforceY',
  'totalMinusGforceZ',
  'totalPlusGforceX',
  'totalPlusGforceY',
  'totalPlusGforceZ',
  'maxGforceX',
  'maxGforceY',
  'maxGforceZ',
  'miniGforceX',
  'miniGforceY',
  'miniGforceZ',
];

// 個人球類運動所需額外數據
export const PERSON_BALL_DATA = BALL_DATA.concat([
  'totalSwingCount',
  'totalForehandSwingCount',
  'totalBackhandSwingCount',
  'avgSwingSpeed',
  'maxSwingSpeed',
]);

/**
 * PAI加權係數(pai = 該心率區間心率總秒數 * 該區間pai係數)
 */
export const PAI_COFFICIENT = {
  z0: 0,
  z1: 0.5,
  z2: 1,
  z3: 2,
  z4: 2.2,
  z5: 2.4,
};

/**
 * 一天pai指標秒數（即經加權後運動時間等於該指標秒數，則pai為100）
 */
export const DAY_PAI_TARGET = 1285;

/**
 * 區間趨勢（上升/下降）
 */
export type Regression = 'up' | 'down';

/**
 * 建立運動報告數據的參數界面
 */
export interface SportsParameter {
  openPrivacy: boolean;
  targetCondition?: TargetConditionMap;
  condition?: ReportCondition;
  data?: Array<any>;
  timeType?: ReportDateType;
  benefitTimeStartZone?: BenefitTimeStartZone;
}
