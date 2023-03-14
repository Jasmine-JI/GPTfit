import { SportType } from '../../shared/enum/sports';
import { mi, ft } from '../../shared/models/bs-constant';
import { mathRounding } from './index';
import { MuscleCode, MuscleGroup, WeightTrainingLevel } from '../../shared/enum/weight-train';
import { asept, metacarpus, novice } from '../../shared/models/weight-train';
import { HrBase } from '../../shared/enum/personal';
import { HrZoneRange } from '../../shared/models/chart-data';
import { BenefitTimeStartZone, DataUnitType } from '../enums/common';
import { PAI_COFFICIENT, DAY_PAI_TARGET } from '../../shared/models/sports-report';
import { sportTypeColor } from '../../shared/models/chart-data';

/**
 * 根據運動類型將速度轉成配速(若為bs英制則公里配速轉英哩配速)
 * @param value {number}-速度
 * @param sportType {SportType}-運動類別
 * @param unit {DataUnitType}-使用者所使用的單位
 */
export function speedToPaceSecond(value: number, sportType: SportType, unit: DataUnitType) {
  const isMetric = unit === DataUnitType.metric;
  const isMinus = value < 0;
  let result = 0;
  switch (sportType) {
    case SportType.run: {
      // 跑步配速
      const valueConversion = isMetric ? value : value / mi;
      result = (60 / valueConversion) * 60;
      break;
    }
    case SportType.swim: // 游泳配速
      result = ((60 / value) * 60) / 10;
      break;
    case SportType.row: // 划船配速
      result = ((60 / value) * 60) / 2;
      break;
  }

  return Math.abs(result) > 3600 ? (isMinus ? -3600 : 3600) : result;
}

/**
 * 將配速秒轉為 hh'mm"
 * @param second {number}-配速（秒）
 */
export function paceSecondTimeFormat(second: number) {
  const valuePrefix = second < 0 ? '-' : '';
  const absoluteSecond = Math.abs(second);
  const costminperkm = Math.floor(absoluteSecond / 60);
  const costsecondperkm = Math.round(absoluteSecond - costminperkm * 60);

  // 配速超過60一律以60計。
  if (costminperkm > 60) return `${valuePrefix}60'00"`;

  let timeMin = `${costminperkm}`.padStart(2, '0');
  let timeSecond = `${costsecondperkm}`.padStart(2, '0');
  // 因應四捨五入
  if (timeSecond === '60') {
    timeSecond = '00';
    timeMin = +timeMin === 60 ? '60' : `${+timeMin + 1}`;
  }

  return `${valuePrefix}${timeMin}'${timeSecond}"`;
}

/**
 * 根據運動類型將速度轉成配速(若為bs英制則公里配速轉英哩配速)
 * @param data {number | string}-速度
 * @param sportType {SportType}-運動類別
 * @param unit {DataUnitType}-使用者所使用的單位
 */
export function speedToPace(data: number | string, sportType: SportType, unit: DataUnitType) {
  const value = +data;
  const converseType = [SportType.run, SportType.swim, SportType.row];
  let result = { value: <number | string>value, unit: '' };

  // 其他運動類別則直接返回速度值
  if (!converseType.includes(sportType)) return result;
  result = { value: `60'00"`, unit: getPaceUnit(sportType, unit) };

  // 速度為0則配速一律顯示60'00"
  if (value === 0) return result;

  const paceSecond = speedToPaceSecond(value, sportType, unit);
  result.value = paceSecondTimeFormat(paceSecond);
  return result;
}

/**
 * 根據運動類別與使用者使用單位取得配速單位
 * @param sportType {SportType}-運動類別
 * @param unit {DataUnitType}-使用者所使用的單位
 */
export function getPaceUnit(sportType: SportType, unit: DataUnitType) {
  switch (sportType) {
    case SportType.run:
      return unit === DataUnitType.metric ? 'min/km' : 'min/mi';
    case SportType.swim:
      return 'min/100m';
    case SportType.row:
      return 'min/500m';
    default:
      return '';
  }
}

/**
 * 根據鍵名判斷該數據是否為平均數據
 * @param key {string}-運動數據之鍵名
 */
