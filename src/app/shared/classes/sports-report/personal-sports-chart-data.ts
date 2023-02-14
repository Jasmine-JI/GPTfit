import { TargetConditionMap } from '../../../core/models/api/api-common';
import { DateUnit } from '../../enum/report';
import { ReportCondition } from '../../models/report-condition';
import { SportType } from '../../enum/sports';
import { DAY } from '../../models/utils-constant';
import { of } from 'rxjs';
import { map } from 'rxjs/operators';
import { ReportDateUnit } from '../report-date-unit';
import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
import { DateRange } from '../date-range';
import { trendChartColor } from '../../models/chart-data';
import { WeightTrainingTrend } from '../../classes/sports-report/weight-train-trend';
import { BodyWeightTrend } from '../sports-report/body-weight-trend';
import { ComplexTrend } from '../sports-report/complex-trend';
import { TargetAchieveTrendData } from '../sports-report/target-achieve-trend';
import { CompareTrendData } from '../sports-report/compare-trend-data';
import { HrZoneTrendChartData } from '../sports-report/hrzone-trend-chart-data';
import { HrZoneChartData } from '../sports-report/hrzone-chart-data';
import { TypeAllChart } from '../sports-report/type-all-chart';
import { TemporaryCount } from '../sports-report/temporary-count';
import { SportsReport } from './sports-report';
import { countBenefitTime, mathRounding } from '../../../core/utils';
import { BenefitTimeStartZone } from '../../../core/enums/common';

dayjs.extend(isoWeek);

/**
 * 處理個人運動報告圖表數據
 */
export class PersonalSportsChartData {
  private _baseTypeAllChart = new TypeAllChart();
  private _compareTypeAllChart = new TypeAllChart();
  private _baseHrZone = new HrZoneChartData();
  private _compareHrZone = new HrZoneChartData();
  private _hrZoneTrend: HrZoneTrendChartData;
  private _totalSecondTrend: CompareTrendData;
  private _benefitTimeTrend: CompareTrendData;
  private _paiTrend: CompareTrendData;
  private _totalActivitiesTrend: CompareTrendData;
  private _caloriesTrend: CompareTrendData;
  private _totalFeedbackEnergy: CompareTrendData;
  private _totalDistanceMetersTrend: CompareTrendData;
  private _targertAchieveTrend: TargetAchieveTrendData;
  private _complexHrTrend: ComplexTrend;
  private _bodyWeightTrend: BodyWeightTrend;
  private _speedPaceTrend: ComplexTrend;
  private _cadenceTrend: ComplexTrend;
  private _powerTrend: ComplexTrend;
  private _xGForceTrend: ComplexTrend;
  private _yGForceTrend: ComplexTrend;
  private _zGForceTrend: ComplexTrend;
  private _weightTrainingTrend: WeightTrainingTrend;
  private _sportsTableData: Array<any> = [];
  private _baseTotalAchieveRate = 0;
  private _compareTotalAchieveRate = 0;

  /**
   * @param condition {ReportCondition}-報告條件
   * @param dataObj {Array<any>}-基準與比較之運動/生活追蹤數據
   * @param sportTargetCondition {Array<TargetCondition>}-依報告時間單位轉換的個人目標條件
   * @param isMondayFirst {boolean}-是否週一為第一天
   * @param benefitTimeStartZone {BenefitTimeStartZone}-效益時間有效開始區間
   */
  constructor(
    condition: ReportCondition,
    dataObj: any,
    sportTargetCondition: TargetConditionMap,
    isMondayFirst: boolean,
    benefitTimeStartZone: BenefitTimeStartZone
  ) {
    const {
      userInfo,
      baseActivitiesData,
      compareActivitiesData,
      baseLifeTracking,
      compareLifeTracking,
    } = dataObj;
    const { sportType, dateUnit, baseTime, compareTime } = condition;
    const isCompareMode = compareActivitiesData !== undefined;
    this._hrZoneTrend = new HrZoneTrendChartData(isCompareMode);
    this._totalSecondTrend = new CompareTrendData(isCompareMode, trendChartColor.totalSecond);
    this._benefitTimeTrend = new CompareTrendData(isCompareMode, trendChartColor.benefitTime);
    this._paiTrend = new CompareTrendData(isCompareMode, trendChartColor.pai);
    this._caloriesTrend = new CompareTrendData(isCompareMode, trendChartColor.calories);
    this._totalActivitiesTrend = new CompareTrendData(
      isCompareMode,
      trendChartColor.totalActivities
    );
    this._targertAchieveTrend = new TargetAchieveTrendData(baseTime, compareTime!);
    this._complexHrTrend = new ComplexTrend(sportType!, 'hr', isCompareMode);
    this._bodyWeightTrend = new BodyWeightTrend(isCompareMode);

    switch (sportType) {
      case SportType.run:
        this._totalDistanceMetersTrend = new CompareTrendData(
          isCompareMode,
          trendChartColor.distance
        );
        this._speedPaceTrend = new ComplexTrend(sportType, 'speedPace', isCompareMode);
        this._cadenceTrend = new ComplexTrend(sportType, 'cadence', isCompareMode);
        this._totalFeedbackEnergy = new CompareTrendData(
          isCompareMode,
          trendChartColor.totalFeedbackEnergy
        );
        break;
      case SportType.cycle:
        this._totalDistanceMetersTrend = new CompareTrendData(
          isCompareMode,
          trendChartColor.distance
        );
        this._speedPaceTrend = new ComplexTrend(sportType, 'speedPace', isCompareMode);
        this._cadenceTrend = new ComplexTrend(sportType, 'cadence', isCompareMode);
        this._powerTrend = new ComplexTrend(sportType, 'power', isCompareMode);
        this._totalFeedbackEnergy = new CompareTrendData(
          isCompareMode,
          trendChartColor.totalFeedbackEnergy
        );
        break;
      case SportType.weightTrain: {
        const { weightTrainingStrengthLevel, bodyWeight, unit } = userInfo;
        this._weightTrainingTrend = new WeightTrainingTrend(
          weightTrainingStrengthLevel,
          bodyWeight,
          unit
        );
        break;
      }
      case SportType.swim:
        this._totalDistanceMetersTrend = new CompareTrendData(
          isCompareMode,
          trendChartColor.distance
        );
        this._speedPaceTrend = new ComplexTrend(sportType, 'speedPace', isCompareMode);
        this._cadenceTrend = new ComplexTrend(sportType, 'cadence', isCompareMode);
        break;
      case SportType.row:
        this._totalDistanceMetersTrend = new CompareTrendData(
          isCompareMode,
          trendChartColor.distance
        );
        this._speedPaceTrend = new ComplexTrend(sportType, 'speedPace', isCompareMode);
        this._cadenceTrend = new ComplexTrend(sportType, 'cadence', isCompareMode);
        this._powerTrend = new ComplexTrend(sportType, 'power', isCompareMode);
        this._totalFeedbackEnergy = new CompareTrendData(
          isCompareMode,
          trendChartColor.totalFeedbackEnergy
        );
        break;
      case SportType.ball:
        this._totalDistanceMetersTrend = new CompareTrendData(
          isCompareMode,
          trendChartColor.distance
        );
        this._speedPaceTrend = new ComplexTrend(sportType, 'speedPace', isCompareMode);
        this._xGForceTrend = new ComplexTrend(sportType, 'maxXGForce', isCompareMode);
        this._yGForceTrend = new ComplexTrend(sportType, 'maxYGForce', isCompareMode);
        this._zGForceTrend = new ComplexTrend(sportType, 'maxZGForce', isCompareMode);
        break;
      case SportType.all:
        this._totalFeedbackEnergy = new CompareTrendData(
          isCompareMode,
          trendChartColor.totalFeedbackEnergy
        );
        break;
    }

    const allDateList = this.createCompleteDate(dateUnit, isMondayFirst, baseTime, compareTime!);
    of([baseActivitiesData, compareActivitiesData])
      .pipe(
        map((data) => this.filterPersonalData(data, dateUnit!, sportType!)),

        map((filterData) => this.mergeSameDateData(filterData, dateUnit!)),
        map((mergeData) =>
          this.postProcessingPerosnalData(mergeData, sportTargetCondition, benefitTimeStartZone)
        ),
        map((completeData) =>
          this.fillUpDate(
            condition,
            completeData,
            allDateList,
            baseLifeTracking,
            compareLifeTracking
          )
        ),
        map((fillUpData) => this.handleChartData(fillUpData, sportType!))
      )
      .subscribe();
  }

