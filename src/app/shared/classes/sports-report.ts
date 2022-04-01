
import { TargetField, GroupSportTarget, TargetCondition } from '../models/sport-target';
import { DateUnit } from '../enum/report';
import { mathRounding, deepCopy } from '../utils/index';
import { SportsTarget } from '../classes/sports-target';
import { ReportCondition } from '../models/report-condition';
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
} from '../models/sports-report';
import { SportType } from '../enum/sports';
import { SportsParameter } from '../models/sports-report';
import { DAY } from '../models/utils-constant';
import { MuscleCode, MuscleGroup } from '../enum/weight-train';
import { PreferSportType } from './prefer-sport-type';
import { WeightTrainStatistics } from './weight-train-statistics';
import { AllGroupMember } from './all-group-member';
import { GroupInfo } from './group-info';

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
    if (openPrivacy) {
console.log('create', target, data);
      const { sportType } = condition;
      const dataKey = this.getDataKey(sportType);

      let preferSports = new PreferSportType();
      let preferWeightTrainGroup = new WeightTrainStatistics();
      data.forEach(_data => {
        const { startTime: _startTime, endTime: _endTime, activities: _activities } = _data;
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
            dataKey.forEach(_key => {
              const _value = +_activity[_key];

              // 平均數據需再乘該期間筆數，之後再除有效總筆數
              if (_key.toLowerCase().includes('avg')) {
                const effectCountKey = `${_key}_Activities`;
                dataObj[_key] = (dataObj[_key] ?? 0) + _value * _totalActivities;
                // 有值且大於0才視為有效值
                dataObj[effectCountKey] = (dataObj[effectCountKey] ?? 0) + (_value ? _totalActivities : 0);
              } else {
                dataObj[_key] = (dataObj[_key] ?? 0) + _value;
              }

            });

          }

        });

      });

      if (Object.keys(dataObj).length > 0) {
        dataObj = {
          ...dataObj,
          ...this.postProcessingData({ target, condition, dataObj, timeType }),
          preferType: preferSports.preferSport
        };

        if (sportType === SportType.weightTrain) {
          const { preferMuscleGroup, muscleGroupData } = preferWeightTrainGroup;
          dataObj = { ...dataObj, preferMuscleGroup, muscleGroupData };
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
      totalHrZone5Second: zone5
    } = dataObj;
    const { realStartTime, realEndTime } = 
      timeType === 'base' ? baseTime.getReportRealTimeRange(dateUnit) : compareTime.getReportRealTimeRange(dateUnit);
    const reportPeriodDay = Math.round((realEndTime - realStartTime) / DAY);
    const hrZone = [zone0, zone1, zone2, zone3, zone4, zone5];
    const { pai, totalWeightedValue } = SportsReport.countPai(hrZone, reportPeriodDay);
    const benefitTime = (zone2 ?? 0) + (zone3 ?? 0) + (zone4 ?? 0) + (zone5 ?? 0);
    const transfromCondition = target.getTransformCondition(dateUnit.unit);
    
    let targetAchieved = totalActivities ? true : false;
    transfromCondition.forEach(_condition => {
      const { filedName, filedValue } = _condition;
      switch (filedName) {
        case 'pai':
          if (totalWeightedValue < filedValue) targetAchieved = false;
          break;
        case 'benefitTime':
          if (benefitTime < filedValue) targetAchieved = false;
          break;
        default:
          if (dataObj[filedName] < filedValue) targetAchieved = false;
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

  /**
   * 回傳肌肉所屬肌群
   * @param muscleCode {MuscleCode}-肌肉部位編碼
   * @return MusecleGroup
   * @author kidin-1100526
   */
  static getBelongMuscleGroup(muscleCode: MuscleCode): MuscleGroup {
    switch (muscleCode) {
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
    }
    
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

/**
 * 處理群組概要數據
 */
export class GroupSportsReportInfo {

  private _groupSportInfo: any = {};

  constructor(
    groupObj: any,
    allMemberList: AllGroupMember
  ) {
    this.createGroupInfo(groupObj, allMemberList);
  }

  /**
   * 依成員所屬群組（下階層群組成員亦計入至上層階層群組）計算各群組概要資訊
   * @param groupObj {any}-群組階層
   * @param allMemberList {AllGroupMember}-所有成員資訊（含運動概要數據）
   */
  createGroupInfo( groupObj: any, allMemberList: AllGroupMember) {
    const { memberList } = allMemberList;
    Object.keys(memberList).forEach((_userId: string) => {
      const {
        memberId,
        memberName,
        groupId: _groupId,
        base: _base,
        compare: _compare
      } = memberList[_userId];

      // 群組成員清單只存基準日期範圍的運動達成人數和隱私權開放狀態
      const { infoData: _baseInfoData } = _base;
      const { openPrivacy } = _baseInfoData;
      const targetAchieved = _baseInfoData.targetAchieved ?? false;
      const _totalActivities = _baseInfoData.totalActivities ?? 0;

      GroupInfo.getBelongGroup(_groupId).forEach(_list => {
        const _gId = _list as string;
        const _groupInfo = groupObj[_gId];
        if (_groupInfo) {
          const memberInfo = { memberId, memberName, targetAchieved, openPrivacy };
          const _groupBaseData = groupObj[_gId].base;
          groupObj[_gId].member.push(memberInfo);  // 該群組成員清單（含以下階層）

          _groupInfo.totalPeople = (_groupInfo.totalPeople ?? 0) + 1;  // 該群組總人數

          _groupBaseData.activityPeople =
            (_groupBaseData.activityPeople ?? 0) + (openPrivacy && _totalActivities ? 1 : 0);  // 有數據的人數

          _groupBaseData.targetAchievedPeople =
            (_groupBaseData.targetAchievedPeople ?? 0) + (targetAchieved ? 1 : 0);  // 達成目標人數
          if (_compare) {
            const { infoData: _compareInfoData } = _compare;
            const { openPrivacy: _compareOpenPrivacy } = _baseInfoData;
            const _compareTargetAchieved = _compareInfoData.targetAchieved ?? false;
            const _compareTotalActivities = _compareInfoData.totalActivities ?? 0;
            const _groupCompareData = groupObj[_gId].compare;

            _groupCompareData.activityPeople = 
              (_groupCompareData.activityPeople ?? 0) + (_compareOpenPrivacy && _compareTotalActivities ? 1 : 0);  // 有數據的人數

            _groupCompareData.targetAchievedPeople =
              (_groupCompareData.targetAchievedPeople ?? 0) + (_compareTargetAchieved ? 1 : 0);  // 達成目標人數
          }

          const excludeKey = [
            'openPrivacy',
            'preferType',
            'targetAchieved',
            'muscleGroupData',
            'preferMuscleGroup',
            'totalReps'
          ];

          // 將個人基準數據加總至該所屬群組中
          Object.entries(_baseInfoData).forEach(([_key, _value]) => {
            if (!excludeKey.includes(_key)) {
              const accumulator = groupObj[_gId].base[_key] ?? 0;
              if (!_key.includes('_')) {

                if (_key.toLowerCase().includes('avg')) {
                  const effectActivities = _baseInfoData[`${_key}_Activities`];
                  const _checkValue = effectActivities ? (_value as number / effectActivities) : 0;
                  groupObj[_gId].base[_key] = accumulator + _checkValue;
                } else {
                  groupObj[_gId].base[_key] = accumulator + _value;
                }

              }

            }

          });

          // 將個人比較數據加總至該所屬群組中
          if (_compare) {
            const { infoData: _compareInfoData } = _compare;
            Object.entries(_compare.infoData).forEach(([_key, _value]) => {
              if (!excludeKey.includes(_key)) {
                const accumulator = groupObj[_gId].compare[_key] ?? 0;
                if (!_key.includes('_')) {
                  
                  if (_key.toLowerCase().includes('avg') && !_key.includes('_')) {
                    const effectActivities = _compareInfoData[`${_key}_Activities`];
                    groupObj[_gId].compare[_key] = accumulator + ((_value as number / effectActivities) || 0);
                  } else {
                    groupObj[_gId].compare[_key] = accumulator + _value;
                  }

                }

              }
  
            });

          }

        }

      });

    });

    this._groupSportInfo = groupObj;
  }

  /**
   * 取得群組概要資訊
   */
  get groupSportInfo() {
    return this._groupSportInfo;
  }

  /**
   * 取得指定群組資訊
   * @param groupId {string}-群組編號
   */
  getAssignGroupInfo(groupId: string, key: string) {
    return this._groupSportInfo[groupId][key];
  }

  /**
   * 將指定的基準數據與比較數據進行比較，確認是否進步
   * @param groupId {string}-群組編號
   * @param dataKey {string}-欲比較的數據
   */
   checkProgressive(groupId: string, dataKey: string) {
    const { base, compare } = this._groupSportInfo[groupId];
    const baseData = base[dataKey] || 0;
    const compareData = compare[dataKey] || 0;
    return baseData - compareData;
  }

}

/**
 * 處理群組運動報告圖表數據
 */
export class GroupSportsChartData {

}