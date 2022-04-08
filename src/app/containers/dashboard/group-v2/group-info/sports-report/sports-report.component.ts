import { Component, OnInit, OnDestroy, ViewChild, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { GroupService } from '../../../../../shared/services/group.service';
import { UtilsService } from '../../../../../shared/services/utils.service';
import { ReportCondition, ReportDateType } from '../../../../../shared/models/report-condition';
import { Subject, of, combineLatest, fromEvent, Subscription, merge, Observable } from 'rxjs';
import { takeUntil, switchMap, map, tap } from 'rxjs/operators';
import { TranslateService } from '@ngx-translate/core';
import { HashIdService } from '../../../../../shared/services/hash-id.service';
import { MatSort, Sort } from '@angular/material/sort';
import dayjs from 'dayjs';
import { SportType } from '../../../../../shared/enum/sports';
import {
  COMMON_DATA,
  RUN_DATA,
  RIDE_DATA,
  WEIGHT_TRAIN_DATA,
  SWIM_DATA,
  ROW_DATA,
  BALL_DATA,
  Regression
} from '../../../../../shared/models/sports-report';
import {
  costTimeColor,
  FilletTrendChart,
  CompareLineTrendChart,
  strokeNumColor,
  caloriesColor,
  distanceColor,
  DiscolorTrendData,
  RelativeTrendChart
} from '../../../../../shared/models/chart-data';
import { MuscleCode, MuscleGroup } from '../../../../../shared/enum/weight-train';
import { HrBase } from '../../../../../shared/models/user-profile-info';
import { getUrlQueryStrings, deepCopy, mathRounding, subscribePluralEvent } from '../../../../../shared/utils/index';
import { QueryString } from '../../../../../shared/enum/query-string';
import { DateRange } from '../../../../../shared/classes/date-range';
import { BrandType, GroupLevel } from '../../../../../shared/enum/professional';
import { UserService } from '../../../../../core/services/user.service';
import { DateUnit } from '../../../../../shared/enum/report';
import { ReportDateUnit } from '../../../../../shared/classes/report-date-unit';
import { Api21xxService } from '../../../../../core/services/api-21xx.service';
import { GroupSportsReport, GroupSportsReportInfo, GroupSportsChartData } from '../../../../../shared/classes/sports-report';
import { AllGroupMember } from '../../../../../shared/classes/all-group-member';
import { ReportService } from '../../../../../core/services/report.service';
import { SportsTarget } from '../../../../../shared/classes/sports-target';
import { SportsParameter } from '../../../../../shared/models/sports-report';
import { Unit, mi, ft, lb } from '../../../../../shared/models/bs-constant';
import { speedToPace } from '../../../../../shared/utils/sports';
import { SportAnalysisSort } from '../../../../../shared/classes/sport-analysis-sort';
import { AnalysisOption } from '../../../../professional/classes/analysis-option';
import { AnalysisSportsColumn } from '../../../../professional/enum/report-analysis';
import { AnalysisAssignMenu } from '../../../../professional/models/report-analysis';

const ERROR_MESSAGE = 'Error! Please try again later.';

@Component({
  selector: 'app-sports-report',
  templateUrl: './sports-report.component.html',
  styleUrls: ['./sports-report.component.scss', '../group-child-page.scss']
})
export class SportsReportComponent implements OnInit, OnDestroy {

  @ViewChild('groupSortTable', {static: false})
  groupSortTable: MatSort;
  @ViewChild('personSortTable', {static: false})
  personSortTable: MatSort;

  private ngUnsubscribe = new Subject();
  pluralEvent = new Subscription();
  resizeEvent = new Subscription();

  /**
   * ui 用到的flag
   */
  uiFlag = {
    progress: 100,
    seeMore: false,
    printMode: false,
    isCompareMode: false,
    showGroupAnalysisOption: false,
    showPersonalAnalysisOption: false,
    analysisSeeMoreGroup: false,
    analysisSeeMorePerson: false
  };

  /**
   * 產生報告之篩選條件
   */
  initReportCondition: ReportCondition = {
    moduleType: 'professional',
    pageType: 'sportsReport',
    baseTime: new DateRange(),
    compareTime: null,
    dateUnit: new ReportDateUnit(DateUnit.month),
    group: {
      brandType: BrandType.brand,
      currentLevel: GroupLevel.class,
      focusGroup: {
        id: null,
        level: null,
        name: null
      },
      brand: null,
      branches: null,
      classes: null
    },
    sportType: SportType.all,
    needRefreshData: false
  }

  /**
   * 儲存變更過後的報告條件
   */
  reportCondition: ReportCondition;


  windowWidth = 320;  // 視窗寬度

  /**
   * 各群組運動概要數據
   */
  groupSportsInfo: GroupSportsReportInfo;

  /**
   * 個人部份基本資訊與運動概要數據
   */
  memberSportsInfo: AllGroupMember;

  /**
   * 基準日期圖表所需數據
   */
  groupBaseChartData: GroupSportsChartData;

  /**
   * 比較日期圖表所需數據
   */
  groupCompareChartData: GroupSportsChartData;

  /**
   * 使用者使用之數據單位（公制/英制）
   */
  userUnit: Unit = this.userService.getUser().userProfile.unit;

  /**
   * 團體分析排序相關
   */
  groupAnalysis: SportAnalysisSort;

  /**
   * 個人分析排序相關
   */
  personAnalysis: SportAnalysisSort;

  /**
   * 分析列表篩選群組皆設定
   */
  groupAnalysisOption = new AnalysisOption({
    reportType: 'sports',
    sportType: SportType.all,
    object: 'group',
    brandType: BrandType.enterprise,
    currentGroupLevel: GroupLevel.class
  });

  /**
   * 分析列表篩選顯示欄位設定
   */
  personalAnalysisOption = new AnalysisOption({
    reportType: 'sports',
    sportType: SportType.all,
    object: 'person',
    brandType: BrandType.enterprise,
    currentGroupLevel: GroupLevel.class
  });

  /**
   * 於團體或個人分析顯示指定對象之選單
   */
  analysisAssignMenu: AnalysisAssignMenu = {
    show: false,
    position: {x: null, y: null},
    reportType: 'sports',
    object: null,
    id: null,
    nameList: []
  };

  readonly SportType = SportType;
  readonly GroupLevel = GroupLevel;
  readonly Unit = Unit;
  readonly AnalysisSportsColumn = AnalysisSportsColumn;
  readonly muscleMetricUnit = 'kg*rep*set';
  readonly muscleImperialUnit = 'lb*rep*set';
  readonly MuscleGroup = MuscleGroup;

  constructor(
    private utils: UtilsService,
    private groupService: GroupService,
    private hashIdService: HashIdService,
    private translate: TranslateService,
    private changeDetectorRef: ChangeDetectorRef,
    private userService: UserService,
    private api21xxService: Api21xxService,
    private reportService: ReportService
  ) { }

  ngOnInit(): void {
    this.checkWindowSize(window.innerWidth);
    this.subscribeWindowSize();
    this.initialReportCondition();
  }

  /**
   * 訂閱視窗寬度
   * @author kidin-1100316
   */
   subscribeWindowSize() {
    const resize = fromEvent(window, 'resize');
    this.resizeEvent = resize.pipe(
      takeUntil(this.ngUnsubscribe)
    ).subscribe(e => {
      this.windowWidth = (e as any).target.innerWidth;
      this.checkWindowSize(this.windowWidth);
    });

  }

  /**
   * 根據視窗寬度調整分析列表最大與最小可顯示數量
   * @param width {number}-視窗寬度
   * @author kidin-1100519
   */
  checkWindowSize(width: number) {
    this.checkGroupAnalysisOption();
    this.checkPersonalAnalysisOption();
  }

  /**
   * 確認團體分析欄位是否超出限制
   * @author kidin-1110401
   */
  checkGroupAnalysisOption() {
    this.groupAnalysisOption.checkOverLimit();
    this.groupAnalysisOption.fillItem();
  }

  /**
   * 確認個人分析欄位是否超出限制
   * @author kidin-1110401
   */
  checkPersonalAnalysisOption() {
    this.personalAnalysisOption.checkOverLimit();
    this.personalAnalysisOption.fillItem();
  }

  /**
   * 將條件篩選器進行初始化
   * @author kidin-1110315
   */
  initialReportCondition() {
    of([]).pipe(
      tap(() => this.getAllGroupLayer()),
      tap(() => this.checkQueryString())
    ).subscribe();

  }

  /**
   * 取得群組資訊
   * @author kidin-1110315
   */
  getGroupInfo() {
    return this.groupService.getCurrentGroupInfo();
  }

  /**
   * 取得所有群組階層
   * @author kidin-1110315
   */
  getAllGroupLayer() {
    const {
      groupDetail: { groupName, groupId, brandType },
      groupLevel,
      immediateGroupList: { brands, branches, coaches }
    } = this.getGroupInfo();

    this.initReportCondition.group = {
      ...this.initReportCondition.group,
      brandType,
      currentLevel: groupLevel,
      focusGroup: {
        id: groupId,
        level: groupLevel,
        name: groupName
      },
      classes: coaches
    }

    if (groupLevel <= GroupLevel.branch) this.initReportCondition.group.branches = branches;
    if (groupLevel <= GroupLevel.brand) this.initReportCondition.group.brand = brands;
  }

  /**
   * 確認query string
   * @author kidin-1110315
   */
  checkQueryString() {
    const query = getUrlQueryStrings(location.search);
    for (let _key in query) {
      const value = query[_key];
      switch (_key) {
        case QueryString.target:
          this.initReportCondition.group.focusGroup.id = this.hashIdService.handleGroupIdDecode(value);
          break;
        case QueryString.baseStartTime:
          this.initReportCondition.baseTime.startTimestamp = +value;
          break;
        case QueryString.baseEndTime:
          this.initReportCondition.baseTime.endTimestamp = +value;
          break;
        case QueryString.compareStartTime:
          if (!this.initReportCondition.compareTime) this.initReportCondition.compareTime = new DateRange();
          this.initReportCondition.compareTime.startTimestamp = +value;
          break;
        case QueryString.compareEndTime:
          if (!this.initReportCondition.compareTime) this.initReportCondition.compareTime = new DateRange();
          this.initReportCondition.compareTime.endTimestamp = +value;
          break;
        case QueryString.dateRangeUnit:
          this.initReportCondition.dateUnit = value;
          break;
        case QueryString.sportType:
          this.initReportCondition.sportType = +value;
          break;
        case QueryString.seeMore:
          this.uiFlag.seeMore = false;
          break;
        case QueryString.printMode:
          this.uiFlag.printMode = false;
          break;
      }

    }

  }

  /**
   * 取得報告篩選條件，並產生報告
   * @param condition {ReportCondition}-報告篩選條件
   * @author kidin-1110317
   */
  getReportCondition(condition: ReportCondition) {
    if (this.uiFlag.progress === 100) {
      this.uiFlag.progress = 30;
      this.reportCondition = deepCopy(condition);
      const {
        group: { focusGroup: { id, level } },
        sportType,
        baseTime,
        compareTime,
        dateUnit,
        needRefreshData
      } = condition;

      this.groupService.getAllGroupMemberList(id).pipe(
        switchMap(res => {
          this.uiFlag.progress = 60;
          // 取不到所有成員資訊回空陣列
          if (!res.belongGroupId) return of([]);
          
          // 若僅變更運動類別，則不需透過api重新取得數據
          if (!needRefreshData) {
            const result = [res, this.reportService.getBaseData()];
            if (this.uiFlag.isCompareMode) result.push(this.reportService.getCompareData());
            return of(result);
          } else {
            
            const targetUserId = res.getNoRepeatMemberId(id);
            const { utcStartTime, utcEndTime } = baseTime;
            const baseBody = {
              token: this.userService.getToken(),
              targetUserId,
              filterStartTime: utcStartTime,
              filterEndTime: utcEndTime,
              type: dateUnit.reportDateType
            };

            const request = [this.api21xxService.fetchSportSummaryArray(baseBody)];
            // 確認是否需要進行數據比較
            if (!compareTime) {
              this.uiFlag.isCompareMode = false;
            } else {
              this.uiFlag.isCompareMode = true;
              const { utcStartTime: compareUtcStartTime, utcEndTime: compareUtcEndTime } = compareTime;
              const compareBody = { ...baseBody, filterStartTime: compareUtcStartTime, filterEndTime: compareUtcEndTime };
              request.push(this.api21xxService.fetchSportSummaryArray(compareBody));
            }

            return combineLatest(request).pipe(
              map(responseArray => [res, ...responseArray])
            );

          }

        }),
        takeUntil(this.ngUnsubscribe)
      ).subscribe(resultArray => {
        // 陣列為空則顯示錯誤訊息
        if (resultArray.length === 0) return this.utils.openAlert(ERROR_MESSAGE);
        this.changeColumnOption(sportType, level);
        this.initFlag();
        this.createReport(condition, resultArray);
      });

    }

  }

  /**
   * 變更分析可選擇的選項
   * @param sportType {SportType}-運動類別
   * @param level {GroupLevel}-群組階層
   * @author kidin-1110331
   */
  changeColumnOption(sportType: SportType, level: GroupLevel) {
    this.groupAnalysisOption.changeOption(sportType, level);
    this.personalAnalysisOption.changeOption(sportType, level);
  }

  /**
   * 將部份flag初始化
   */
  initFlag() {
    this.uiFlag.analysisSeeMoreGroup = false;
    this.uiFlag.analysisSeeMorePerson = false;
  }

  /**
   * 建立報告內容
   * @param condition {ReportCondition}-報告條件
   * @param data {Array<any>}
   * @author kidin-1110321
   */
  createReport(condition: ReportCondition, data: Array<any>) {
    const [allGroupMemberList, baseSportSummary, compareSportSummary] = data;
    const sportsTarget = new SportsTarget(this.getGroupInfo().sportTarget);
    this.handlePersonalData('base', condition, allGroupMemberList, baseSportSummary, sportsTarget);

    if (this.uiFlag.isCompareMode) {
      this.handlePersonalData('compare', condition, allGroupMemberList, compareSportSummary, sportsTarget);
    }

    this.handleGroupChartData(condition, baseSportSummary, compareSportSummary, sportsTarget);
    this.handleGroupInfoData(allGroupMemberList);
    this.uiFlag.progress = 100;
  }

  /**
   * 處理每個成員個人基準數據
   * @param timeType {ReportDateType}-日期範圍類別
   * @param condition {ReportCondition}-報告篩選條件
   * @param allGroupList {AllGroupMember}-群組內所有成員清單
   * @param dataArray {Array<any>}-多人的運動數據陣列
   * @author kidin-1110318
   */
  handlePersonalData(
    timeType: ReportDateType,
    condition: ReportCondition,
    allGroupList: AllGroupMember,
    dataArray: Array<any>,
    sportTarget: SportsTarget
  ) {
    timeType === 'base' ? this.reportService.saveBaseData(dataArray) : this.reportService.saveCompareData(dataArray);
    const { dateUnit } = condition;
    dataArray.forEach(_data => {
      const { userId: _userId, resultCode } = _data;
      let parameter: SportsParameter;
      if (resultCode === 403) {
        parameter = { openPrivacy: false };
      } else {
        const _dataArray = _data[dateUnit.getReportKey('sportsReport')];
        parameter = { openPrivacy: true, target: sportTarget, condition, data: _dataArray, timeType };
      }

      const sportData = new GroupSportsReport(parameter);
      allGroupList.savePersonalData(_userId, timeType, sportData.infoData);
    });

    this.memberSportsInfo = allGroupList;
    this.personAnalysis = new SportAnalysisSort(Object.values(allGroupList.memberList), 'memberName');
console.log('allGroupList', this.personAnalysis);
  }

  /**
   * 計算各群組數據
   * @param allGroupList {AllGroupMember}-群組內所有成員清單
   * @author kidin-1110322
   */
  handleGroupInfoData(allGroupList: AllGroupMember) {
    const { immediateGroupObj } = this.getGroupInfo();
    this.groupSportsInfo = new GroupSportsReportInfo(immediateGroupObj, allGroupList);
    this.groupAnalysis = new SportAnalysisSort(Object.values(this.groupSportsInfo.groupSportInfo), 'targetAchievedPeople');
console.log('GroupInfo', this.groupSportsInfo, this.groupAnalysis);
  }

  /**
   * 計算基準日期範圍圖表所需數據
   * @param condition {ReportCondition}-報告篩選條件
   * @param baseData {Array<any>}-多人的基準運動數據陣列
   * @param compareData {Array<any>}-多人的比較運動數據陣列
   * @author kidin-1110322
   */
  handleGroupChartData(
    condition: ReportCondition,
    baseData: Array<any>,
    compareData: Array<any>,
    sportsTarget: SportsTarget
  ) {
    this.groupBaseChartData = new GroupSportsChartData(condition, baseData, compareData, sportsTarget);
  }

  /**
   * 取得目前聚焦群組的群組id
   * @author kidin-1110324
   */
  getFocusGroupId() {
    return this.reportCondition.group.focusGroup.id;
  }

  /**
   * 取得人均數據
   * @param infoData {any}-運動概要數據
   * @param key {string}-指定數據的鍵名
   * @author kidin-1110324 
   */
  getPerAvgData(infoData: any, key: string) {
    const isMetric = this.userUnit === Unit.metric;
    const { sportType } = this.reportCondition;
    const result = {
      value: 0,
      unit: '',
      update(value: string | number, unit: string = '') {
        this.value = value;
        this.unit = unit;
      },
      get() {
        return { value: this.value, unit: this.unit }
      }
    };

    if (infoData[key]) {
      const value = Math.round(infoData.activityPeople ? infoData[key] / infoData.activityPeople : 0);
      switch (key) {
        case 'calories':
          result.update(value, 'cal');
          break;
        case 'avgHeartRateBpm':
          result.update(value, 'bpm');
          break;
        case 'totalDistanceMeters':
          // 距離統一使用千位數單位進行四捨五入
          const thousandsNumber = value / 1000;
          let distanceConverse: number | string;
          if (isMetric) {
            distanceConverse = mathRounding(thousandsNumber, 2);
            result.unit = 'km';
          } else {
            distanceConverse = mathRounding(thousandsNumber / mi, 2);
            result.unit = 'mi';
          }

          // 不足0.1公里或0.1英哩，則以 '< 0.1' 表示
          result.update(distanceConverse >= 0.1 ? distanceConverse : '< 0.1');
          break;
        case 'elevGain':
          isMetric ? result.update(value, 'm') : result.update(mathRounding(value / ft, 1), 'ft');
          break;
        case 'avgSpeed':
          const paceList = [SportType.run, SportType.swim, SportType.row];
          if (paceList.includes(sportType)) {
            const { value: pace, unit: paceUnit } = speedToPace(value, sportType, this.userUnit);
            result.update(pace, paceUnit);
          } else {
            isMetric ? result.update(value, 'km/hr') : result.update(mathRounding(value / mi, 2), 'mi/hr');
          }
          
          break;
        case 'cycleAvgCadence':
        case 'swimAvgCadence':
        case 'rowingAvgCadence':
          result.update(value, 'rpm');
          break;
        case 'totalWeightKg':
          isMetric ? result.update(value, 'kg') : result.update(mathRounding(value / lb, 1), 'lb');
          break;
        case 'rowingAvgWatt':
          result.update(value, 'watt');
          break;
        default:
          result.update(value);
          break;
      }

    }
    
    return result.get();
  }

  /**
   * 取得個人概要數據
   * @param data {any}-運動概要數據
   * @param key {string}-指定數據的鍵名
   * @author kidin-1110324 
   */
  getPersonalData(data: any, key: string) {
    if (this.uiFlag.progress !== 100) return 0;
    
    const isMetric = this.userUnit === Unit.metric;
    const { sportType } = this.reportCondition;
    let result: string | number = 0;
    const value = data[key];
    if (value) {
      
      switch (key) {
        case 'totalDistanceMeters':
          // 距離統一使用千位數單位進行四捨五入
          const thousandsNumber = value / 1000;
          const distanceConverse = mathRounding(thousandsNumber / (isMetric ? 1 : mi), 2);

          // 不足0.1公里或0.1英哩，則以 '< 0.1' 表示
          result = distanceConverse >= 0.1 ? distanceConverse : '< 0.1';
          break;
        case 'elevGain':
          result = isMetric ? value : mathRounding(value / ft, 1);
          break;
        case 'avgSpeed':
          const paceList = [SportType.run, SportType.swim, SportType.row];
          if (paceList.includes(sportType)) {
            result = speedToPace(value, sportType, this.userUnit).value;
          } else {
            result = isMetric ? value : mathRounding(value / mi, 2);
          }
          
          break;
        case 'totalWeightKg':
          result = isMetric ? value : mathRounding(value / lb, 1);
          break;
        default:
          result = Math.round(value);
          break;
      }

    }
    
    return result;
  }

  /**
   * 取得目標達成率
   * @param totalPeople {number}-總人數
   * @param statistics {number}-統計人數
   * @author kidin-1110329
   */
  getAchievedNumber(totalPeople: number, statistics: number) {
    const molecular = statistics ?? 0;
    return {
      value: totalPeople ? `${mathRounding((molecular / totalPeople) * 100, 1)}%` : '0%',
      unit: ''
    };

  }

  /**
   * 取得人數相關統計數據
   * @param denominator {number}-總人數
   * @param statistics {number}-統計人數
   * @author kidin-1110325
   */
  getPeopleNumber(denominator: number, statistics: number) {
    const molecular = statistics ?? 0;
    return {
      value: denominator ? `${molecular}/${denominator}` : '0/0',
      unit: ''
    };

  }

  /**
   * 變更排序類別或方向
   * @param isGroupAnalysis {boolean}-分析類別
   * @param column {string}-欄位類別
   * @author kidin-1110328
   */
  changeSort(isGroupAnalysis: boolean, columnType: string = undefined) {
    if (!columnType) return false;
    const analysis = isGroupAnalysis ? this.groupAnalysis : this.personAnalysis;
    if (analysis.sortType !== columnType) {
      analysis.changeSortType(columnType);
    } else {
      analysis.changeOrder();
    }

  }

  /**
   * 團體分析將基準數據與比較數據比對是否進步
   * @param id {string}-群組編號
   * @param key {string}-欲比較的數據
   * @author kidin-1110406
   */
  checkGroupProgressive(id: string, key: string) {
    const { progress, isCompareMode } = this.uiFlag;
    if (progress === 100 && isCompareMode) return this.groupSportsInfo.checkProgressive(id, key);
  }

  /**
   * 個人分析將基準數據與比較數據比對是否進步
   * @param id {string}-使用者編號
   * @param key {string}-欲比較的數據
   * @author kidin-1110406
   */
  checkPersonProgressive(id: string, key: string) {
    const { progress, isCompareMode } = this.uiFlag;
    if (progress === 100 && isCompareMode) return this.memberSportsInfo.checkProgressive(id, key);
  }

  /**
   * 顯示團體分析設定
   * @param e {MouseEvent}
   * @author kidin-1110329
   */
  showGroupAnalysisOption(e: MouseEvent) {
    e.stopPropagation();
    const { showGroupAnalysisOption } = this.uiFlag;
    if (showGroupAnalysisOption) {
      this.unSubscribePluralEvent();
    } else {
      this.uiFlag.showGroupAnalysisOption = true;
      this.subscribePluralEvent();
    }

  }

  /**
   * 顯示個人分析設定
   * @author kidin-1110330
   */
  showPersonalAnalysisOption(e: MouseEvent) {
    e.stopPropagation();
    const { showPersonalAnalysisOption } = this.uiFlag;
    if (showPersonalAnalysisOption) {
      this.unSubscribePluralEvent();
    } else {
      this.uiFlag.showPersonalAnalysisOption = true;
      this.subscribePluralEvent();
    }

  }

  /**
   * 訂閱點擊與捲動事件，事件發生時關閉選單
   * @author kidin-1110329
   */
  subscribePluralEvent() {
    this.pluralEvent = subscribePluralEvent('.main-body').pipe(
      takeUntil(this.ngUnsubscribe)
    ).subscribe(e => {
      this.unSubscribePluralEvent();
    });

  }

  /**
   * 將所有選單關閉，並解除rxjs訂閱
   * @author kidin-1110329
   */
  unSubscribePluralEvent() {
    this.uiFlag.showGroupAnalysisOption = false;
    this.uiFlag.showPersonalAnalysisOption = false;
    this.analysisAssignMenu.show = false;
    this.pluralEvent.unsubscribe();
  }

  /**
   * 群組分析之群組篩選與欄位設定變更，依設定顯示項目
   * @param e {AnalysisOption}-群組篩選與欄位設定
   * @author kidin-1110331
   */
  groupOptionChange(e: AnalysisOption) {
    this.groupAnalysisOption = e;
  }

  /**
   * 個人分析分析之群組篩選與欄位設定變更，依設定顯示項目
   * @param e {AnalysisOption}-群組篩選與欄位設定
   * @author kidin-1110401
   */
  personalOptionChange(e: AnalysisOption) {
    this.personalAnalysisOption = e;
  }

  /**
   * 顯示指定的群組選單
   * @param e {MouseEvent}
   * @param info {any}-群組相關資訊
   * @author kidin-1110401
   */
  showAssignGroupMenu(e: MouseEvent, info: any) {
    e.stopPropagation();
    const { x, y } = (e as any);
    const { groupId, member } = info;
    this.analysisAssignMenu = {
      show: true,
      position: { x, y },
      reportType: 'sports',
      object: 'group',
      id: groupId,
      nameList: member
    };

    this.subscribePluralEvent();
  }

  /**
   * 顯示指定的群組選單
   * @param e {MouseEvent}
   * @param info {any}-個人相關資訊
   * @author kidin-1110401
   */
  showAssignPersonMenu(e: MouseEvent, info: any) {
    e.stopPropagation();
    const { x, y } = (e as any);
    const { memberId, groupId } = info;
    const belongGroup = groupId.map(_id => {
      const { groupSportInfo } = this.groupSportsInfo;
      return {
        groupId: _id,
        groupName: groupSportInfo[_id].groupName
      }

    });

    this.analysisAssignMenu = {
      show: true,
      position: { x, y },
      reportType: 'sports',
      object: 'person',
      id: memberId,
      nameList: belongGroup
    };

    this.subscribePluralEvent();
  }

  /**
   * 將群組分析列表完整顯示
   * @author kidin-1110401
   */
  seeMoreGroup() {
    this.uiFlag.analysisSeeMoreGroup = true;   
  }

  /**
   * 將個人分析列表完整顯示
   * @author kidin-1110401
   */
  seeMorePerson() {
    this.uiFlag.analysisSeeMorePerson = true;
  }

  /**
   * 解除rxjs訂閱
   * @author kidin-1091211
   */
  ngOnDestroy() {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

}