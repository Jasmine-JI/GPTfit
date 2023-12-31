import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Output,
  EventEmitter,
} from '@angular/core';
import { Subject, Subscription, of, merge, fromEvent, combineLatestWith } from 'rxjs';
import { takeUntil, tap, map, switchMap, debounceTime } from 'rxjs/operators';
import { ReportCondition, ReportDateType } from '../../../core/models/compo/report-condition.model';
import { DateRange } from '../../classes/date-range';
import { ReportDateUnit } from '../../classes/report-date-unit';
import {
  TargetField,
  TargetConditionMap,
} from '../../../core/models/api/api-common/sport-target.model';
import {
  UserService,
  ReportService,
  ConfigJsonService,
  GlobalEventsService,
  AuthService,
  LocalstorageService,
  Api21xxService,
  HashIdService,
} from '../../../core/services';
import { ActivatedRoute } from '@angular/router';
import { SportsTarget } from '../../classes/sports-target';
import { SportsReport } from '../../classes/sports-report/sports-report';
import { PersonalSportsChartData } from '../../classes/sports-report/personal-sports-chart-data';
import { HrZoneRange } from '../../../core/models/compo/chart-data.model';
import { mi, ft, lb } from '../../../core/models/const';
import {
  DataUnitType,
  QueryString,
  BenefitTimeStartZone,
  AccessRight,
  DateUnit,
} from '../../../core/enums/common';
import { DefaultDateRange } from '../../classes/default-date-range';
import { zoneColor, sportTypeColor, trendChartColor } from '../../../core/models/represent-color';
import { WeightTrainingAnalysis } from '../../classes/sports-report/weight-train-anaysis';
import { WeightTrainAnalysisOption } from '../../classes/weight-train-analysis-option';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { WeightTrainingAnalysisSort } from '../../classes/sports-report/weight-training-analysis-sort';
import {
  speedToPace,
  getAvgCadenceI18nKey,
  getMaxCadenceI18nKey,
  getPaceUnit,
  transformDistance,
  getWeightTrainingLevelText,
  speedToPaceSecond,
  paceSecondTimeFormat,
  getUserHrRange,
  deepCopy,
  getUrlQueryStrings,
  checkResponse,
  mathRounding,
} from '../../../core/utils';
import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
import { SameWeekLifeTrackingData } from '../../classes/same-week-lifetracking-data';
import { PersonalChartAnalysisOption } from '../../../containers/personal/classes';
import { DataDescription } from '../../../core/models/compo';
import { MuscleAnalysisColumn, MuscleGroup, SportType } from '../../../core/enums/sports';
import { MusclePartIconPipe } from '../../../core/pipes/muscle-part-icon.pipe';
import { MuscleGroupNamePipe } from '../../../core/pipes/muscle-group-name.pipe';
import { MuscleGroupIconPipe } from '../../../core/pipes/muscle-group-icon.pipe';
import { DataTypeUnitPipe } from '../../../core/pipes/data-type-unit.pipe';
import { DataTypeTranslatePipe } from '../../../core/pipes/data-type-translate.pipe';
import { SportTypePipe } from '../../../core/pipes/sport-type.pipe';
import { SportTimePipe } from '../../../core/pipes/sport-time.pipe';
import { SportTypeIconPipe } from '../../../core/pipes/sport-type-icon.pipe';
import { WeightSibsPipe } from '../../../core/pipes/weight-sibs.pipe';
import { SportPaceSibsPipe } from '../../../core/pipes/sport-pace-sibs.pipe';
import { TranslateUnitKeyPipe } from '../../../core/pipes/translate-unit-key.pipe';
import { TranslateKeyPipe } from '../../../core/pipes/translate-key.pipe';
import { DateUnitKeyPipe } from '../../../core/pipes/date-unit-key.pipe';
import { MatIconModule } from '@angular/material/icon';
import { RingChartComponent } from '../chart/ring-chart/ring-chart.component';
import { AnalysisOptionComponent } from '../../../components/analysis-option/analysis-option.component';
import { SportsDataTableComponent } from '../../../components/sports-data-table/sports-data-table.component';
import { CompareBodyWeightChartComponent } from '../chart/compare-body-weight-chart/compare-body-weight-chart.component';
import { TargetAchieveChartComponent } from '../chart/target-achieve-chart/target-achieve-chart.component';
import { CompareExtremeGforceChartComponent } from '../chart/compare-extreme-gforce-chart/compare-extreme-gforce-chart.component';
import { ComparePaceChartComponent } from '../chart/compare-pace-chart/compare-pace-chart.component';
import { CompareOverlayColumnChartComponent } from '../chart/compare-overlay-column-chart/compare-overlay-column-chart.component';
import { CompareColumnTrendComponent } from '../chart/compare-column-trend/compare-column-trend.component';
import { CompareHrzoneTrendComponent } from '../chart/compare-hrzone-trend/compare-hrzone-trend.component';
import { HrzoneInfoComponent } from '../chart/hrzone-info/hrzone-info.component';
import { TreeMapChartComponent } from '../../../components/tree-map-chart/tree-map-chart.component';
import { HrzoneChartComponent } from '../chart/hrzone-chart/hrzone-chart.component';
import { MuscleMapChartComponent } from '../chart/muscle-map/muscle-map-chart/muscle-map-chart.component';
import { WeightTrainLevelSelectorComponent } from '../weight-train-level-selector/weight-train-level-selector.component';
import { DistributionCanvasChartComponent } from '../chart/distribution-canvas-chart/distribution-canvas-chart.component';
import { TipDialogComponent } from '../../../components/tip-dialog/tip-dialog.component';
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
import { ConditionSelectorComponent } from '../condition-selector/condition-selector.component';
import { LoadingMaskComponent } from '../../../components/loading-mask/loading-mask.component';
import { LoadingBarComponent } from '../../../components/loading-bar/loading-bar.component';