  /**
   * 根據報告時間單位、基準日期範圍與比較日期範圍產生完整的日期序列
   * @param dateUnit {ReportDateUnit}-選擇的報告日期單位
   * @param baseTime {DateRange}-報告基準日期
   * @param compareTime {DateRange}-報告比較日期
   */
  createCompleteDate(
    dateUnit: ReportDateUnit,
    isMondayFirst: boolean,
    baseTime: DateRange,
    compareTime: DateRange
  ) {
    // 若有比較時間，則先確認基準與比較日期何者較長，以較長的日期作為日期範圍長度
    let baseDateList = [];
    let compareDateList = [];
    const unitString = dateUnit.getUnitString();
    const { startTimestamp: baseStart, endTimestamp: baseEnd } = baseTime;
    const referenceUnitString = isMondayFirst ? 'isoWeek' : unitString;
    const baseDiffTime = baseTime.getCrossRange(unitString, referenceUnitString);
    const compareDiffTime = compareTime
      ? compareTime.getCrossRange(unitString, referenceUnitString)
      : -1;
    if (baseDiffTime >= compareDiffTime) {
      baseDateList = this.createDateList([], unitString, baseStart, baseEnd);
      if (compareTime) {
        const { startTimestamp: compareStart } = compareTime;
        const extentCompareEnd = dayjs(compareStart)
          .add(baseDiffTime - 1, unitString)
          .endOf(referenceUnitString)
          .valueOf();

        compareDateList = this.createDateList([], unitString, compareStart, extentCompareEnd);
      }
    } else {
      const extentBaseEnd = dayjs(baseStart)
        .add(compareDiffTime - 1, unitString)
        .endOf(referenceUnitString)
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
      const newStart = dayjs(prevStart)
        .add(1, unitString === 'isoWeek' ? 'week' : unitString)
        .valueOf();
      const newDate = this.getNewDate(unitString, newStart);

      // 將時間逐漸疊加至超過所選時間後，即完成日期清單
      if (newDate.start <= dateEnd) {
        list.push(newDate);
        return this.createDateList(list, unitString, dateStart, dateEnd);
      } else {
        return list;
      }
    } else {
      list.push(this.getNewDate(unitString, dateStart));
      return this.createDateList(list, unitString, dateStart, dateEnd);
    }
  }

  /**
   * 根據時間單位與指定的開始日，取得日期範圍的起始日與結束日
   * @param unitStr {string}-日期單位字串（使用any以符合dayjs type）
   * @param newStart {number}-日期範圍的開始時間
   */
  getNewDate(unitStr: any, newStart: number) {
    const dayjsObj = dayjs(newStart);
    const end = dayjsObj.endOf(unitStr).valueOf();
    return { start: newStart, end };
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
    const compareFilterResult = compareData
      ? this.filterData(compareData, sportType, dataKey, true)
      : undefined;
    return [baseFilterResult, compareFilterResult];
  }

  /**
   * 根據運動類別篩選數據，同時處理心率區間數據與成效分佈圖數據
   * @param data {any}-基準或比較之數據
   * @param sportType {SportType}-運動類別
   * @param key {string}-儲存運動數據物件的鍵名
   * @param isCompareData {boolean}-是否為比較模式
   */
  filterData = (data: Array<any>, sportType: SportType, key: string, isCompareData: boolean) => {
    const checkDataOpen = (resultCode: number) => resultCode === 200;
    const filterResult: Array<any> = [];
    data.forEach((_data) => {
      const result: Array<any> = [];
      const { resultCode: _resultCode } = _data;
      if (checkDataOpen(_resultCode)) {
        _data[key].forEach((_dataRow) => {
          const { activities, startTime, endTime } = _dataRow;
          activities.forEach((_activity) => {
            const { type } = _activity;
            const isAllType = sportType === SportType.all;
            if (isAllType || sportType === +type) {
              // 扁平化方便之後依相同日期範圍合併數據
              result.unshift({
                activities: _activity,
                startTime: this.alignTimeZone(startTime, 'start'),
                endTime: this.alignTimeZone(endTime, 'end'),
              });

              this.handleHrZoneData(_activity, isCompareData);
            }

            if (isAllType) this.handleDistributionChartData(_activity, isCompareData);
          });
        });
      }

      if (result.length > 0) filterResult.push(result);
    });

    return filterResult;
  };

