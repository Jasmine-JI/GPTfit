import { TargetConditionMap } from '../../../core/models/api/api-common/sport-target.model';
import { DateUnit } from '../../enum/report';
import { mathRounding, countPercentage, countBenefitTime } from '../../../core/utils';
import { ReportCondition } from '../../models/report-condition';
import { PAI_COFFICIENT, DAY_PAI_TARGET } from '../../models/sports-report';
import { SportType } from '../../enum/sports';
import { of } from 'rxjs';
import { map } from 'rxjs/operators';
import { ReportDateUnit } from '../report-date-unit';
import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
import { DateRange } from '../date-range';
import { trendChartColor } from '../../models/chart-data';
import { CompareTrendData } from '../sports-report/compare-trend-data';
import { HrZoneTrendChartData } from '../sports-report/hrzone-trend-chart-data';
import { HrZoneChartData } from '../sports-report/hrzone-chart-data';
import { TypeAllChart } from '../sports-report/type-all-chart';
import { TemporaryCount } from '../sports-report/temporary-count';
import { BenefitTimeStartZone } from '../../../core/enums/common';
import { DAY } from '../../models/utils-constant';

dayjs.extend(isoWeek);

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

  private _sportsTableData: Array<any> = [];

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
    sportTargetCondition: TargetConditionMap,
    totalPeople: number,
    isMondayFirst: boolean,
    benefitTimeStartZone: BenefitTimeStartZone
  ) {
    const isCompareMode = compareData !== undefined;
    this._hrZoneTrend = new HrZoneTrendChartData(isCompareMode);
    this._totalSecondTrend = new CompareTrendData(isCompareMode, trendChartColor.totalSecond);
    this._caloriesTrend = new CompareTrendData(isCompareMode, trendChartColor.calories);
    this._achievementRate = new CompareTrendData(isCompareMode, trendChartColor.achieveRate);

    const { sportType, dateUnit, baseTime, compareTime } = condition;
    const allDateList = this.createCompleteDate(dateUnit, isMondayFirst, baseTime, compareTime);
    of([baseData, compareData])
      .pipe(
        map((data) => this.filterPersonalData(data, dateUnit, sportType)),
        map((filterData) => this.mergePersonalData(filterData, dateUnit)),
        map((personalData) =>
          this.postProcessingPerosnalData(
            personalData,
            sportTargetCondition,
            benefitTimeStartZone,
            dateUnit
          )
        ),
        map((completeData) => this.concatPersonalData(completeData)),
        map((concatData) => this.sortData(concatData)),
        map((sortData) => this.mergeGroupData(sortData, dateUnit)),
        map((mergeData) => this.fillUpDate(mergeData, allDateList)),
        map((fillUpData) => this.handleChartData(fillUpData, totalPeople))
      )
      .subscribe();
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
   * 根據運動類別篩選數據，同時處理群組心率區間數據與成效分佈圖數據
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

              this.handleGroupHrZoneData(_activity, isCompareData);
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
   * 將個人數據依報告時間單位進行數據合併，以產生目標達成率圖表
   * @param allData {Array<any>}-基準數據與比較數據
   * @param dateUnit {ReportDateUnit}-報告所選擇的時間單位
   */
  mergePersonalData(allData: Array<any>, dateUnit: ReportDateUnit) {
    const [baseData, compareData] = allData;
    const mergeData = (data: Array<any>, dateUnit: ReportDateUnit) => {
      const result = data.map((_data) => {
        const personalData: Array<any> = [];
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
   * @param targetCondition {TargetConditionMap}-依報告時間單位轉換的個人目標內容
   * @param benefitTimeStartZone {BenefitTimeStartZone}-效益時間有效開始區間
   * @param dateUnit {ReportDateUnit}-報告所選擇的時間單位
   */
  postProcessingPerosnalData(
    allData: Array<any>,
    targetCondition: TargetConditionMap,
    benefitTimeStartZone: BenefitTimeStartZone,
    dateUnit: ReportDateUnit
  ) {
    const [baseData, compareData] = allData;
    const achievementData = (data: Array<any>) => {
      return data.map((_data) => {
        return _data.map((_dataRow) => {
          const {
            totalHrZone0Second: zone0,
            totalHrZone1Second: zone1,
            totalHrZone2Second: zone2,
            totalHrZone3Second: zone3,
            totalHrZone4Second: zone4,
            totalHrZone5Second: zone5,
            totalSecond,
            calories,
            totalActivities,
            avgHeartRate,
          } = _dataRow.activities;
          let achieve = 1;
          targetCondition.forEach((_value, _filedName) => {
            const _filedValue = +_value.filedValue;
            switch (_filedName) {
              case 'totalActivities':
                if (totalActivities < _filedValue) achieve = 0;
                break;
              case 'totalTime': {
                if (+totalSecond < _filedValue) achieve = 0;
                break;
              }
              case 'benefitTime': {
                const hrZone = [zone0, zone1, zone2, zone3, zone4, zone5];
                const benefitTime = countBenefitTime(hrZone, benefitTimeStartZone);
                if (benefitTime < _filedValue) achieve = 0;
                break;
              }
              case 'pai': {
                const { z0, z1, z2, z3, z4, z5 } = PAI_COFFICIENT;
                const datePeroid = dateUnit.reportDatePeroid / DAY;
                const weightedValue =
                  zone0 * z0 + zone1 * z1 + zone2 * z2 + zone3 * z3 + zone4 * z4 + zone5 * z5;
                const pai = (weightedValue / DAY_PAI_TARGET / datePeroid) * 100;
                if (pai < _filedValue) achieve = 0;
                break;
              }
              case 'calories':
                if (calories < _filedValue) achieve = 0;
                break;
              case 'avgHeartRate':
                if (avgHeartRate < _filedValue) achieve = 0;
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
      compareData ? this.mergeData(compareData, dateUnit) : undefined,
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
    const baseDataResult: Array<any> = [];
    const compareDataResult: Array<any> = [];
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
        const compareDataStart = compareData[compareDataIndex]
          ? compareData[compareDataIndex].startTime
          : null;
        if (_compareStart !== compareDataStart) {
          compareDataResult.push({
            activities: {},
            startTime: _compareStart,
            endTime: _compareEnd,
          });
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
      } = _activities;

      const dateRange = [_startTime, _endTime];
      const hrZone = [_z0, _z1, _z2, _z3, _z4, _z5].map((_zone) => (_zone ? _zone : 0));
      this._hrZoneTrend.addBaseData(hrZone, dateRange);
      this._totalSecondTrend.addBaseData(_totalSecond, dateRange);
      this._caloriesTrend.addBaseData(_calories, dateRange);

      const _achieveRate = mathRounding(countPercentage(_achieve, totalPeople, 1), 1);
      this._achievementRate.addBaseData(_achieveRate, dateRange);
      this._sportsTableData.push([
        {
          dateRange,
          hrZone,
          totalSecond: _totalSecond || 0,
          calories: _calories || 0,
          achieveRate: _achieveRate,
        },
      ]);
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
      } = _compareActivities;

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
        _baseTotalSecond,
        _baseDateRange,
        _compareTotalSecond,
        _compareDateRange
      );
      this._caloriesTrend.addMixData(
        _baseCalories,
        _baseDateRange,
        _compareCalories,
        _compareDateRange
      );

      const _baseAchieveRate = mathRounding(countPercentage(_baseAchieve, totalPeople, 1), 1);
      const _compareAchieveRate = mathRounding(countPercentage(_compareAchieve, totalPeople, 1), 1);
      this._achievementRate.addMixData(
        _baseAchieveRate,
        _baseDateRange,
        _compareAchieveRate,
        _compareDateRange
      );

      this._sportsTableData.push([
        {
          dateRange: _baseDateRange,
          hrZone: _baseHrZone,
          totalSecond: _baseTotalSecond || 0,
          calories: _baseCalories || 0,
          achieveRate: _baseAchieve,
        },
        {
          dateRange: _compareDateRange,
          hrZone: _compareHrZone,
          totalSecond: _compareTotalSecond || 0,
          calories: _compareCalories || 0,
          achieveRate: _compareAchieve,
        },
      ]);
    });
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
   * 合併數據
   * @param data {Array<any>}-運動數據
   * @param dateUnit {ReportDateUnit}-報告所選擇的時間單位
   */
  mergeData(data: Array<any>, dateUnit: ReportDateUnit) {
    const result: Array<any> = [];
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
      if (newDate.start < dateEnd) {
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
   * 統一時區，以utc字串之日期部份進行對齊
   * @param utcTime {string}-utc time
   * @param type {'start' | 'end'}-開始或結束日期
   */
  alignTimeZone(utcTime: string, type: 'start' | 'end') {
    const alignTime = dayjs(utcTime.split('T')[0], 'YYYY-MM-DD');
    return type === 'start' ? alignTime.startOf('day').valueOf() : alignTime.endOf('day').valueOf();
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

  /**
   * 取得運動表格數據
   */
  get sportsTableData() {
    return this._sportsTableData;
  }
}