dayjs.extend(isoWeek);

@Component({
  selector: 'app-sports-reports',
  templateUrl: './sports-report.component.html',
  styleUrls: ['./sports-report.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    LoadingBarComponent,
    LoadingMaskComponent,
    ConditionSelectorComponent,
    NgIf,
    NgClass,
    NgTemplateOutlet,
    TipDialogComponent,
    DistributionCanvasChartComponent,
    NgFor,
    WeightTrainLevelSelectorComponent,
    MuscleMapChartComponent,
    HrzoneChartComponent,
    TreeMapChartComponent,
    HrzoneInfoComponent,
    CompareHrzoneTrendComponent,
    CompareColumnTrendComponent,
    CompareOverlayColumnChartComponent,
    ComparePaceChartComponent,
    CompareExtremeGforceChartComponent,
    TargetAchieveChartComponent,
    CompareBodyWeightChartComponent,
    SportsDataTableComponent,
    AnalysisOptionComponent,
    NgSwitch,
    NgSwitchCase,
    RingChartComponent,
    MatIconModule,
    DecimalPipe,
    KeyValuePipe,
    TranslateModule,
    DateUnitKeyPipe,
    TranslateKeyPipe,
    TranslateUnitKeyPipe,
    SportPaceSibsPipe,
    WeightSibsPipe,
    SportTypeIconPipe,
    SportTimePipe,
    SportTypePipe,
    DataTypeTranslatePipe,
    DataTypeUnitPipe,
    MuscleGroupIconPipe,
    MuscleGroupNamePipe,
    MusclePartIconPipe,
  ],
})
export class SportsReportComponent implements OnInit, OnDestroy {
  @Output() showPrivacyUi = new EventEmitter();
  private ngUnsubscribe = new Subject();
  private pluralEvent = new Subscription();
  private subscribeUserProfile = new Subscription();
  resizeEvent = new Subscription();

  /**
   * UI控制相關flag
   */
  uiFlag = {
    progress: 100,
    isCompareMode: false,
    selectedType: SportType.all, // 活動分析圖表用，與條件選擇器運動類別作用不同
    printMode: false,
    isOutSidePage: !location.pathname.split('/').includes('dashboard'),
    isPageOwner: false,
    isDebugMode: false,
    isSystemAdmin: false,
    typeRunShowPace: true, // 跑步類別之配速圖表是否切換成速度圖表
    showWeightTrainSetting: false,
    showAnalysisMenu: false,
    analysisSeeMore: false,
  };

  /**
   * 產生報告之篩選條件
   */
  initReportCondition: ReportCondition = {
    moduleType: 'personal',
    pageType: 'sportsReport',
    baseTime: new DateRange(),
    compareTime: null,
    dateUnit: new ReportDateUnit(DateUnit.day),
    sportType: SportType.all,
    needRefreshData: false,
  };

  /**
   * 儲存變更過後的報告條件
   */
  reportCondition: ReportCondition;

  /**
   * 目標使用者編號(用於觀看他人運動報告)
   */
  targetUserId: number;

  /**
   * 個人運動目標
   */
  sportsTargetCondition: TargetConditionMap;

  /**
   * 運動概要數據
   */
  sportInfoData = {
    base: <SportsReport | null>null,
    compare: <SportsReport | null>null,
    diff: <any>null,
  };

  /**
   * 圖表所需數據
   */
  chartData: PersonalSportsChartData;

  /**
   * 另存重訓肌群圖表數據，避免因使用ngFor造成版面改變重新取值以重繪的問題
   */
  muscleGroupTrendData: Array<any> = [];

  /**
   * 另存重訓部位圖表數據，避免因使用ngFor造成版面改變重新取值以重繪的問題
   */
  musclePartTrendData: any = {};

  /**
   * 圖表數據分析列表顯示欄位設定
   */
  chartAnalysisOption = new PersonalChartAnalysisOption({
    analysisType: 'normal',
    sportType: SportType.all,
    object: 'list',
  });

  /**
   * 重訓動作分析列表欄位篩選設定（因欄位數不多，故預設欄位同欄位清單）
   */
  weightTrainingAnalysisOption = new WeightTrainAnalysisOption({
    analysisType: 'weightTrainMenu',
    object: 'list',
  });

  /**
   * 重訓動作分析
   */
  weightTrainingAnalysis: WeightTrainingAnalysis;

  /**
   * 重訓動作排序相關
   */
  weightTrainingSort: WeightTrainingAnalysisSort;

  /**
   * 目前使用之多國語細
   */
  currentLang = this.translateService.currentLang;

  /**
   * 重訓程度
   */
  levelText = getWeightTrainingLevelText();