  /**
   * 計算各日期範圍之效益時間、pai、目標達成與否，同時將數據合併為一陣列，以便計算圖表數據
   * @param allData {Array<any>}-基準數據與比較數據
   * @param targetCondition {TargetConditionMap}-依報告時間單位轉換的個人目標條件
   * @param benefitTimeStartZone {BenefitTimeStartZone}-效益時間有效開始區間
   */
  postProcessingPerosnalData(
    allData: Array<any>,
    targetCondition: TargetConditionMap,
    benefitTimeStartZone: BenefitTimeStartZone
  ) {
    const [baseData, compareData] = allData;
    const achievementData = (data: Array<any>) => {
      return data.map((_data) => {
        const {
          activities: {
            totalHrZone0Second: zone0,
            totalHrZone1Second: zone1,
            totalHrZone2Second: zone2,
            totalHrZone3Second: zone3,
            totalHrZone4Second: zone4,
            totalHrZone5Second: zone5,
            totalSecond,
            calories,
            totalActivities,
            avgHeartRateBpm,
          },
          startTime,
          endTime,
        } = _data;

        const hrZone = [zone0, zone1, zone2, zone3, zone4, zone5];
        // 計算效益時間並寫回activities
        const benefitTime = countBenefitTime(hrZone, benefitTimeStartZone);
        _data.activities.benefitTime = benefitTime;

        // 計算pai並寫回activities
        const rowPeriodDay = Math.round((endTime - startTime) / DAY);
        const { pai } = SportsReport.countPai(hrZone, rowPeriodDay);
        _data.activities.pai = pai;

        // 確認達成運動目標與否
        const conditionPercentage = this.getConditionPercentage(targetCondition);
        let achieve = 1;
        let achieveRate = 0;
        targetCondition.forEach((_value, _filedName) => {
          const _filedValue = +_value.filedValue;
          switch (_filedName) {
            case 'totalActivities': {
              if (totalActivities < _filedValue) achieve = 0;
              const conditionAchieveRate = this.getConditionAchieveRate(
                totalActivities,
                _filedValue,
                conditionPercentage
              );
              achieveRate += conditionAchieveRate;
              break;
            }
            case 'totalTime': {
              if (!totalSecond || +totalSecond < _filedValue) achieve = 0;
              const conditionAchieveRate = this.getConditionAchieveRate(
                +totalSecond,
                _filedValue,
                conditionPercentage
              );

              achieveRate += conditionAchieveRate;
              break;
            }
            case 'benefitTime': {
              if (benefitTime < _filedValue) achieve = 0;
              const conditionAchieveRate = this.getConditionAchieveRate(
                benefitTime,
                _filedValue,
                conditionPercentage
              );

              achieveRate += conditionAchieveRate;
              break;
            }
            case 'pai': {
              if (pai < _filedValue) achieve = 0;
              const conditionAchieveRate = this.getConditionAchieveRate(
                pai,
                _filedValue,
                conditionPercentage
              );

              achieveRate += conditionAchieveRate;
              break;
            }
            case 'calories': {
              if (calories < _filedValue) achieve = 0;
              const conditionAchieveRate = this.getConditionAchieveRate(
                calories,
                _filedValue,
                conditionPercentage
              );

              achieveRate += conditionAchieveRate;
              break;
            }
            case 'avgHeartRate': {
              if (avgHeartRateBpm < _filedValue) achieve = 0;
              const conditionAchieveRate = this.getConditionAchieveRate(
                avgHeartRateBpm,
                _filedValue,
                conditionPercentage
              );

              achieveRate += conditionAchieveRate;
              break;
            }
          }
        });

        // 將目標達成數寫回activities，以便之後產生達成率圖表
        _data.activities.achieve = achieve;
        _data.activities.achieveRate = mathRounding(achieveRate * 100, 1);
        return _data;
      });
    };

    const baseDataResult = achievementData(baseData);
    const compareDataResult = compareData ? achievementData(compareData) : undefined;
    return [baseDataResult, compareDataResult];
  }

  /**
   * 將同時間範圍的數據合併為一筆，同時將日期轉為timestamp
   * 若運動類別為不分類別，則同時處理數量與時間佔比圖與成效分佈圖數據
   * @param allData {Array<any>}-已經根據起始時間排序過後的數據
   * @param dateUnit {ReportDateUnit}-報告所選擇的時間單位
   */
  mergeSameDateData(allData: Array<any>, dateUnit: ReportDateUnit) {
    const [baseData, compareData] = allData;
    return [
      this.mergeData(baseData, dateUnit),
      compareData ? this.mergeData(compareData, dateUnit) : undefined,
    ];
  }

