import { mathRounding } from '../../utils/index';
import {
  COMMON_DATA,
  RUN_DATA,
  RIDE_DATA,
  WEIGHT_TRAIN_DATA,
  SWIM_DATA,
  ROW_DATA,
  BALL_DATA,
  PERSON_BALL_DATA,
  PAI_COFFICIENT,
  DAY_PAI_TARGET
} from '../../models/sports-report';
import { SportType } from '../../enum/sports';
import { SportsParameter } from '../../models/sports-report';
import { DAY } from '../../models/utils-constant';
import { PreferSportType } from '../prefer-sport-type';
import { WeightTrainStatistics } from '../weight-train-statistics';
import dayjs from 'dayjs';
import quarterOfYear from 'dayjs/plugin/quarterOfYear';
import { isAvgData } from '../../utils/sports';


dayjs.extend(quarterOfYear);

/**
 * 處理 api 2104 response
 */
export class SportsReport {

  private _infoData: any;

  /**
   * 建立報告所需之內容
   * @param parameter {SportsParameter}-統計運動數據所需參數與數據
   */
  constructor(parameter: SportsParameter) {
    this.statisticalData(parameter);
  }

  /**
   * 建立報告所需之內容
   * @param parameter {SportsParameter}-統計運動數據所需參數與數據
   */
  statisticalData(parameter: SportsParameter) {
    const { openPrivacy, target, condition, data, timeType } = parameter;
    // 將統計數據另存至物件中
    let dataObj = { openPrivacy } as any;
    const avgDataIntermediary = {};
    const maxDataIntermediary = {};
    if (openPrivacy) {
      const { sportType } = condition!;
      const dataKey = this.getDataKey(sportType!);
      const preferSports = new PreferSportType();
      const preferWeightTrainGroup = new WeightTrainStatistics();

      data!.forEach(_data => {
        const { activities: _activities } = _data;
        _activities.forEach(_activity => {
          const  _sportType = +_activity.type as SportType;
          if (sportType === SportType.all || _sportType === sportType) {
            // 計算偏好運動類別
            const _totalActivities = _activity['totalActivities'];
            preferSports.countType(_sportType, _totalActivities);

            // 計算偏好重訓肌群與各肌群訓練數據
            if (sportType === SportType.weightTrain) {
              const { weightTrainingInfo: _weightTrainingInfo } = _activity;
              _weightTrainingInfo.forEach(_info => {
                preferWeightTrainGroup.countMuscleGroup(_info.muscle, _totalActivities);
                preferWeightTrainGroup.countMuscleGroupData(_info);
              });
              
            }

            // 根據運動類別將所需數據進行加總
            dataKey!.forEach(_key => {
              const isMaxData = _key.toLowerCase().includes('max');
              const _value = +_activity[_key];
              if (isMaxData) {
                // 若為最大相關數據，則只取該時間範圍最大值
                if ((maxDataIntermediary[_key] ?? 0) < _value) maxDataIntermediary[_key] = _value;
              } else if (isAvgData(_key)) {
                // 平均數據需再乘該期間筆數，之後再除有效總筆數
                const dataIntermediary = avgDataIntermediary[_key];
                const currentWeightedValue = _value * _totalActivities;
                let [ effectTotal, effectActivities ] = dataIntermediary ?? [0, 0];
                effectTotal += currentWeightedValue;
                effectActivities += _value ? _totalActivities : 0;
                avgDataIntermediary[_key] = [ effectTotal, effectActivities ];
              } else {
                dataObj[_key] = (dataObj[_key] ?? 0) + _value;
              }

            });

          }

        });

      });

      // 最後處理其他數據
      if (Object.keys(dataObj).length > 0) {
        dataObj = {
          ...dataObj,
          ...maxDataIntermediary,
          ...this.getAvgData(avgDataIntermediary),
          ...this.postProcessingData({ target, condition, dataObj, timeType }),
          preferSports: preferSports.preferSport
        };

        if (sportType === SportType.weightTrain) {
          const { preferMuscleGroup, muscleGroupData, muscleGroupTotalReps } = preferWeightTrainGroup;
          dataObj = { ...dataObj, preferMuscleGroup, muscleGroupData, muscleGroupTotalReps };
        }

      }

    }

    this._infoData = dataObj;
  }

  /**
   * 取得概要運動數據
   */
  get infoData() {
    return this._infoData;
  }

  /**
   * 取得該運動類別需統計的數據鍵名
   * @param sportType {SportType}-運動類別
   */
  getDataKey(type: SportType) {
    switch (type) {
      case SportType.all:
      case SportType.aerobic:
        return COMMON_DATA;
      case SportType.run:
        return COMMON_DATA.concat(RUN_DATA);
      case SportType.cycle:
        return COMMON_DATA.concat(RIDE_DATA);
      case SportType.weightTrain:
        return COMMON_DATA.concat(WEIGHT_TRAIN_DATA);
      case SportType.swim:
        return COMMON_DATA.concat(SWIM_DATA);
      case SportType.row:
        return COMMON_DATA.concat(ROW_DATA);
      case SportType.ball:
        return COMMON_DATA.concat(PERSON_BALL_DATA);
    }

  }