export function isAvgData(key: string) {
  const lowerCaseString = key.toLowerCase();
  const isMaxData = lowerCaseString.includes('max');
  const isMinData = lowerCaseString.includes('mini');
  const haveKeyword = lowerCaseString.includes('avg') || lowerCaseString.includes('average');
  return !isMaxData && !isMinData && haveKeyword;
}

/**
 * 根據運動類別取得翻譯的鍵名
 * @param code {number | string}-運動類別代號
 */
export function getSportsTypeKey(code: number | string) {
  if (code === '') return '';
  const sportsCode = `${code}`.includes('s') ? +(code as string).split('s')[1] : +code;
  switch (sportsCode) {
    case SportType.run:
      return 'universal_activityData_run';
    case SportType.cycle:
      return 'universal_activityData_cycle';
    case SportType.weightTrain:
      return 'universal_activityData_weightTraining';
    case SportType.swim:
      return 'universal_activityData_swin';
    case SportType.aerobic:
      return 'universal_activityData_aerobic';
    case SportType.row:
      return 'universal_sportsName_boating';
    case SportType.ball:
      return 'universal_activityData_ballSports';
    case SportType.all:
      return 'universal_adjective_all';
    case SportType.complex:
      return 'universal_activityData_complex';
    case SportType.rest:
      return 'universal_activityData_restSection';
    default:
      return 'universal_userAccount_otherTypes';
  }
}

/**
 * 將 cjson 運動類別代碼轉為運動類別名稱
 * @param code {string}-cjson運動類別代碼
 */
export function translateSportsCode(code: string) {
  const sportsCode = +code.split('s')[1];
  switch (sportsCode) {
    case SportType.run:
      return 'run';
    case SportType.cycle:
      return 'cycle';
    case SportType.weightTrain:
      return 'weightTraining';
    case SportType.swim:
      return 'swim';
    case SportType.aerobic:
      return 'aerobic';
    case SportType.row:
      return 'row';
    case SportType.ball:
      return 'ball';
    case SportType.all:
      return 'all';
    case SportType.complex:
      return 'complex';
    case SportType.rest:
      return 'rest';
    default:
      return 'other';
  }
}

/**
 * 根據運動類別指派代表色
 * @param code {number | string}-運動類別代號
 */
export function assignSportsTypeColor(code: number | string) {
  const sportsCode = `${code}`.includes('s') ? +(code as string).split('s')[1] : +code;
  const colorLength = sportTypeColor.length;
  if (sportsCode > sportTypeColor.length) return sportTypeColor[colorLength - 1];
  return sportTypeColor[sportsCode - 1];
}

/**
 * 根據運動類別回應頻率之翻譯鍵名
 * @param sportType {SportType}-運動類別
 */
export function getCadenceI18nKey(sportType: SportType) {
  switch (sportType) {
    case SportType.run:
      return 'universal_activityData_stepCadence';
    case SportType.cycle:
      return 'universal_activityData_CyclingCadence';
    case SportType.swim:
      return 'universal_activityData_swimCadence';
    case SportType.row:
      return 'universal_activityData_rowCadence';
    default:
      return 'universal_activityData_trend';
  }
}

/**
 * 根據運動類別回應平均頻率之翻譯鍵名
 * @param sportType {SportType}-運動類別
 */
export function getAvgCadenceI18nKey(sportType: SportType) {
  switch (sportType) {
    case SportType.run:
      return 'universal_activityData_avgStepCadence';
    case SportType.cycle:
      return 'universal_activityData_avgCyclingCadence';
    case SportType.swim:
      return 'universal_activityData_avgSwimReps';
    case SportType.row:
      return 'universal_activityData_avgRowCadence';
    default:
      return 'universal_adjective_avg';
  }
}

/**
 * 根據運動類別回應最大頻率之翻譯鍵名
 * @param sportType {SportType}-運動類別
 */
export function getMaxCadenceI18nKey(sportType: SportType) {
  switch (sportType) {
    case SportType.run:
      return 'universal_activityData_liveMaxStepCadence';
    case SportType.cycle:
      return 'universal_activityData_liveMaxCycleCadence';
    case SportType.swim:
      return 'universal_activityData_baetSwimReps';
    case SportType.row:
      return 'universal_activityData_baetRowReps';
    default:
      return 'universal_adjective_maxBest';
  }
}

