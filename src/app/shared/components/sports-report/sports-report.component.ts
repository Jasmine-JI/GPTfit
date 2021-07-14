import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef, Output, EventEmitter } from '@angular/core';
import { UtilsService } from '../../services/utils.service';
import { ReportService } from '../../services/report.service';
import { ReportConditionOpt } from '../../models/report-condition';
import { Subject, fromEvent, Subscription, merge } from 'rxjs';
import { takeUntil, tap } from 'rxjs/operators';
import { TranslateService } from '@ngx-translate/core';
import { HashIdService } from '../../services/hash-id.service';
import moment from 'moment';
import { SportType, SportCode } from '../../models/report-condition';
import {
  commonData,
  runData,
  rideData,
  weightTrainData,
  swimData,
  rowData,
  personBallData
} from '../../models/sports-report';
import { Unit, mi, unit } from '../../models/bs-constant';
import { UserProfileService } from '../../services/user-profile.service';
import {
  costTimeColor,
  FilletTrendChart,
  CompareLineTrendChart,
  strokeNumColor,
  caloriesColor,
  distanceColor,
  DiscolorTrendData,
  RelativeTrendChart,
  HrZoneRange
} from '../../models/chart-data';
import { Proficiency, ProficiencyCoefficient } from '../../models/weight-train';
import { SettingsService } from '../../../containers/dashboard/services/settings.service';
import { ActivatedRoute } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MessageBoxComponent } from '../message-box/message-box.component';
import { UserProfileInfo } from '../../../containers/dashboard/models/userProfileInfo';
import { ShareGroupInfoDialogComponent } from '../share-group-info-dialog/share-group-info-dialog.component';

const errMsg = 'Error!<br>Please try again later.';