  /**
   * 處理已加總的平均數據以取得此報告期間之各項平均數據
   * @param intermediary {any}-各項加總之數據
   */
  getAvgData(intermediary: any) {
    let result = {};
    for (const _key in intermediary) {
      const [ effectTotal, effectActivities ] = intermediary[_key];
      result = {
        ...result,
        [_key]: mathRounding(effectTotal / (effectActivities ? effectActivities : Infinity), 3)
      };
    }

    return result;
  }

  /**
   * 將統計完成的數據再進行後續處理（PAI/效益時間/目標達成與否）
   * @param parameter {any}-統計運動數據所需參數與數據
   */
  postProcessingData(parameter: any) {
    const {
      target,
      condition,
      dataObj,
      timeType
    } = parameter;
    const { dateUnit, baseTime, compareTime } = condition;
    const {
      totalActivities,
      totalHrZone0Second: zone0,
      totalHrZone1Second: zone1,
      totalHrZone2Second: zone2,
      totalHrZone3Second: zone3,
      totalHrZone4Second: zone4,
      totalHrZone5Second: zone5,
      totalSecond
    } = dataObj;

    const { realStartTime, realEndTime } = 
      timeType === 'base' ? baseTime.getReportRealTimeRange(dateUnit.unit) : compareTime.getReportRealTimeRange(dateUnit.unit);
    const reportPeriodDay = Math.round((realEndTime - realStartTime) / DAY);
    const hrZone = [zone0, zone1, zone2, zone3, zone4, zone5];
    const { pai, totalWeightedValue } = SportsReport.countPai(hrZone, reportPeriodDay);
    const benefitTime = (zone2 ?? 0) + (zone3 ?? 0) + (zone4 ?? 0) + (zone5 ?? 0);
    const unitKey = dateUnit.getUnitString();
    const crossRange = baseTime.getCrossRange(unitKey);
    const transfromCondition = target.getTransformCondition(dateUnit.unit);
    let targetAchieved = totalActivities ? true : false;

    transfromCondition.forEach(_condition => {
      const { filedName, filedValue } = _condition;
      const targetValue = crossRange * +filedValue;
      switch (filedName) {
        case 'pai':
          if (totalWeightedValue < targetValue) targetAchieved = false;
          break;
        case 'benefitTime':
          if (benefitTime < targetValue) targetAchieved = false;
          break;
        case 'totalTime':
          if (totalSecond < targetValue) targetAchieved = false;
          break;
        default:
          if (dataObj[filedName] < targetValue) targetAchieved = false;
          break;
      }

    });

    const result = {
      benefitTime,
      pai,
      targetAchieved
    };

    return result;
  }

  /**
   * 計算pai
   * @param hrZone {Array<number>}-心率區間
   * @param periodDay {number}-報告橫跨天數
   */
  static countPai(hrZone: Array<number>, periodDay: number) {
    const { z0, z1, z2, z3, z4, z5 } = PAI_COFFICIENT;
    const [
      totalHrZone0Second,
      totalHrZone1Second,
      totalHrZone2Second,
      totalHrZone3Second,
      totalHrZone4Second,
      totalHrZone5Second
    ] = hrZone;
    const totalWeightedValue = ((
        (totalHrZone0Second ?? 0) * z0
      + (totalHrZone1Second ?? 0) * z1
      + (totalHrZone2Second ?? 0) * z2
      + (totalHrZone3Second ?? 0) * z3
      + (totalHrZone4Second ?? 0) * z4
      + (totalHrZone5Second ?? 0) * z5
    ) / DAY_PAI_TARGET) * 100;

    const pai = mathRounding(totalWeightedValue / periodDay, 1);
    return { totalWeightedValue, pai };
  }

}

/**
 * 群組運動報告（處理多人的 api 2104 response）
 */
export class GroupSportsReport extends SportsReport {

  constructor(parameter: SportsParameter) {
    super(parameter);
  }

  /**
   * 取得該運動類別需統計的數據鍵名
   * @param sportType {SportType}
   * @author kidin-1110321
   */
  getDataKey(type: SportType) {
    switch (type) {
      case SportType.all:
      case SportType.aerobic:
        return COMMON_DATA;
      case SportType.run:
        return COMMON_DATA.concat(RUN_DATA);
      case SportType.cycle:
        return COMMON_DATA.concat(RIDE_DATA);
      case SportType.weightTrain:
        return COMMON_DATA.concat(WEIGHT_TRAIN_DATA);
      case SportType.swim:
        return COMMON_DATA.concat(SWIM_DATA);
      case SportType.row:
        return COMMON_DATA.concat(ROW_DATA);
      case SportType.ball:
        return COMMON_DATA.concat(BALL_DATA);
    }

  }

}