  /**
   * 合併數據
   * @param data {Array<any>}-運動數據
   * @param dateUnit {ReportDateUnit}-報告所選擇的時間單位
   */
  mergeData(data: Array<any>, dateUnit: ReportDateUnit) {
    const result: Array<any> = [];
    const temporaryCount = new TemporaryCount();
    const flatData = data[0] || [];
    flatData.forEach((_data, _index) => {
      const { startTime: _startTime, endTime: _endTime, activities: _activities } = _data;
      const { start, end } = this.getSameRangeDate(_startTime, _endTime, dateUnit);
      const { startTime } = temporaryCount.dateRange;
      const isFirstData = _index === 0;
      const isLastData = _index + 1 === flatData.length;
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
   * 將基準數據與比較數據，根據所選日期範圍將日期填補完整
   * 讓圖表呈現時不會跳過無數據之日期
   * 同時將生活追蹤之體重、體脂數據合併至運動數據中方便製作相關圖表
   * @param condition {ReportCondition}-運動報告篩選條件
   * @param allData {Array<any>}-基準與比較日期範圍之運動數據
   * @param allDateList {Array<any>}-基準與比較數據之完整日期清單
   * @param baseLifeTracking {Array<any>}-基準生活追蹤數據
   * @param compareLifeTracking {Array<any>}-比較追蹤數據
   */
  fillUpDate(
    condition: ReportCondition,
    allData: Array<any>,
    allDateList: Array<any>,
    baseLifeTracking?: Array<any>,
    compareLifeTracking?: Array<any>
  ) {
    const [baseDateList, compareDateList] = allDateList;
    const [baseActivitiesData, compareActivitiesData] = allData;
    const baseDataResult = [];
    const compareDataResult = [];
    const lifeTrackingKey = condition.dateUnit.getReportKey('lifeTracking');
    let baseActivitiesIndex = 0;
    let compareActivitiesIndex = 0;
    let baseLifeTrackingIndex = 0;
    let compareLifeTrackingIndex = 0;

    // 將完整日期列表與運動數據合併
    const mergeActivities = (
      startTime: number,
      endTime: number,
      data: any,
      index: number,
      result: Array<any>
    ) => {
      const oneData = data && data.length > 0 ? data[index] : null;
      const activityStart = oneData ? oneData.startTime : null;
      if (startTime !== activityStart) {
        result.push({ activities: {}, startTime, endTime });
      } else {
        result.push(oneData);
        index++;
      }

      return index;
    };

    // 將生活追蹤數據併至activities中
    const mergeLifeTracking = (startTime: number, data: any, index: number, result: Array<any>) => {
      const lifeTrackingLength = data ? data[0][lifeTrackingKey].length : -1;
      if (lifeTrackingLength > 0) {
        const reverseIndex = lifeTrackingLength - 1 - index; // 生活追蹤數據排序為由新->舊
        const lifeTrackingData = data[0][lifeTrackingKey][reverseIndex];
        const lifeTrackingStart = lifeTrackingData
          ? this.alignTimeZone(lifeTrackingData.startTime, 'start')
          : null;
        if (startTime === lifeTrackingStart) {
          const { bodyWeight, fatRate } = lifeTrackingData;
          if (bodyWeight || fatRate) {
            const resultCurrentIndex = result.length - 1;
            Object.assign(result[resultCurrentIndex].activities, { fatRate, bodyWeight });
          }

          index++;
        }
      }

      return index;
    };

    baseDateList.forEach((_date, _index) => {
      const { start: _baseStart, end: _baseEnd } = _date;
      baseActivitiesIndex = mergeActivities(
        _baseStart,
        _baseEnd,
        baseActivitiesData,
        baseActivitiesIndex,
        baseDataResult
      );
      baseLifeTrackingIndex = mergeLifeTracking(
        _baseStart,
        baseLifeTracking,
        baseLifeTrackingIndex,
        baseDataResult
      );
      if (compareActivitiesData) {
        const { start: _compareStart, end: _compareEnd } = compareDateList[_index];
        compareActivitiesIndex = mergeActivities(
          _compareStart,
          _compareEnd,
          compareActivitiesData,
          compareActivitiesIndex,
          compareDataResult
        );
        compareLifeTrackingIndex = mergeLifeTracking(
          _compareStart,
          compareLifeTracking,
          compareLifeTrackingIndex,
          compareDataResult
        );
      }
    });

    return [baseDataResult, compareActivitiesData ? compareDataResult : undefined];
  }

  /**
   * 將基準數據與比較數據進行整合，產生圖表所需數據
   * @param allData {Array<any>}-已篩選運動類別且已魂混合並依時間排序的基準數據與比較數據
   * @param sportType {SportType}-報告運動類別
   */
  handleChartData(allData: Array<any>, sportType: SportType) {
    const [baseData, compareData] = allData;
    if (!compareData) return this.handleChart(baseData, sportType);
    return this.handleChartWithCompare(allData, sportType);
  }

  /**
   * 將基準數據整理成各圖表所需數據
   * @param data {Array<any>}-基準運動概要陣列數據
   * @param sportType {SportType}-報告運動類別
   */
  handleChart(data: Array<any>, sportType: SportType) {
    data.forEach((_data) => {
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
        achieve: _achieve,
        achieveRate: _achieveRate,
        totalActivities: _totalActivities,
        benefitTime: _benefitTime,
        pai: _pai,
        totalDistanceMeters: _totalDistanceMeters,
        avgHeartRateBpm: _avgHeartRateBpm,
        avgMaxHeartRateBpm: _avgMaxHeartRateBpm,
        fatRate: _fatRate,
        bodyWeight: _bodyWeight,
        avgSpeed: _avgSpeed,
        avgMaxSpeed: _avgMaxSpeed,
        avgRunMaxCadence: _avgRunMaxCadence,
        runAvgCadence: _runAvgCadence,
        cycleAvgCadence: _cycleAvgCadence,
        avgCycleMaxCadence: _avgCycleMaxCadence,
        cycleAvgWatt: _cycleAvgWatt,
        avgCycleMaxWatt: _avgCycleMaxWatt,
        avgSwimMaxCadence: _avgSwimMaxCadence,
        swimAvgCadence: _swimAvgCadence,
        avgRowingMaxCadence: _avgRowingMaxCadence,
        rowingAvgCadence: _rowingAvgCadence,
        rowingAvgWatt: _rowingAvgWatt,
        rowingMaxWatt: _rowingMaxWatt,
        totalMinusGforceX: _totalMinusGforceX,
        totalMinusGforceY: _totalMinusGforceY,
        totalMinusGforceZ: _totalMinusGforceZ,
        totalPlusGforceX: _totalPlusGforceX,
        totalPlusGforceY: _totalPlusGforceY,
        totalPlusGforceZ: _totalPlusGforceZ,
        maxGforceX: _maxGforceX,
        maxGforceY: _maxGforceY,
        maxGforceZ: _maxGforceZ,
        miniGforceX: _miniGforceX,
        miniGforceY: _miniGforceY,
        miniGforceZ: _miniGforceZ,
        weightTrainingInfo: _weightTrainingInfo,
        totalFeedbackEnergy: _totalFeedbackEnergy,
      } = _activities;
      const tableData: any = {};

      const dateRange = [_startTime, _endTime];
      const hrZone = [_z0, _z1, _z2, _z3, _z4, _z5].map((_zone) => (_zone ? _zone : 0));
      this._hrZoneTrend.addBaseData(hrZone, dateRange);
      this._totalSecondTrend.addBaseData(+_totalSecond, dateRange);
      this._benefitTimeTrend.addBaseData(_benefitTime, dateRange);
      this._caloriesTrend.addBaseData(_calories, dateRange);
      this._totalActivitiesTrend.addBaseData(_totalActivities, dateRange);
      this._paiTrend.addBaseData(_pai, dateRange);
      this._targertAchieveTrend.addBaseData(_achieve, dateRange);
      this._complexHrTrend.addBaseData(_avgMaxHeartRateBpm, _avgHeartRateBpm, dateRange);
      this._bodyWeightTrend.addBaseData(_bodyWeight, _fatRate, dateRange);
      this._baseTotalAchieveRate += _achieveRate ?? 0;
      Object.assign(tableData, {
        dateRange: dateRange,
        hrZone: hrZone,
        totalSecond: _totalSecond ? +_totalSecond : 0,
        benefitTime: _benefitTime,
        calories: _calories,
        totalActivities: _totalActivities,
        pai: _pai,
        achieveRate: _achieveRate,
        avgMaxHeartRateBpm: _avgMaxHeartRateBpm,
        avgHeartRateBpm: _avgHeartRateBpm,
        bodyWeight: _bodyWeight,
        fatRate: _fatRate,
      });

      switch (sportType) {
        case SportType.run:
          this._totalDistanceMetersTrend.addBaseData(_totalDistanceMeters, dateRange);
          this._speedPaceTrend.addBaseData(_avgMaxSpeed, _avgSpeed, dateRange);
          this._cadenceTrend.addBaseData(_avgRunMaxCadence, _runAvgCadence, dateRange);
          this._totalFeedbackEnergy.addBaseData(_totalFeedbackEnergy, dateRange);
          Object.assign(tableData, {
            totalDistanceMeters: _totalDistanceMeters,
            avgMaxSpeed: _avgMaxSpeed,
            avgSpeed: _avgSpeed,
            avgMaxCadence: _avgRunMaxCadence,
            avgCadence: _runAvgCadence,
            totalFeedbackEnergy: _totalFeedbackEnergy,
          });
          break;
        case SportType.cycle:
          this._totalDistanceMetersTrend.addBaseData(_totalDistanceMeters, dateRange);
          this._speedPaceTrend.addBaseData(_avgMaxSpeed, _avgSpeed, dateRange);
          this._cadenceTrend.addBaseData(_avgCycleMaxCadence, _cycleAvgCadence, dateRange);
          this._powerTrend.addBaseData(_avgCycleMaxWatt, _cycleAvgWatt, dateRange);
          this._totalFeedbackEnergy.addBaseData(_totalFeedbackEnergy, dateRange);
          Object.assign(tableData, {
            totalDistanceMeters: _totalDistanceMeters,
            avgMaxSpeed: _avgMaxSpeed,
            avgSpeed: _avgSpeed,
            avgMaxCadence: _avgCycleMaxCadence,
            avgCadence: _cycleAvgCadence,
            avgMaxWatt: _avgCycleMaxWatt,
            avgWatt: _cycleAvgWatt,
            totalFeedbackEnergy: _totalFeedbackEnergy,
          });
          break;
        case SportType.weightTrain:
          this._weightTrainingTrend.addTrainData('base', _weightTrainingInfo ?? [], dateRange);
          break;
        case SportType.swim:
          this._totalDistanceMetersTrend.addBaseData(_totalDistanceMeters, dateRange);
          this._speedPaceTrend.addBaseData(_avgMaxSpeed, _avgSpeed, dateRange);
          this._cadenceTrend.addBaseData(_avgSwimMaxCadence, _swimAvgCadence, dateRange);
          Object.assign(tableData, {
            totalDistanceMeters: _totalDistanceMeters,
            avgMaxSpeed: _avgMaxSpeed,
            avgSpeed: _avgSpeed,
            avgMaxCadence: _avgSwimMaxCadence,
            avgCadence: _swimAvgCadence,
          });
          break;
        case SportType.row:
          this._totalDistanceMetersTrend.addBaseData(_totalDistanceMeters, dateRange);
          this._speedPaceTrend.addBaseData(_avgMaxSpeed, _avgSpeed, dateRange);
          this._cadenceTrend.addBaseData(_avgRowingMaxCadence, _rowingAvgCadence, dateRange);
          this._powerTrend.addBaseData(_rowingMaxWatt, _rowingAvgWatt, dateRange);
          this._totalFeedbackEnergy.addBaseData(_totalFeedbackEnergy, dateRange);
          Object.assign(tableData, {
            totalDistanceMeters: _totalDistanceMeters,
            avgMaxSpeed: _avgMaxSpeed,
            avgSpeed: _avgSpeed,
            avgMaxCadence: _avgRowingMaxCadence,
            avgCadence: _rowingAvgCadence,
            avgMaxWatt: _rowingMaxWatt,
            avgWatt: _rowingAvgWatt,
            totalFeedbackEnergy: _totalFeedbackEnergy,
          });

          break;
        case SportType.ball:
          this._totalDistanceMetersTrend.addBaseData(_totalDistanceMeters, dateRange);
          this._speedPaceTrend.addBaseData(_avgMaxSpeed, _avgSpeed, dateRange);
          this._xGForceTrend.addBaseData(_maxGforceX, _miniGforceX, dateRange);
          this._yGForceTrend.addBaseData(_maxGforceY, _miniGforceY, dateRange);
          this._zGForceTrend.addBaseData(_maxGforceZ, _miniGforceZ, dateRange);
          Object.assign(tableData, {
            totalDistanceMeters: _totalDistanceMeters,
            avgMaxSpeed: _avgMaxSpeed,
            avgSpeed: _avgSpeed,
          });

          break;
        case SportType.all:
          this._totalFeedbackEnergy.addBaseData(_totalFeedbackEnergy, dateRange);
          tableData.totalFeedbackEnergy = _totalFeedbackEnergy;
          break;
      }

      this._sportsTableData.push([tableData]);
    });
  }

  /**
   * 將基準與比較數據整理成各圖表所需數據
   * @param allData {Array<any>}-基準與比較之運動概要陣列數據
   * @param sportType {SportType}-報告運動類別
   */
  handleChartWithCompare(allData: Array<any>, sportType: SportType) {
    const [baseData, compareData] = allData;
    baseData.forEach((_baseData, _index) => {
      const {
        activities: _baseActivities,
        startTime: _baseStartTime,
        endTime: _baseEndTime,
      } = _baseData;
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
        achieve: _baseAchieve,
        achieveRate: _baseAchieveRate,
        totalActivities: _baseTotalActivities,
        benefitTime: _baseBenefitTime,
        pai: _basePai,
        totalDistanceMeters: _baseTotalDistanceMeters,
        avgHeartRateBpm: _baseAvgHeartRateBpm,
        avgMaxHeartRateBpm: _baseAvgMaxHeartRateBpm,
        bodyWeight: _baseBodyWeight,
        fatRate: _baseFatRate,
        avgSpeed: _baseAvgSpeed,
        avgMaxSpeed: _baseAvgMaxSpeed,
        avgRunMaxCadence: _baseAvgRunMaxCadence,
        runAvgCadence: _baseRunAvgCadence,
        cycleAvgCadence: _baseCycleAvgCadence,
        avgCycleMaxCadence: _baseAvgCycleMaxCadence,
        cycleAvgWatt: _baseCycleAvgWatt,
        avgCycleMaxWatt: _baseAvgCycleMaxWatt,
        avgSwimMaxCadence: _baseAvgSwimMaxCadence,
        swimAvgCadence: _baseSwimAvgCadence,
        avgRowingMaxCadence: _baseAvgRowingMaxCadence,
        rowingAvgCadence: _baseRowingAvgCadence,
        rowingAvgWatt: _baseRowingAvgWatt,
        rowingMaxWatt: _baseRowingMaxWatt,
        maxGforceX: _baseMaxGforceX,
        maxGforceY: _baseMaxGforceY,
        maxGforceZ: _baseMaxGforceZ,
        miniGforceX: _baseMiniGforceX,
        miniGforceY: _baseMiniGforceY,
        miniGforceZ: _baseMiniGforceZ,
        weightTrainingInfo: _baseWeightTrainingInfo,
        totalFeedbackEnergy: _baseTotalFeedbackEnergy,
      } = _baseActivities;

      const {
        activities: _compareActivities,
        startTime: _compareStartTime,
        endTime: _compareEndTime,
      } = compareData[_index];
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
        achieve: _compareAchieve,
        achieveRate: _compareAchieveRate,
        totalActivities: _compareTotalActivities,
        benefitTime: _compareBenefitTime,
        pai: _comparePai,
        totalDistanceMeters: _compareTotalDistanceMeters,
        avgHeartRateBpm: _compareAvgHeartRateBpm,
        avgMaxHeartRateBpm: _compareAvgMaxHeartRateBpm,
        bodyWeight: _compareBodyWeight,
        fatRate: _compareFatRate,
        avgSpeed: _compareAvgSpeed,
        avgMaxSpeed: _compareAvgMaxSpeed,
        avgRunMaxCadence: _compareAvgRunMaxCadence,
        runAvgCadence: _compareRunAvgCadence,
        cycleAvgCadence: _compareCycleAvgCadence,
        avgCycleMaxCadence: _compareAvgCycleMaxCadence,
        cycleAvgWatt: _compareCycleAvgWatt,
        avgCycleMaxWatt: _compareAvgCycleMaxWatt,
        avgSwimMaxCadence: _compareAvgSwimMaxCadence,
        swimAvgCadence: _compareSwimAvgCadence,
        avgRowingMaxCadence: _compareAvgRowingMaxCadence,
        rowingAvgCadence: _compareRowingAvgCadence,
        rowingAvgWatt: _compareRowingAvgWatt,
        rowingMaxWatt: _compareRowingMaxWatt,
        maxGforceX: _compareMaxGforceX,
        maxGforceY: _compareMaxGforceY,
        maxGforceZ: _compareMaxGforceZ,
        miniGforceX: _compareMiniGforceX,
        miniGforceY: _compareMiniGforceY,
        miniGforceZ: _compareMiniGforceZ,
        weightTrainingInfo: _compareWeightTrainingInfo,
        totalFeedbackEnergy: _compareTotalFeedbackEnergy,
      } = _compareActivities;
      const baseTableData: any = {};
      const compareTableData: any = {};

      const _baseHrZone = [_baseZ0, _baseZ1, _baseZ2, _baseZ3, _baseZ4, _baseZ5].map((_zone) =>
        _zone ? _zone : 0
      );
      const _baseDateRange = [_baseStartTime, _baseEndTime];
      const _compareHrZone = [
        _compareZ0,
        _compareZ1,
        _compareZ2,
        _compareZ3,
        _compareZ4,
        _compareZ5,
      ].map((_zone) => (_zone ? _zone : 0));
      const _compareDateRange = [_compareStartTime, _compareEndTime];
      this._hrZoneTrend.addMixData(_baseHrZone, _baseDateRange, _compareHrZone, _compareDateRange);
      this._totalSecondTrend.addMixData(
        +_baseTotalSecond,
        _baseDateRange,
        +_compareTotalSecond,
        _compareDateRange
      );
      this._benefitTimeTrend.addMixData(
        _baseBenefitTime,
        _baseDateRange,
        _compareBenefitTime,
        _compareDateRange
      );
      this._caloriesTrend.addMixData(
        _baseCalories,
        _baseDateRange,
        _compareCalories,
        _compareDateRange
      );
      this._totalActivitiesTrend.addMixData(
        _baseTotalActivities,
        _baseDateRange,
        _compareTotalActivities,
        _compareDateRange
      );
      this._paiTrend.addMixData(_basePai, _baseDateRange, _comparePai, _compareDateRange);
      this._targertAchieveTrend.addMixData(
        _baseAchieve,
        _baseDateRange,
        _compareAchieve,
        _compareDateRange
      );

      const baseHrData = {
        max: _baseAvgMaxHeartRateBpm,
        avgOrMin: _baseAvgHeartRateBpm,
        dateRange: _baseDateRange,
      };
      const compareHrData = {
        max: _compareAvgMaxHeartRateBpm,
        avgOrMin: _compareAvgHeartRateBpm,
        dateRange: _compareDateRange,
      };
      this._complexHrTrend.addMixData(baseHrData, compareHrData);

      const baseBodyData = {
        weight: _baseBodyWeight,
        fatRate: _baseFatRate,
        dateRange: _baseDateRange,
      };
      const compareBodyData = {
        weight: _compareBodyWeight,
        fatRate: _compareFatRate,
        dateRange: _compareDateRange,
      };
      this._bodyWeightTrend.addMixData(baseBodyData, compareBodyData);
      this._baseTotalAchieveRate += _baseAchieveRate ?? 0;
      this._compareTotalAchieveRate += _compareAchieveRate ?? 0;
      Object.assign(baseTableData, {
        dateRange: _baseDateRange,
        hrZone: _baseHrZone,
        totalSecond: _baseTotalSecond ? +_baseTotalSecond : 0,
        benefitTime: _baseBenefitTime,
        calories: _baseCalories,
        totalActivities: _baseTotalActivities,
        pai: _basePai,
        achieveRate: _baseAchieveRate,
        avgMaxHeartRateBpm: _baseAvgMaxHeartRateBpm,
        avgHeartRateBpm: _baseAvgHeartRateBpm,
        bodyWeight: _baseBodyWeight,
        fatRate: _baseFatRate,
      });

      Object.assign(compareTableData, {
        dateRange: _compareDateRange,
        hrZone: _compareHrZone,
        totalSecond: _compareTotalSecond ? +_compareTotalSecond : 0,
        benefitTime: _compareBenefitTime,
        calories: _compareCalories,
        totalActivities: _compareTotalActivities,
        pai: _comparePai,
        achieveRate: _compareAchieveRate,
        avgMaxHeartRateBpm: _compareAvgMaxHeartRateBpm,
        avgHeartRateBpm: _compareAvgHeartRateBpm,
        bodyWeight: _compareBodyWeight,
        fatRate: _compareFatRate,
      });

      switch (sportType) {
        case SportType.run: {
          this._totalDistanceMetersTrend.addMixData(
            _baseTotalDistanceMeters,
            _baseDateRange,
            _compareTotalDistanceMeters,
            _compareDateRange
          );

          const baseSpeedData = {
            max: _baseAvgMaxSpeed,
            avgOrMin: _baseAvgSpeed,
            dateRange: _baseDateRange,
          };
          const compareSpeedData = {
            max: _compareAvgMaxSpeed,
            avgOrMin: _compareAvgSpeed,
            dateRange: _compareDateRange,
          };
          this._speedPaceTrend.addMixData(baseSpeedData, compareSpeedData);

          const baseCadenceData = {
            max: _baseAvgRunMaxCadence,
            avgOrMin: _baseRunAvgCadence,
            dateRange: _baseDateRange,
          };
          const compareCadenceData = {
            max: _compareAvgRunMaxCadence,
            avgOrMin: _compareRunAvgCadence,
            dateRange: _compareDateRange,
          };
          this._cadenceTrend.addMixData(baseCadenceData, compareCadenceData);
          this._totalFeedbackEnergy.addMixData(
            _baseTotalFeedbackEnergy,
            _baseDateRange,
            _compareTotalFeedbackEnergy,
            _compareDateRange
          );

          Object.assign(baseTableData, {
            totalDistanceMeters: _baseTotalDistanceMeters,
            avgMaxSpeed: _baseAvgMaxSpeed,
            avgSpeed: _baseAvgSpeed,
            avgMaxCadence: _baseAvgRunMaxCadence,
            avgCadence: _baseRunAvgCadence,
            totalFeedbackEnergy: _baseTotalFeedbackEnergy,
          });

          Object.assign(compareTableData, {
            totalDistanceMeters: _compareTotalDistanceMeters,
            avgMaxSpeed: _compareAvgMaxSpeed,
            avgSpeed: _compareAvgSpeed,
            avgMaxCadence: _compareAvgRunMaxCadence,
            avgCadence: _compareRunAvgCadence,
            totalFeedbackEnergy: _compareTotalFeedbackEnergy,
          });
          break;
        }
        case SportType.cycle: {
          this._totalDistanceMetersTrend.addMixData(
            _baseTotalDistanceMeters,
            _baseDateRange,
            _compareTotalDistanceMeters,
            _compareDateRange
          );

          const baseSpeedData = {
            max: _baseAvgMaxSpeed,
            avgOrMin: _baseAvgSpeed,
            dateRange: _baseDateRange,
          };
          const compareSpeedData = {
            max: _compareAvgMaxSpeed,
            avgOrMin: _compareAvgSpeed,
            dateRange: _compareDateRange,
          };
          this._speedPaceTrend.addMixData(baseSpeedData, compareSpeedData);

          const baseCadenceData = {
            max: _baseAvgCycleMaxCadence,
            avgOrMin: _baseCycleAvgCadence,
            dateRange: _baseDateRange,
          };
          const compareCadenceData = {
            max: _compareAvgCycleMaxCadence,
            avgOrMin: _compareCycleAvgCadence,
            dateRange: _compareDateRange,
          };
          this._cadenceTrend.addMixData(baseCadenceData, compareCadenceData);

          const basePowerData = {
            max: _baseAvgCycleMaxWatt,
            avgOrMin: _baseCycleAvgWatt,
            dateRange: _baseDateRange,
          };
          const comparePowerData = {
            max: _compareAvgCycleMaxWatt,
            avgOrMin: _compareCycleAvgWatt,
            dateRange: _compareDateRange,
          };
          this._powerTrend.addMixData(basePowerData, comparePowerData);
          this._totalFeedbackEnergy.addMixData(
            _baseTotalFeedbackEnergy,
            _baseDateRange,
            _compareTotalFeedbackEnergy,
            _compareDateRange
          );

          Object.assign(baseTableData, {
            totalDistanceMeters: _baseTotalDistanceMeters,
            avgMaxSpeed: _baseAvgMaxSpeed,
            avgSpeed: _baseAvgSpeed,
            avgMaxCadence: _baseAvgCycleMaxCadence,
            avgCadence: _baseCycleAvgCadence,
            avgMaxWatt: _baseAvgCycleMaxWatt,
            avgWatt: _baseCycleAvgWatt,
            totalFeedbackEnergy: _baseTotalFeedbackEnergy,
          });

          Object.assign(compareTableData, {
            totalDistanceMeters: _compareTotalDistanceMeters,
            avgMaxSpeed: _compareAvgMaxSpeed,
            avgSpeed: _compareAvgSpeed,
            avgMaxCadence: _compareAvgCycleMaxCadence,
            avgCadence: _compareCycleAvgCadence,
            avgMaxWatt: _compareAvgCycleMaxWatt,
            avgWatt: _compareCycleAvgWatt,
            totalFeedbackEnergy: _compareTotalFeedbackEnergy,
          });

          break;
        }
        case SportType.weightTrain:
          this._weightTrainingTrend.addTrainData(
            'base',
            _baseWeightTrainingInfo ?? [],
            _baseDateRange
          );
          this._weightTrainingTrend.addTrainData(
            'compare',
            _compareWeightTrainingInfo ?? [],
            _compareDateRange
          );
          break;
        case SportType.swim: {
          this._totalDistanceMetersTrend.addMixData(
            _baseTotalDistanceMeters,
            _baseDateRange,
            _compareTotalDistanceMeters,
            _compareDateRange
          );

          const baseSpeedData = {
            max: _baseAvgMaxSpeed,
            avgOrMin: _baseAvgSpeed,
            dateRange: _baseDateRange,
          };
          const compareSpeedData = {
            max: _compareAvgMaxSpeed,
            avgOrMin: _compareAvgSpeed,
            dateRange: _compareDateRange,
          };
          this._speedPaceTrend.addMixData(baseSpeedData, compareSpeedData);

          const baseCadenceData = {
            max: _baseAvgSwimMaxCadence,
            avgOrMin: _baseSwimAvgCadence,
            dateRange: _baseDateRange,
          };
          const compareCadenceData = {
            max: _compareAvgSwimMaxCadence,
            avgOrMin: _compareSwimAvgCadence,
            dateRange: _compareDateRange,
          };
          this._cadenceTrend.addMixData(baseCadenceData, compareCadenceData);

          Object.assign(baseTableData, {
            totalDistanceMeters: _baseTotalDistanceMeters,
            avgMaxSpeed: _baseAvgMaxSpeed,
            avgSpeed: _baseAvgSpeed,
            avgMaxCadence: _baseAvgRowingMaxCadence,
            avgCadence: _baseSwimAvgCadence,
          });

          Object.assign(compareTableData, {
            totalDistanceMeters: _compareTotalDistanceMeters,
            avgMaxSpeed: _compareAvgMaxSpeed,
            avgSpeed: _compareAvgSpeed,
            avgMaxCadence: _compareAvgRowingMaxCadence,
            avgCadence: _compareSwimAvgCadence,
          });
          break;
        }
        case SportType.row: {
          this._totalDistanceMetersTrend.addMixData(
            _baseTotalDistanceMeters,
            _baseDateRange,
            _compareTotalDistanceMeters,
            _compareDateRange
          );

          const baseSpeedData = {
            max: _baseAvgMaxSpeed,
            avgOrMin: _baseAvgSpeed,
            dateRange: _baseDateRange,
          };
          const compareSpeedData = {
            max: _compareAvgMaxSpeed,
            avgOrMin: _compareAvgSpeed,
            dateRange: _compareDateRange,
          };
          this._speedPaceTrend.addMixData(baseSpeedData, compareSpeedData);

          const baseCadenceData = {
            max: _baseAvgRowingMaxCadence,
            avgOrMin: _baseRowingAvgCadence,
            dateRange: _baseDateRange,
          };
          const compareCadenceData = {
            max: _compareAvgRowingMaxCadence,
            avgOrMin: _compareRowingAvgCadence,
            dateRange: _compareDateRange,
          };
          this._cadenceTrend.addMixData(baseCadenceData, compareCadenceData);

          const basePowerData = {
            max: _baseRowingMaxWatt,
            avgOrMin: _baseRowingAvgWatt,
            dateRange: _baseDateRange,
          };
          const comparePowerData = {
            max: _compareRowingMaxWatt,
            avgOrMin: _compareRowingAvgWatt,
            dateRange: _compareDateRange,
          };
          this._powerTrend.addMixData(basePowerData, comparePowerData);
          this._totalFeedbackEnergy.addMixData(
            _baseTotalFeedbackEnergy,
            _baseDateRange,
            _compareTotalFeedbackEnergy,
            _compareDateRange
          );

          Object.assign(baseTableData, {
            totalDistanceMeters: _baseTotalDistanceMeters,
            avgMaxSpeed: _baseAvgMaxSpeed,
            avgSpeed: _baseAvgSpeed,
            avgMaxCadence: _baseAvgRowingMaxCadence,
            avgCadence: _baseRowingAvgCadence,
            avgMaxWatt: _baseRowingMaxWatt,
            avgWatt: _baseRowingAvgWatt,
            totalFeedbackEnergy: _baseTotalFeedbackEnergy,
          });

          Object.assign(compareTableData, {
            totalDistanceMeters: _compareTotalDistanceMeters,
            avgMaxSpeed: _compareAvgMaxSpeed,
            avgSpeed: _compareAvgSpeed,
            avgMaxCadence: _compareAvgRowingMaxCadence,
            avgCadence: _compareRowingAvgCadence,
            avgMaxWatt: _compareRowingMaxWatt,
            avgWatt: _compareRowingAvgWatt,
            totalFeedbackEnergy: _compareTotalFeedbackEnergy,
          });

          break;
        }
        case SportType.ball: {
          this._totalDistanceMetersTrend.addMixData(
            _baseTotalDistanceMeters,
            _baseDateRange,
            _compareTotalDistanceMeters,
            _compareDateRange
          );

          const baseSpeedData = {
            max: _baseAvgMaxSpeed,
            avgOrMin: _baseAvgSpeed,
            dateRange: _baseDateRange,
          };
          const compareSpeedData = {
            max: _compareAvgMaxSpeed,
            avgOrMin: _compareAvgSpeed,
            dateRange: _compareDateRange,
          };
          this._speedPaceTrend.addMixData(baseSpeedData, compareSpeedData);

          const baseXGForceData = {
            max: _baseMaxGforceX,
            avgOrMin: _baseMiniGforceX,
            dateRange: _baseDateRange,
          };
          const compareXGForceData = {
            max: _compareMaxGforceX,
            avgOrMin: _compareMiniGforceX,
            dateRange: _compareDateRange,
          };
          this._xGForceTrend.addMixData(baseXGForceData, compareXGForceData);

          const baseYGForceData = {
            max: _baseMaxGforceY,
            avgOrMin: _baseMiniGforceY,
            dateRange: _baseDateRange,
          };
          const compareYGForceData = {
            max: _compareMaxGforceY,
            avgOrMin: _compareMiniGforceY,
            dateRange: _compareDateRange,
          };
          this._yGForceTrend.addMixData(baseYGForceData, compareYGForceData);

          const baseZGForceData = {
            max: _baseMaxGforceZ,
            avgOrMin: _baseMiniGforceZ,
            dateRange: _baseDateRange,
          };
          const compareZGForceData = {
            max: _compareMaxGforceZ,
            avgOrMin: _compareMiniGforceZ,
            dateRange: _compareDateRange,
          };
          this._zGForceTrend.addMixData(baseZGForceData, compareZGForceData);

          Object.assign(baseTableData, {
            totalDistanceMeters: _baseTotalDistanceMeters,
            avgMaxSpeed: _baseAvgMaxSpeed,
            avgSpeed: _baseAvgSpeed,
          });

          Object.assign(compareTableData, {
            totalDistanceMeters: _compareTotalDistanceMeters,
            avgMaxSpeed: _compareAvgMaxSpeed,
            avgSpeed: _compareAvgSpeed,
          });
          break;
        }
        case SportType.all:
          this._totalFeedbackEnergy.addMixData(
            _baseTotalFeedbackEnergy,
            _baseDateRange,
            _compareTotalFeedbackEnergy,
            _compareDateRange
          );
          baseTableData.totalFeedbackEnergy = _baseTotalFeedbackEnergy;
          compareTableData.totalFeedbackEnergy = _compareTotalFeedbackEnergy;
          break;
      }

      this._sportsTableData.push([baseTableData, compareTableData]);
    });
  }

