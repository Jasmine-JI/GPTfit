import { mi, ft } from '../models/const/bs-constant.model';
import { mathRounding } from './index';
import { adept, metacarpus, novice } from '../models/const/weight-train.model';
import { HrBase, Proficiency } from '../../core/enums/sports';
import { BenefitTimeStartZone, DataUnitType } from '../enums/common';
import { paiCofficient, dayPaiTarget } from '../models/const/sports-report.model';
import { sportTypeColor, weightTrainColor } from '../models/represent-color';
import { MuscleCode, MuscleGroup, WeightTrainingLevel, SportType } from '../../core/enums/sports';
import { paceReg } from '../models/regex';

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
      result = Math.round((60 / valueConversion) * 60);
      break;
    }
    case SportType.swim: // 游泳配速
      result = Math.round(((60 / value) * 60) / 10);
      break;
    case SportType.row: // 划船配速
      result = Math.round(((60 / value) * 60) / 2);
      break;
    default:
      // 其他運動類別直接回傳速度
      return isMetric ? value : mathRounding(value / mi, 2);
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

  // 配速超過60顯示NA。
  if (costminperkm >= 60) return `NA`;

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
  const result = { value: <number | string>value, unit: getPaceUnit(sportType, unit) };

  // 其他運動類別則直接返回速度值
  if (!converseType.includes(sportType)) return result;

  // 速度為0則配速一律顯示NA
  if (value < 1) {
    result.value = 'NA';
    return result;
  }

  const paceSecond = speedToPaceSecond(value, sportType, unit);
  result.value = paceSecondTimeFormat(paceSecond);
  return result;
}

/**
 * 根據公英制將配速轉速度
 * @param pace 配速
 * @param sportType {SportType}-運動類別
 * @param unit {DataUnitType}-使用者所使用的單位
 */
export function paceToSpeed(pace: string, sportType: SportType, unit: DataUnitType) {
  if (!paceReg.test(pace)) return 0;
  const [min, secondText] = pace.split(`'`);
  const totalSecond = +min * 60 + +secondText.split(`"`)[0];
  const coefficient = {
    [SportType.run]: unit === DataUnitType.metric ? 1 : mi,
    [SportType.swim]: 0.1,
    [SportType.row]: 0.5,
  };

  return mathRounding((60 * 60 * coefficient[sportType]) / totalSecond, 1);
}

/**
 * 將配速轉配速秒
 * @param pace 配速
 */
export function paceToPaceSecond(pace: string) {
  if (!paceReg.test(pace)) return 0;
  const [min, secondText] = pace.split(`'`);
  const totalSecond = +min * 60 + +secondText.split(`"`)[0];
  return totalSecond;
}

/**
 * 根據運動類別與使用者使用單位取得配速單位
 * @param sportType {SportType}-運動類別
 * @param unit {DataUnitType}-使用者所使用的單位
 */
export function getPaceUnit(sportType: SportType, unit: DataUnitType) {
  const isMetric = unit === DataUnitType.metric;
  switch (sportType) {
    case SportType.run:
      return isMetric ? 'min/km' : 'min/mi';
    case SportType.swim:
      return 'min/100m';
    case SportType.row:
      return 'min/500m';
    default:
      return isMetric ? 'kph' : 'mph';
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
  const key = {
    [SportType.run]: 'universal_activityData_run',
    [SportType.cycle]: 'universal_activityData_cycle',
    [SportType.weightTrain]: 'universal_activityData_weightTraining',
    [SportType.swim]: 'universal_activityData_swin',
    [SportType.aerobic]: 'universal_activityData_aerobic',
    [SportType.row]: 'universal_sportsName_boating',
    [SportType.ball]: 'universal_activityData_ballSports',
    [SportType.all]: 'universal_adjective_all',
    [SportType.complex]: 'universal_activityData_complex',
    [SportType.translate]: 'universal_app_transfer',
    [SportType.rest]: 'universal_activityData_restSection',
  };
  const sportsCode = `${code}`.includes('s') ? +(code as string).split('s')[1] : +code;
  return key[sportsCode] ?? 'universal_userAccount_otherTypes';
}

/**
 * 將 cjson 運動類別代碼轉為運動類別名稱
 * @param code {string}-cjson運動類別代碼
 */
export function translateSportsCode(code: string) {
  const name = {
    [SportType.run]: 'run',
    [SportType.cycle]: 'cycle',
    [SportType.weightTrain]: 'weightTraining',
    [SportType.swim]: 'swim',
    [SportType.aerobic]: 'aerobic',
    [SportType.row]: 'row',
    [SportType.ball]: 'ball',
    [SportType.all]: 'all',
    [SportType.complex]: 'complex',
    [SportType.rest]: 'rest',
  };

  const sportsCode = +code.split('s')[1];
  return name[sportsCode] ?? 'other';
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
  const key = {
    [SportType.run]: 'universal_activityData_stepCadence',
    [SportType.cycle]: 'universal_activityData_CyclingCadence',
    [SportType.swim]: 'universal_activityData_swimCadence',
    [SportType.row]: 'universal_activityData_rowCadence',
  };

  return key[sportType] ?? 'universal_activityData_trend';
}

/**
 * 根據運動類別回應平均頻率之翻譯鍵名
 * @param sportType {SportType}-運動類別
 */
export function getAvgCadenceI18nKey(sportType: SportType) {
  const key = {
    [SportType.run]: 'universal_activityData_avgStepCadence',
    [SportType.cycle]: 'universal_activityData_avgCyclingCadence',
    [SportType.swim]: 'universal_activityData_avgSwimReps',
    [SportType.row]: 'universal_activityData_avgRowCadence',
  };

  return key[sportType] ?? 'universal_adjective_avg';
}

/**
 * 根據運動類別回應最大頻率之翻譯鍵名
 * @param sportType {SportType}-運動類別
 */
export function getMaxCadenceI18nKey(sportType: SportType) {
  const key = {
    [SportType.run]: 'universal_activityData_liveMaxStepCadence',
    [SportType.cycle]: 'universal_activityData_liveMaxCycleCadence',
    [SportType.swim]: 'universal_activityData_baetSwimReps',
    [SportType.row]: 'universal_activityData_baetRowReps',
  };

  return key[sportType] ?? 'universal_adjective_maxBest';
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
      return MuscleGroup.armMuscle;
  }
}