/**
 * 將距離根據使用者使用單位進行轉換
 * @param distance {number}-距離
 * @param unit {DataUnitType}-使用者使用單位（公制/英制）
 */
export function transformDistance(distance: number, unit: DataUnitType, convertKiloAlways = false) {
  const checkDistance = +(distance ?? 0);
  const transfrom = {
    value: null,
    unit: null,
    update(val: number, dataUnit: string) {
      (this.value = mathRounding(val, 2)), (this.unit = dataUnit);
    },
    get result() {
      const { value, unit } = this;
      return { value, unit };
    },
  };

  if (unit === DataUnitType.metric) {
    Math.abs(distance) >= 1000 || convertKiloAlways
      ? transfrom.update(checkDistance / 1000, 'km')
      : transfrom.update(checkDistance, 'm');
  } else {
    const bsValue = checkDistance / ft;
    Math.abs(bsValue) >= 1000 || convertKiloAlways
      ? transfrom.update(checkDistance / mi / 1000, 'mi')
      : transfrom.update(bsValue, 'ft');
  }

  return transfrom.result;
}

/**
 * 取得該肌肉部位所屬肌群代碼
 * @param muscleCode {MuscleCode}-肌肉部位代碼
 */
export function getCorrespondingMuscleGroup(muscleCode: MuscleCode) {
  switch (+muscleCode) {
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
    default:
      return;
  }
}

/**
 * 取得重訓程度提示百分比文字
 */
export function getWeightTrainingLevelText(
  weightTrainingStrengthLevel: WeightTrainingLevel = WeightTrainingLevel.metacarpus
) {
  switch (weightTrainingStrengthLevel) {
    case WeightTrainingLevel.asept:
      return asept;
    case WeightTrainingLevel.metacarpus:
      return metacarpus;
    case WeightTrainingLevel.novice:
      return novice;
  }
}

/**
 * 取得各心率區間
 * @param userHRBase {HrBase}-使用者心率法, 0.最大心率法 1.儲備心率法
 * @param userAge {number}-使用者年齡
 * @param userMaxHR {number}-使用者最大心率
 * @param userRestHR {number}-使用者休息心率
 */
export function getUserHrRange(
  userHRBase: HrBase,
  userAge: number,
  userMaxHR: number,
  userRestHR: number
) {
  const userHrInfo = <HrZoneRange>{
    hrBase: userHRBase,
    z0: 0,
    z1: 0,
    z2: 0,
    z3: 0,
    z4: 0,
    z5: 0,
  };

  if (userAge !== null) {
    if (userMaxHR && userRestHR) {
      if (userHRBase === HrBase.max) {
        // 區間數值採無條件捨去法
        userHrInfo['z0'] = Math.floor((220 - userAge) * 0.5 - 1);
        userHrInfo['z1'] = Math.floor((220 - userAge) * 0.6 - 1);
        userHrInfo['z2'] = Math.floor((220 - userAge) * 0.7 - 1);
        userHrInfo['z3'] = Math.floor((220 - userAge) * 0.8 - 1);
        userHrInfo['z4'] = Math.floor((220 - userAge) * 0.9 - 1);
        userHrInfo['z5'] = Math.floor((220 - userAge) * 1);
      } else {
        userHrInfo['z0'] = Math.floor((userMaxHR - userRestHR) * 0.55) + userRestHR;
        userHrInfo['z1'] = Math.floor((userMaxHR - userRestHR) * 0.6) + userRestHR;
        userHrInfo['z2'] = Math.floor((userMaxHR - userRestHR) * 0.65) + userRestHR;
        userHrInfo['z3'] = Math.floor((userMaxHR - userRestHR) * 0.75) + userRestHR;
        userHrInfo['z4'] = Math.floor((userMaxHR - userRestHR) * 0.85) + userRestHR;
        userHrInfo['z5'] = Math.floor((userMaxHR - userRestHR) * 1) + userRestHR;
      }
    } else {
      if (userHRBase === HrBase.max) {
        // 區間數值採無條件捨去法
        userHrInfo['z0'] = Math.floor((220 - userAge) * 0.5 - 1);
        userHrInfo['z1'] = Math.floor((220 - userAge) * 0.6 - 1);
        userHrInfo['z2'] = Math.floor((220 - userAge) * 0.7 - 1);
        userHrInfo['z3'] = Math.floor((220 - userAge) * 0.8 - 1);
        userHrInfo['z4'] = Math.floor((220 - userAge) * 0.9 - 1);
        userHrInfo['z5'] = Math.floor((220 - userAge) * 1);
      } else {
        userHrInfo['z0'] = Math.floor((220 - userAge - userRestHR) * 0.55) + userRestHR;
        userHrInfo['z1'] = Math.floor((220 - userAge - userRestHR) * 0.6) + userRestHR;
        userHrInfo['z2'] = Math.floor((220 - userAge - userRestHR) * 0.65) + userRestHR;
        userHrInfo['z3'] = Math.floor((220 - userAge - userRestHR) * 0.75) + userRestHR;
        userHrInfo['z4'] = Math.floor((220 - userAge - userRestHR) * 0.85) + userRestHR;
        userHrInfo['z5'] = Math.floor((220 - userAge - userRestHR) * 1) + userRestHR;
      }
    }
  } else {
    userHrInfo['z0'] = 'Z0';
    userHrInfo['z1'] = 'Z1';
    userHrInfo['z2'] = 'Z2';
    userHrInfo['z3'] = 'Z3';
    userHrInfo['z4'] = 'Z4';
    userHrInfo['z5'] = 'Z5';
  }

  return userHrInfo;
}