  /**
   * 統一時區，以utc字串之日期部份進行對齊
   * @param utcTime {string}-utc time
   * @param type {'start' | 'end'}-開始或結束日期
   */
  alignTimeZone(utcTime: string, type: 'start' | 'end') {
    const alignTime = dayjs(utcTime.split('T')[0], 'YYYY-MM-DD');
    return type === 'start' ? alignTime.startOf('day').valueOf() : alignTime.endOf('day').valueOf();
  }

  /**
   * 處理群組心率區間數據
   * @param activity {any}-運動數據
   * @param isCompareData {boolean}-是否為比較數據
   */
  handleHrZoneData(activity: any, isCompareData: boolean) {
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
    const { totalSecond, totalActivities, avgHeartRateBpm, type } = activity;
    const onePoint = {
      type: +type as SportType,
      totalSecond,
      totalActivities,
      avgHeartRateBpm,
    };

    if (isCompareData) {
      this._compareTypeAllChart.count(onePoint);
    } else {
      this._baseTypeAllChart.count(onePoint);
    }
  }

  /**
   * 根據報告日期單位與報告日期，取得所屬範圍
   * @param startTime {string}-開始時間
   * @param endTime {string}-結束時間
   * @param dateUnit {ReportDateUnit}-報告所選擇的時間單位
   */
  getSameRangeDate(startTime: string, endTime: string, dateUnit: ReportDateUnit) {
    const startTimestamp = dayjs(startTime).startOf('day').valueOf();
    const endTimestamp = dayjs(endTime).endOf('day').valueOf();
    switch (dateUnit.unit) {
      case DateUnit.season: {
        const seasonStart = dayjs(startTimestamp).startOf('quarter').valueOf();
        const seasonEnd = dayjs(endTimestamp).endOf('quarter').valueOf();
        return { start: seasonStart, end: seasonEnd };
      }
      case DateUnit.year: {
        const rangeStart = dayjs(startTimestamp).startOf('year').valueOf();
        const rangeEnd = dayjs(endTimestamp).endOf('year').valueOf();
        return { start: rangeStart, end: rangeEnd };
      }
      default:
        return { start: startTimestamp, end: endTimestamp };
    }
  }