@Component({
  selector: 'app-sports-reports',
  templateUrl: './sports-report.component.html',
  styleUrls: ['./sports-report.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SportsReportComponent implements OnInit, OnDestroy {
  @Output() showPrivacyUi = new EventEmitter();
  private ngUnsubscribe = new Subject();
  scrollAndClickEvent = new Subscription();

  /**
   * UI控制相關flag
   */
   uiFlag = {
    isPreviewMode: false,
    isDashboardPage: false,
    progress: 100,
    noData: true,
    inited: false,
    analysisType: SportCode.all,
    noFtpData: true,
    haveQueryString: false,
    openPrivacy: false,
    showWeightTrainingOpt: false,
    showLevelSelector: false,
    isReportOwner: false
  }

  /**
   * 報告頁面可讓使用者篩選的條件
   */
  reportConditionOpt: ReportConditionOpt = {
    reportType: 'sport',
    date: {
      startTimestamp: moment().startOf('day').subtract(6, 'days').valueOf(),
      endTimestamp: moment().endOf('day').valueOf(),
      type: 'sevenDay'
    },
    sportType: SportCode.all,
    hideConfirmBtn: true
  }

  info = {};  // 報告概要資訊

  /**
   * 圖表用數據
   */
  chart = {
    ring: {
      stroke: [0, 0, 0, 0, 0, 0, 0],
      time: [0, 0, 0, 0, 0, 0, 0]
    },
    distribution: {
      typeList: [],
      perAvgHR: [],
      perActivityTime: []
    },
    strokeTrend: <FilletTrendChart>{
      maxStrokeNum: 0,
      avgStrokeNum: 0,
      strokeNum: [],
      colorSet: strokeNumColor
    },
    totalTimeTrend: <FilletTrendChart>{
      maxTotalTime: 0,
      avgTotalTime: 0,
      totalTime: [],
      colorSet: costTimeColor
    },
    caloriesTrend: <FilletTrendChart>{
      maxCalories: 0,
      avgCalories: 0,
      calories: [],
      colorSet: caloriesColor
    },
    hrTrend: <CompareLineTrendChart>{
      hrArr: [],
      maxHrArr: [],
      avgHr: 0,
      maxHr: 0
    },
    distanceTrend: <FilletTrendChart>{
      maxDistance: 0,
      avgDistance: 0,
      distance: [],
      colorSet: distanceColor
    },
    powerTrend: <CompareLineTrendChart>{
      powerArr: [],
      maxPowerArr: [],
      avgPower: 0,
      maxPower: 0
    },
    speedPaceTrend: <DiscolorTrendData>{
      dataArr: [],
      avgSpeed: 0,
      maxSpeed: 0,
      minSpeed: null
    },
    cadenceTrend: <DiscolorTrendData> {
      dataArr: [],
      avgCadence: 0,
      maxCadence: 0,
      minCadence: null
    },
    swolfTrend: <DiscolorTrendData> {
      dataArr: [],
      avgSwolf: 0,
      maxSwolf: 0,
      minSwolf: null
    },
    planeAcceleration: <FilletTrendChart>{
      maxPlaneGForce: 0,
      avgPlaneGForce: 0,
      planeGForce: []
    },

    // 暫只開放給20權觀看，待球類運動細分不同球類時可能會用到
    totalXAxisMoveTrend: <RelativeTrendChart>{
      positiveData: [],
      negativeData: [],
      maxGForce: 0,
      minGForce: 0
    },

    // 暫只開放給20權觀看，待球類運動細分不同球類時可能會用到
    totalYAxisMoveTrend: <RelativeTrendChart>{
      positiveData: [],
      negativeData: [],
      maxGForce: 0,
      minGForce: 0
    },
    totalZAxisMoveTrend: <RelativeTrendChart>{
      positiveData: [],
      negativeData: [],
      maxGForce: 0,
      minGForce: 0
    },
    extremePlaneGForce: <FilletTrendChart>{
      maxPlaneMaxGForce: 0,
      avgPlaneMaxGForce: 0,
      planeMaxGForce: []
    },

    // 暫只開放給20權觀看，待球類運動細分不同球類時可能會用到
    extremeXGForce: <CompareLineTrendChart>{
      maxXArr: [],
      minXArr: [],
      maxX: 0,
      minX: 0
    },

    // 暫只開放給20權觀看，待球類運動細分不同球類時可能會用到
    extremeYGForce: <CompareLineTrendChart>{
      maxYArr: [],
      minYArr: [],
      maxY: 0,
      minY: 0
    },
    extremeZGForce: <CompareLineTrendChart>{
      maxZArr: [],
      minZArr: [],
      maxZ: 0,
      minZ: 0
    },
    swingSpeed: <DiscolorTrendData>{
      dataArr: [],
      avgSpeed: 0,
      maxSpeed: 0,
      minSpeed: null
    },
    swingRatio: <RelativeTrendChart>{
      positiveData: [],
      negativeData: [],
      maxForehandCount: 0,
      maxBackhandCount: 0
    },
    hrzone: [0, 0, 0, 0, 0, 0],
    hrInfo: <HrZoneRange>{
      hrBase: 0,
      z0: 'Z0',
      z1: 'Z1',
      z2: 'Z2',
      z3: 'Z3',
      z4: 'Z4',
      z5: 'Z5'
    },
    hrZoneTrend: {
      zoneZero: [],
      zoneOne: [],
      zoneTwo: [],
      zoneThree: [],
      zoneFour: [],
      zoneFive: []
    },
    thresholdZone: [0, 0, 0, 0, 0, 0, 0],
    thresholdZoneTrend: {
      zoneZero: [],
      zoneOne: [],
      zoneTwo: [],
      zoneThree: [],
      zoneFour: [],
      zoneFive: [],
      zoneSix: []
    },
    trainingPart: [],
    muscleTrendList: []
  };

  /**
   * 紀錄平均數據如avgHeartRateBpm，不為零的筆數。
   * 個人平均數據計算方式：Σ(個人平均數據) / 有效筆數（平均數據不為0的筆數）
   */
  avgDataRecord = {}

  /**
   * 頁面所需相關時間日期資訊
   */
  reportTime = {
    endDate: null,
    range: null,
    create: null,
    diffWeek: 0,
    type: <1 | 2>1 // 1: 日報告 2: 週報告
  };

  /**
   * 使用者概要資訊
   */
  userInfo = {
    name: '',
    id: null,
    accessRight: null,
    unit: <Unit>unit.metric,
    icon: '',
    bodyWeight: 70,
    weightTrainLevel: Proficiency.metacarpus
  }

  /**
   * 用來計算趨勢圖表日平均/週平均
   */
   totalCount = {
    stroke: 0,
    totalTime: 0,
    calories: 0,
    distance: 0,
    hr: 0,
    power: 0,
    speed: 0,
    cadence: 0,
    swolf: 0,
    planeGForce: 0,
    planeMaxGForce: 0,
    swingSpeed: 0
  };

  readonly mi = mi;
  readonly unitEnum = unit;
  readonly sportCode = SportCode;
  readonly proficiency = Proficiency;
  dateLen = 0; // 報告橫跨天數/週數
  haveDataLen = 0;  // 有數據的天（週）數
  sameTimePersonData: any;
  previewUrl: string;
  dataKey: 'reportActivityDays' | 'reportActivityWeeks' = 'reportActivityDays';
  weightTrainDescription = '';
  chartXAxis = [];
  muscleDataCompleted = false;
  token = '';
  userProfile: UserProfileInfo;

  constructor(
    private utils: UtilsService,
    private reportService: ReportService,
    private hashIdService: HashIdService,
    private translate: TranslateService,
    private userProfileService: UserProfileService,
    private changeDetectorRef: ChangeDetectorRef,
    private settingsService: SettingsService,
    private route: ActivatedRoute,
    private dialog: MatDialog
  ) { }

  ngOnInit(): void {
    const { pathname, search } = location;
    this.token = this.utils.getToken() || '';
    this.checkPathName(pathname);
    this.checkQueryString(search);
    if (this.uiFlag.isDashboardPage || this.token.length > 0) {
      this.getLoginUserInfo();
    } else {
      this.getReportUserInfo();
    }

  }

  /**
   * 確認report所在頁面（portal/dashboard）
   * @param pathname {string}
   * @author kidin-1100615
   */
  checkPathName(pathname: string) {
    if (pathname.includes('dashboard')) {
      this.uiFlag.isDashboardPage = true;
    } else {
      const hashUserId = this.route.snapshot.paramMap.get('userId');
      this.userInfo.id = this.hashIdService.handleUserIdDecode(hashUserId);
    }

  }

  /**
   * 從query string取得參數
   * @param queryString {string}
   * @author kidin-1100414
   */
  checkQueryString(queryString: string) {
    const query = queryString.split('?')[1];
    if (query) {
      const queryArr = query.split('&');
      queryArr.forEach(_query => {
        const _queryArr = _query.split('='),
              [_key, _value] = [..._queryArr];
        switch (_key) {
          case 'ipm':
            this.uiFlag.isPreviewMode = true;
            break;
          case 'startdate':
            this.reportConditionOpt.date.startTimestamp = moment(_value, 'YYYY-MM-DD').startOf('day').valueOf();
            this.reportConditionOpt.date.type = 'custom';
            break;
          case 'enddate':
            this.reportConditionOpt.date.endTimestamp = moment(_value, 'YYYY-MM-DD').endOf('day').valueOf();
            this.reportConditionOpt.date.type = 'custom';
            break;
          case 'sporttype':
            this.reportConditionOpt.sportType = +_value as SportType;
            break;
          case 'level':
            this.userInfo.weightTrainLevel = +_value;
            break;
        }

      });

    }

  }

  /**
   * 取得登入者資訊
   * @author kidin-1091028
   */
   getLoginUserInfo() {
    this.userProfileService.getRxUserProfile().pipe(
      takeUntil(this.ngUnsubscribe)
    ).subscribe(res => {
      this.userProfile = res;
      const {
        userId,
        unit,
        heartRateBase,
        systemAccessRight,
        avatarUrl,
        nickname,
        heartRateMax,
        heartRateResting,
        birthday,
        bodyWeight,
        weightTrainingStrengthLevel
      } = res as any;
      const age = this.reportService.countAge(birthday);
      const weightTrainLevel = this.getWeightTrainLevel(weightTrainingStrengthLevel);
      if (this.uiFlag.isDashboardPage || userId == this.userInfo.id) {
        this.uiFlag.isReportOwner = true;
        this.userInfo = {
          name: nickname,
          id: userId,
          accessRight: systemAccessRight,
          unit,
          icon: avatarUrl,
          bodyWeight,
          weightTrainLevel: weightTrainLevel
        };

        this.chart.hrInfo = this.utils.getUserHrRange(heartRateBase, age, heartRateMax, heartRateResting);
        this.reportService.setReportCondition(this.reportConditionOpt);
        this.getReportSelectedCondition();
      } else {
        this.uiFlag.isReportOwner = false;
        if (this.uiFlag.isPreviewMode) {
          this.getReportUserInfo(unit, this.userInfo.weightTrainLevel);
        } else {
          this.getReportUserInfo(unit, weightTrainLevel);
        }
        
      }

    });

  }

  /**
   * 取得報告紀錄者資訊
   * @param unit { Unit }-登入者使用的單位類別
   * @param 
   * @author kidin-1100615
   */
  getReportUserInfo(
    unit: Unit = 0,
    weightTrainLevel: ProficiencyCoefficient = Proficiency.metacarpus
  ) {    
    const body = {
      targetUserId: this.userInfo.id
    };

    this.userProfileService.getUserProfile(body).subscribe(res => {
      const { processResult, userProfile } = res;
      if (userProfile) {
        const { avatarUrl, nickname, userId } = userProfile;
        this.userInfo = {
          name: nickname,
          id: userId,
          accessRight: [99],
          unit,
          icon: avatarUrl,
          bodyWeight: 70,
          weightTrainLevel
        };
      } else {

        if (processResult) {
          const { apiCode, resultCode, resultMessage } = processResult;
          this.utils.handleError(resultCode, apiCode, resultMessage);
        } else {
          this.utils.openAlert(errMsg);
        }

      }

      this.reportService.setReportCondition(this.reportConditionOpt);
      this.getReportSelectedCondition();
    });
    
  }

  /**
   * 初始化報告
   * @author kidin-1100414
   */
  initReportContent() {
    this.info = {};
    this.chart = {
      ring: {
        stroke: [0, 0, 0, 0, 0, 0, 0],
        time: [0, 0, 0, 0, 0, 0, 0]
      },
      distribution: {
        typeList: [],
        perAvgHR: [],
        perActivityTime: []
      },
      strokeTrend: {
        maxStrokeNum: 0,
        avgStrokeNum: 0,
        strokeNum: [],
        colorSet: strokeNumColor
      },
      totalTimeTrend: {
        maxTotalTime: 0,
        avgTotalTime: 0,
        totalTime: [],
        colorSet: costTimeColor
      },
      caloriesTrend: {
        maxCalories: 0,
        avgCalories: 0,
        calories: [],
        colorSet: caloriesColor
      },
      hrTrend: {
        hrArr: [],
        maxHrArr: [],
        avgHr: 0,
        maxHr: 0
      },
      distanceTrend: {
        maxDistance: 0,
        avgDistance: 0,
        distance: [],
        colorSet: distanceColor
      },
      powerTrend: {
        powerArr: [],
        maxPowerArr: [],
        avgPower: 0,
        maxPower: 0
      },
      speedPaceTrend: {
        dataArr: [],
        avgSpeed: 0,
        maxSpeed: 0,
        minSpeed: null
      },
      cadenceTrend: {
        dataArr: [],
        avgCadence: 0,
        maxCadence: 0,
        minCadence: null
      },
      swolfTrend: {
        dataArr: [],
        avgSwolf: 0,
        maxSwolf: 0,
        minSwolf: null
      },
      planeAcceleration: {
        maxPlaneGForce: 0,
        avgPlaneGForce: 0,
        planeGForce: []
      },
      totalXAxisMoveTrend: {
        positiveData: [],
        negativeData: [],
        maxGForce: 0,
        minGForce: 0
      },
      totalYAxisMoveTrend: {
        positiveData: [],
        negativeData: [],
        maxGForce: 0,
        minGForce: 0
      },
      totalZAxisMoveTrend: {
        positiveData: [],
        negativeData: [],
        maxGForce: 0,
        minGForce: 0
      },
      extremePlaneGForce: {
        maxPlaneMaxGForce: 0,
        avgPlaneMaxGForce: 0,
        planeMaxGForce: []
      },
      extremeXGForce: {
        maxXArr: [],
        minXArr: [],
        maxX: 0,
        minX: 0
      },
      extremeYGForce: {
        maxYArr: [],
        minYArr: [],
        maxY: 0,
        minY: 0
      },
      extremeZGForce: {
        maxZArr: [],
        minZArr: [],
        maxZ: 0,
        minZ: 0
      },
      swingSpeed: {
        dataArr: [],
        avgSpeed: 0,
        maxSpeed: 0,
        minSpeed: null
      },
      swingRatio: {
        positiveData: [],
        negativeData: [],
        maxForehandCount: 0,
        maxBackhandCount: 0
      },
      hrzone: [0, 0, 0, 0, 0, 0,],
      hrInfo: this.chart.hrInfo,
      hrZoneTrend: {
        zoneZero: [],
        zoneOne: [],
        zoneTwo: [],
        zoneThree: [],
        zoneFour: [],
        zoneFive: []
      },
      thresholdZone: [0, 0, 0, 0, 0, 0, 0],
      thresholdZoneTrend: {
        zoneZero: [],
        zoneOne: [],
        zoneTwo: [],
        zoneThree: [],
        zoneFour: [],
        zoneFive: [],
        zoneSix: []
      },
      trainingPart: [],
      muscleTrendList: []
    };

    /**
     * 用來計算趨勢圖表日平均/週平均
     */
    this.totalCount = {
      stroke: 0,
      totalTime: 0,
      calories: 0,
      distance: 0,
      hr: 0,
      power: 0,
      speed: 0,
      cadence: 0,
      swolf: 0,
      planeGForce: 0,
      planeMaxGForce: 0,
      swingSpeed: 0
    };

    this.haveDataLen = 0;
    this.avgDataRecord = {};
    this.muscleDataCompleted = false;
    this.closeAllMenu();
  }

  /**
   * 變更載入頁面進度，並檢查頁面渲染（避免loading bar出不來）
   * @author kidin-1100624
   */
  changeProgress(progress: number) {
    this.uiFlag.progress = progress;
    this.changeDetectorRef.markForCheck();
  }

  /**
   * 取得使用者所篩選的條件
   * @author kidin-1091029
   */
  getReportSelectedCondition() {
    this.reportService.getReportCondition().pipe(
      tap(res => {
        const { progress } = this.uiFlag;
        this.changeProgress(progress === 100 ? 10 : progress);
        this.initReportContent();
      }),
      takeUntil(this.ngUnsubscribe)
    ).subscribe(res => {
      // 避免連續送出
      if (this.uiFlag.progress >= 10 && this.uiFlag.progress < 100) {
        this.changeProgress(30);
        const condition = res as any,
              { date: { startTimestamp, endTimestamp }} = condition,
              { date: { startTimestamp: preStartTimestamp, endTimestamp: preEndTimestamp}} = this.reportConditionOpt;

        // 日期範圍大於52天則取週報告
        if (moment(endTimestamp).diff(moment(startTimestamp), 'day') <= 52) {
          this.reportTime.type = 1;
          this.dataKey = 'reportActivityDays';
        } else {
          this.reportTime.type = 2;
          this.dataKey = 'reportActivityWeeks';
        }

        const { inited } = this.uiFlag,
              sameStartTime = startTimestamp === preStartTimestamp,
              sameEndTime = endTimestamp === preEndTimestamp,
              notReGetData = (inited && sameStartTime && sameEndTime);

        // 若只更動運動類型，則不再call api取得數據
        if (notReGetData) {
          this.reportConditionOpt = this.utils.deepCopy(condition);
          this.createReport(this.sameTimePersonData);
        } else {
          this.reportConditionOpt = this.utils.deepCopy(condition);
          if (!this.uiFlag.inited) this.uiFlag.inited = true;
          this.getData(this.userInfo.id);
        }

      }

    });

  }

  /**
   * 取得數據
   * @param userId {number}
   * @author kidin-1100414
   */
  getData(userId: number) {
    const { startTimestamp, endTimestamp } = this.reportConditionOpt.date,
          body = {
            token: this.utils.getToken() || '',
            type: this.reportTime.type,
            targetUserId: [userId],
            filterStartTime: moment(startTimestamp).format('YYYY-MM-DDTHH:mm:ss.SSSZ'),
            filterEndTime: moment(endTimestamp).format('YYYY-MM-DDTHH:mm:ss.SSSZ'),
          };

    this.reportService.fetchSportSummaryArray(body).subscribe(res => {
      this.sameTimePersonData = res[0];
      if (res.length && this.sameTimePersonData[this.dataKey].length > 0) {
        this.uiFlag.noData = false;
        this.changeProgress(70);
        this.createReport(this.sameTimePersonData);
      } else {
        this.uiFlag.noData = true;
        this.changeProgress(100);
      }
      
    });

  }

  /**
   * 建立圖表用時間軸陣列，用來與數據之時間比對用
   * @param date {startTimestamp, endTimestamp}
   * @param type {number}-報告類別
   * @author kidin-1100419
   */
  createChartXaxis(
    date: {
      startTimestamp: number,
      endTimestamp: number
    },
    type: number
  ) {
    const { startTimestamp, endTimestamp } = date,
          result = [];
    let dateRange: number,
        reportStartDate = startTimestamp,
        reportEndDate = endTimestamp;
    if (type === 1) {
      this.dateLen = moment(endTimestamp).diff(moment(startTimestamp), 'day') + 1;
      dateRange = 86400000; // 間隔1天(ms)
    } else {
      reportStartDate = moment(startTimestamp).startOf('week').valueOf(),
      reportEndDate = moment(endTimestamp).startOf('week').valueOf();
      this.dateLen = moment(reportEndDate).diff(moment(reportStartDate), 'week') + 1;
      dateRange = 604800000;  // 間隔7天(ms)
    }

    for (let i = 0; i < this.dateLen; i++) {
      result.push(reportStartDate + dateRange * i);
    }

    return result;
  }

  /**
   * 統計數據以建立報告
   * @param data {any}-api 2104的數據
   * @author kidin-1100414
   */
  createReport(data: any) {
    const originData = [];
    let haveData = false;
    const { resultCode } = data,
          activity = data[this.dataKey];
    // 針對關閉隱私權的使用者建立對應物件
    if (resultCode !== 403) {
      this.privacyOpened(true);
      activity.forEach(_activity => {
        // 根據運動類別篩選數據
        const { startTime, activities } = _activity;
        activities.forEach(_activities => {
          const { type: sportType } = _activities,
                { sportType: currentSportType } = this.reportConditionOpt;
          if (currentSportType === SportCode.all || currentSportType == sportType) {
            haveData = true;
            originData.push({
              activities: [_activities],
              startTime
            });

          };

        });

      });

    } else {
      this.privacyOpened(false);
    }

    if (!haveData) {
      this.uiFlag.noData = true;
      this.changeProgress(100);
    } else {
      this.translate.get('hellow world').pipe(
        takeUntil(this.ngUnsubscribe)
      ).subscribe(() => {
        this.uiFlag.noData = false;
        const { date: {startTimestamp, endTimestamp} } = this.reportConditionOpt,
              rangeUnit = this.translate.instant('universal_time_day');
        this.reportTime = {
          create: moment().format('YYYY-MM-DD HH:mm'),
          endDate: moment(endTimestamp).format('YYYY-MM-DD'),
          range: `${moment(endTimestamp).diff(moment(startTimestamp), 'day') + 1}${rangeUnit}`,
          diffWeek: (moment(endTimestamp).diff(moment(startTimestamp), 'day') + 1) / 7,
          type: this.reportTime.type
        };

        this.handleData(originData);
        this.changeProgress(100);
        this.updateUrl();
      });
      
    }

  }

  /**
   * 統計數據以生成概要數據與圖表
   * @param mix {Array<any>}-運動數據
   * @author kidin-1100415
   */
  handleData(originData: Array<any>) {
    const { sportType } = this.reportConditionOpt;
    originData.sort((a, b) => moment(a.startTime).valueOf() - moment(b.startTime).valueOf());
    this.chartXAxis = this.createChartXaxis(this.reportConditionOpt.date, this.reportTime.type);
    const noRepeatDateData = this.mergeSameDateData(originData),
          needKey = this.getNeedKey(this.reportConditionOpt.sportType);
    let dataIdx = 0;
    for (let i = 0, len = this.chartXAxis.length; i < len; i++) {
      // 若無該日數據，則以補0方式呈現圖表數據。
      const xAxisTimestamp = this.chartXAxis[i],
            { startTimestamp, activities } = noRepeatDateData[dataIdx] || { startTimestamp: undefined, activities: undefined };
      if (xAxisTimestamp === startTimestamp) {
        let sameDateData = {};
        const activitiesLen = activities.length;
        for (let j = 0; j < activitiesLen; j++) {
          const _activity = activities[j];
          if (sportType === SportCode.all) this.createAnalysisChartData(_activity);

          for (let k = 0, keyLen = needKey.length; k < keyLen; k++) {
            const key = needKey[k],
                  isAvgKey = key.toLowerCase().includes('avg');
            if (_activity.hasOwnProperty(key)) {
              // 帶有plus字樣的key，其值必為正值，帶有minus字樣的key，其值必為負值
              let value: number;
              if (key.toLowerCase().includes('plus')) {
                value = Math.abs(_activity[key]);
              } else if (key.toLowerCase().includes('minus')) {
                value = -Math.abs(_activity[key]);
              } else {
                value = +_activity[key];
              }

              // 判斷該數據是否為平均數據，並以不同方式加總，以呈現概要資訊
              if (value && isAvgKey) {

                if (this.avgDataRecord[key] !== undefined) {
                  this.avgDataRecord[key] += _activity.totalActivities;
                } else {
                  this.avgDataRecord = {
                    [key]: _activity.totalActivities,
                    ...this.avgDataRecord
                  };

                }

                if (this.info[key] !== undefined) {
                  this.info[key] += value * _activity.totalActivities;
                } else {
                  this.info = {
                    [key]: value * _activity.totalActivities,
                    ...this.info
                  };

                }

              } else {

                if (this.info[key] !== undefined) {
                  this.info[key] += value;
                } else {
                  this.info = {
                    [key]: value,
                    ...this.info
                  };

                }

              }

              // 將各數據加總，之後均化產生趨勢圖表
              if (sameDateData[key] !== undefined) {
                sameDateData[key] += value;
              } else {
                sameDateData = {[key]: value, ...sameDateData};
              }

            }

          }

          // 處理訓練部位數據
          if (sportType === SportCode.weightTrain) {
            sameDateData = {
              weightTrainingInfo: _activity['weightTrainingInfo'],
              ...sameDateData
            };

          }

        }

        this.createChartData(sameDateData, activitiesLen, xAxisTimestamp);
        this.haveDataLen++;
        dataIdx++;
      } else {
        let zeroData = {};
        for (let l = 0, keyLen = needKey.length; l < keyLen; l++) {
          const key = needKey[l];
          zeroData = {[key]: 0, ...zeroData};
        }

        // 處理訓練部位數據
        if (sportType === SportCode.weightTrain) {
          zeroData = {
            weightTrainingInfo: [],
            ...zeroData
          };
          
        }

        this.createChartData(zeroData, 1, xAxisTimestamp);
      }

    }

    this.getTrendAvgValue();
    // 針對不同類別所需數據進行加工
    switch (sportType) {
      case SportCode.all:
        const {
          totalHrZone0Second: z0,
          totalHrZone1Second: z1,
          totalHrZone2Second: z2,
          totalHrZone3Second: z3,
          totalHrZone4Second: z4,
          totalHrZone5Second: z5
        } = this.info as any;
  
        const totalBenefitSecond = z2 + z3 + z4 + z5,  // 效益時間
              pai = this.reportService.countPai([z0, z1, z2, z3, z4, z5], this.reportTime.diffWeek); // pai指數
        this.info = { totalBenefitSecond, pai, ...this.info };
        break;
      case SportCode.ball:
        const { totalPlusGforceX, totalPlusGforceY, totalMinusGforceX, totalMinusGforceY } = this.info as any,
        countElementArr = [totalPlusGforceX, totalPlusGforceY, totalMinusGforceX, totalMinusGforceY],
        totalPlaneAcceleration = this.reportService.pythagorean(countElementArr);
        this.info = { totalPlaneAcceleration, ...this.info };
        break;
    }

  }

  /**
   * 依運動類別製作各圖表所需數據
   * @param strokeData {any}-一個時間單位（日/週）加總的資料
   * @param denominator {number}-均化分母
   * @param startTimestamp {number}-該筆數據開始時間
   * @author kidin-1100421
   */
  createChartData(strokeData: any, denominator: number, startTimestamp: number) {
    const { sportType } = this.reportConditionOpt;
    this.createTotalTimeChart(strokeData, startTimestamp);
    this.createHrChart(strokeData, denominator, startTimestamp);
    this.createCaloriesChart(strokeData, startTimestamp);
    if (this.reportTime.type === 2) {
      this.createStrokeNumChart(strokeData, startTimestamp);
    }
    
    switch (sportType) {
      case SportCode.all:
        this.createHrZoneChart(strokeData, startTimestamp);
        break;
      case SportCode.run:
        this.createHrZoneChart(strokeData, startTimestamp);
        this.createDistanceChart(strokeData, startTimestamp);
        this.createSpeedPaceChart(strokeData, startTimestamp, SportCode.run);
        this.createCadenceChart(strokeData, startTimestamp, SportCode.run);
        break;
      case SportCode.cycle:
        this.createHrZoneChart(strokeData, startTimestamp);
        this.createThresholdChart(strokeData, startTimestamp);
        this.createDistanceChart(strokeData, startTimestamp);
        this.createPowerChart(strokeData, startTimestamp, SportCode.cycle);
        this.createSpeedPaceChart(strokeData, startTimestamp, SportCode.cycle);
        this.createCadenceChart(strokeData, startTimestamp, SportCode.cycle);
        break;
      case SportCode.weightTrain:
        this.weightTrainDescription = this.translate.instant('universal_activityData_muscleColorIllustration');
        this.createMuscleMap(strokeData, startTimestamp);
        break;
      case SportCode.swim:
        this.createHrZoneChart(strokeData, startTimestamp);
        this.createDistanceChart(strokeData, startTimestamp);
        this.createSpeedPaceChart(strokeData, startTimestamp, SportCode.swim);
        this.createCadenceChart(strokeData, startTimestamp, SportCode.swim);
        this.createSwolfChart(strokeData, startTimestamp);
        break;
      case SportCode.aerobic:
        this.createHrZoneChart(strokeData, startTimestamp);
        break;
      case SportCode.row:
        this.createHrZoneChart(strokeData, startTimestamp);
        this.createDistanceChart(strokeData, startTimestamp);
        this.createPowerChart(strokeData, startTimestamp, SportCode.row);
        this.createSpeedPaceChart(strokeData, startTimestamp, SportCode.row);
        this.createCadenceChart(strokeData, startTimestamp, SportCode.row);
        break;
      case SportCode.ball:
        this.createHrZoneChart(strokeData, startTimestamp);
        this.createDistanceChart(strokeData, startTimestamp);
        this.createTotalGForceChart(strokeData, startTimestamp);
        this.createExtremeGForceChart(strokeData, startTimestamp);
        this.createSpeedPaceChart(strokeData, startTimestamp, SportCode.ball);
        this.createExtremePlaneChart(strokeData, startTimestamp);
        this.createTotalPlaneChart(strokeData, startTimestamp);
        this.createSwingSpeedChart(strokeData, startTimestamp);
        this.createSwingRatioChart(strokeData, startTimestamp);
        break;
    }

  }

  /**
   * 取得趨勢圖表所需平均值
   * @author kidin-1100505
   */
  getTrendAvgValue() {
    const { sportType } = this.reportConditionOpt,
          { type } = this.reportTime,
          {
            stroke,
            totalTime,
            calories,
            distance,
            hr,
            power,
            speed,
            cadence,
            planeGForce,
            planeMaxGForce
          } = this.totalCount;

    this.chart.totalTimeTrend.avgTotalTime = totalTime / this.haveDataLen;
    this.chart.caloriesTrend.avgCalories = calories / this.haveDataLen;
    this.chart.hrTrend.avgHr = hr / this.haveDataLen;
    if (type === 2) {
      this.chart.strokeTrend.avgStrokeNum = stroke / this.haveDataLen;
    }
    
    switch (sportType) {
      case SportCode.all:
        
        break;
      case SportCode.run:
        this.chart.distanceTrend.avgDistance = distance / this.haveDataLen;
        this.chart.speedPaceTrend.avgSpeed = speed / this.haveDataLen;
        this.chart.cadenceTrend.avgCadence = cadence / this.haveDataLen;
        break;
      case SportCode.cycle:
        this.chart.distanceTrend.avgDistance = distance / this.haveDataLen;
        this.chart.powerTrend.avgPower = power / this.haveDataLen;
        this.chart.speedPaceTrend.avgSpeed = speed / this.haveDataLen;
        this.chart.cadenceTrend.avgCadence = cadence / this.haveDataLen;
        break;
      case SportCode.weightTrain:
        break;
      case SportCode.swim:
        this.chart.distanceTrend.avgDistance = distance / this.haveDataLen;
        this.chart.speedPaceTrend.avgSpeed = speed / this.haveDataLen;
        this.chart.cadenceTrend.avgCadence = cadence / this.haveDataLen;
        break;
      case SportCode.aerobic:
        
        break;
      case SportCode.row:
        this.chart.distanceTrend.avgDistance = distance / this.haveDataLen;
        this.chart.powerTrend.avgPower = power / this.haveDataLen;
        this.chart.speedPaceTrend.avgSpeed = speed / this.haveDataLen;
        this.chart.cadenceTrend.avgCadence = cadence / this.haveDataLen;
        break;
      case SportCode.ball:
        this.chart.distanceTrend.avgDistance = distance / this.haveDataLen;
        this.chart.speedPaceTrend.avgSpeed = speed / this.haveDataLen;
        this.chart.planeAcceleration.avgPlaneGForce = planeGForce / this.haveDataLen;
        this.chart.extremePlaneGForce.avgPlaneMaxGForce = planeMaxGForce / this.haveDataLen;
        break;
    }

  }

  /**
   * 建立佔比圖/成效分佈圖數據
   * @param data {any}-一個時間單位（日/週）的資料
   * @author kidin-1100421
   */
  createAnalysisChartData(data: any) {
    const { type, totalActivities, totalSecond, avgHeartRateBpm } = data,
          typeIndex = +type - 1,
          { ring: { stroke, time }, distribution: { typeList, perAvgHR, perActivityTime } } = this.chart;
    stroke[typeIndex] += totalActivities;
    time[typeIndex] += +totalSecond;
    typeList.push(type);
    perAvgHR.push(avgHeartRateBpm);
    perActivityTime.push(+totalSecond / totalActivities);
  }

  /**
   * 若為週報告，則建立活動筆數趨勢圖
   * @param data {any}-一天（週）加總的數據
   * @param startTimestamp {number}-該天（週）起始時間
   * @author kidin-1100505
   */
  createStrokeNumChart(data: any, startTimestamp: number) {
    const { totalActivities } = data,
          { strokeNum, maxStrokeNum } = this.chart.strokeTrend;
    strokeNum.push([startTimestamp, totalActivities]);
    this.totalCount.stroke += totalActivities;
    if (totalActivities > maxStrokeNum) {
      this.chart.strokeTrend.maxStrokeNum = totalActivities;
    }

  }

  /**
   * 建立活動時間趨勢圖
   * @param data {any}-一天（週）加總的數據
   * @param startTimestamp {number}-該天（週）起始時間
   * @author kidin-1100505
   */
  createTotalTimeChart(data: any, startTimestamp: number) {
    const { totalSecond, totalActivitySecond } = data,
          { totalTime, maxTotalTime } = this.chart.totalTimeTrend,
          ref = this.reportConditionOpt.sportType === SportCode.weightTrain ? +totalActivitySecond : +totalSecond;
    totalTime.push([startTimestamp, ref]);
    this.totalCount.totalTime += ref;
    if (ref > maxTotalTime) {
      this.chart.totalTimeTrend.maxTotalTime = ref;
    }

  }

  /**
   * 建立卡路里趨勢圖
   * @param data {any}-一天（週）加總的數據
   * @param startTimestamp {number}-該天（週）起始時間
   * @author kidin-1100505
   */
  createCaloriesChart(data: any, startTimestamp: number) {
    const { calories } = data,
          { calories: caloriesArr, maxCalories } = this.chart.caloriesTrend;
    caloriesArr.push([startTimestamp, calories] as any);
    this.totalCount.calories += calories;
    if (calories > maxCalories) {
      this.chart.caloriesTrend.maxCalories = calories;
    }

  }

  /**
   * 建立心率趨勢圖
   * @param data {any}-一天（週）加總的數據
   * @param denominator {number}-該天（週）運動總筆數
   * @param startTimestamp {number}-該天（週）起始時間
   * @author kidin-1100505
   */
  createHrChart(data: any, denominator: number, startTimestamp: number) {
    const { avgHeartRateBpm, avgMaxHeartRateBpm } = data,
          { hrArr, maxHrArr, maxHr } = this.chart.hrTrend,
          oneDayAvgHr = avgHeartRateBpm / denominator,
          oneDayAvgMaxHr = avgMaxHeartRateBpm / denominator;
    hrArr.push([startTimestamp, oneDayAvgHr]);
    maxHrArr.push([startTimestamp, oneDayAvgMaxHr]);
    this.totalCount.hr += oneDayAvgHr;
    if (oneDayAvgMaxHr > maxHr) {
      this.chart.hrTrend.maxHr = oneDayAvgMaxHr;
    }

  }

  /**
   * 建立距離趨勢圖
   * @param data {any}-一天（週）加總的數據
   * @param startTimestamp {number}-該天（週）起始時間
   * @author kidin-1100505
   */
  createDistanceChart(data: any, startTimestamp: number) {
    const { totalDistanceMeters } = data,
          { distance, maxDistance } = this.chart.distanceTrend;
    distance.push([startTimestamp, totalDistanceMeters]);
    this.totalCount.distance += totalDistanceMeters;
    if (totalDistanceMeters > maxDistance) {
      this.chart.distanceTrend.maxDistance = totalDistanceMeters;
    }

  }

  /**
   * 建立功率趨勢圖
   * @param data {any}-一天（週）加總的數據
   * @param startTimestamp {number}-該天（週）起始時間
   * @param type {SportType}-運動類型
   * @author kidin-1100505
   */
  createPowerChart(data: any, startTimestamp: number, type: SportType) {
    let maxRef: string,
        avgRef: string;
    switch (type) {
      case SportCode.cycle:
        maxRef = 'avgCycleMaxWatt';
        avgRef = 'cycleAvgWatt';
        break;
      case SportCode.row:
        maxRef = 'rowingMaxWatt';
        avgRef = 'rowingAvgWatt';
        break;
    }

    const avgWatt = data[avgRef],
          maxWatt = data[maxRef],
          { powerArr, maxPowerArr, maxPower } = this.chart.powerTrend;
    powerArr.push([startTimestamp, avgWatt]);
    maxPowerArr.push([startTimestamp, maxWatt]);
    this.totalCount.power += avgWatt;
    if (maxWatt > maxPower) {
      this.chart.powerTrend.maxPower = maxWatt;
    }

  }

  /**
   * 根據運動類別與使用者使用之單位建立配速趨勢圖
   * @param data {any}-一天（週）加總的數據
   * @param startTimestamp {number}-該天（週）起始時間
   * @param type {SportType}-運動類型
   * @author kidin-1100505
   */
  createSpeedPaceChart(data: any, startTimestamp: number, type: SportType) {
    const { avgSpeed, avgMaxSpeed } = data,
          { unit: userUnit } = this.userInfo;
    let avgVal,
        avgMaxVal;
    switch (type) {
      case SportCode.cycle:
      case SportCode.ball:
        if (userUnit === unit.metric) {  // km/h
          avgVal = avgSpeed || 0;
          avgMaxVal = avgMaxSpeed || 0;
        } else {  // mi/h
          avgVal = (avgSpeed / mi) || 0;
          avgMaxVal = (avgMaxSpeed / mi) || 0;
        }
        break;
      case SportCode.run:
      case SportCode.swim:
      case SportCode.row:
        avgVal = avgSpeed || 0;
        avgMaxVal = avgMaxSpeed || 0;
        break;
    }

    const { dataArr, maxSpeed, minSpeed } = this.chart.speedPaceTrend;
    if ([SportCode.run, SportCode.swim, SportCode.row].includes(type)) {

      if (avgVal !== 0) {
        dataArr.push({
          x: startTimestamp,
          y: this.utils.convertSpeed(avgMaxVal, type, userUnit, 'second') as number,
          low: this.utils.convertSpeed(avgVal, type, userUnit, 'second') as number
        });

      } else {
        dataArr.push({
          x: startTimestamp,
          y: null,
          low: null
        });
      }
      
    } else {
      dataArr.push({
        x: startTimestamp,
        y: avgMaxVal,
        low: avgVal
      });
    }

    this.totalCount.speed += avgVal;
    if (avgMaxVal > maxSpeed) {
      this.chart.speedPaceTrend.maxSpeed = avgMaxVal;
    }

    if ((minSpeed === null || minSpeed > avgVal) && avgVal !== 0) {
      this.chart.speedPaceTrend.minSpeed = avgVal;
    }

  }

  /**
   * 根據運動類別與使用者使用之單位建立頻率趨勢圖
   * @param data {any}-一天（週）加總的數據
   * @param startTimestamp {number}-該天（週）起始時間
   * @param type {SportType}-運動類型
   * @author kidin-1100505
   */
  createCadenceChart(data: any, startTimestamp: number, type: SportType) {
    let avgCadence: number,
        rangeMaxCadence: number;
    switch (type) {
      case SportCode.run:
        const { runAvgCadence, avgRunMaxCadence } = data;
        avgCadence = runAvgCadence || 0;
        rangeMaxCadence = avgRunMaxCadence || 0;
        break
      case SportCode.cycle:
        const { cycleAvgCadence, avgCycleMaxCadence } = data;
        avgCadence = cycleAvgCadence || 0;
        rangeMaxCadence = avgCycleMaxCadence || 0;
        break
      case SportCode.swim:
        const { swimAvgCadence, avgSwimMaxCadence } = data;
        avgCadence = swimAvgCadence || 0;
        rangeMaxCadence = avgSwimMaxCadence || 0;
        break
      case SportCode.row:
        const { rowingAvgCadence, avgRowingMaxCadence } = data;
        avgCadence = rowingAvgCadence || 0;
        rangeMaxCadence = avgRowingMaxCadence || 0;
        break;
    }

    const { dataArr, maxCadence, minCadence } = this.chart.cadenceTrend;
    if (avgCadence !== 0) {
      dataArr.push({
        x: startTimestamp,
        y: rangeMaxCadence,
        low: avgCadence
      });

    } else {
      dataArr.push({
        x: startTimestamp,
        y: null,
        low: null
      });
    }
      
    this.totalCount.cadence += avgCadence;
    if (rangeMaxCadence > maxCadence) {
      this.chart.cadenceTrend.maxCadence = rangeMaxCadence;
    }

    if ((minCadence === null || minCadence > avgCadence) && avgCadence !== 0) {
      this.chart.cadenceTrend.minCadence = avgCadence;
    }

  }

  /**
   * 建立游泳效益趨勢圖
   * @param data {any}-一天（週）加總的數據
   * @param startTimestamp {number}-該天（週）起始時間
   * @author kidin-1100505
   */
  createSwolfChart(data: any, startTimestamp: number) {
    const { dataArr, maxSwolf, minSwolf } = this.chart.swolfTrend,
          avgSwolf = data.avgSwolf || 0,
          bestSwolf = data.bestSwolf || 0;
    if (avgSwolf !== 0) {
      dataArr.push({
        x: startTimestamp,
        y: bestSwolf,
        low: avgSwolf
      });

    } else {
      dataArr.push({
        x: startTimestamp,
        y: null,
        low: null
      });
    }
      
    this.totalCount.swolf += avgSwolf;
    if (bestSwolf > maxSwolf) {
      this.chart.swolfTrend.maxSwolf = bestSwolf;
    }

    if ((minSwolf === null || minSwolf > avgSwolf) && avgSwolf !== 0) {
      this.chart.swolfTrend.minSwolf = avgSwolf;
    }

  }

  /**
   * 建立累積G值正負長條趨勢圖
   * @param data {any}-一天（週）加總的數據
   * @param startTimestamp {number}-該天（週）起始時間
   * @author kidin-1100506
   */
  createTotalGForceChart(data: any, startTimestamp: number) {
    const {
      totalPlusGforceX,
      totalPlusGforceY,
      totalPlusGforceZ,
      totalMinusGforceX,
      totalMinusGforceY,
      totalMinusGforceZ
    } = data;

    const {
      positiveData: xPositiveData,
      negativeData: xNegativeData,
      maxGForce: maxX,
      minGForce: minX
    } = this.chart.totalXAxisMoveTrend;

    const {
      positiveData: yPositiveData,
      negativeData: yNegativeData,
      maxGForce: maxY,
      minGForce: minY
    } = this.chart.totalYAxisMoveTrend;

    const {
      positiveData: zPositiveData,
      negativeData: zNegativeData,
      maxGForce: maxZ,
      minGForce: minZ
    } = this.chart.totalZAxisMoveTrend;

    xPositiveData.push([startTimestamp, totalPlusGforceX]);
    yPositiveData.push([startTimestamp, totalPlusGforceY]);
    zPositiveData.push([startTimestamp, totalPlusGforceZ]);
    xNegativeData.push([startTimestamp, totalMinusGforceX]);
    yNegativeData.push([startTimestamp, totalMinusGforceY]);
    zNegativeData.push([startTimestamp, totalMinusGforceZ]);
    if (totalPlusGforceX > maxX) {
      this.chart.totalXAxisMoveTrend.maxGForce = totalPlusGforceX;
    }

    if (totalPlusGforceY > maxY) {
      this.chart.totalYAxisMoveTrend.maxGForce = totalPlusGforceY;
    }

    if (totalPlusGforceZ > maxZ) {
      this.chart.totalZAxisMoveTrend.maxGForce = totalPlusGforceZ;
    }

    if (totalMinusGforceX < minX) {
      this.chart.totalXAxisMoveTrend.minGForce = totalMinusGforceX;
    }

    if (totalMinusGforceY < minY) {
      this.chart.totalYAxisMoveTrend.minGForce = totalMinusGforceY;
    }

    if (totalMinusGforceZ < minZ) {
      this.chart.totalZAxisMoveTrend.minGForce = totalMinusGforceZ;
    }

  }

  /**
   * 建立平面加速度趨勢圖
   * @param data {any}-一天（週）加總的數據
   * @param startTimestamp {number}-該天（週）起始時間
   * @author kidin-1100517
   */
  createTotalPlaneChart(data: any, startTimestamp: number) {
    const {
      totalPlusGforceX,
      totalPlusGforceY,
      totalMinusGforceX,
      totalMinusGforceY
    } = data;

    const elementArr = [totalPlusGforceX, totalPlusGforceY, totalMinusGforceX, totalMinusGforceY],
          planeG = parseFloat(this.reportService.pythagorean(elementArr).toFixed(0)),
          { maxPlaneGForce, planeGForce } = this.chart.planeAcceleration;

    planeGForce.push([startTimestamp, planeG]);
    this.totalCount.planeGForce += planeG;
    if (planeG > maxPlaneGForce) {
      this.chart.planeAcceleration.maxPlaneGForce = planeG;
    }

  }

  /**
   * 建立最大最小G值趨勢圖
   * @param data {any}-一天（週）加總的數據
   * @param startTimestamp {number}-該天（週）起始時間
   * @author kidin-1100506
   */
  createExtremeGForceChart(data: any, startTimestamp: number) {
    const {
      maxGforceX,
      maxGforceY,
      maxGforceZ,
      miniGforceX,
      miniGforceY,
      miniGforceZ,
    } = data;

    const maxGForceX = maxGforceX || 0,
          maxGForceY = maxGforceY || 0,
          maxGForceZ = maxGforceZ || 0,
          miniGForceX = miniGforceX || 0,
          miniGForceY = miniGforceY || 0,
          miniGForceZ = miniGforceZ || 0;

    const { maxXArr, minXArr, maxX, minX } = this.chart.extremeXGForce,
          { maxYArr, minYArr, maxY, minY } = this.chart.extremeYGForce,
          { maxZArr, minZArr, maxZ, minZ } = this.chart.extremeZGForce;
    maxXArr.push([startTimestamp, maxGForceX]);
    minXArr.push([startTimestamp, miniGForceX]);
    maxYArr.push([startTimestamp, maxGForceY]);
    minYArr.push([startTimestamp, miniGForceY]);
    maxZArr.push([startTimestamp, maxGForceZ]);
    minZArr.push([startTimestamp, miniGForceZ]);
    if (maxGForceX > maxX) this.chart.extremeXGForce.maxX = maxGForceX;
    if (maxGForceY > maxY) this.chart.extremeYGForce.maxY = maxGForceY;
    if (maxGForceZ > maxZ) this.chart.extremeZGForce.maxZ = maxGForceZ;
    if (miniGForceX < minX) this.chart.extremeXGForce.minX = miniGForceX;
    if (miniGForceY < minY) this.chart.extremeYGForce.minY = miniGForceY;
    if (miniGForceZ < minZ) this.chart.extremeZGForce.minZ = miniGForceZ;
  }

  /**
   * 建立平面G值趨勢圖
   * @param data {any}-一天（週）加總的數據
   * @param startTimestamp {number}-該天（週）起始時間
   * @author kidin-1100517
   */
  createExtremePlaneChart(data: any, startTimestamp: number) {
    const absMaxGForceX = Math.abs(data.maxGforceX),
          absMaxGForceY = Math.abs(data.maxGforceY),
          absMinGForceX = Math.abs(data.miniGforceX),
          absMinGForceY = Math.abs(data.miniGforceY),
          maxX = absMaxGForceX >= absMinGForceX ? absMaxGForceX : absMinGForceX,
          maxY = absMaxGForceY >= absMinGForceY ? absMaxGForceY : absMinGForceY;
    let maxPlaneG: number;
    if (maxX >= maxY) {
      maxPlaneG = this.reportService.countMaxPlaneGForce(maxX, maxY);
    } else {
      maxPlaneG = this.reportService.countMaxPlaneGForce(maxY, maxX);
    }

    const capitaMaxPlaneG = maxPlaneG || 0,
          { maxPlaneMaxGForce, planeMaxGForce } = this.chart.extremePlaneGForce;
    planeMaxGForce.push([startTimestamp, capitaMaxPlaneG]);
    this.totalCount.planeMaxGForce += capitaMaxPlaneG;
    if (capitaMaxPlaneG > maxPlaneMaxGForce) {
      this.chart.extremePlaneGForce.maxPlaneMaxGForce = capitaMaxPlaneG;
    }

  }

  /**
   * 建立揮拍速度趨勢圖數據
   * @param data {any}-一天（週）加總的數據
   * @param startTimestamp {number}-該天（週）起始時間
   * @author kidin-1100429
   */
  createSwingSpeedChart(data: any, startTimestamp: number) {
    const { avgSwingSpeed, maxSwingSpeed } = data,
          { unit: userUnit } = this.userInfo;
    let avgVal: number,
        avgMaxVal: number;
    if (userUnit === unit.metric) {
      avgVal = avgSwingSpeed || 0;
      avgMaxVal = maxSwingSpeed || 0;
    } else {
      avgVal = (avgSwingSpeed / mi) || 0;
      avgMaxVal = (maxSwingSpeed / mi) || 0;
    }

    const { dataArr, maxSpeed, minSpeed } = this.chart.swingSpeed;
    dataArr.push({
      x: startTimestamp,
      y: avgMaxVal,
      low: avgVal
    });

    this.totalCount.swingSpeed += avgVal;
    if (avgMaxVal > maxSpeed) {
      this.chart.swingSpeed.maxSpeed = avgMaxVal;
    }

    if ((minSpeed === null || minSpeed > avgVal) && avgVal !== 0) {
      this.chart.swingSpeed.minSpeed = avgVal;
    }

  }

  /**
   * 建立揮拍比例趨勢圖數據
   * @param data {any}-一天（週）加總的數據
   * @param startTimestamp {number}-該天（週）起始時間
   * @author kidin-1100429
   */
  createSwingRatioChart(data: any, startTimestamp: number) {
    const {
      totalForehandSwingCount,
      totalBackhandSwingCount
    } = data;

    const {
      positiveData,
      negativeData,
      maxForehandCount,
      maxBackhandCount
    } = this.chart.swingRatio;

    positiveData.push([startTimestamp, totalForehandSwingCount]);
    negativeData.push([startTimestamp, totalBackhandSwingCount]);
    if (totalForehandSwingCount > maxForehandCount) {
      this.chart.swingRatio.maxForehandCount = totalForehandSwingCount;
    }

    if (totalBackhandSwingCount > maxBackhandCount) {
      this.chart.swingRatio.maxBackhandCount = totalBackhandSwingCount;
    }

  }

  /**
   * 建立心率區間落點數據和心率區間趨勢圖數據
   * @param data {any}-一天（週）加總的數據
   * @param startTimestamp {number}-該天（週）起始時間
   * @author kidin-1100429
   */
  createHrZoneChart(data: any, startTimestamp: number) {
    const {
      totalHrZone0Second,
      totalHrZone1Second,
      totalHrZone2Second,
      totalHrZone3Second,
      totalHrZone4Second,
      totalHrZone5Second
    } = data;

    // 心率區間落點圖表
    let [z0, z1, z2, z3, z4, z5] = [...this.chart.hrzone];
    z0 += totalHrZone0Second;
    z1 += totalHrZone1Second;
    z2 += totalHrZone2Second;
    z3 += totalHrZone3Second;
    z4 += totalHrZone4Second;
    z5 += totalHrZone5Second;
    this.chart.hrzone = [z0, z1, z2, z3, z4, z5];

    // 心率區間趨勢圖表
    const {
      zoneZero,
      zoneOne,
      zoneTwo,
      zoneThree,
      zoneFour,
      zoneFive
    } = this.chart.hrZoneTrend;
    zoneZero.push([startTimestamp, totalHrZone0Second]);
    zoneOne.push([startTimestamp, totalHrZone1Second]);
    zoneTwo.push([startTimestamp, totalHrZone2Second]);
    zoneThree.push([startTimestamp, totalHrZone3Second]);
    zoneFour.push([startTimestamp, totalHrZone4Second]);
    zoneFive.push([startTimestamp, totalHrZone5Second]);
  }

  /**
   * 建立閾值區間落點數據和閾值區間趨勢圖數據
   * @param data {any}-一天（週）加總的數據
   * @param startTimestamp {number}-該天（週）起始時間
   * @author kidin-1100429
   */
  createThresholdChart(data: any, startTimestamp: number) {
    const {
      totalFtpZone0Second,
      totalFtpZone1Second,
      totalFtpZone2Second,
      totalFtpZone3Second,
      totalFtpZone4Second,
      totalFtpZone5Second,
      totalFtpZone6Second
    } = data;

    // 閾值區間落點圖表
    let [z0, z1, z2, z3, z4, z5, z6] = [...this.chart.thresholdZone];
    z0 += totalFtpZone0Second;
    z1 += totalFtpZone1Second;
    z2 += totalFtpZone2Second;
    z3 += totalFtpZone3Second;
    z4 += totalFtpZone4Second;
    z5 += totalFtpZone5Second;
    z6 += totalFtpZone6Second;
    this.chart.thresholdZone = [z0, z1, z2, z3, z4, z5, z6];

    // 閾值區間趨勢圖表
    const {
      zoneZero,
      zoneOne,
      zoneTwo,
      zoneThree,
      zoneFour,
      zoneFive,
      zoneSix
    } = this.chart.thresholdZoneTrend;
    zoneZero.push([startTimestamp, totalFtpZone0Second]);
    zoneOne.push([startTimestamp, totalFtpZone1Second]);
    zoneTwo.push([startTimestamp, totalFtpZone2Second]);
    zoneThree.push([startTimestamp, totalFtpZone3Second]);
    zoneFour.push([startTimestamp, totalFtpZone4Second]);
    zoneFive.push([startTimestamp, totalFtpZone5Second]);
    zoneSix.push([startTimestamp, totalFtpZone6Second]);
  }

  /**
   * 取得對應的訓練程度係數
   * @param level {50 | 100 | 200}-重訓程度
   * @author kidin-1100610
   */
  getWeightTrainLevel(level: 50 | 100 | 200) {
    this.updateUrl();
    switch (level) {
      case 50:
        return Proficiency.novice;
      case 100:
        return Proficiency.metacarpus;
      case 200:
        return Proficiency.asept;
    }

  }

  /**
   * 取得對應的訓練程度(api用)
   * @param level { ProficiencyCoefficient }-重訓程度係數
   * @author kidin-1100610
   */
  getStrengthLevel(proficiency: ProficiencyCoefficient) {
    switch (proficiency) {
      case Proficiency.novice:
        return 50;
      case Proficiency.metacarpus:
        return 100;
      case Proficiency.asept:
        return 200;
    }

  }

  /**
   * 變更重訓程度（係數），並儲存雲端
   * @param level {ProficiencyCoefficient}-重訓係數
   * @author kidin-1100610
   */
  changeLevel(level: ProficiencyCoefficient) {
    this.userInfo.weightTrainLevel = level;
    const strengthLevel = this.getStrengthLevel(level);
    if (this.uiFlag.isDashboardPage || this.uiFlag.isReportOwner) {
      const body = {
        token: this.utils.getToken() || '',
        userProfile: {
          weightTrainingStrengthLevel: strengthLevel
        }

      };

      this.settingsService.updateUserProfile(body).subscribe(res => {
        const { processResult } = res;
        if (processResult && processResult.resultCode === 200) {
          this.userProfile.weightTrainingStrengthLevel = strengthLevel;
          this.userProfileService.editRxUserProfile(this.userProfile);
        }

      });

    }
    
    this.closeAllMenu();
    this.updateUrl();
  }

  /**
   * 生成肌肉地圖
   * @param strokeData {any}-一天（週）的數據
   * @param startTimestamp {number}-該天（週）起始時間
   * @author kidin-1100610
   */
  createMuscleMap(data: any, startTimestamp: number) {
    this.chart.trainingPart.push({
      part: data['weightTrainingInfo'],
      startDate: startTimestamp
    });

  }

  /**
   * 顯示或隱藏該肌群圖表
   * @param e {any}
   * @author kidin-1100611
   */
  handleTrendChart(data: any) {
    const muscleGroup = data[0];
    for (let i = 0, len = muscleGroup.length; i < len; i++) {

      if (this.muscleDataCompleted === false) {
        const partList = [];
        for (const list in muscleGroup[i].trainList) {

          if (muscleGroup[i].trainList.hasOwnProperty(list)) {
            partList.push([
              list,
              [
                this.chartXAxis,
                this.fillVacancyData(
                  muscleGroup[i].trainList[list].oneRepMaxChartData,
                  muscleGroup[i].trainList[list].date,
                  'max'
                  ),
                this.fillVacancyData(
                  muscleGroup[i].trainList[list].oneRepWeightChartData,
                  muscleGroup[i].trainList[list].date,
                  'avg'
                  )
              ]
            ]);

          }

        }

        const model = {
          id: muscleGroup[i].id,
          name: muscleGroup[i].name,
          isFold: true,
          isFocus: false,
          muscleGroupData: [   // 訓練肌群數據for圖表
            this.chartXAxis,
            this.fillVacancyData(
              muscleGroup[i].muscleGroupData.oneRepMaxChartData,
              muscleGroup[i].muscleGroupData.date,
              'max'
              ),
            this.fillVacancyData(
              muscleGroup[i].muscleGroupData.oneRepWeightChartData,
              muscleGroup[i].muscleGroupData.date,
              'avg'
              )
          ],
          trainList: partList  // 訓練部位清單數據for圖表
        };

        this.chart.muscleTrendList.push(model);
        if (i === muscleGroup.length - 1) {
          this.muscleDataCompleted = true;
        }

      }

      this.chart.muscleTrendList[i].isFocus = muscleGroup[i].isFocus;
      if (this.uiFlag.isPreviewMode && data[1] === 'init') {
        this.chart.muscleTrendList[i].isFold = muscleGroup[i].isFold;
      }

    }

    this.updateUrl();
  }

  /**
   * 依據選取日期和報告類型（日/週）將缺漏的數值以0填補，並處理重複日期的資料
   * @param data {Array<any>}-重訓圖表所需數據
   * @param date Array<number>-有數據的日期起始timestamp
   * @param act {'avg' | 'max'}-計算方式(平均/取最大值)
   * @author kidin-1090324
   */
  fillVacancyData (data: Array<any>, date: Array<number>, act: 'avg' | 'max') {
    if (data.length === 0) {
      return [];
    } else {
      let idx = 0,
          sameDateData = 0;
      const newData = [];
      for (let i = 0, len = this.chartXAxis.length; i < len; i++) {
        const isHaveData = this.chartXAxis[i] === date[idx],
              isSameDateData = date[idx + 1] && date[idx] === date[idx + 1];
        if (sameDateData !== 0 && isHaveData) {

          switch (act) {
            case 'avg':
              newData.push((sameDateData + data[idx]) / 2);
              break;
            case 'max':
              newData.push(
                sameDateData > data[idx] ? sameDateData : data[idx]
              );
              break;
          }

          sameDateData = 0;
          idx++;
        } else if (isSameDateData) {
          sameDateData = data[idx];
          idx++;
          i--;
        } else if (isHaveData) {
          newData.push(data[idx]);
          idx++;
        } else if (idx === 0 || idx >= date.length || !isSameDateData) {

          if (idx >= date.length) {
            newData.push(null);
          } else if (this.chartXAxis[i] !== date[idx]) {
            newData.push(null);
          } else {
            newData.push(data[idx]);
            idx++;
          }

        } else {
          newData.push(null);
        }

      }

      return newData;
    }


  }

  /**
   * 重訓圖表收合
   * @param idx {number}-指定展開收合的序列
   * @author kidin-1090414
   */
  handleChartFold (idx: number) {
    if (this.chart.muscleTrendList[idx].hasOwnProperty('isFold')) {

      if (this.chart.muscleTrendList[idx].isFold === false) {
        this.chart.muscleTrendList[idx].isFold = true;
      } else {
        this.chart.muscleTrendList[idx].isFold = false;
      }

    }

    this.updateUrl();
  }

  /**
   * 根據運動類別回傳所需數據的key
   * @param type {SportType}
   * @author kidin-1100419
   */
  getNeedKey(type: SportType) {
    switch (type) {
      case SportCode.run:
        return commonData.concat(runData);
      case SportCode.cycle:
        return commonData.concat(rideData);
      case SportCode.weightTrain:
        return commonData.concat(weightTrainData);
      case SportCode.swim:
        return commonData.concat(swimData);
      case SportCode.row:
        return commonData.concat(rowData);
      case SportCode.ball:
        return commonData.concat(personBallData);
      default: // 共同、有氧
        return commonData;
    }

  }

  /**
   * 將同一天的數據合併（時區不同的數據以同年同月同日合併為同一天）
   * @param data {Array<any>}
   * @author kidin-1100419
   */
  mergeSameDateData(data: Array<any>) {
    let sameDateData = {};
    const result = [];
    for (let i = 0, len = data.length; i < len; i++) {
      const { startTime, activities } = data[i],
            { startTime: nextStartTime } = data[i + 1] || { startTime: undefined },
            startDate = startTime.split('T')[0],
            nextStartDate = nextStartTime ? nextStartTime.split('T')[0] : undefined;
      if (nextStartDate === startDate) {

        if (!sameDateData['startTimestamp']) {
          sameDateData = {
            startTimestamp: moment(startDate, 'YYYY-MM-DD').valueOf(),
            activities
          };
        } else {
          sameDateData['activities'] = sameDateData['activities'].concat(activities);
        }

      } else {

        if (!sameDateData['startTimestamp']) {
          result.push({
            startTimestamp: moment(startDate, 'YYYY-MM-DD').valueOf(),
            activities 
          });
        } else {
          sameDateData['activities'] = sameDateData['activities'].concat(activities);
          result.push(sameDateData);
          sameDateData = {};
        }
        
      }

    }

    return result;
  }

  /**
   * 關閉所有浮動選單
   * @author kidin-1100520
   */
  closeAllMenu() {
    this.uiFlag.showWeightTrainingOpt = false;
    this.uiFlag.showLevelSelector = false;
    this.unsubscribeEvent();
    this.changeDetectorRef.markForCheck();
  }

  /**
   * 訂閱捲動和點擊事件
   * @author kidin-1100520
   */
  subscribeScrollAndClick() {
    const subscribeEle = this.uiFlag.isDashboardPage ? '.main-body' : '.main',
          scrollEle = document.querySelectorAll(subscribeEle),
          scrollEvent = fromEvent(scrollEle, 'scroll'),
          clickEvent = fromEvent(window, 'click'),
          mergeEvent = merge(scrollEvent, clickEvent);

    this.scrollAndClickEvent = mergeEvent.pipe(
      takeUntil(this.ngUnsubscribe)
    ).subscribe(event => {
      this.closeAllMenu();
    });

  }

  /**
   * 取消訂閱捲動和點擊事件
   * @author kidin-1100520
   */
  unsubscribeEvent() {
    this.scrollAndClickEvent.unsubscribe();
  }

  /**
   * 顯示重訓程度設定與否
   * @param e {MouseEvent}
   * @author kidin-1100610
   */
  handleShowOpt(e: MouseEvent) {
    e.stopPropagation();
    if (this.uiFlag.showWeightTrainingOpt) {
      this.unsubscribeEvent();
    } else {
      this.uiFlag.showWeightTrainingOpt = true;
      this.subscribeScrollAndClick();
    }

  }

  /**
   * 顯示重訓程度選單與否
   * @param e {MouseEvent}
   * @author kidin-1100610
   */
  handleShowLevelSelector(e: MouseEvent) {
    e.stopPropagation();
    if (this.uiFlag.showLevelSelector) {
      this.unsubscribeEvent();
    } else {
      this.uiFlag.showLevelSelector = true;
      this.subscribeScrollAndClick();
    }
  }

  /**
   * 覆蓋目前網址與預覽列印網址
   * @param resetUrl {boolean}
   * @author kidin-1100414
   */
  updateUrl(resetUrl: boolean = true) {
    let focusMuscle = '',
        proficiency = '',
        list = [];
    if (this.reportConditionOpt.sportType === SportCode.weightTrain) {
      proficiency = `&level=${this.userInfo.weightTrainLevel}`;
      this.chart.muscleTrendList.forEach(_list => {
        if (_list.isFocus === true) {

          if (_list.isFold === true) {
            list.push(`g${_list.id}`);  // 收合用g表示
          } else {
            list.push(`m${_list.id}`);  // 展開用m表示
          }

        }

      });

      focusMuscle = `&selectMuscle=${list.join('_')}`;
    }

    const { sportType, date: {startTimestamp, endTimestamp} } = this.reportConditionOpt,
          { id } = this.userInfo,
          { origin } = location,
          hashUserId = this.hashIdService.handleUserIdEncode(id),
          path = this.uiFlag.isDashboardPage ? '/dashboard' : `/user-profile/${hashUserId}`,
          startDate = moment(startTimestamp).format('YYYY-MM-DD'),
          endDate = moment(endTimestamp).format('YYYY-MM-DD');
    this.previewUrl = `${origin
      }${path
      }/sport-report?startdate=${startDate
      }&enddate=${endDate
      }&sporttype=${sportType
      }${proficiency.length > 0 ? proficiency + focusMuscle : ''
      }&ipm=s
    `;

    this.changeDetectorRef.markForCheck();
  }

  /**
   * 導向預覽列印頁面
   * (修正直接在html使用[herf]="previewUrl"時，重訓頁面previewUrl會吃不到最新值的問題)
   * @param e {MouseEvent}
   * @author kidin-1100630
   */
  navigatePreviewMode(e: MouseEvent) {
    e.preventDefault();
    window.open(this.previewUrl, '_blank', 'noopener=yes,noreferrer=yes');
  }

  /**
   * 點擊活動分析的運動項目
   * @param sportType {SportType}
   * @author kidin-1100428
   */
   assignAnalysisType(sportType: SportType) {
    let { analysisType } = this.uiFlag;
    if (sportType === analysisType) {
      this.uiFlag.analysisType = SportCode.all;
    } else {
      this.uiFlag.analysisType = sportType;
    }

    this.changeDetectorRef.markForCheck();
  }

  /**
   * 將隱私權pass給父組件
   * @param e {boolean}-是否開放隱私權
   * @author kidin-1090205
   */
  privacyOpened (e: boolean) {
    this.uiFlag.openPrivacy = e;
    if (!this.uiFlag.isDashboardPage) {
      this.showPrivacyUi.emit(!e);
    }
    
  }

  /**
   * 開啟分享框
   * @author kidin-1100615
   */
  showPrivacyAlert() {
    this.dialog.open(MessageBoxComponent, {
      hasBackdrop: true,
      data: {
        title: 'Message',
        body: `${this.translate.instant('universal_privacy_usingSharing')}`,
        confirmText: this.translate.instant(
          'universal_operating_confirm'
        ),
        cancelText: this.translate.instant(
          'universal_operating_cancel'
        ),
        onCancel: () => {
          return false;
        },
        onConfirm: this.editReportPrivacy.bind(this)
      }

    });

    this.changeDetectorRef.markForCheck();
  }

  /**
   * 編輯該期間運動報告隱私權
   * @author kidin-1100302
   */
  editReportPrivacy() {
    const format = 'YYYY-MM-DDTHH:mm:ss.SSSZ',
          { startTimestamp, endTimestamp } = this.reportConditionOpt.date,
          startTime = moment(startTimestamp).format(format),
          endTime = moment(endTimestamp).format(format),
          body = {
            token: this.utils.getToken(),
            editFileType: '2',
            rangeType: '1',
            startTime,
            endTime,
            privacy: [1, 99]
          };

    this.settingsService.editPrivacy(body).subscribe(res => {
      if (res.resultCode === 200) {
        this.showShareBox();
      } else {
        this.utils.openAlert(errMsg);
      }

      this.changeDetectorRef.markForCheck();
    });

  }

  /**
   * 顯示分享框
   * @author kidin-1100220
   */
  showShareBox() {
    this.translate.get('hellow world').pipe(
      takeUntil(this.ngUnsubscribe)
    ).subscribe(() => {
      const { id } = this.userInfo,
            { origin } = location,
            hashUserId = this.hashIdService.handleUserIdEncode(id),
            queryString = this.previewUrl.split('?')[1].replace('&ipm=s', '').trim(),
            url = `${origin}/user-profile/${hashUserId}/sport-report?${queryString}`;

      this.dialog.open(ShareGroupInfoDialogComponent, {
        hasBackdrop: true,
        data: {
          url,
          title: this.translate.instant('universal_operating_share'),
          shareName: this.translate.instant('universal_activityData_sportReport'),
          cancelText: this.translate.instant('universal_operating_confirm'),
          debugUrl: ''
        }

      });

      this.changeDetectorRef.markForCheck();
    });
    
  }

  /**
   * 列印
   */
  print() {
    window.print();
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