/**
 * 取得重訓程度提示百分比文字
 */
export function getWeightTrainingLevelText(
  weightTrainingStrengthLevel: WeightTrainingLevel = WeightTrainingLevel.metacarpus
) {
  const percentage = {
    [WeightTrainingLevel.adept]: adept,
    [WeightTrainingLevel.metacarpus]: metacarpus,
    [WeightTrainingLevel.novice]: novice,
  };

  return percentage[weightTrainingStrengthLevel] ?? percentage[WeightTrainingLevel.metacarpus];
}

/**
 * 取得各心率區間
 * @param userHRBase {HrBase}-使用者心率法, 0.最大心率法 1.儲備心率法
 * @param userAge {number}-使用者年齡
 * @param userMaxHR {number}-使用者最大心率
 * @param userRestHR {number}-使用者休息心率
 */
export function getUserHrRange(
  userHRBase = HrBase.max,
  userAge = 30,
  userMaxHR = 190,
  userRestHR = 60
) {
  if (userHRBase === HrBase.max) {
    const maxHrByAge = 220 - userAge;
    const getZoneValue = (coefficient: number) => Math.floor(maxHrByAge * coefficient);
    return {
      hrBase: userHRBase,
      z0: getZoneValue(0.5) - 1,
      z1: getZoneValue(0.6) - 1,
      z2: getZoneValue(0.7) - 1,
      z3: getZoneValue(0.8) - 1,
      z4: getZoneValue(0.9) - 1,
      z5: getZoneValue(1),
    };
  }

  const effectRange = userMaxHR - userRestHR;
  const getZoneValue = (coefficient: number) => Math.floor(effectRange * coefficient) + userRestHR;
  return {
    hrBase: userHRBase,
    z0: getZoneValue(0.55),
    z1: getZoneValue(0.6),
    z2: getZoneValue(0.65),
    z3: getZoneValue(0.75),
    z4: getZoneValue(0.85),
    z5: getZoneValue(1),
  };
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
  const key = {
    [SportType.run]: 'run',
    [SportType.cycle]: 'cycle',
    [SportType.weightTrain]: 'weightTraining',
    [SportType.swim]: 'swim',
    [SportType.aerobic]: 'aerobic',
    [SportType.row]: 'rowing',
    [SportType.ball]: 'ball',
    [SportType.complex]: 'combined',
    [SportType.rest]: 'rest',
    [SportType.translate]: 'transition',
  };

  const typeString = key[+type] ?? key[SportType.aerobic];
  return `/app/public_html/img/${typeString}_${subtype}.jpg`;
}

/**
 * 根據心率區間計算PAI，PAI公式=((加權後運動秒數 / 週數) / 週目標時間)*100
 * @param hrZone {Array<number>}-心率區間
 * @param weekNum {number}-選擇期間的週數
 * @returns pai {number}
 */
export function countPai(hrZone: Array<number>, weekNum: number) {
  const { z0, z1, z2, z3, z4, z5 } = paiCofficient;
  const [zone0, zone1, zone2, zone3, zone4, zone5] = hrZone.map((_zone) => _zone ?? 0);
  const weightedValue = z0 * zone0 + z1 * zone1 + z2 * zone2 + z3 * zone3 + z4 * zone4 + z5 * zone5;
  return parseFloat((((weightedValue / (dayPaiTarget * 7)) * 100) / weekNum).toFixed(1));
}

/**
 * 取得重訓程度顏色係數
 * @param level 重訓程度
 */
export function getWeightProficiency(level: WeightTrainingLevel) {
  const proficiency = {
    [WeightTrainingLevel.novice]: Proficiency.novice,
    [WeightTrainingLevel.metacarpus]: Proficiency.metacarpus,
    [WeightTrainingLevel.adept]: Proficiency.adept,
  };

  return proficiency[level] ?? proficiency[WeightTrainingLevel.metacarpus];
}

/**
 * 根據使用者設定訓練程度與重訓重量取得呈現顏色
 * @param weight 重量
 */
export function getWeightTrainingColor(
  weight: number,
  args?: {
    bodyWeight?: number;
    proficiency?: number;
    coverTransparency?: number;
    isAvgWeight?: boolean;
  }
) {
  const { saturation, brightnessFor1RM, brightnessForAvgWeight, transparency } = weightTrainColor;
  const bodyWeight = args?.bodyWeight ?? 60;
  const proficiency = args?.proficiency ?? Proficiency.metacarpus;
  const opacity = args?.coverTransparency ?? transparency;
  const brightness = args?.isAvgWeight ?? false ? brightnessFor1RM : brightnessForAvgWeight;

  let hue = Math.round(200 - (weight / bodyWeight) * 100 * proficiency);
  if (hue < 0) hue = 0;
  if (hue > 200) hue = 200;

  return `hsla(${hue}, ${saturation}, ${brightness}, ${opacity})`;
}