  /**
   * 取得條件達成率
   * @param value {number}-運動數據
   * @param conditionTarget {number}-達成該目標條件的數值
   * @param conditionPercentage {number}-該條件佔所有條件的佔比
   */
  getConditionAchieveRate(value: number, conditionTarget: number, conditionPercentage: number) {
    const effectValue = value ?? 0;
    let percentage = 0;
    if (!conditionTarget || effectValue >= conditionTarget) {
      percentage = 1;
    } else {
      percentage = effectValue / conditionTarget;
    }

    return mathRounding(percentage * conditionPercentage, 4);
  }

  /**
   * 取得條件佔比
   * @param conditionMap {TargetConditionMap}-目標日期單位
   */
  getConditionPercentage(conditionMap: TargetConditionMap) {
    const totalConditionCount = conditionMap?.size;
    return totalConditionCount ? 1 / totalConditionCount : 1;
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
   * 取得效益時間趨勢數據
   */
  get benefitTimeTrend() {
    return this._benefitTimeTrend;
  }

  /**
   * 取得pai趨勢數據
   */
  get paiTrend() {
    return this._paiTrend;
  }

  /**
   * 取得卡路里趨勢數據
   */
  get caloriesTrend() {
    return this._caloriesTrend;
  }

  /**
   * 取得總發電量趨勢數據
   */
  get totalFeedbackEnergyTrend() {
    return this._totalFeedbackEnergy;
  }

  /**
   * 取得次數趨勢數據
   */
  get totalActivitiesTrend() {
    return this._totalActivitiesTrend;
  }

  /**
   * 取得距離趨勢數據
   */
  get distanceTrend() {
    return this._totalDistanceMetersTrend;
  }

  /**
   * 取得目標達成率數據
   */
  get targertAchieveTrend() {
    return this._targertAchieveTrend;
  }

  /**
   * 取得最大與平均心率趨勢圖數據
   */
  get complexHrTrend() {
    return this._complexHrTrend;
  }

  /**
   * 取得個人體重相關趨勢圖數據
   */
  get bodyWeightTrend() {
    return this._bodyWeightTrend;
  }

  /**
   * 取得個人速度趨勢圖數據
   */
  get speedPaceTrend() {
    return this._speedPaceTrend;
  }

  /**
   * 取得個人頻率相關趨勢圖數據
   */
  get cadenceTrend() {
    return this._cadenceTrend;
  }

  /**
   * 取得個人功率相關趨勢圖數據
   */
  get powerTrend() {
    return this._powerTrend;
  }

  /**
   * 取得x軸正向與反向最大G值相關趨勢圖數據
   */
  get xGForceTrend() {
    return this._xGForceTrend;
  }

  /**
   * 取得y軸正向與反向最大G值相關趨勢圖數據
   */
  get yGForceTrend() {
    return this._yGForceTrend;
  }

  /**
   * 取得z軸正向與反向最大G值相關趨勢圖數據
   */
  get zGForceTrend() {
    return this._zGForceTrend;
  }

  /**
   * 取得重訓肌肉地圖與趨勢圖所需數據
   */
  get weightTrainingTrend() {
    return this._weightTrainingTrend;
  }

  /**
   * 取得運動表格數據
   */
  get sportsTableData() {
    return this._sportsTableData;
  }

  /**
   * 取得報告基準範圍目標均化達成率
   */
  get baseTargetAchieveRate() {
    const { _sportsTableData, _baseTotalAchieveRate } = this;
    const dataLength = _sportsTableData.length;
    const denominator = dataLength ? dataLength : Infinity;
    return {
      value: mathRounding(_baseTotalAchieveRate / denominator, 1),
      unit: '%',
    };
  }

  /**
   * 取得報告比較範圍目標均化達成率
   */
  get compareTargetAchieveRate() {
    const { _sportsTableData, _compareTotalAchieveRate } = this;
    const dataLength = _sportsTableData.length;
    const denominator = dataLength ? dataLength : Infinity;
    return {
      value: mathRounding(_compareTotalAchieveRate / denominator, 1),
      unit: '%',
    };
  }

  /**
   * 取得報告基準與比較範圍目標均化達成率的差值
   */
  get diffTargetAchieveRate() {
    const { _sportsTableData, _baseTotalAchieveRate, _compareTotalAchieveRate } = this;
    const dataLength = _sportsTableData.length;
    const diff = _baseTotalAchieveRate - _compareTotalAchieveRate;
    const denominator = dataLength ? dataLength : Infinity;
    return {
      value: mathRounding(diff / denominator, 1),
      unit: '%',
    };
  }
}
