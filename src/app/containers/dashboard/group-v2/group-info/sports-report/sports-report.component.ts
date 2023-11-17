import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { ProfessionalService } from '../../../../professional/services/professional.service';
import {
  ReportCondition,
  ReportDateType,
} from '../../../../../core/models/compo/report-condition.model';
import { Subject, of, combineLatest, fromEvent, Subscription, merge } from 'rxjs';
import { takeUntil, switchMap, map, tap, debounceTime } from 'rxjs/operators';
import {
  getUrlQueryStrings,
  deepCopy,
  mathRounding,
  subscribePluralEvent,
  speedToPace,
} from '../../../../../core/utils';
import { DateRange } from '../../../../../shared/classes/date-range';
import { BrandType, GroupLevel } from '../../../../../core/enums/professional';
import { ReportDateUnit } from '../../../../../shared/classes/report-date-unit';
import { GroupSportsChartData } from '../../../../../shared/classes/sports-report/group-sports-chart-data';
import { GroupSportsReport } from '../../../../../shared/classes/sports-report/sports-report';
import { GroupSportsReportInfo } from '../../../../../shared/classes/sports-report/group-sports-report-info';
import { AllGroupMember } from '../../../../../shared/classes/all-group-member';
import { SportsParameter } from '../../../../../core/models/compo';
import { mi, ft, lb, errorMessage } from '../../../../../core/models/const';
import { SportsAnalysisSort } from '../../../../../shared/classes/sports-report/sports-analysis-sort';
import { ProfessionalAnalysisOption } from '../../../../professional/classes/professional-analysis-option';
import { ProfessionalChartAnalysisOption } from '../../../../professional/classes/professional-chart-analysis-option';
import { AnalysisSportsColumn } from '../../../../../core/enums/sports/report-analysis.enum';
import { AnalysisAssignMenu } from '../../../../../core/models/compo';
import { sportTypeColor, trendChartColor } from '../../../../../core/models/represent-color';
import { TargetField, TargetConditionMap } from '../../../../../core/models/api/api-common';
import { MuscleGroup, SportType } from '../../../../../core/enums/sports';
import { groupIdReg } from '../../../../../core/models/regex';
import { DefaultDateRange } from '../../../../../shared/classes/default-date-range';
import {
  AuthService,
  LocalstorageService,
  GlobalEventsService,
  UserService,
  Api21xxService,
  ReportService,
  HashIdService,
  HintDialogService,
} from '../../../../../core/services';
import {
  BenefitTimeStartZone,
  DataUnitType,
  QueryString,
  DateUnit,
} from '../../../../../core/enums/common';
import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
import { DataDescription } from '../../../../../core/models/compo';
import { SportTypePipe } from '../../../../../core/pipes/sport-type.pipe';
import { SportTimePipe } from '../../../../../core/pipes/sport-time.pipe';
import { SportTypeIconPipe } from '../../../../../core/pipes/sport-type-icon.pipe';
import { TranslateUnitKeyPipe } from '../../../../../core/pipes/translate-unit-key.pipe';
import { TranslateKeyPipe } from '../../../../../core/pipes/translate-key.pipe';
import { DateUnitKeyPipe } from '../../../../../core/pipes/date-unit-key.pipe';
import { TranslateModule } from '@ngx-translate/core';
import { RingChartComponent } from '../../../../../shared/components/chart/ring-chart/ring-chart.component';
import { MatIconModule } from '@angular/material/icon';
import { AnalysisInfoMenuComponent } from '../../../../../components/analysis-info-menu/analysis-info-menu.component';
import { SmallHrzoneChartComponent } from '../../../../../components/small-hrzone-chart/small-hrzone-chart.component';
import { AnalysisOptionComponent } from '../../../../../components/analysis-option/analysis-option.component';
import { SportsDataTableComponent } from '../../../../../components/sports-data-table/sports-data-table.component';
import { CompareColumnTrendComponent } from '../../../../../shared/components/chart/compare-column-trend/compare-column-trend.component';
import { CompareHrzoneTrendComponent } from '../../../../../shared/components/chart/compare-hrzone-trend/compare-hrzone-trend.component';
import { HrzoneInfoComponent } from '../../../../../shared/components/chart/hrzone-info/hrzone-info.component';
import { TreeMapChartComponent } from '../../../../../components/tree-map-chart/tree-map-chart.component';
import { HrzoneChartComponent } from '../../../../../shared/components/chart/hrzone-chart/hrzone-chart.component';
import { DistributionCanvasChartComponent } from '../../../../../shared/components/chart/distribution-canvas-chart/distribution-canvas-chart.component';
import { TipDialogComponent } from '../../../../../components/tip-dialog/tip-dialog.component';
import { ConditionSelectorComponent } from '../../../../../shared/components/condition-selector/condition-selector.component';
import {
  NgIf,
  NgClass,
  NgTemplateOutlet,
  NgFor,
  NgSwitch,
  NgSwitchCase,
  DecimalPipe,
  KeyValuePipe,
} from '@angular/common';
import { LoadingMaskComponent } from '../../../../../components/loading-mask/loading-mask.component';
import { LoadingBarComponent } from '../../../../../components/loading-bar/loading-bar.component';
import * as XLSX from 'xlsx/xlsx.mjs';