/**
 * 取得功能性閾值功率區間
 * @param ftp {number}-功能性閾值功率
 */
export function getUserFtpZone(ftp: number) {
  const ref = ftp ? ftp : 100;
  const userFtpZone = {
    z0: mathRounding(ref * 0.55, 0),
    z1: mathRounding(ref * 0.75, 0),
    z2: mathRounding(ref * 0.9, 0),
    z3: mathRounding(ref * 1.05, 0),
    z4: mathRounding(ref * 1.2, 0),
    z5: mathRounding(ref * 1.5, 0),
    z6: '', // 最上層不顯示數值
  };

  return userFtpZone;
}

/**
 * 依使用者設定之有效心率區間計算效益時間
 * @param hrZoneTime {hrZoneTime: Array<number>}-心率區間
 * @param startZone {BenefitTimeStartZone}-開始統計的區間
 */
export function countBenefitTime(hrZoneTime: Array<number>, startZone: BenefitTimeStartZone) {
  return hrZoneTime.reduce((_previousValue, _currentValue, _index) => {
    if (_currentValue && _index >= startZone) return _previousValue + _currentValue;
    return _previousValue;
  }, 0);
}

/**
 * 根據運動類別顯示佈景圖
 * @param type {number}-運動類別
 */
export function handleSceneryImg(type: number, subtype = 0) {
  let sportType: string;
  switch (type) {
    case SportType.run:
      sportType = 'run';
      break;
    case SportType.cycle:
      sportType = 'cycle';
      break;
    case SportType.weightTrain:
      sportType = 'weightTraining';
      break;
    case SportType.swim:
      sportType = 'swim';
      break;
    case SportType.aerobic:
      sportType = 'aerobic';
      break;
    case SportType.row:
      sportType = 'rowing';
      break;
    case SportType.ball:
      sportType = 'ball';
      break;
    case SportType.complex:
      sportType = 'combined';
      break;
    case SportType.rest:
      sportType = 'rest';
      break;
  }

  return `/app/public_html/img/${sportType}_${subtype}.jpg`;
}

/**
 * 根據心率區間計算PAI，PAI公式=((加權後運動秒數 / 週數) / 週目標時間)*100
 * @param hrZone {Array<number>}-心率區間
 * @param weekNum {number}-選擇期間的週數
 * @returns pai {number}
 */
export function countPai(hrZone: Array<number>, weekNum: number) {
  const { z0, z1, z2, z3, z4, z5 } = PAI_COFFICIENT;
  const [zone0, zone1, zone2, zone3, zone4, zone5] = hrZone.map((_zone) => _zone ?? 0);
  const weightedValue = z0 * zone0 + z1 * zone1 + z2 * zone2 + z3 * zone3 + z4 * zone4 + z5 * zone5;
  return parseFloat((((weightedValue / (DAY_PAI_TARGET * 7)) * 100) / weekNum).toFixed(1));
}