  /**
   * 日期橫跨範圍
   */
  diffTime = {
    base: <number | null>null,
    compare: <number | null>null,
  };

  /**
   * 心率區間
   */
  hrZoneRange: HrZoneRange | null = null;

  /**
   * 說明框的內容
   */
  readonly tipContent = {
    summary: <Array<DataDescription>>[
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
    dataTable: <Array<DataDescription>>[
      {
        title: 'universal_lifeTracking_achievementRate',
        content: 'universal_vocabulary_unitTargetInfo',
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
  readonly DataUnitType = DataUnitType;
  readonly sportTypeColor = sportTypeColor;
  readonly trendChartColor = trendChartColor;
  readonly DateUnit = DateUnit;
  readonly MuscleGroup = MuscleGroup;
  readonly MuscleAnalysisColumn = MuscleAnalysisColumn;

  constructor(
    private changeDetectorRef: ChangeDetectorRef,
    private userService: UserService,
    private api21xxService: Api21xxService,
    private reportService: ReportService,
    private route: ActivatedRoute,
    private hashIdService: HashIdService,
    private configJsonService: ConfigJsonService,
    private translateService: TranslateService,
    private globalEventsService: GlobalEventsService,
    private authService: AuthService,
    private localStorageService: LocalstorageService
  ) {}

  /**
   * 取得使用者
   */
  get userUnit() {
    return this.userService.getUser().userProfile.unit;
  }

  ngOnInit(): void {
    this.subscribeLangChange();
    this.subscribeWindowSize();
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
      .subscribe((e) => {
        this.handleTableResize();
        this.changeDetectorRef.markForCheck();
      });
  }

  /**
   * 訂閱語系改變事件
   */
  subscribeLangChange() {
    this.translateService.onLangChange.pipe(takeUntil(this.ngUnsubscribe)).subscribe((res) => {
      this.currentLang = res.lang;
    });
  }

  /**
   * 視窗寬度變更時，調整表格欄位顯示數目
   */
  handleTableResize() {
    const element = document.querySelector('.main__container') as HTMLElement;
    const containerWidth = element.getBoundingClientRect().width;
    this.weightTrainingAnalysisOption.checkOverLimit(containerWidth);
    this.weightTrainingAnalysisOption.fillItem();
  }

  /**
   * 將條件篩選器進行初始化
   * @author kidin-1110315
   */
  initialReportCondition() {
    of([])
      .pipe(
        tap(() => this.getDefaultDate()),
        tap(() => this.checkPageOwner()),
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
   * 確認頁面擁有者是否為登入者
   */
  checkPageOwner() {
    const hashUserId = this.route.snapshot.parent?.paramMap.get('userId');
    const { userId, systemAccessright } = this.userService.getUser();
    if (hashUserId) {
      if (systemAccessright <= AccessRight.marketing) this.uiFlag.isSystemAdmin = true;
      if (hashUserId) {
        const targetUserId = +this.hashIdService.handleUserIdDecode(hashUserId);
        if (targetUserId !== userId) {
          this.uiFlag.isPageOwner = false;
          this.targetUserId = targetUserId;
          return;
        }
      }
    }

    this.uiFlag.isPageOwner = true;
    this.targetUserId = userId;
    return;
  }

  /**
   * 確認query string
   * @author kidin-1110315
   */
  checkQueryString() {
    const query = getUrlQueryStrings(location.search);
    for (const _key in query) {
      const value = query[_key];
      switch (_key) {
        case QueryString.debug: {
          const { systemAccessright } = this.userService.getUser();
          if (systemAccessright <= AccessRight.marketing) this.uiFlag.isDebugMode = true;
          break;
        }
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
          if (this.initReportCondition.dateUnit) this.initReportCondition.dateUnit.unit = +value;
          break;
        case QueryString.sportType:
          this.initReportCondition.sportType = +value;
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
      this.subscribeUserProfile.unsubscribe(); // 先解除先前訂閱避免memory leak
      this.uiFlag.progress = 30;
      const { isPageOwner } = this.uiFlag;
      const getUserInfo = () =>
        isPageOwner
          ? this.userService.getUser().rxUserProfile
          : this.userService.getTargetUserInfo(this.targetUserId);
      const { baseTime, compareTime, dateUnit, needRefreshData } = condition;
      this.reportCondition = deepCopy(condition);
      this.chartAnalysisOption.changeOption(condition.sportType);
      this.uiFlag.isCompareMode = compareTime ? true : false;
      const { isCompareMode } = this.uiFlag;
      const isMondayFirst = dayjs(baseTime.startTimestamp).isoWeekday() === 1;
      const isWeekReport = dateUnit?.unit === DateUnit.week;
      const needMergeData = isMondayFirst && isWeekReport;
      // 取得使用者資訊與運動數據，並根據該頁面是否為使用者擁有決定是否顯示體重與體脂
      this.subscribeUserProfile = getUserInfo()
        .pipe(
          switchMap((res) => {
            let resultObj: any = { userInfo: res };
            // 若僅變更運動類別，則取已儲存之數據
            if (!needRefreshData) {
              const baseActivitiesData = this.reportService.getBaseActivitiesData();
              resultObj = { ...resultObj, baseActivitiesData };
              if (isPageOwner) {
                const baseLifeTracking = this.reportService.getBaseLifeTracking();
                resultObj = { ...resultObj, baseLifeTracking };
              }

              if (isCompareMode) {
                const compareActivitiesData = this.reportService.getCompareActivitiesData();
                resultObj = { ...resultObj, compareActivitiesData };
              }

              if (isCompareMode && isPageOwner) {
                const compareLifeTracking = this.reportService.getCompareLifeTracking();
                resultObj = { ...resultObj, compareLifeTracking };
              }

              return of(resultObj);
            } else {
              const body = this.getSportsSummaryRequestBody(baseTime, dateUnit);
              return this.api21xxService.fetchSportSummaryArray(body).pipe(
                map((baseActivitiesData) => {
                  return { ...resultObj, baseActivitiesData };
                })
              );
            }
          }),
          switchMap((resultObj: any) => {
            if (needRefreshData && isCompareMode) {
              const body = this.getSportsSummaryRequestBody(compareTime, dateUnit);
              return this.api21xxService.fetchSportSummaryArray(body).pipe(
                map((compareActivitiesData) => {
                  return { ...resultObj, compareActivitiesData };
                })
              );
            }

            return of(resultObj);
          }),
          switchMap((resultObj: any) => {
            if (needRefreshData && isPageOwner) {
              const body = this.getTrackingSummaryRequestBody(baseTime, dateUnit);
              return this.api21xxService.fetchTrackingSummaryArray(body).pipe(
                map((baseLifeTracking) => {
                  const lifeTrackingBaseMergeData = this.mergeSameWeekLifeTrackingData(
                    needMergeData,
                    baseLifeTracking
                  );
                  return { ...resultObj, baseLifeTracking: lifeTrackingBaseMergeData };
                })
              );
            }

            return of(resultObj);
          }),
          switchMap((resultObj: any) => {
            if (needRefreshData && isCompareMode && isPageOwner) {
              const body = this.getTrackingSummaryRequestBody(compareTime, dateUnit);
              return this.api21xxService.fetchTrackingSummaryArray(body).pipe(
                map((compareLifeTracking) => {
                  const lifeTrackingCompareMergeData = this.mergeSameWeekLifeTrackingData(
                    needMergeData,
                    compareLifeTracking
                  );
                  return { ...resultObj, compareLifeTracking: lifeTrackingCompareMergeData };
                })
              );
            }

            return of(resultObj);
          }),
          switchMap((resultObj: any) => {
            if (isPageOwner && this.reportCondition.sportType === SportType.weightTrain) {
              const body = this.getMultiActivityRequestBody(baseTime);
              return this.configJsonService.getWeightTrainingConfig().pipe(
                combineLatestWith(this.api21xxService.fetchMultiActivityData(body)),
                map(([weightTrainingConfig, baseWeigtTrainingLap]) => {
                  return { ...resultObj, weightTrainingConfig, baseWeigtTrainingLap };
                })
              );
            }

            return of(resultObj);
          }),
          switchMap((resultObj: any) => {
            if (
              isPageOwner &&
              this.reportCondition.sportType === SportType.weightTrain &&
              isCompareMode
            ) {
              const body = this.getMultiActivityRequestBody(compareTime);
              return this.api21xxService.fetchMultiActivityData(body).pipe(
                map((compareWeightTrainingLap) => {
                  return { ...resultObj, compareWeightTrainingLap };
                })
              );
            }

            return of(resultObj);
          }),
          takeUntil(this.ngUnsubscribe)
        )
        .subscribe({
          next: (res) => this.handleNext(res, condition),
          error: (err) => this.handleError(err),
        });
    }
  }

  /**
   * api回應後生成報告
   * @param result 所有api回應
   * @param condition 報告條件
   */
  handleNext(result: any, condition: ReportCondition) {
    this.saveData(result);
    this.createReport(condition, result);
    this.diffTime = this.getDiffTime(condition);
    this.scrollToReport();
    this.uiFlag.progress = 100;
    this.changeDetectorRef.markForCheck();
  }

  /**
   * 錯誤處理
   * @param err 錯誤訊息
   */
  handleError(err) {
    console.error('error', err);
  }

  /**
   * 取得橫跨時間範圍
   * @param condition {ReportCondition}-篩選條件
   */
  getDiffTime(condition: ReportCondition) {
    const { baseTime, compareTime, dateUnit } = condition;
    const unit = (dateUnit as ReportDateUnit).getUnitString();
    return {
      base: baseTime.getDiffRange(unit),
      compare: compareTime ? compareTime.getDiffRange(unit) : null,
    };
  }

  /**
   * 若選擇週報告但起始日為週一，則用日報告合併成周生活追蹤報告
   * @param needMerge {boolean}-是否需要合併成周報告
   * @param data {Array<any>}-生活追蹤日報告數據
   */
  mergeSameWeekLifeTrackingData(needMerge: boolean, data: Array<any>) {
    if (!needMerge || data[0].reportLifeTrackingWeeks) return data;
    const sameWeekData = new SameWeekLifeTrackingData();
    const reportLifeTrackingWeeks: Array<any> = [];
    const { reportLifeTrackingDays } = data[0];
    reportLifeTrackingDays.forEach((_lifeTrackingDays) => {
      const { startTime, endTime } = this.getWeekRangeTime(_lifeTrackingDays.startTime);
      const newDaysObj = {
        ..._lifeTrackingDays,
        startTime,
        endTime,
      };

      if (!sameWeekData.haveMergingData) {
        sameWeekData.next(newDaysObj);
      } else {
        if (startTime !== sameWeekData.startTime) {
          reportLifeTrackingWeeks.push(sameWeekData.result);
          sameWeekData.next(newDaysObj);
        } else {
          sameWeekData.mergeData(_lifeTrackingDays);
        }
      }
    });

    if (sameWeekData.haveMergingData) reportLifeTrackingWeeks.push(sameWeekData.result);
    delete data[0].reportLifeTrackingDays;
    data[0].reportLifeTrackingWeeks = reportLifeTrackingWeeks;
    return data;
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
   * 將數據暫存，方便僅切換運動類別時，不用重call api
   * @param dataObj {any}-時間範圍內之運動與生活追蹤數據
   */
  saveData(dataObj: any) {
    const { isCompareMode, isPageOwner } = this.uiFlag;
    const { baseActivitiesData, compareActivitiesData, baseLifeTracking, compareLifeTracking } =
      dataObj;
    this.reportService.saveBaseActivitiesData(baseActivitiesData);
    if (isCompareMode) this.reportService.saveCompareActivitiesData(compareActivitiesData);
    if (isPageOwner) this.reportService.saveBaseLifeTracking(baseLifeTracking);
    if (isPageOwner && isCompareMode)
      this.reportService.saveCompareLifeTracking(compareLifeTracking);
  }

  /**
   * 取得2104/2107所需的request body
   * @param rangeTime {DateRange}-報告日期範圍
   * @param dateUnit {ReportDateUnit}-報告所使用之單位
   */
  getSportsSummaryRequestBody(rangeTime: DateRange, dateUnit: ReportDateUnit) {
    const { utcStartTime, utcEndTime } = rangeTime;
    const firstDayOfWeek = this.localStorageService.getIsoWeekStatus() ? 2 : 1;
    const body = {
      token: this.authService.token,
      targetUserId: [this.targetUserId],
      filterStartTime: utcStartTime,
      filterEndTime: utcEndTime,
      type: dateUnit.getReportDateType(),
      firstDayOfWeek,
    };

    return body;
  }

  /**
   * 取得2104/2107所需的request body
   * @param rangeTime {DateRange}-報告日期範圍
   * @param dateUnit {ReportDateUnit}-報告所使用之單位
   */
  getTrackingSummaryRequestBody(rangeTime: DateRange, dateUnit: ReportDateUnit) {
    const { utcStartTime, utcEndTime, startTimestamp } = rangeTime;
    return {
      token: this.authService.token,
      targetUserId: [this.targetUserId],
      filterStartTime: utcStartTime,
      filterEndTime: utcEndTime,
      type: dateUnit.getReportDateType(startTimestamp),
    };
  }

  /**
   * 取得api 2111所需的request body
   * @param rangeTime {DateRange}-報告日期範圍
   */
  getMultiActivityRequestBody(rangeTime: DateRange) {
    const { utcStartTime, utcEndTime } = rangeTime;
    return {
      token: this.authService.token,
      searchTime: {
        type: 1,
        fuzzyTime: [],
        filterStartTime: utcStartTime,
        filterEndTime: utcEndTime,
      },
      searchRule: {
        activity: SportType.weightTrain,
        targetUser: 1,
        fileInfo: {
          author: this.userService.getUser().userId,
        },
      },
      display: {
        activityLapLayerDisplay: 2,
        activityLapLayerDataField: [
          'dispName',
          'setOneRepMax',
          'setTotalReps',
          'setTotalWeightKg',
          'setWorkOutMuscleMain',
          'type',
          // 'sortIndex'
        ],
        activityPointLayerDisplay: 3,
        activityPointLayerDataField: [],
      },
      page: 0,
      pageCounts: 10000,
    };
  }

  /**
   * 建立報告內容
   * @param condition {ReportCondition}-報告條件
   * @param dataObj {any}-時間範圍內之運動與生活追蹤數據
   * @author kidin-1110321
   */
  createReport(condition: ReportCondition, dataObj: any) {
    const { userInfo, baseActivitiesData, compareActivitiesData } = dataObj;
    const { workoutTarget } = userInfo;
    const { unit } = condition.dateUnit as ReportDateUnit;
    this.sportsTargetCondition = new SportsTarget(workoutTarget || {}).getArrangeCondition(unit);
    this.hrZoneRange = this.getUserHrRange(userInfo);
    this.handleInfoData(condition, baseActivitiesData, compareActivitiesData);
    this.handleChartData(condition, dataObj);
    this.handleWeightTrainingAnalysis(condition, dataObj);
  }

  /**
   * 取得心率區間
   * @param userInfo {any}-使用者資訊
   */
  getUserHrRange(userInfo: any) {
    const { heartRateBase, heartRateMax, heartRateResting, birthday } = userInfo;
    if (birthday) {
      const age = dayjs().diff(dayjs(birthday, 'YYYYMMDD'), 'year');
      return getUserHrRange(heartRateBase, age, heartRateMax, heartRateResting);
    } else {
      return null;
    }
  }

  /**
   * 生成運動概要數據
   * @param condition {ReportCondition}-報告篩選條件
   * @param baseSportSummary {Array<any>}-基準時間運動數據
   * @param compareSportSummary {Array<any>}-比較時間運動數據
   */
  handleInfoData(
    condition: ReportCondition,
    baseSportSummary: Array<any>,
    compareSportSummary: Array<any>
  ) {
    const getParameter = (timeType: ReportDateType, data: Array<any>) => {
      const openPrivacy = !data || data[0].resultCode !== 403;
      const activities =
        data[0][(condition.dateUnit as ReportDateUnit).getReportKey('sportsReport')];
      const targetCondition = this.sportsTargetCondition;
      const { benefitTimeStartZone } = this.userService.getUser();
      return {
        openPrivacy,
        targetCondition,
        condition,
        data: activities,
        timeType,
        benefitTimeStartZone,
      };
    };

    const baseParameter = getParameter('base', baseSportSummary);
    this.sportInfoData.base = new SportsReport(baseParameter);
    this.sportInfoData.compare = this.uiFlag.isCompareMode
      ? new SportsReport(getParameter('compare', compareSportSummary))
      : null;
    if (this.uiFlag.isCompareMode) this.sportInfoData.diff = this.getSportInfoDiff();
  }

  /**
   * 生成圖表所需數據
   * @param condition {ReportCondition}-報告篩選條件
   * @param dataObj {Array<any>}-個人資訊、基準與比較之運動數據及生活追蹤數據
   * @param sportsTarget {SportsTarget}-群組設定的運動目標
   */
  handleChartData(condition: ReportCondition, dataObj: any) {
    const { benefitTimeStartZone } = this.userService.getUser();
    const { sportType } = condition;
    const isMondayFirst = this.localStorageService.getIsoWeekStatus();
    this.chartData = new PersonalSportsChartData(
      condition,
      dataObj,
      this.sportsTargetCondition,
      isMondayFirst,
      benefitTimeStartZone as BenefitTimeStartZone
    );
    if (sportType === SportType.weightTrain) {
      this.muscleGroupTrendData = deepCopy(this.chartData.weightTrainingTrend.groupTrainingData);
      this.musclePartTrendData = deepCopy(this.chartData.weightTrainingTrend.partTrainingData);
    }
  }

  /**
   * 生成圖表所需數據
   * @param condition {ReportCondition}-報告篩選條件
   * @param dataObj {Array<any>}-個人資訊、基準與比較之運動數據及生活追蹤數據
   */
  handleWeightTrainingAnalysis(condition: ReportCondition, dataObj: any) {
    const isWeightTrainType = condition.sportType === SportType.weightTrain;
    const { isPageOwner } = this.uiFlag;
    if (isWeightTrainType && isPageOwner) {
      const {
        userInfo: { bodyWeight, weightTrainingStrengthLevel },
        weightTrainingConfig: {
          exchangeSetupApplication: { lapOrSetTrainingSelect },
        },
        baseWeigtTrainingLap,
        compareWeightTrainingLap,
      } = dataObj;

      this.levelText = getWeightTrainingLevelText(weightTrainingStrengthLevel);
      this.weightTrainingAnalysis = new WeightTrainingAnalysis(lapOrSetTrainingSelect, bodyWeight);
      this.countLapData(baseWeigtTrainingLap, compareWeightTrainingLap);
    }
  }

  /**
   * 根據重訓名稱取得所屬sortIndex，避免因多國語系關係將同一動作區拆開，同時統計分段重訓數據
   * @param baseData {Array<any>}-api 2111回傳之基準日期範圍重訓檔案數據
   * @param compareData {Array<any>}-api 2111回傳之筆比較日期範圍重訓檔案數據
   */
  countLapData(baseData: Array<any>, compareData: Array<any>) {
    const countData = (dateType: ReportDateType, data: Array<any>) => {
      if (checkResponse(data)) {
        const { activities } = (data as any).info;
        activities.forEach((_activities) => {
          const { activityLapLayer } = _activities;
          activityLapLayer.forEach((_activityLapLayer) => {
            this.weightTrainingAnalysis.countLapTrainingData(dateType, _activityLapLayer);
          });
        });
      }
    };

    countData('base', baseData);
    if (this.uiFlag.isCompareMode) countData('compare', compareData);
    this.weightTrainingAnalysis.combineList();
    this.weightTrainingSort = new WeightTrainingAnalysisSort(this.weightTrainingAnalysis.menuList);
  }

  /**
   * 捲動至報告位置
   * @author kidin-1110427
   */
  scrollToReport() {
    setTimeout(() => {
      const element = document.querySelector('.report-headTitleSection') as HTMLElement;
      const top = element.offsetTop - 70;
      const scrollElement = document.querySelector('.main__container');
      scrollElement.scrollTo({ top, behavior: 'smooth' });
    }, 200);
  }

  /**
   * 取得加總數據或平均單筆數據
   * @param infoData {any}-運動概要數據
   * @param key {string}-指定數據的鍵名
   * @author kidin-1110324
   */
  getInfoData(infoData: any, key: string) {
    const { sportType } = this.reportCondition;
    const isMetric = this.userUnit === DataUnitType.metric;
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

    if (infoData[key]) {
      const value = infoData[key] || 0;
      switch (key) {
        case 'calories':
          result.update(Math.round(value), 'cal');
          break;
        case 'avgHeartRateBpm':
          result.update(Math.round(value), 'bpm');
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
          const prefix = distanceConverse >= 0 ? '' : '-';
          result.update(
            Math.abs(distanceConverse) >= 0.1 ? distanceConverse : `< ${prefix}0.1`,
            unit
          );
          break;
        }
        case 'elevGain':
          isMetric
            ? result.update(mathRounding(value, 1), 'm')
            : result.update(mathRounding(value / ft, 1), 'ft');
          break;
        case 'avgSpeed': {
          const paceList = [SportType.run, SportType.swim, SportType.row];
          if (paceList.includes(sportType) && this.showPace()) {
            const { value: pace, unit: paceUnit } = speedToPace(value, sportType, this.userUnit);
            result.update(pace, paceUnit);
          } else {
            isMetric
              ? result.update(mathRounding(value, 1), 'kph')
              : result.update(mathRounding(value / mi, 2), 'mph');
          }

          break;
        }
        case 'runAvgCadence':
          result.update(Math.round(value), 'spm');
          break;
        case 'cycleAvgCadence':
        case 'swimAvgCadence':
        case 'rowingAvgCadence':
          result.update(Math.round(value), 'rpm');
          break;
        case 'totalWeightKg':
          isMetric ? result.update(value, 'kg') : result.update(mathRounding(value / lb, 1), 'lb');
          break;
        case 'cycleAvgWatt':
        case 'rowingAvgWatt':
          result.update(Math.round(value), 'watt');
          break;
        case 'paceSecond':
          result.update(Math.round(value), getPaceUnit(sportType, this.userUnit));
          break;
        case 'targetAchieveRate': {
          result.update(mathRounding(value, 1), '%');
          break;
        }
        case 'totalFeedbackEnergy': {
          result.update(mathRounding(value, 1), 'whr');
          break;
        }
        default:
          result.update(Math.round(value));
          break;
      }
    }

    return result.get();
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
    return assignCondition ? +assignCondition.filedValue : null;
  }

  /**
   * 依運動類別取得平均頻率翻譯鍵名
   */
  getAvgCadenceI18nKey = getAvgCadenceI18nKey;

  /**
   * 依運動類別取得最大頻率翻譯鍵名
   */
  getMaxCadenceI18nKey = getMaxCadenceI18nKey;

  /**
   * 根據運動類別取得配速單位
   */
  getPaceUnit = getPaceUnit;

  /**
   * 根據使用者使用單位轉換距離
   */
  transformDistance = transformDistance;

  /**
   * 將配速秒轉換為 分':秒"
   */
  paceSecondTimeFormat = paceSecondTimeFormat;

  /**
   * 根據運動類別與數據類型回傳對應的頻率概要數據
   * @param sportType {SportType}-運動類別
   * @param rangeType {ReportDateType}-數據範圍類型
   * @param isMaxData {boolean}-該數據類型是否為最大值
   */
  getCadenceInfo(sportType: SportType, rangeType: ReportDateType, isMaxData: boolean) {
    let dataKey: string;
    switch (sportType) {
      case SportType.run:
        dataKey = isMaxData ? 'avgRunMaxCadence' : 'runAvgCadence';
        break;
      case SportType.cycle:
        dataKey = isMaxData ? 'avgCycleMaxCadence' : 'cycleAvgCadence';
        break;
      case SportType.swim:
        dataKey = isMaxData ? 'avgSwimMaxCadence' : 'swimAvgCadence';
        break;
      case SportType.row:
        dataKey = isMaxData ? 'avgRowingMaxCadence' : 'rowingAvgCadence';
        break;
      default:
        return '';
    }

    const info = this.sportInfoData[rangeType];
    return info?.infoData[dataKey] ?? 0;
  }

  /**
   * 根據運動類別與數據類型回傳對應的功率概要數據
   * @param sportType {SportType}-運動類別
   * @param rangeType {ReportDateType}-數據範圍類型
   * @param isMaxData {boolean}-該數據類型是否為最大值
   */
  getPowerInfo(sportType: SportType, rangeType: ReportDateType, isMaxData: boolean) {
    let dataKey: string;
    switch (sportType) {
      case SportType.cycle:
        dataKey = isMaxData ? 'avgCycleMaxWatt' : 'cycleAvgWatt';
        break;
      case SportType.row:
        dataKey = isMaxData ? 'rowingMaxWatt' : 'rowingAvgWatt';
        break;
      default:
        return '';
    }

    const info = this.sportInfoData[rangeType];
    return info?.infoData[dataKey] ?? 0;
  }

  /**
   * 切換跑步類別之配速/速度圖表
   */
  conversePaceSpeed() {
    this.uiFlag.typeRunShowPace = !this.uiFlag.typeRunShowPace;
  }

  /**
   * 顯示重訓設定選單與否
   * @param e {MouseEvent}
   */
  showWeightTrainSettingMenu(e: MouseEvent) {
    e.stopPropagation();
    const { showWeightTrainSetting } = this.uiFlag;
    if (showWeightTrainSetting) {
      this.unSubscribePluralEvent();
    } else {
      this.uiFlag.showWeightTrainSetting = true;
      this.subscribePluralEvent();
    }
  }

  /**
   * 顯示重訓動作選單與否
   * @param e {MouseEvent}
   */
  showAnalysisMenu(e: MouseEvent) {
    e.stopPropagation();
    const { showAnalysisMenu } = this.uiFlag;
    if (showAnalysisMenu) {
      this.unSubscribePluralEvent();
    } else {
      this.uiFlag.showAnalysisMenu = true;
      this.subscribePluralEvent();
    }
  }

  /**
   * 訂閱點擊與滾動事件
   */
  subscribePluralEvent() {
    const targetElement = document.querySelector('.main__container');
    const scrollEvent = fromEvent(targetElement, 'scroll');
    const clickEvent = fromEvent(document, 'click');
    this.pluralEvent = merge(scrollEvent, clickEvent)
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe(() => {
        this.unSubscribePluralEvent();
      });
  }

  /**
   * 取消訂閱點擊與滾動事件
   */
  unSubscribePluralEvent() {
    this.uiFlag.showWeightTrainSetting = false;
    this.uiFlag.showAnalysisMenu = false;
    this.pluralEvent.unsubscribe();
    this.changeDetectorRef.markForCheck();
  }

  /**
   * 取得各肌群於樹狀圖之代表顏色
   * @param muscleGroup {MuscleGroup}-肌群代號
   */
  getMuscleGroupColor(muscleGroup: MuscleGroup) {
    return zoneColor[muscleGroup - 1];
  }

  /**
   * 重訓動作分析欄位顯示變更
   * @param e {any}
   */
  weightTrainingAnalysisChange(e: any) {
    this.weightTrainingAnalysisOption = e;
  }

  /**
   * 確認進步與否
   * @param rowData {Array<any>}-該列數據
   * @param key {string}-欲比較之數據鍵名
   */
  checkProgressive(rowData: Array<any>, key: string) {
    if (!this.uiFlag.isCompareMode) return 0;
    const { base, compare } = rowData[1];
    return base[key] - compare[key];
  }

  /**
   * 顯示所有動作列表
   */
  seeMoreAnalysis() {
    this.uiFlag.analysisSeeMore = true;
  }

  /**
   * 變更動作列表排序
   * @param columnType {string}-欄位類別
   */
  changeSort(columnType?: string) {
    if (!columnType) return false;
    this.weightTrainingSort.sortType !== columnType
      ? this.weightTrainingSort.changeSortType(columnType)
      : this.weightTrainingSort.changeOrder();
  }

  /**
   * 是否顯示該機群之部位訓練趨勢圖
   * @param muscleGroup {MuscleGroup}-肌群編號
   */
  unfoldMuscleGroupDetail(muscleGroup: MuscleGroup) {
    const { unfold } = this.musclePartTrendData[muscleGroup];
    this.musclePartTrendData[muscleGroup].unfold = !unfold;
  }

  /**
   * 取得基準與比較各數據之間的差值
   */
  getSportInfoDiff() {
    const {
      base: { infoData: baseInfo },
      compare: { infoData: compareInfo },
    } = this.sportInfoData;

    const baseKeyLength = Object.keys(baseInfo).length;
    const compareKeyLength = Object.keys(compareInfo).length;
    const reference = baseKeyLength >= compareKeyLength ? baseInfo : compareInfo;
    let result = {};
    for (const key in reference) {
      const baseValue = baseInfo[key];
      const compareValue = compareInfo[key];
      const referenceValue = reference[key];
      if (typeof referenceValue === 'number') {
        result = {
          ...result,
          [key]: (baseValue ?? 0) - (compareValue ?? 0),
        };

        // 另外追加配速差值，針對配速先轉配速秒再相減
        if (key === 'avgSpeed') {
          const { sportType } = this.reportCondition;
          const unit = this.userUnit;
          const basePaceSecond = speedToPaceSecond(baseValue ?? 0, sportType, unit);
          const comparePaceSecond = speedToPaceSecond(compareValue ?? 0, sportType, unit);
          result = {
            ...result,
            ['paceSecond']: basePaceSecond - comparePaceSecond,
          };
        }
      }
    }

    return result;
  }

  /**
   * 確認概要資訊的類別
   * @param type {string}-概要資訊類別
   */
  checkInfoType(type: string, checkKey?: 'time' | 'pace') {
    const isTimeType = type.toLowerCase().includes('time');
    const isPaceType = type.toLowerCase().includes('pace');
    if (isTimeType && checkKey === 'time') return true;
    if (isPaceType && checkKey === 'pace') return true;
    if (!isTimeType && !isPaceType && !checkKey) return true;
    return false;
  }

  /**
   * 根據運動類別與目前顯示切換之顯示類別，顯示速度或配速
   */
  showPace() {
    const { sportType } = this.reportCondition;
    switch (sportType) {
      case SportType.swim:
      case SportType.row:
        return true;
      case SportType.run:
        return this.uiFlag.typeRunShowPace;
      default:
        return false;
    }
  }

  /**
   * 解除rxjs訂閱
   * @author kidin-1091211
   */
  ngOnDestroy() {
    this.subscribeUserProfile.unsubscribe();
    this.ngUnsubscribe.next(null);
    this.ngUnsubscribe.complete();
  }
}
