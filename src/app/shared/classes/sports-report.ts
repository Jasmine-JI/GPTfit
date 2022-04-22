
import { Inject } from '@angular/core';
import { TargetField, GroupSportTarget, TargetCondition } from '../models/sport-target';
import { DateUnit } from '../enum/report';
import { mathRounding, deepCopy, countPercentage } from '../utils/index';
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
import { of } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { ReportDateUnit } from './report-date-unit';
import dayjs from 'dayjs';
import quarterOfYear from 'dayjs/plugin/quarterOfYear';
import { DateRange } from './date-range';
import { zoneColor } from '../models/chart-data';
import { COLUMN_BORDER_COLOR, COMPARE_COLUMN_BORDER_COLOR, trendChartColor } from '../models/chart-data';

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
    if (openPrivacy) {
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

      // 最後處理其他數據
      if (Object.keys(dataObj).length > 0) {
        dataObj = {
          ...dataObj,
          ...this.postProcessingData({ target, condition, dataObj, timeType }),
          preferSports: preferSports.preferSport
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
      totalHrZone5Second: zone5,
      totalSecond
    } = dataObj;

    const { realStartTime, realEndTime } = 
      timeType === 'base' ? baseTime.getReportRealTimeRange(dateUnit) : compareTime.getReportRealTimeRange(dateUnit);
    const reportPeriodDay = Math.round((realEndTime - realStartTime) / DAY);
    const hrZone = [zone0, zone1, zone2, zone3, zone4, zone5];
    const { pai, totalWeightedValue } = SportsReport.countPai(hrZone, reportPeriodDay);
    const benefitTime = (zone2 ?? 0) + (zone3 ?? 0) + (zone4 ?? 0) + (zone5 ?? 0);
    const transfromCondition = target.getTransformCondition(dateUnit.unit);
    const unitKey = dateUnit.getUnitString();
    const crossRange = baseTime.getCrossRange(unitKey);
    let targetAchieved = totalActivities ? true : false;

    transfromCondition.forEach(_condition => {
      const { filedName, filedValue } = _condition;
      const targetValue = crossRange * filedValue;
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
      const { openPrivacy } = _base;
      const targetAchieved = _base.targetAchieved ?? false;
      const _totalActivities = _base.totalActivities ?? 0;

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
            const { openPrivacy: _compareOpenPrivacy } = _compare;
            const _compareTargetAchieved = _compare.targetAchieved ?? false;
            const _compareTotalActivities = _compare.totalActivities ?? 0;
            const _groupCompareData = groupObj[_gId].compare;

            _groupCompareData.activityPeople = 
              (_groupCompareData.activityPeople ?? 0) + (_compareOpenPrivacy && _compareTotalActivities ? 1 : 0);  // 有數據的人數

            _groupCompareData.targetAchievedPeople =
              (_groupCompareData.targetAchievedPeople ?? 0) + (_compareTargetAchieved ? 1 : 0);  // 達成目標人數
          }

          const excludeKey = [
            'openPrivacy',
            'preferSports',
            'targetAchieved',
            'muscleGroupData',
            'preferMuscleGroup',
            'totalReps'
          ];

          // 將個人基準數據加總至該所屬群組中
          Object.entries(_base).forEach(([_key, _value]) => {
            if (!excludeKey.includes(_key)) {
              const accumulator = groupObj[_gId].base[_key] ?? 0;
              if (!_key.includes('_')) {

                if (_key.toLowerCase().includes('avg')) {
                  const effectActivities = _base[`${_key}_Activities`];
                  const _checkValue = effectActivities ? (_value as number / effectActivities) : 0;
                  groupObj[_gId].base[_key] = accumulator + _checkValue;
                } else {
                  groupObj[_gId].base[_key] = accumulator + _value;
                }

              }

            }

          });

          // 將個人比較數據加總至該所屬群組中(使用底線區隔)
          if (_compare) {
            Object.entries(_compare).forEach(([_key, _value]) => {
              if (!excludeKey.includes(_key)) {
                const accumulator = groupObj[_gId].compare[_key] ?? 0;
                if (!_key.includes('_')) {
                  
                  if (_key.toLowerCase().includes('avg') && !_key.includes('_')) {
                    const effectActivities = _compare[`${_key}_Activities`];
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

  private _baseTypeAllChart = new TypeAllChart();


  private _compareTypeAllChart = new TypeAllChart();


  private _baseHrZone = new HrZoneChartData();


  private _compareHrZone = new HrZoneChartData();


  private _hrZoneTrend: HrZoneTrendChartData;


  private _totalSecondTrend: CompareTrendData;


  private _caloriesTrend: CompareTrendData;


  private _achievementRate: CompareTrendData;

  /**
   * @param condition {ReportCondition}-報告條件
   * @param baseData {Array<any>}-基準數據
   * @param compareData {Array<any>}-比較數據
   * @param perTransformTarget {Array<TargetCondition>}-依報告時間單位轉換的個人目標條件
   * @param totalPeople {number}-群組總人數
   */
  constructor(
    condition: ReportCondition,
    baseData: Array<any>,
    compareData: Array<any>,
    perTransformTarget: Array<TargetCondition>,
    totalPeople: number
  ) {
    const isCompareMode = compareData !== undefined;
    this._hrZoneTrend = new HrZoneTrendChartData(isCompareMode);
    this._totalSecondTrend = new CompareTrendData(isCompareMode, trendChartColor.totalSecond);
    this._caloriesTrend = new CompareTrendData(isCompareMode, trendChartColor.calories);
    this._achievementRate = new CompareTrendData(isCompareMode, trendChartColor.achieveRate);

    const { sportType, dateUnit, baseTime, compareTime } = condition;
    const allDateList = this.createCompleteDate(dateUnit, baseTime, compareTime);
    of([baseData, compareData]).pipe(
      map(data => this.filterPersonalData(data, dateUnit, sportType)),
      map(filterData => this.mergePersonalData(filterData, dateUnit)),
      map(personalData => this.postProcessingPerosnalData(personalData, perTransformTarget)),
      map(completeData => this.concatPersonalData(completeData)),
      map(concatData => this.sortData(concatData)),
      map(sortData => this.mergeGroupData(sortData, dateUnit)),
      map(mergeData => this.fillUpDate(mergeData, allDateList)),
      map(fillUpData => this.handleChartData(fillUpData, totalPeople))
    ).subscribe()

  }

  /**
   * 將個人數據依運動類別進行篩選，並同時扁平化
   * @param data {Array<any>}-基準數據與比較數據
   * @param dateUnit {ReportDateUnit}-報告所選擇的時間單位
   * @param sportType {SportType}-運動類別
   */
  filterPersonalData(data: Array<any>, dateUnit: ReportDateUnit, sportType: SportType) {
    const dataKey = dateUnit.getReportKey('sportsReport');
    const [baseData, compareData] = data;
    const baseFilterResult = this.filterData(baseData, sportType, dataKey, false);
    const compareFilterResult = compareData ? this.filterData(compareData, sportType, dataKey, true) : undefined;
    return [baseFilterResult, compareFilterResult];
  }

  /**
   * 根據運動類別篩選數據，同時處理群組心率區間數據與成效分佈圖數據
   * @param data {any}-基準或比較之數據
   * @param sportType {SportType}-運動類別
   * @param key {string}-儲存運動數據物件的鍵名
   * @param isCompareData {boolean}-是否為比較模式
   */
  filterData = (data: Array<any>, sportType: SportType, key: string, isCompareData: boolean) => {
    const checkDataOpen = (resultCode: number) => resultCode === 200;
    let filterResult = [];
    data.forEach(_data => {
      let result = [];
      const { resultCode: _resultCode } = _data;
      if (checkDataOpen(_resultCode)) {
        _data[key].forEach(_dataRow => {
          const { activities, startTime, endTime } = _dataRow;
          activities.forEach(_activity => {
            const { type } = _activity;
            const isAllType = sportType === SportType.all;
            if (isAllType || sportType === +type) {
              // 扁平化方便之後依相同日期範圍合併數據
              result.unshift({ activities: _activity, startTime, endTime });
              this.handleGroupHrZoneData(_activity, isCompareData);
            }

            if (isAllType) this.handleDistributionChartData(_activity, isCompareData);
          });

        });
        
      }

      if (result.length > 0) filterResult.push(result);
    });

    return filterResult;
  }

  /**
   * 將個人數據依報告時間單位進行數據合併，以產生目標達成率圖表
   * @param allData {Array<any>}-基準數據與比較數據
   * @param dateUnit {ReportDateUnit}-報告所選擇的時間單位
   */
  mergePersonalData(allData: Array<any>, dateUnit: ReportDateUnit) {
    const [baseData, compareData] = allData;
    const mergeData = (data: Array<any>, dateUnit: ReportDateUnit) => {
      const result = data.map(_data => {
        const personalData = [];
        const temporaryCount = new TemporaryCount();
        _data.forEach((_activity, _index) => {
          const { startTime: _startTime, endTime: _endTime, activities: _activities } = _activity;
          const { start, end } = this.getSameRangeDate(_startTime, _endTime, dateUnit);
          const { startTime } = temporaryCount.dateRange;
          const isFirstData = _index === 0;
          const isLastData = _index + 1 === _data.length;
          if (isFirstData) {
            temporaryCount.saveDate(start, end);
            temporaryCount.countData(_activities);
            if (isLastData) personalData.push(temporaryCount.result);
    
          } else if (start === startTime) {
            temporaryCount.countData(_activities);
            if (isLastData) personalData.push(temporaryCount.result);
    
          } else {
            personalData.push(temporaryCount.result);
            temporaryCount.init();
            temporaryCount.saveDate(start, end);
            temporaryCount.countData(_activities);
            if (isLastData) personalData.push(temporaryCount.result);
          }

        });
  
        return personalData;
      });

      return result;
    };

    const baseMergeResult = mergeData(baseData, dateUnit);
    const compareMergeResult = compareData ? mergeData(compareData, dateUnit) : undefined;
    return [baseMergeResult, compareMergeResult];
  }

  /**
   * 計算各日期範圍目標達成與否，同時將所有成員數據合併唯一陣列，以便計算群組圖表數據
   * @param allData {Array<any>}-基準數據與比較數據
   * @param perTransformTarget {Array<TargetCondition>}-依報告時間單位轉換的個人目標條件
   */
  postProcessingPerosnalData(allData: Array<any>, perTransformTarget: Array<TargetCondition>) {
    const [baseData, compareData] = allData;
    const achievementData = (data: Array<any>) => {
      return data.map(_data => {

        return _data.map(_dataRow => {
          const {
            totalHrZone0Second: zone0,
            totalHrZone1Second: zone1,
            totalHrZone2Second: zone2,
            totalHrZone3Second: zone3,
            totalHrZone4Second: zone4,
            totalHrZone5Second: zone5,
            totalSecond,
            calories,
            totalActivities
          } = _dataRow.activities;
          let achieve = 1;
          perTransformTarget.forEach(_condition => {
            const { filedName, filedValue } = _condition;
            switch (filedName) {
              case 'totalActivities':
                if (totalActivities < filedValue) achieve = 0;
                break;
              case 'totalTime':
                const targetSecond = filedValue;
                if (+totalSecond < targetSecond) achieve = 0;
                break;
              case 'benefitTime':
                const benefitTime = zone2 + zone3 + zone4 + zone5;
                if (benefitTime < filedValue) achieve = 0;
                break;
              case 'pai':
                const { z0, z1, z2, z3, z4, z5 } = PAI_COFFICIENT;
                const pai = zone0 * z0 + zone1 * z1 + zone2 * z2 + zone3 * z3 + zone4 * z4 + zone5 * z5;
                if (pai < filedValue) achieve = 0;
                break;
              case 'calories':
                if (calories < filedValue) achieve = 0;
                break;
            }

          });

          // 將目標達成數寫回activities，以便之後產生達成率圖表
          _dataRow.activities.achieve = achieve;
          return _dataRow;
        });

      });

    };

    const baseDataResult = achievementData(baseData);
    const compareDataResult = compareData ? achievementData(compareData) : undefined;
    return [baseDataResult, compareDataResult];
  }

  /**
   * 將個人數據合併唯一陣列
   * @param allData {Array<any>}-基準與比較數據
   */
  concatPersonalData(allData: Array<any>) {
    const [baseData, compareData] = allData;
    const concat = (data: Array<any>) => {
      return data.reduce((prev, current) => {
        return prev.concat(current);
      }, []);

    };

    const baseDataResult = concat(baseData);
    const compareDataResult = compareData ? concat(compareData) : undefined;
    return [baseDataResult, compareDataResult];
  }

  /**
   * 將所有成員的基準數據與比較數據混合後依據時間進行排序
   * @param allData {Array<any>}-已篩選運動類別的基準數據與比較數據
   */
  sortData(allData: Array<any>) {
    const sortByStartTime = (data: Array<any>) => {
      return data.sort((_a, _b) => {
        const _aStartTimestamp = dayjs(_a.startTime).valueOf();
        const _bStartTimestamp = dayjs(_b.startTime).valueOf();
        return _aStartTimestamp - _bStartTimestamp;
      });
      
    };

    const [baseData, compareData] = allData;
    const baseSortResult = sortByStartTime(baseData);
    if (!compareData) return [baseSortResult, undefined];

    const compareSortResult = sortByStartTime(compareData);
    return [baseSortResult, compareSortResult];
  }

  /**
   * 將同時間範圍的數據合併為一筆，同時將日期轉為timestamp
   * 若運動類別為不分類別，則同時處理數量與時間佔比圖與成效分佈圖數據
   * @param allData {Array<any>}-已經根據起始時間排序過後的數據
   * @param dateUnit {ReportDateUnit}-報告所選擇的時間單位
   */
  mergeGroupData(allData: Array<any>, dateUnit: ReportDateUnit) {
    const [baseData, compareData] = allData;
    return [
      this.mergeData(baseData, dateUnit),
      compareData ? this.mergeData(compareData, dateUnit) : undefined
    ];

  }

  /**
   * 將基準數據與比較數據，根據所選日期範圍將日期填補完整
   * 讓圖表呈現時不會跳過無數據之日期
   * @param allData {Array<any>}-基準與比較日期範圍之運動數據
   * @param allDateList {Array<any>}-基準與比較數據之完整日期清單
   */
  fillUpDate(allData: Array<any>, allDateList: Array<any>) {
    const [baseDateList, compareDateList] = allDateList;
    const [baseData, compareData] = allData;
    const baseDataResult = [];
    const compareDataResult = [];
    let baseDataIndex = 0;
    let compareDataIndex = 0;

    baseDateList.forEach((_date, _index) => {
      const { start: _baseStart, end: _baseEnd } = _date;
      const baseDataStart = baseData[baseDataIndex] ? baseData[baseDataIndex].startTime : null;
      if (_baseStart !== baseDataStart) {
        baseDataResult.push({ activities: {}, startTime: _baseStart, endTime: _baseEnd });
      } else {
        baseDataResult.push(baseData[baseDataIndex]);
        baseDataIndex++;
      }

      if (compareData) {
        const { start: _compareStart, end: _compareEnd } = compareDateList[_index];
        const compareDataStart = compareData[compareDataIndex] ? compareData[compareDataIndex].startTime : null;
        if (_compareStart !== compareDataStart) {
          compareDataResult.push({ activities: {}, startTime: _compareStart, endTime: _compareEnd });
        } else {
          compareDataResult.push(compareData[compareDataIndex]);
          compareDataIndex++;
        }

      }

    });

    return [baseDataResult, compareData ? compareDataResult : undefined];
  }

  /**
   * 將基準數據與比較數據進行整合，產生圖表所需數據
   * @param allData {Array<any>}-已篩選運動類別且已魂混合並依時間排序的基準數據與比較數據
   * @param totalPeople {number}-群組總人數
   */
  handleChartData(allData: Array<any>, totalPeople: number) {
    const [baseData, compareData] = allData;
    if (!compareData) return this.handleChart(baseData, totalPeople);
    return this.handleChartWithCompare(allData, totalPeople);
  }

  /**
   * 將基準數據整理成各圖表所需數據
   * @param data {Array<any>}-基準運動概要陣列數據
   * @param totalPeople {number}-群組總人數
   */
  handleChart(data: Array<any>, totalPeople: number) {    
    data.forEach(_data => {
      const { activities: _activities, startTime: _startTime, endTime: _endTime } = _data;
      const {
        totalHrZone0Second: _z0,
        totalHrZone1Second: _z1,
        totalHrZone2Second: _z2,
        totalHrZone3Second: _z3,
        totalHrZone4Second: _z4,
        totalHrZone5Second: _z5,
        calories: _calories,
        totalSecond: _totalSecond,
        totalActivitySecond: _totalActivitySecond,
        achieve: _achieve
      } = _activities;

      const dateRange = [_startTime, _endTime];
      const hrZone = [_z0, _z1, _z2, _z3, _z4, _z5].map(_zone => _zone ? _zone : 0);
      this._hrZoneTrend.addBaseData(hrZone, dateRange);
      this._totalSecondTrend.addBaseData(_totalSecond, dateRange);
      this._caloriesTrend.addBaseData(_calories, dateRange);

      const _achieveRate = mathRounding(countPercentage(_achieve, totalPeople), 1);
      this._achievementRate.addBaseData(_achieveRate, dateRange);
    });

  }

  /**
   * 將基準與比較數據整理成各圖表所需數據
   * @param allData {Array<any>}-基準與比較之運動概要陣列數據
   * @param totalPeople {number}-群組總人數
   */
  handleChartWithCompare(allData: Array<any>, totalPeople: number) {
    const [baseData, compareData] = allData;
    baseData.forEach((_baseData, _index) => {
      const { activities: _baseActivities, startTime: _baseStartTime, endTime: _baseEndTime } = _baseData;
      const {
        totalHrZone0Second: _baseZ0,
        totalHrZone1Second: _baseZ1,
        totalHrZone2Second: _baseZ2,
        totalHrZone3Second: _baseZ3,
        totalHrZone4Second: _baseZ4,
        totalHrZone5Second: _baseZ5,
        calories: _baseCalories,
        totalSecond: _baseTotalSecond,
        totalActivitySecond: _baseTotalActivitySecond,
        achieve: _baseAchieve
      } = _baseActivities;

      const { activities: _compareActivities, startTime: _compareStartTime, endTime: _compareEndTime } = compareData[_index];
      const {
        totalHrZone0Second: _compareZ0,
        totalHrZone1Second: _compareZ1,
        totalHrZone2Second: _compareZ2,
        totalHrZone3Second: _compareZ3,
        totalHrZone4Second: _compareZ4,
        totalHrZone5Second: _compareZ5,
        calories: _compareCalories,
        totalSecond: _compareTotalSecond,
        totalActivitySecond: _compareTotalActivitySecond,
        achieve: _compareAchieve
      } = _compareActivities;

      const _baseHrZone = [_baseZ0, _baseZ1, _baseZ2, _baseZ3, _baseZ4, _baseZ5].map(_zone => _zone ? _zone : 0);
      const _baseDateRange = [_baseStartTime, _baseEndTime];
      const _compareHrZone = [_compareZ0, _compareZ1, _compareZ2, _compareZ3, _compareZ4, _compareZ5].map(_zone => _zone ? _zone : 0);
      const _compareDateRange = [_compareStartTime, _compareEndTime];
      this._hrZoneTrend.addMixData(_baseHrZone, _baseDateRange, _compareHrZone, _compareDateRange);
      this._totalSecondTrend.addMixData(_baseTotalSecond, _baseDateRange, _compareTotalSecond, _compareDateRange);
      this._caloriesTrend.addMixData(_baseCalories, _baseDateRange, _compareCalories, _compareDateRange);

      const _baseAchieveRate = mathRounding(countPercentage(_baseAchieve, totalPeople), 1);
      const _compareAchieveRate = mathRounding(countPercentage(_compareAchieve, totalPeople), 1);
      this._achievementRate.addMixData(_baseAchieveRate, _baseDateRange, _compareAchieveRate, _compareDateRange);
    });

  }

  /**
   * 根據報告日期單位與報告日期，取得所屬範圍
   * @param startTime {string}-開始時間
   * @param endTime {string}-結束時間
   * @param dateUnit {ReportDateUnit}-報告所選擇的時間單位
   */
  getSameRangeDate(startTime: string, endTime: string, dateUnit: ReportDateUnit) {
    const startTimestamp = dayjs(startTime).valueOf();
    const endTimestamp = dayjs(endTime).valueOf();
    switch (dateUnit.unit) {
      case DateUnit.season:
        const seasonStart = dayjs(startTimestamp).startOf('quarter').valueOf();
        const seasonEnd = dayjs(endTimestamp).startOf('quarter').valueOf();
        return { start: seasonStart, end: seasonEnd };
      case DateUnit.year:
        const rangeStart = dayjs(startTimestamp).startOf('year').valueOf();
        const rangeEnd = dayjs(endTimestamp).endOf('year').valueOf();
        return { start: rangeStart, end: rangeEnd };
      default:
        return { start: startTimestamp, end: endTimestamp };
    }

  };

  /**
   * 合併數據
   * @param data {Array<any>}-運動數據
   * @param dateUnit {ReportDateUnit}-報告所選擇的時間單位
   */
  mergeData(
    data: Array<any>,
    dateUnit: ReportDateUnit
  ) {
    const result = [];
    const temporaryCount = new TemporaryCount();
    data.forEach((_data, _index) => {
      const { startTime: _startTime, endTime: _endTime, activities: _activities } = _data;
      const { start, end } = this.getSameRangeDate(_startTime, _endTime, dateUnit);
      const { startTime } = temporaryCount.dateRange;
      const isFirstData = _index === 0;
      const isLastData = _index + 1 === data.length;
      if (isFirstData) {
        temporaryCount.saveDate(start, end);
        temporaryCount.countData(_activities);
        if (isLastData) result.push(temporaryCount.result);

      } else if (start === startTime) {
        temporaryCount.countData(_activities);
        if (isLastData) result.push(temporaryCount.result);

      } else {
        result.push(temporaryCount.result);
        temporaryCount.init();
        temporaryCount.saveDate(start, end);
        temporaryCount.countData(_activities);
        if (isLastData) result.push(temporaryCount.result);
      }

    });

    return result;
  }

  /**
   * 處理群組心率區間數據
   * @param activity {any}-運動數據
   * @param isCompareData {boolean}-是否為比較數據
   */
  handleGroupHrZoneData(activity: any, isCompareData: boolean) {
    const {
      totalHrZone0Second: z0,
      totalHrZone1Second: z1,
      totalHrZone2Second: z2,
      totalHrZone3Second: z3,
      totalHrZone4Second: z4,
      totalHrZone5Second: z5,
    } = activity;
    const hrZone = [z0, z1, z2, z3, z4, z5];
    if (isCompareData) {
      this._compareHrZone.add(hrZone);
    } else {
      this._baseHrZone.add(hrZone);
    }

  }

  /**
   * 處理群組成效分佈圖數據
   * @param activity {any}-運動數據
   * @param isCompareData {boolean}-是否為比較數據
   */
  handleDistributionChartData(activity: any, isCompareData: boolean) {
    const {
      totalSecond,
      totalActivities,
      avgHeartRateBpm,
      type
    } = activity;
    const onePoint = {
      type: +type as SportType,
      totalSecond,
      totalActivities,
      avgHeartRateBpm
    };

    if (isCompareData) {
      this._compareTypeAllChart.count(onePoint);
    } else {
      this._baseTypeAllChart.count(onePoint);
    }

  }


  /**
   * 根據報告時間單位、基準日期範圍與比較日期範圍產生完整的日期序列
   * @param dateUnit {ReportDateUnit}-選擇的報告日期單位
   * @param baseTime {DateRange}-報告基準日期
   * @param compareTime {DateRange}-報告比較日期
   */
  createCompleteDate(dateUnit: ReportDateUnit, baseTime: DateRange, compareTime: DateRange) {
    const unitString = dateUnit.getUnitString();
    const baseDiffTime = baseTime.getCrossRange(unitString);
    const compareDiffTime = compareTime ? compareTime.getCrossRange(unitString) : -1;

    // 若有比較時間，則先確認基準與比較日期何者較長，以較長的日期作為日期範圍長度
    let baseDateList = [];
    let compareDateList = [];
    const { startTimestamp: baseStart, endTimestamp: baseEnd } = baseTime;
    if (baseDiffTime >= compareDiffTime) {
      baseDateList = this.createDateList([], unitString, baseStart, baseEnd);
      if (compareTime) {
        const { startTimestamp: compareStart } = compareTime;
        const extentCompareEnd = dayjs(compareStart)
          .add(baseDiffTime - 1, unitString as any)
          .endOf(unitString)
          .valueOf();
        
        compareDateList = this.createDateList([], unitString, compareStart, extentCompareEnd);
      }

    } else {
      const extentBaseEnd = dayjs(baseStart)
        .add(compareDiffTime - 1, unitString as any)
        .endOf(unitString)
        .valueOf();
      
      baseDateList = this.createDateList([], unitString, baseStart, extentBaseEnd);

      const { startTimestamp: compareStart, endTimestamp: compareEnd } = compareTime;
      compareDateList = this.createDateList([], unitString, compareStart, compareEnd);
    }
    
    return [baseDateList, compareTime ? compareDateList : undefined];
  }

  /**
   * 根據時間範圍單位與所選時間，建立一時間清單
   * @param list {Array<{ start: number; end: number }>}
   * @param unitString {string}-日期單位字串（使用any以符合dayjs type）
   * @param dateStart {number}-報告日期範圍開始時間
   * @param dateEnd {number}-報告日期範圍結束時間
   */
  createDateList(
    list: Array<{ start: number; end: number }>,
    unitString: any,
    dateStart: number,
    dateEnd: number
  ) {

    if (list.length > 0) {
      const { start: prevStart } = list[list.length - 1];
      const start = dayjs(prevStart).add(1, unitString).valueOf();

      // 將時間逐漸疊加至超過所選時間後，即完成日期清單
      if (start <= dateEnd) {
        const end = dayjs(start).endOf(unitString).valueOf();
        list.push({ start, end });
        return this.createDateList(list, unitString, dateStart, dateEnd);
      } else {
        return list;
      }

    } else {
      const start = dayjs(dateStart).startOf(unitString).valueOf();
      const end = dayjs(start).endOf(unitString).valueOf();
      list.push({ start, end });
      return this.createDateList(list, unitString, dateStart, dateEnd);
    }

  }

  /**
   * 取得基準日期範圍活動分析用數據（圓環圖/成效分佈圖）
   */
  get baseTypeAllChart() {
    return this._baseTypeAllChart;
  }

  /**
   * 取得比較日期範圍活動分析用數據（圓環圖/成效分佈圖）
   */
  get compareTypeAllChart() {
    return this._compareTypeAllChart;
  }

  /**
   * 取得基準日期範圍心率區間用數據
   */
  get baseHrZone() {
    return this._baseHrZone;
  }

  /**
   * 取得比較模式心率樹狀圖數據
   */
  get compareHrZone() {
    return this._compareHrZone;
  }

  /**
   * 取得心率區間趨勢數據
   */
  get hrZoneTrend() {
    return this._hrZoneTrend;
  }

  /**
   * 取得總時間趨勢數據
   */
  get totalSecondTrend() {
    return this._totalSecondTrend;
  }

  /**
   * 取得卡路里趨勢數據
   */
  get caloriesTrend() {
    return this._caloriesTrend;
  }

  /**
   * 取得達標率趨勢數據
   */
  get achievementRate() {
    return this._achievementRate;
  }

}

/**
 * 計算同一時間範圍數據用
 */
class TemporaryCount {

  private _countObj = {};


  private _totalActivities = 0;


  private _startTime: number = 0;


  private _endTime: number = 0;

  /**
   * 將變數初始化
   */
  init() {
    this._countObj = {};
    this._totalActivities = 0;
    this._startTime = 0;
    this._endTime = 0;
  }

  /**
   * 將各數據加總
   * @param data {any}-一個日期範圍內的一個運動類別數據
   */
  countData(data: any) {
    const isAvgData = (str: string) => str.toLowerCase().includes('avg') || str.toLowerCase().includes('average');
    const isSpecialData = (str: string, keyword: string) => !isAvgData(str) && str.toLowerCase().includes(keyword);
    const excludeKey = ['type', 'weightTrainingInfo'];
    const { totalActivities } = data;
    this._totalActivities += totalActivities;
    for (let _key in data) {
      
      if (!excludeKey.includes(_key)) {
        const value = Math.abs(+data[_key]);

        // 處理舊有數據正負值與該數據類型牴觸的情形（球類）
        const checkValue = isSpecialData(_key, 'min') ? -value : value;

        // 確認是否為最大或最小類型的數據（球類）
        if (isSpecialData(_key, 'max')) {
          if (this._countObj[_key] < checkValue) this._countObj[_key] = checkValue;
        } else if (isSpecialData(_key, 'mini')) {
          if (this._countObj[_key] > checkValue) this._countObj[_key] = checkValue;
        } else {
          // 平均數據需依運動數目加權回來再進行加總
          const totalValue = isAvgData(_key) ? checkValue * totalActivities : checkValue;
          this._countObj[_key] = this._countObj[_key] ? this._countObj[_key] + totalValue : totalValue;
        }

      }

    }

  }

  /**
   * 將加總的平均數據依運動數目進行均化
   */
  handleDataAverage(obj: any) {
    const isAvgData = (str: string) => str.toLowerCase().includes('avg');
    let result = {};
    for (let _key in obj) {
      const totalValue = obj[_key];
      result[_key] = mathRounding(isAvgData(_key) ? totalValue / this._totalActivities : totalValue, 1);      
    }

    return result;
  }

  /**
   * 儲存日期範圍供比對用
   * @param start {number}-開始時間(timestamp)
   * @param end {number}-結束時間(timestamp)
   */
  saveDate(start: number, end: number) {
    this._startTime = start;
    this._endTime = end;
  }

  /**
   * 取得目前數據所屬日期範圍
   */
  get dateRange() {
    return { startTime: this._startTime, endTime: this._endTime };
  }

  /**
   * 取得運動數目
   */
  get totalActivities() {
    return this._totalActivities;
  }

  /**
   * 取得結果
   */
  get result() {
    return {
      activities: this.handleDataAverage(this._countObj),
      startTime: this._startTime,
      endTime: this._endTime
    };

  }


}

/**
 * 不分運動類別時處理佔比圖表數據與成效分佈圖
 */
export class TypeAllChart {

  /**
   * 成效分佈圖用數據
   */
  private _dotList = [];

  /**
   * 數量佔比圖數據
   */
  private _activitiesStatistics = [0, 0, 0, 0, 0, 0, 0];

  /**
   * 時間佔比圖數據
   */
  private _totalSecondStatistics = [0, 0, 0, 0, 0, 0, 0];

  /**
   * 統計各圖表所需數據
   * @param data {{ type: SportType; totalSecond: number; totalActivities: number; avgHeartRateBpm: number; }}
   */
  count(data: {
    type: SportType;
    totalSecond: number;
    totalActivities: number;
    avgHeartRateBpm: number;
  }) {
    const { type, totalSecond, totalActivities, avgHeartRateBpm } = data;
    const index = +type - 1;
    this._activitiesStatistics[index] += +totalActivities;
    this._totalSecondStatistics[index] += +totalSecond;
    this._dotList.push({ sportType: +type, avgSecond: mathRounding(+totalSecond / +totalActivities, 0), avgHeartRateBpm });
  }

  /**
   * 取得統計數據
   */
  get activitiesStatistics() {
    return this._activitiesStatistics;
  }

  /**
   * 取得統計數據
   */
  get totalSecondStatistics() {
    return this._totalSecondStatistics;
  }

  /**
   * 取得分佈圖數據
   */
  get dotList() {
    return this._dotList;
  }

}

/**
 * 處理心率區間數據(用於心率佔比圖)
 */
export class HrZoneChartData {

  private _hrZone = [0, 0, 0, 0, 0, 0];

  /**
   * 統計各心率區間數據
   * @param count 
   */
  add(data: Array<number>) {
    if (data[0] !== null) this._hrZone = this._hrZone.map((_second, _index) => _second + data[_index]);
  }

  /**
   * 取得心率區間數據
   */
  get chartData() {
    return this._hrZone;
  }

}

/**
 * 處理心率趨勢數據
 */
export class HrZoneTrendChartData {

  private _hrZoneTrend: Array<any>;


  constructor(isCompareMode: boolean) {
    isCompareMode ? this.createCompareOption() : this.createNormalOption();
  }

  /**
   * 變數進行格式化成非比較模式之圖表
   */
  createNormalOption() {
    this._hrZoneTrend = new Array(6).fill(null).map((_arr, _index) => {
      const _reverseIndex = this.getReverseIndex(_index);
      return {
        name: `Zone${_reverseIndex}`,
        data: [],
        showInLegend: false,
        color: zoneColor[_reverseIndex],
        borderColor: COLUMN_BORDER_COLOR,
        custom: {
          dateRange: []
        }

      };

    });

  }

  /**
   * 變數進行格式化成比較模式之圖表
   */
  createCompareOption() {
    this._hrZoneTrend = new Array(12).fill(null).map((_arr, _index) => {
      // 陣列依序為[baseZ5, baseZ4, ..., baseZ0, compareZ5, compareZ4, ..., compareZ0]
      const isCompare = _index > 5;
      const _zoneIndex = isCompare ? _index - 6 : _index;
      const _reverseIndex = this.getReverseIndex(_zoneIndex);
      return {
        name: `Zone${_reverseIndex}`,
        data: [],
        stack: isCompare ? 'compare' : 'base',
        borderColor: isCompare ? COMPARE_COLUMN_BORDER_COLOR : COLUMN_BORDER_COLOR,
        color: zoneColor[_reverseIndex],
        showInLegend: false,
        custom: {
          dateRange: []
        }

      };

    });
    
  }

  /**
   * 將單筆心率數據與日期範圍加至圖表數據陣列中
   * @param baseData {Array<number>}-基準心率區間
   * @param dateRange {Array<number>}-該筆數據所屬時間
   */
  addBaseData(baseData: Array<number>, dateRange: Array<number>) {
    // highchart 堆疊柱狀圖堆疊順序由上到下為數據陣列前到後，故z5要放陣列最前面
    baseData.forEach((_hrZone, _index) => {
      const reverseIndex = this.getReverseIndex(_index);
      this._hrZoneTrend[reverseIndex].data.push([dateRange[0], _hrZone || 0]); // [startTimestamp, hrZone]
      this._hrZoneTrend[reverseIndex].custom.dateRange.push(dateRange);  // [startTimestamp, endTimestamp]
    });

  }

  /**
   * 將基準與比較的單筆心率數據與日期範圍加至圖表數據陣列中
   * @param baseData {Array<number>}-基準心率區間
   * @param baseDateRange {Array<number>}-該筆數據所屬時間
   * @param baseData {Array<number>}-比較心率區間
   * @param compareDateRange {Array<number>}-該筆數據所屬時間
   */
  addMixData(
    baseData: Array<number>,
    baseDateRange: Array<number>,
    compareData: Array<number>,
    compareDateRange: Array<number>
  ) {
    baseData.forEach((_baseHrZone, _index) => {
      const _compareHrZone = compareData[_index];
      const _baseReverseIndex = this.getReverseIndex(_index)
      const _compareReverseIndex = _baseReverseIndex + 6;
      this._hrZoneTrend[_baseReverseIndex].data.push(_baseHrZone);
      this._hrZoneTrend[_baseReverseIndex].custom.dateRange.push(baseDateRange);
      this._hrZoneTrend[_compareReverseIndex].data.push(_compareHrZone);
      this._hrZoneTrend[_compareReverseIndex].custom.dateRange.push(compareDateRange);
    });

  }

  /**
   * highchart 堆疊柱狀圖堆疊順序由上到下為數據陣列前到後，故需將序列反過來
   * @param index {number}-原序列
   */
  getReverseIndex(index: number) {
    return Math.abs(index - 5);
  }

  /**
   * 取得圖表數據
   */
  get chartData() {
    return this._hrZoneTrend;
  }

}

/**
 * 比較趨勢圖
 */
export class CompareTrendData {

  /**
   * 用來標註目標線(yAxis.plotLines)
   */
  private _target: number;

  /**
   * 顏色設定
   */
  private _colorOption: any;

  /**
   * 圖表所需數據與設定
   */
  private _trendData = [{
    color: {
      linearGradient: {
        x1: 0,
        x2: 0,
        y1: 0,
        y2: 1
      },
      stops: []
    },
    showInLegend: false,
    custom: {
      dateRange: []
    },
    data: []
  }];

  constructor(isCompareMode: boolean, colorOption: any) {
    this._colorOption = colorOption;
    isCompareMode ? this.initCompareOption(colorOption) : this.initNormalOption(colorOption);
  }

  /**
   * 非比較模式的圖表設定值
   * @param colorOption {any}-柱狀圖顏色設定
   */
  initNormalOption(colorOption: any) {
    const { top, bottom } = colorOption.base;
    this._trendData[0].color.stops = [
      [0, top],
      [1, bottom]
    ];

  }

  /**
   * 比較模式的圖表設定值
   * @param colorOption {any}-柱狀圖顏色設定
   */
  initCompareOption(colorOption: any) {
    const { base, compare } = colorOption;
    const optionModel = deepCopy(this._trendData[0]);
    this._trendData.push(optionModel);
    this._trendData[0].color.stops = [[0, base.top], [1, base.bottom]];
    this._trendData[1].color.stops = [[0, compare.top], [1, compare.bottom]];
  }

  /**
   * 將單筆數據與日期範圍加至圖表數據陣列中
   * @param data {number}-數據
   * @param dateRange {Array<number>}-該筆數據所屬時間
   */
  addBaseData(data: number, dateRange: Array<number>) {
    this._trendData[0].data.push([dateRange[0], data || 0]);
    this._trendData[0].custom.dateRange.push(dateRange);
  }

  /**
   * 將基準與比較的單筆數據與日期範圍加至圖表數據陣列中
   * @param baseData {Array<number>}-基準數據
   * @param baseDateRange {Array<number>}-該筆數據所屬時間
   * @param baseData {Array<number>}-比較數據
   * @param compareDateRange {Array<number>}-該筆數據所屬時間
   */
  addMixData(
    baseData: number,
    baseDateRange: Array<number>,
    compareData: number,
    compareDateRange: Array<number>
  ) {
    this._trendData[0].data.push(baseData || 0);
    this._trendData[0].custom.dateRange.push(baseDateRange);
    this._trendData[1].data.push(compareData || 0);
    this._trendData[1].custom.dateRange.push(compareDateRange);
  }

  /**
   * 儲存目標值
   * @param value {number}-目標值
   */
  set target(value: number) {
    this._target = value;
  }

  /**
   * 取得目標值
   */
  get target() {
    return this._target;
  }


  get colorOption() {
    return this._colorOption;
  }

  /**
   * 取得圖表數據與設定值
   */
  get chartData() {
    return this._trendData;
  }

  /**
   * 取得基準數據長度
   */
  get baseDataLength() {
    return this._trendData[0]?.data?.length;
  }

  /**
   * 取得比較數據長度
   */
  get compareDataLength() {
    return this._trendData[1]?.data?.length;
  }

}