dayjs.extend(isoWeek);

@Component({
  selector: 'app-sports-report',
  templateUrl: './sports-report.component.html',
  styleUrls: ['./sports-report.component.scss', '../group-child-page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    LoadingBarComponent,
    LoadingMaskComponent,
    NgIf,
    ConditionSelectorComponent,
    NgClass,
    NgTemplateOutlet,
    TipDialogComponent,
    DistributionCanvasChartComponent,
    NgFor,
    HrzoneChartComponent,
    TreeMapChartComponent,
    HrzoneInfoComponent,
    CompareHrzoneTrendComponent,
    CompareColumnTrendComponent,
    SportsDataTableComponent,
    AnalysisOptionComponent,
    SmallHrzoneChartComponent,
    AnalysisInfoMenuComponent,
    NgSwitch,
    NgSwitchCase,
    MatIconModule,
    RingChartComponent,
    DecimalPipe,
    KeyValuePipe,
    TranslateModule,
    DateUnitKeyPipe,
    TranslateKeyPipe,
    TranslateUnitKeyPipe,
    SportTypeIconPipe,
    SportTimePipe,
    SportTypePipe,
  ],
})
export class SportsReportComponent implements OnInit, OnDestroy {
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
    analysisSeeMorePerson: false,
    selectedType: SportType.all, // 活動分析圖表用，與條件選擇器運動類別作用不同
  };

  /**
   * 產生報告之篩選條件
   */
  initReportCondition: ReportCondition = {
    moduleType: 'professional',
    pageType: 'sportsReport',
    baseTime: new DateRange(),
    compareTime: null,
    dateUnit: new ReportDateUnit(DateUnit.day),
    includeAdmin: this.localStorageService.getAdminInclusion(),
    group: {
      brandType: BrandType.brand,
      currentLevel: GroupLevel.class,
      focusGroup: {
        id: null,
        level: null,
        name: null,
      },
      brand: null,
      branches: null,
      classes: null,
    },
    sportType: SportType.all,
    needRefreshData: false,
  };

  /**
   * 儲存變更過後的報告條件
   */
  reportCondition: ReportCondition;

  /**
   * 各群組運動概要數據
   */
  groupSportsInfo: GroupSportsReportInfo;

  /**
   * 個人部份基本資訊與運動概要數據
   */
  memberSportsInfo: AllGroupMember;

  /**
   * 圖表所需數據
   */
  groupChartData: GroupSportsChartData;

  /**
   * 使用者使用之數據單位（公制/英制）
   */
  userUnit = this.userService.getUser().userProfile.unit as DataUnitType;

  /**
   * 團體分析排序相關
   */
  groupAnalysis: SportsAnalysisSort;

  /**
   * 個人分析排序相關
   */
  personAnalysis: SportsAnalysisSort;

  /**
   * 圖表數據分析列表顯示欄位設定
   */
  chartAnalysisOption = new ProfessionalChartAnalysisOption({
    analysisType: 'normal',
    sportType: SportType.all,
    object: 'list',
  });

  /**
   * 分析列表篩選群組階層設定
   */
  groupAnalysisOption = new ProfessionalAnalysisOption({
    analysisType: 'normal',
    sportType: SportType.all,
    object: 'group',
    brandType: BrandType.enterprise,
    currentGroupLevel: GroupLevel.class,
  });

  /**
   * 分析列表篩選顯示欄位設定
   */
  personalAnalysisOption = new ProfessionalAnalysisOption({
    analysisType: 'normal',
    sportType: SportType.all,
    object: 'person',
    brandType: BrandType.enterprise,
    currentGroupLevel: GroupLevel.class,
  });

  /**
   * 於團體或個人分析顯示指定對象之選單
   */
  analysisAssignMenu: AnalysisAssignMenu = {
    show: false,
    position: { x: null, y: null },
    reportType: 'sports',
    object: null,
    id: null,
    nameList: [],
  };

  /**
   * 群組運動目標
   */
  sportsTargetCondition: TargetConditionMap;

  /**
   * 日期橫跨範圍
   */
  diffTime = {
    base: <number | null>null,
    compare: <number | null>null,
  };

  /**
   * 不重複的管理員userId清單
   */
  adminSet: Set<number> = new Set();

  /**
   * 說明框的內容
   */
  readonly tipContent = {
    summary: <Array<DataDescription>>[
      {
        title: 'universal_lifeTracking_achievementRate',
        content: 'universal_vocabulary_groupTargetInfo',
      },
      {
        title: 'universal_activityData_benefitime',
        content: 'universal_system_zoneInfo',
      },
      {
        title: 'PAI',
        content: 'universal_vocabulary_paiInfo',
      },
    ],
    groupAnalysis: <Array<DataDescription>>[
      {
        title: 'universal_lifeTracking_achievementRate',
        content: 'universal_vocabulary_groupTargetInfo',
      },
      {
        title: 'universal_activityData_benefitime',
        content: 'universal_system_zoneInfo',
      },
      {
        title: 'PAI',
        content: 'universal_vocabulary_paiInfo',
      },
    ],
    personalAnalysis: <Array<DataDescription>>[
      {
        title: 'universal_lifeTracking_achievementRate',
        content: 'universal_vocabulary_personalTargetInfo',
      },
      {
        title: 'universal_activityData_benefitime',
        content: 'universal_system_zoneInfo',
      },
      {
        title: 'PAI',
        content: 'universal_vocabulary_paiInfo',
      },
    ],
  };

  readonly SportType = SportType;
  readonly GroupLevel = GroupLevel;
  readonly DataUnitType = DataUnitType;
  readonly AnalysisSportsColumn = AnalysisSportsColumn;
  readonly muscleMetricUnit = 'kg*rep*set';
  readonly muscleImperialUnit = 'lb*rep*set';
  readonly MuscleGroup = MuscleGroup;
  readonly sportTypeColor = sportTypeColor;
  readonly trendChartColor = trendChartColor;
  readonly DateUnit = DateUnit;

  constructor(
    private hintDialogService: HintDialogService,
    private professionalService: ProfessionalService,
    private hashIdService: HashIdService,
    private changeDetectorRef: ChangeDetectorRef,
    private userService: UserService,
    private api21xxService: Api21xxService,
    private reportService: ReportService,
    private globalEventsService: GlobalEventsService,
    private authService: AuthService,
    private localStorageService: LocalstorageService
  ) {}

  ngOnInit(): void {
    this.checkWindowSize(window.innerWidth);
    this.subscribeWindowSize();
    this.getAdminList();
    this.initialReportCondition();
  }

  /**
   * 訂閱視窗寬度
   * @author kidin-1100316
   */
  subscribeWindowSize() {
    const resize = fromEvent(window, 'resize');
    this.resizeEvent = merge(resize, this.globalEventsService.getRxSideBarMode())
      .pipe(debounceTime(500), takeUntil(this.ngUnsubscribe))
      .subscribe(() => {
        const element = document.querySelector('.main-body') as HTMLElement;
        const containerWidth = element.getBoundingClientRect().width;
        this.checkWindowSize(containerWidth);
        this.changeDetectorRef.markForCheck();
      });
  }

  /**
   * 根據視窗寬度調整分析列表最大與最小可顯示數量
   * @param width {number}-容器寬度
   * @author kidin-1100519
   */
  checkWindowSize(width: number) {
    this.checkGroupAnalysisOption(width);
    this.checkPersonalAnalysisOption(width);
  }

  /**
   * 確認團體分析欄位是否超出限制
   * @param width {number}-容器寬度
   * @author kidin-1110401
   */
  checkGroupAnalysisOption(width: number) {
    this.groupAnalysisOption.checkOverLimit(width);
    this.groupAnalysisOption.fillItem();
  }

  /**
   * 確認個人分析欄位是否超出限制
   * @param width {number}-容器寬度
   * @author kidin-1110401
   */
  checkPersonalAnalysisOption(width: number) {
    this.personalAnalysisOption.checkOverLimit(width);
    this.personalAnalysisOption.fillItem();
  }

  /**
   * 取得管理員清單，用於篩選管理員數據的功能
   */
  getAdminList() {
    this.professionalService
      .getRXAdminList()
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((list) => {
        this.adminSet.clear();
        list.forEach((_list) => {
          this.adminSet.add(_list.memberId);
        });
      });
  }

  /**
   * 將條件篩選器進行初始化
   * @author kidin-1110315
   */
  initialReportCondition() {
    of([])
      .pipe(
        tap(() => this.getDefaultDate()),
        tap(() => this.getAllGroupLayer()),
        tap(() => this.checkQueryString())
      )
      .subscribe();
  }

  /**
   * 取得預設時間
   */
  getDefaultDate() {
    const { startTime, endTime } = DefaultDateRange.getSevenDay();
    this.initReportCondition.baseTime.startTimestamp = startTime;
    this.initReportCondition.baseTime.endTimestamp = endTime;
    return;
  }

  /**
   * 取得目前群組資訊與根群組資訊
   * @author kidin-1110315
   */
  getGroupInfo() {
    return this.professionalService.getCurrentGroupInfo();
  }

  /**
   * 取得所有群組階層
   * @author kidin-1110315
   */
  getAllGroupLayer() {
    const {
      groupDetail: { groupName, groupId, brandType },
      groupLevel,
      immediateGroupList: { brands, branches, coaches },
    } = this.getGroupInfo();

    this.initReportCondition.group = {
      ...this.initReportCondition.group!,
      brandType,
      currentLevel: groupLevel,
      focusGroup: {
        id: groupId,
        level: groupLevel,
        name: groupName,
      },
      classes: coaches,
    };

    if (groupLevel <= GroupLevel.branch) this.initReportCondition.group.branches = branches;
    if (groupLevel <= GroupLevel.brand) this.initReportCondition.group.brand = brands;
  }

  /**
   * 確認query string
   */
  checkQueryString() {
    const query = getUrlQueryStrings(location.search);
    for (const _key in query) {
      const value = query[_key];
      switch (_key) {
        case QueryString.target:
          this.initReportCondition.group.focusGroup.id =
            this.hashIdService.handleGroupIdDecode(value);
          break;
        case QueryString.baseStartTime:
          this.initReportCondition.baseTime.startTimestamp = +value;
          this.initReportCondition.baseTime.dateRange = 'custom';
          break;
        case QueryString.baseEndTime:
          this.initReportCondition.baseTime.endTimestamp = +value;
          this.initReportCondition.baseTime.dateRange = 'custom';
          break;
        case QueryString.compareStartTime:
          if (!this.initReportCondition.compareTime)
            this.initReportCondition.compareTime = new DateRange();
          this.initReportCondition.compareTime.startTimestamp = +value;
          this.initReportCondition.compareTime.dateRange = 'custom';
          break;
        case QueryString.compareEndTime:
          if (!this.initReportCondition.compareTime)
            this.initReportCondition.compareTime = new DateRange();
          this.initReportCondition.compareTime.endTimestamp = +value;
          this.initReportCondition.compareTime.dateRange = 'custom';
          break;
        case QueryString.dateRangeUnit:
          (this.initReportCondition.dateUnit as ReportDateUnit).unit = +value;
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
        case QueryString.includeAdmin:
          this.initReportCondition.includeAdmin = value === 'true';
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
      const { group, sportType, baseTime, compareTime, dateUnit, needRefreshData } = condition;
      this.diffTime = this.getDiffTime(condition);
      const { id, level } = group.focusGroup;
      const reportDayType = (dateUnit as ReportDateUnit).getReportDateType();

      this.professionalService
        .getAllGroupMemberList(id as string)
        .pipe(
          switchMap((res) => {
            this.uiFlag.progress = 60;
            // 取不到所有成員資訊回空陣列
            if (!res.belongGroupId) return of([]);

            // 若僅變更運動類別，則不需透過api重新取得數據
            if (!needRefreshData) {
              const result = [res, this.reportService.getBaseActivitiesData()];
              if (this.uiFlag.isCompareMode)
                result.push(this.reportService.getCompareActivitiesData());
              return of(result);
            } else {
              const excludeSet = condition.includeAdmin ? undefined : this.adminSet;
              const targetUserId = res.getNoRepeatMemberId(id as string, excludeSet);
              if (targetUserId.length > 0) {
                const { utcStartTime, utcEndTime } = baseTime;
                const firstDayOfWeek = this.localStorageService.getIsoWeekStatus() ? 2 : 1;
                const baseBody = {
                  token: this.authService.token,
                  targetUserId,
                  filterStartTime: utcStartTime,
                  filterEndTime: utcEndTime,
                  type: reportDayType,
                  firstDayOfWeek,
                };

                const request = [this.api21xxService.fetchSportSummaryArray(baseBody)];
                // 確認是否需要進行數據比較
                if (!compareTime) {
                  this.uiFlag.isCompareMode = false;
                } else {
                  this.uiFlag.isCompareMode = true;
                  const { utcStartTime: compareUtcStartTime, utcEndTime: compareUtcEndTime } =
                    compareTime;
                  const compareBody = {
                    ...baseBody,
                    filterStartTime: compareUtcStartTime,
                    filterEndTime: compareUtcEndTime,
                  };
                  request.push(this.api21xxService.fetchSportSummaryArray(compareBody));
                }

                return combineLatest(request).pipe(map((responseArray) => [res, ...responseArray]));
              }

              const emptyDataResult = [res, []];
              if (compareTime) emptyDataResult.push([]);
              return of(emptyDataResult);
            }
          }),
          takeUntil(this.ngUnsubscribe)
        )
        .subscribe((resultArray) => {
          // 陣列為空則顯示錯誤訊息
          if (resultArray.length === 0) return this.hintDialogService.openAlert(errorMessage);
          this.changeColumnOption(sportType as SportType, level as GroupLevel);
          this.initFlag();
          this.createReport(condition, resultArray);
          this.scrollToReport();
          this.changeDetectorRef.markForCheck();
        });
    }
  }

  /**
   * 取得橫跨時間範圍
   * @param condition {ReportCondition}-報告條件
   */
  getDiffTime(condition: ReportCondition) {
    const { baseTime, compareTime, dateUnit } = condition;
    const baseOnMonth = (dateUnit as ReportDateUnit).unit >= DateUnit.month;
    const unit = (dateUnit as ReportDateUnit).getUnitString();
    const baseDiffRange = baseTime.getDiffRange(unit, baseOnMonth);
    const compareDiffRange = compareTime ? compareTime.getDiffRange(unit, baseOnMonth) : null;
    return {
      base: baseDiffRange,
      compare: compareDiffRange,
    };
  }

  /**
   * 取得當週的日期(起始日為週一)
   * @param utcStartTime {string}-開始日期(UTC)
   */
  getWeekRangeTime(utcStartTime: string) {
    const startTime = dayjs(utcStartTime).startOf('isoWeek').format('YYYY-MM-DDTHH:mm:ss.SSSZ');
    const endTime = dayjs(startTime).endOf('isoWeek').format('YYYY-MM-DDTHH:mm:ss.SSSZ');
    return { startTime, endTime };
  }

  /**
   * 變更分析可選擇的選項
   * @param sportType {SportType}-運動類別
   * @param level {GroupLevel}-群組階層
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
   */
  createReport(condition: ReportCondition, data: Array<any>) {
    const [allGroupMemberList, baseSportSummary, compareSportSummary] = data;
    const { groupDetail } = this.getGroupInfo();
    this.sportsTargetCondition = this.professionalService
      .getSportsTarget(groupDetail)
      .getArrangeCondition((condition.dateUnit as ReportDateUnit).unit);
    this.handlePersonalData(
      'base',
      condition,
      allGroupMemberList,
      baseSportSummary,
      this.sportsTargetCondition
    );

    if (this.uiFlag.isCompareMode) {
      this.handlePersonalData(
        'compare',
        condition,
        allGroupMemberList,
        compareSportSummary,
        this.sportsTargetCondition
      );
    }

    this.handleGroupInfoData(allGroupMemberList);
    this.handleGroupChartData(condition, baseSportSummary, compareSportSummary);
    this.uiFlag.progress = 100;
  }

  /**
   * 處理每個成員個人基準數據
   * @param timeType {ReportDateType}-日期範圍類別
   * @param condition {ReportCondition}-報告篩選條件
   * @param allGroupList {AllGroupMember}-群組內所有成員清單
   * @param dataArray {Array<any>}-多人的運動數據陣列
   */
  handlePersonalData(
    timeType: ReportDateType,
    condition: ReportCondition,
    allGroupList: AllGroupMember,
    dataArray: Array<any>,
    sportsTargetCondition: TargetConditionMap
  ) {
    timeType === 'base'
      ? this.reportService.saveBaseActivitiesData(dataArray)
      : this.reportService.saveCompareActivitiesData(dataArray);
    const dateUnit = condition.dateUnit as ReportDateUnit;
    const {
      groupDetail: { customField },
    } = this.getGroupInfo();
    const benefitTimeStartZone = customField?.activityTimeHRZ;
    dataArray.forEach((_data) => {
      const { userId: _userId, resultCode } = _data;
      let parameter: SportsParameter;
      if (resultCode === 403) {
        parameter = { openPrivacy: false };
      } else {
        const _dataArray = _data[dateUnit.getReportKey('sportsReport')];
        parameter = {
          openPrivacy: true,
          targetCondition: sportsTargetCondition,
          condition,
          data: _dataArray,
          timeType,
          benefitTimeStartZone,
        };
      }

      const sportData = new GroupSportsReport(parameter);
      allGroupList.savePersonalData(_userId, timeType, sportData.infoData);
    });

    this.memberSportsInfo = allGroupList;
    this.personAnalysis = new SportsAnalysisSort(
      Object.values(allGroupList.memberList),
      'targetAchievedPeople',
      false
    );
  }

  /**
   * 計算各群組數據
   * @param allGroupList {AllGroupMember}-群組內所有成員清單
   */
  handleGroupInfoData(allGroupList: AllGroupMember) {
    const rootGroupInfo = this.getBelongGroupObj();
    this.groupSportsInfo = new GroupSportsReportInfo(rootGroupInfo, allGroupList);
    // console.log(this.groupSportsInfo);

    this.groupAnalysis = new SportsAnalysisSort(
      Object.values(this.groupSportsInfo.groupSportInfo),
      'targetAchievedPeople',
      true
    );
  }

  /**
   * 只取得所屬群組、子群組之資訊
   * @author kidin-1110427
   */
  getBelongGroupObj() {
    if (this.reportCondition.group) {
      const { id, level } = this.reportCondition.group.focusGroup;
      const allGroupInfo = deepCopy(
        this.professionalService.getCurrentGroupInfo().immediateGroupObj
      );
      if (level === GroupLevel.brand) return allGroupInfo;

      const {
        groups: { branchId, classId },
      } = groupIdReg.exec(id as string) as any;
      for (const _id in allGroupInfo) {
        const {
          groups: { branchId: _branchId, classId: _classId },
        } = groupIdReg.exec(_id) as any;
        if (_branchId !== branchId) {
          delete allGroupInfo[_id];
          continue;
        }

        if (level === GroupLevel.class && _classId !== classId) delete allGroupInfo[_id];
      }

      return allGroupInfo;
    }
  }

  /**
   * 計算圖表所需數據
   * @param condition {ReportCondition}-報告篩選條件
   * @param baseData {Array<any>}-多人的基準運動數據陣列
   * @param compareData {Array<any>}-多人的比較運動數據陣列
   * @author kidin-1110322
   */
  handleGroupChartData(condition: ReportCondition, baseData: Array<any>, compareData: Array<any>) {
    const {
      groupDetail: { customField },
    } = this.getGroupInfo();
    const benefitTimeStartZone = customField?.activityTimeHRZ;
    const isMondayFirst = this.localStorageService.getIsoWeekStatus();
    const totalPeople = this.groupSportsInfo.getAssignGroupInfo(
      this.getFocusGroupId() as string,
      'totalPeople'
    );

    this.groupChartData = new GroupSportsChartData(
      condition,
      baseData,
      compareData,
      this.sportsTargetCondition,
      totalPeople,
      isMondayFirst,
      benefitTimeStartZone as BenefitTimeStartZone
    );
  }

  /**
   * 取得目前聚焦群組的群組id
   * @author kidin-1110324
   */
  getFocusGroupId() {
    return this.reportCondition.group?.focusGroup.id;
  }

  /**
   * 取得人均數據
   * @param infoData {any}-運動概要數據
   * @param key {string}-指定數據的鍵名
   * @author kidin-1110324
   */
  getPerAvgData(infoData: any, key: string) {
    const isMetric = this.userUnit === DataUnitType.metric;
    const sportType = this.reportCondition.sportType as SportType;
    const result = {
      value: 0,
      unit: '',
      update(value: string | number, unit = '') {
        this.value = value;
        this.unit = unit;
      },
      get() {
        return { value: this.value, unit: this.unit };
      },
    };

    const data = infoData[key];
    if (data) {
      const { activityPeople } = infoData;
      const value = mathRounding(activityPeople ? data / activityPeople : 0, 2);
      switch (key) {
        case 'calories':
          result.update(value, 'cal');
          break;
        case 'alaPoint':
          result.update(Math.floor(activityPeople ? data / activityPeople : 0), 'point');
          break;
        case 'avgHeartRateBpm':
          result.update(value, 'bpm');
          break;
        case 'totalDistanceMeters': {
          // 距離統一使用千位數單位進行四捨五入
          const thousandsNumber = value / 1000;
          let distanceConverse: number | string;
          let unit: string;
          if (isMetric) {
            distanceConverse = mathRounding(thousandsNumber, 2);
            unit = 'km';
          } else {
            distanceConverse = mathRounding(thousandsNumber / mi, 2);
            unit = 'mi';
          }

          // 不足0.1公里或0.1英哩，則以 '< 0.1' 表示
          result.update(distanceConverse >= 0.1 ? distanceConverse : '< 0.1', unit);
          break;
        }
        case 'elevGain':
          isMetric ? result.update(value, 'm') : result.update(mathRounding(value / ft, 1), 'ft');
          break;
        case 'avgSpeed': {
          const paceList = [SportType.run, SportType.swim, SportType.row];
          if (paceList.includes(sportType)) {
            const { value: pace, unit: paceUnit } = speedToPace(value, sportType, this.userUnit);
            result.update(pace, paceUnit);
          } else {
            isMetric
              ? result.update(value, 'kph')
              : result.update(mathRounding(value / mi, 2), 'mph');
          }

          break;
        }
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
        case 'totalFeedbackEnergy':
          result.update(mathRounding(value ?? 0, 2), 'whr');
          break;
        default:
          result.update(value);
          break;
      }
    }

    return result.get();
  }

  /**
   * 取得個人概要數據  /////////////////////////////////////////////////////////
   * @param data {any}-運動概要數據
   * @param key {string}-指定數據的鍵名
   * @author kidin-1110324
   */
  getPersonalData(data: any, key: string) {
    //data : personAnalysis.data ; key = 需要的資料名稱
    if (this.uiFlag.progress !== 100) return 0;

    const isMetric = this.userUnit === DataUnitType.metric;
    const sportType = this.reportCondition.sportType as SportType;
    let result: string | number = 0;
    const value = data[key];
    if (value) {
      switch (key) {
        case 'totalDistanceMeters': {
          // 距離統一使用千位數單位進行四捨五入
          const thousandsNumber = value / 1000;
          const distanceConverse = mathRounding(thousandsNumber / (isMetric ? 1 : mi), 2);

          // 不足0.1公里或0.1英哩，則以 '< 0.1' 表示
          result = distanceConverse >= 0.1 ? distanceConverse : '< 0.1';
          break;
        }
        case 'elevGain':
          result = isMetric ? value : mathRounding(value / ft, 1);
          break;
        case 'avgSpeed': {
          const paceList = [SportType.run, SportType.swim, SportType.row];
          if (paceList.includes(sportType)) {
            result = speedToPace(value, sportType, this.userUnit).value;
          } else {
            result = isMetric ? value : mathRounding(value / mi, 2);
          }

          break;
        }
        case 'totalWeightKg':
          result = isMetric ? value : mathRounding(value / lb, 1);
          break;
        case 'targetAchieveRate':
          result = `${value}%`;
          break;
        case 'totalFeedbackEnergy':
          result = mathRounding(value ?? 0, 1);
          break;
        default:
          result = Math.round(value ?? 0);
          break;
      }
    }

    return result ? result : '--';
  }

  /**
   * 取得目標達成率
   * @param isBaseData {number}-是否為基準類型數據
   */
  getTotalAchievedNumber(isBaseData: boolean) {
    const { baseDataAvg, compareDataAvg } = this.groupChartData.achievementRate;
    return {
      value: `${isBaseData ? baseDataAvg : compareDataAvg}%`,
      unit: '',
    };
  }

  /**
   * 取得目標達成率
   * @param totalPeople {number}-總人數
   * @param statistics {number}-統計人數
   */
  getAchievedNumber(totalPeople: number, statistics: number) {
    const numerator = statistics ?? 0;
    return {
      value: totalPeople ? `${mathRounding((numerator / totalPeople) * 100, 1)}%` : '0%',
      unit: '',
    };
  }

  /**
   * 取得人數相關統計數據
   * @param denominator {number}-總人數
   * @param statistics {number}-統計人數
   */
  getPeopleNumber(denominator: number, statistics: number) {
    const numerator = statistics ?? 0;
    return {
      value: denominator ? `${numerator}/${denominator}` : '0/0',
      unit: '',
    };
  }

  /**
   * 取得已達標人數
   * @param statistics {number}-統計人數
   */
  getAchievedPeople(statistics: number) {
    return {
      value: statistics ?? 0,
      unit: '',
    };
  }

  /**
   * 變更排序類別或方向
   * @param isGroupAnalysis {boolean}-分析類別
   * @param column {string}-欄位類別
   * @author kidin-1110328
   */
  changeSort(isGroupAnalysis: boolean, columnType: string | undefined = undefined) {
    if (!columnType) return false;
    const analysis = isGroupAnalysis ? this.groupAnalysis : this.personAnalysis;
    if (analysis.sortType !== columnType) {
      analysis.changeSortType(columnType);
    } else {
      analysis.changeOrder();
    }

    this.changeDetectorRef.markForCheck();
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

    this.changeDetectorRef.markForCheck();
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

    this.changeDetectorRef.markForCheck();
  }

  /**
   * 訂閱點擊與捲動事件，事件發生時關閉選單
   * @author kidin-1110329
   */
  subscribePluralEvent() {
    this.pluralEvent = subscribePluralEvent('.main-body')
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((e) => {
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
    this.changeDetectorRef.markForCheck();
  }

  /**
   * 群組分析之群組篩選與欄位設定變更，依設定顯示項目
   * @param e {ProfessionalAnalysisOption}-群組篩選與欄位設定
   * @author kidin-1110331
   */
  groupOptionChange(e: ProfessionalAnalysisOption) {
    this.groupAnalysisOption = e;
    this.changeDetectorRef.markForCheck();
  }

  /**
   * 個人分析分析之群組篩選與欄位設定變更，依設定顯示項目
   * @param e {ProfessionalAnalysisOption}-群組篩選與欄位設定
   * @author kidin-1110401
   */
  personalOptionChange(e: ProfessionalAnalysisOption) {
    this.personalAnalysisOption = e;
    this.changeDetectorRef.markForCheck();
  }

  /**
   * 顯示指定的群組選單
   * @param e {MouseEvent}
   * @param info {any}-群組相關資訊
   * @author kidin-1110401
   */
  showAssignGroupMenu(e: MouseEvent, info: any) {
    e.stopPropagation();
    const { x, y } = e as any;
    const { groupId, member } = info;
    this.analysisAssignMenu = {
      show: true,
      position: { x, y },
      reportType: 'sports',
      object: 'group',
      id: groupId,
      nameList: member,
    };

    this.subscribePluralEvent();
    this.changeDetectorRef.markForCheck();
  }

  /**
   * 顯示指定的群組選單
   * @param e {MouseEvent}
   * @param info {any}-個人相關資訊
   * @author kidin-1110401
   */
  showAssignPersonMenu(e: MouseEvent, info: any) {
    e.stopPropagation();
    const { x, y } = e as any;
    const { memberId, groupId } = info;
    const belongGroup = groupId.map((_id) => {
      const { groupSportInfo } = this.groupSportsInfo;
      return {
        groupId: _id,
        groupName: groupSportInfo[_id].groupName,
      };
    });

    this.analysisAssignMenu = {
      show: true,
      position: { x, y },
      reportType: 'sports',
      object: 'person',
      id: memberId,
      nameList: belongGroup,
    };

    this.subscribePluralEvent();
    this.changeDetectorRef.markForCheck();
  }

  /**
   * 將群組分析列表完整顯示
   * @author kidin-1110401
   */
  seeMoreGroup() {
    this.uiFlag.analysisSeeMoreGroup = true;
    this.changeDetectorRef.markForCheck();
  }

  /**
   * 將個人分析列表完整顯示
   * @author kidin-1110401
   */
  seeMorePerson() {
    this.uiFlag.analysisSeeMorePerson = true;
    this.changeDetectorRef.markForCheck();
  }

  /**
   * 變更活動分析的運動類別
   * @param type {SportType}-運動類別
   */
  changeSelectedType(type: SportType) {
    const { selectedType } = this.uiFlag;
    this.uiFlag.selectedType = type === selectedType ? SportType.all : type;
    this.changeDetectorRef.markForCheck();
  }

  /**
   * 取得與此圖表有關的運動目標條件
   * @param type {TargetField}-此圖表的類別
   * @author kidin-1110418
   */
  getAssignCondition(type: TargetField) {
    const assignCondition = this.sportsTargetCondition.get(type);
    const totalPeople = this.groupSportsInfo.getAssignGroupInfo(
      this.getFocusGroupId() as string,
      'totalPeople'
    );
    return assignCondition ? +assignCondition.filedValue * totalPeople : null;
  }

  /**
   * 根據運動類別與使用者使用單位取得配速單位
   */
  getSpeedPaceUnit() {
    const { sportType } = this.reportCondition;
    const isMetric = this.userUnit === DataUnitType.metric;
    switch (sportType) {
      case SportType.run:
        return isMetric ? 'min/km' : 'min/mi';
      case SportType.cycle:
        return isMetric ? 'kph' : 'mph';
      case SportType.swim:
        return 'min/100m';
      case SportType.row:
        return 'min/500m';
      default:
        return '';
    }
  }

  /**
   * 捲動至報告位置
   * @author kidin-1110427
   */
  scrollToReport() {
    setTimeout(() => {
      const element = document.querySelector('.report-headTitleSection') as HTMLElement;
      const top = element.offsetTop - 70;
      const scrollElement = document.querySelector('.main-body') as Element;
      scrollElement.scrollTo({ top, behavior: 'smooth' });
    }, 200);
  }

  /**
   *下載運動報告-個人分析 xlsx檔案
   * @memberof SportsReportComponent
   */
  downloadXlsx() {
    const workbook = XLSX.utils.book_new(); // 創建試算表檔案
    const data = [];
    const columns = [
      '名稱',
      '達成率',
      '活動數量',
      '總計時',
      '效益時間',
      '活動指標 PAI',
      '總卡路里',
      '平均心率',
      '總發電量',
      '活動偏好',
      'ALA POINT',
      'Zone0',
      'Zone1',
      'Zone2',
      'Zone3',
      'Zone4',
      'Zone5',
    ];
    data.push(columns);
    this.personAnalysis.data.forEach((person) => {
      const personData = [];
      personData.push(person.memberName);
      personData.push(this.getPersonalData(person.base, 'targetAchieveRate'));
      personData.push(this.getPersonalData(person.base, 'totalActivities'));
      personData.push(this.transform(this.getPersonalData(person.base, 'totalSecond')));
      personData.push(this.transform(this.getPersonalData(person.base, 'benefitTime')));
      personData.push(this.getPersonalData(person.base, 'pai'));
      personData.push(this.getPersonalData(person.base, 'calories'));
      personData.push(this.getPersonalData(person.base, 'avgHeartRateBpm'));
      personData.push(this.getPersonalData(person.base, 'totalFeedbackEnergy'));
      const preferString = person.base.preferSports?.join(',') || '';
      personData.push(preferString);
      personData.push(this.getPersonalData(person.base, 'alaPoint'));
      // 心律 Zone0-Zone5
      personData.push(this.transform(this.getPersonalData(person.base, 'totalHrZone0Second')) || 0);
      personData.push(this.transform(this.getPersonalData(person.base, 'totalHrZone1Second')) || 0);
      personData.push(this.transform(this.getPersonalData(person.base, 'totalHrZone2Second')) || 0);
      personData.push(this.transform(this.getPersonalData(person.base, 'totalHrZone3Second')) || 0);
      personData.push(this.transform(this.getPersonalData(person.base, 'totalHrZone4Second')) || 0);
      personData.push(this.transform(this.getPersonalData(person.base, 'totalHrZone5Second')) || 0);
      // 將memberNameChars陣列放進data陣列中
      data.push(personData);
    });

    const sheet = XLSX.utils.aoa_to_sheet(data);
    XLSX.utils.sheet_add_aoa(sheet, data);
    XLSX.utils.book_append_sheet(workbook, sheet, '個人分析', true);
    XLSX.writeFileXLSX(workbook, '群組運動報告-個人分析.xlsx');
  }

  /**
   * 將總秒數轉為時:分:秒或時:分
   * @param value {any}-時間（s）
   * @param args.showZeroHour 不足1小時或1分鐘是否仍完整顯示時：分：秒，ex. 00:00:39
   * @param args.hideSecond 是否隱藏秒
   */
  transform(value: any, args = { showZeroHour: true, hideSecond: false }): string {
    const { showZeroHour, hideSecond } = args;
    if (typeof value === 'number') {
      const prefix = value < 0 ? '-' : '';
      const yVal = Math.abs(value);
      const costhr = Math.floor(yVal / 3600);
      const costmin = Math.floor(Math.round(yVal - costhr * 60 * 60) / 60);
      const costsecond = Math.round(yVal - costmin * 60 - costhr * 60 * 60);
      const timeHr = `${costhr}`.padStart(2, '0');
      const timeSecond = `${costsecond}`.padStart(2, '0');
      let timeMin = `${costmin}`.padStart(2, '0');

      if (showZeroHour === undefined || showZeroHour) {
        if (hideSecond) {
          timeMin = +timeSecond >= 30 ? `${costmin + 1}`.padStart(2, '0') : timeMin;
          return `${prefix}${timeHr}:${timeMin}`;
        } else {
          return `${prefix}${timeHr}:${timeMin}:${timeSecond}`;
        }
      } else {
        if (costhr === 0) {
          return `${prefix}${timeMin}:${timeSecond}`;
        } else {
          return `${prefix}${costhr}:${timeMin}:${timeSecond}`;
        }
      }
    } else {
      return '--';
    }
  }
  /**
   * 解除rxjs訂閱
   */
  ngOnDestroy() {
    this.ngUnsubscribe.next(null);
    this.ngUnsubscribe.complete();
  }
}
