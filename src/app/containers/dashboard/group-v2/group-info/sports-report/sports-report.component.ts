import { Component, OnInit, OnDestroy, ViewChild, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { GroupService } from '../../../services/group.service';
import { UtilsService } from '../../../../../shared/services/utils.service';
import { ReportService } from '../../../../../shared/services/report.service';
import { ReportConditionOpt } from '../../../../../shared/models/report-condition';
import { Subject, of, combineLatest, fromEvent, Subscription, merge } from 'rxjs';
import { takeUntil, switchMap, map } from 'rxjs/operators';
import { TranslateService } from '@ngx-translate/core';
import { HashIdService } from '../../../../../shared/services/hash-id.service';
import { MatSort, Sort } from '@angular/material/sort';
import moment from 'moment';
import { MatTableDataSource } from '@angular/material/table';
import SimpleLinearRegression from 'ml-regression-simple-linear';
import { SportType, SportCode } from '../../../../../shared/models/report-condition';
import {
  commonData,
  runData,
  rideData,
  weightTrainData,
  swimData,
  rowData,
  ballData,
  Regression
} from '../../../../../shared/models/sports-report';
import { Unit, mi, unit } from '../../../../../shared/models/bs-constant';
import { UserProfileService } from '../../../../../shared/services/user-profile.service';
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
import { GroupLevel, SettingObj } from '../../../../dashboard/models/group-detail';
import { MuscleCode, MuscleGroup } from '../../../../../shared/models/weight-train';
import { MatCheckboxChange } from '@angular/material/checkbox';


@Component({
  selector: 'app-sports-report',
  templateUrl: './sports-report.component.html',
  styleUrls: ['./sports-report.component.scss', '../group-child-page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SportsReportComponent implements OnInit, OnDestroy {

  @ViewChild('groupSortTable', {static: false})
  groupSortTable: MatSort;
  @ViewChild('personSortTable', {static: false})
  personSortTable: MatSort;

  private ngUnsubscribe = new Subject();
  scrollAndClickEvent = new Subscription();
  resizeEvent = new Subscription();

  /**
   * UI控制相關flag
   */
   uiFlag = {
    isPreviewMode: false,
    progress: 100,
    noData: true,
    inited: false,
    analysisType: SportCode.all,
    noFtpData: true,
    haveQueryString: false
  }

  /**
   * 報告頁面可讓使用者篩選的條件
   */
  reportConditionOpt: ReportConditionOpt = {
    brandType: 2,
    pageType: 'sport',
    date: {
      startTimestamp: moment().startOf('day').subtract(6, 'days').valueOf(),
      endTimestamp: moment().endOf('day').valueOf(),
      type: 'sevenDay'
    },
    group: {
      brands: null,
      branches: null,
      coaches: [],
      selectGroup: null
    },
    sportType: SportCode.all,
    hideConfirmBtn: false
  }

  /**
   * 指定的群組概要
   */
  groupInfo = {
    name: null,
    icon: null,
    id: null,
    parents: null,
    level: null
  };

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
    hrzone: [0, 0, 0, 0, 0, 0],
    hrInfo: {
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
    }

  };

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
    planeMaxGForce: 0
  };

  groupAnalysis = {};  // 群組分析數據
  personAnalysis = {};  // 個人分析數據

  /**
   * 紀錄平均數據如avgHeartRateBpm，不為零的筆數和人數。
   * 個人平均數據計算方式：Σ(當天平均數據 * 當天有效筆數(totalActivity不為null或0)) / 總有效筆數
   * 群組平均數據計算方式：Σ(個人平均數據) / 有效人數（有效筆數不為0的人數）
   */
  avgDataRecord = {
    group: {},  // 紀錄有效人數
    person: {}  // 紀錄有效筆數
  }

  /**
   * 團體分析篩選設定
   */
  groupTableOpt = [];

  /**
   * 個人分析篩選設定
   */
  personTableOpt = [];

  /**
   * 群組分析列表相關
   */
  groupTable = {
    showAll: false,
    showOpt: false,
    sorted: false,
    sortType: null,
    mouseInId: false,
    focusId: null,
    list: new MatTableDataSource<any>(),
    showDataDef: []
  }

  /**
   * 個人分析列表相關
   */
  personTable = {
    showAll: false,
    showOpt: false,
    sorted: false,
    sortType: null,
    mouseInId: false,
    focusId: null,
    list: new MatTableDataSource<any>(),
    showDataDef: []
  }

  /**
   * 點擊分析列表後顯示之菜單
   */
  analysisMenu = {
    type: null,
    focusId: '',
    x: null,
    y: null
  };

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
    id: null,
    accessRight: null,
    unit: <Unit>unit.metric
  }

  /**
   * 分析列表可設定的欄位數量範圍
   */
  tableColumn = {
    max: 3,
    min: 2
  }

  groupList = {
    analysisObj: {},
    regression: {},
    originList: null
  };

  memberList = {
    analysisObj: {},
    noRepeatList: []
  };

  readonly mi = mi;
  readonly tableLength = 8; // 分析列表預設顯示長度
  readonly groupLevelEnum = GroupLevel;
  readonly unitEnum = unit;
  readonly sportCode = SportCode;
  groupFilterLevel = [30, 40, 60];  // 團體分析可篩選的階層
  dateLen = 0; // 報告橫跨天數/週數
  haveDataLen = 0;  // 有數據的天（週）數
  sameTimeGroupData: any;
  previewUrl: string;
  windowWidth = 320;  // 視窗寬度
  columnTranslate = {};  // 分析列表所需的欄位名稱翻譯

  constructor(
    private utils: UtilsService,
    private reportService: ReportService,
    private groupService: GroupService,
    private hashIdService: HashIdService,
    private translate: TranslateService,
    private userProfileService: UserProfileService,
    private changeDetectorRef: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.checkWindowSize(window.innerWidth);
    this.subscribeWindowSize();
    this.checkQueryString(location.search);
    this.getNeedInfo();
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
      this.changeDetectorRef.markForCheck();
    });

  }

  /**
   * 根據視窗寬度調整分析列表最大與最小可顯示數量
   * @param width {number}-視窗寬度
   * @author kidin-1100519
   */
  checkWindowSize(width: number) {
      if (width < 500) {
        this.tableColumn = {
          max: 3,
          min: 2
        };

      } else if (width < 630) {
        this.tableColumn = {
          max: 4,
          min: 2
        };

      } else if (width < 950) {
        this.tableColumn = {
          max: 5,
          min: 2
        };

      } else {
        this.tableColumn = {
          max: 6,
          min: 3
        };

      }

    const { max } = this.tableColumn;
    if (this.groupTableOpt.length > max) {
      this.groupTableOpt.length = max;
    }

    if (this.personTableOpt.length > max) {
      this.personTableOpt.length = max;
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
              [_key, _value] = _queryArr;
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
          case 'seemore':
            if (_value.includes('g')) this.groupTable.showAll = true;
            if (_value.includes('p')) this.personTable.showAll = true;
            break;
        }

      });

    }

  }

  /**
   * 取得目前所在群組與其他群組階層資訊
   * @author kidin-1091028
   */
  getNeedInfo() {
    combineLatest([
      this.groupService.getAllLevelGroupData(),
      this.userProfileService.getRxUserProfile(),
      this.translate.get('hellow world')
    ]).pipe(
      takeUntil(this.ngUnsubscribe)
    ).subscribe(resArr => {
      this.createTranslate();
      this.groupList.originList = resArr[0];
      const { groupId, brands, branches, coaches } = resArr[0] as any,
            { userId, unit, heartRateBase, systemAccessRight } = resArr[1] as any,
            groupLevel = this.utils.displayGroupLevel(groupId),
            group = this.reportConditionOpt.group;

      this.userInfo = {
        id: userId,
        accessRight: systemAccessRight,
        unit
      };

      this.chart.hrInfo.hrBase = heartRateBase;
      group.coaches = coaches;
      switch (groupLevel) {
        case GroupLevel.brand:
          group.brands = brands[0];
          group.branches = branches;
          group.selectGroup = groupId.split('-').slice(0, 3).join('-');
          break;
        case GroupLevel.branch:
          group.brands = null;
          group.branches = branches;
          group.selectGroup = groupId.split('-').slice(0, 4).join('-');
          break;
        default:
          group.brands = null;
          group.branches = null;
          group.selectGroup = groupId.split('-').slice(0, 5).join('-');
          break;
      }

      this.reportService.setReportCondition(this.reportConditionOpt);
      this.getReportSelectedCondition();
    });

  }

  /**
   * 建立分析列表欄位多國語系
   * @author kidin-1100520
   */
  createTranslate() {
    this.columnTranslate = {
      name: this.translate.instant('universal_activityData_name'),
      memberNum: `
        ${this.translate.instant('universal_vocabulary_activity')}
        ${this.translate.instant('universal_activityData_people')}
      `,
      stroke: this.translate.instant('universal_activityData_numberOfActivity'),
      totalTime: this.translate.instant('universal_activityData_limit_totalTime'),
      totalActivityTime: `${this.translate.instant('universal_adjective_singleTotal')} ${
        this.translate.instant('universal_activityData_limit_activityTime')
      }`,
      benefitTime: this.translate.instant('universal_activityData_benefitime'),
      pai: this.translate.instant('universal_activityData_pai'),
      calories: this.translate.instant('universal_activityData_totalCalories'),
      totalDistance: this.translate.instant('universal_activityData_limit_totalDistance'),
      avgPace: this.translate.instant('universal_activityData_limit_avgPace'),
      avgSpeed: this.translate.instant('universal_activityData_limit_avgSpeed'),
      avgCadence: {
        [SportCode.run]: this.translate.instant('universal_activityData_limit_avgStepCadence'),
        [SportCode.cycle]: this.translate.instant('universal_activityData_limit_avgCyclingCadence'),
        [SportCode.swim]: this.translate.instant('universal_activityData_limit_avgSwimReps'),
        [SportCode.row]: this.translate.instant('universal_activityData_limit_avgRowCadence'),
      },
      avgPower: this.translate.instant('universal_activityData_limit_avgPower'),
      avgHr: this.translate.instant('universal_activityData_limit_avgHr'),
      totalPlaneGForce: `
        ${this.translate.instant('universal_adjective_accumulation')}
        ${this.translate.instant('universal_activityData_planarAcceleration')}
      `,
      totalPlusZGForce: this.translate.instant('universal_activityData_limit_totalJump'),
      totalMinZGForce: this.translate.instant('universal_activityData_limit_totalFloorImpact'),
      hrZone: this.translate.instant('universal_activityData_limit_hrZone'),
      totalWeight: this.translate.instant('universal_activityData_limit_totalWeight'),
      totalSets: this.translate.instant('universal_activityData_limit_totalSets'),
      preferMuscleGroup: this.translate.instant('universal_muscleName_preferredMuscleGroup'),
      armMuscle: this.translate.instant('universal_muscleName_armMuscles'),
      pectoralsMuscle: this.translate.instant('universal_muscleName_pectoralsMuscle'),
      shoulderMuscle: this.translate.instant('universal_muscleName_shoulderMuscle'),
      backMuscle: this.translate.instant('universal_muscleName_backMuscle'),
      abdominalMuscle: this.translate.instant('universal_muscleName_abdominalMuscle'),
      legMuscle: this.translate.instant('universal_muscleName_legMuscle'),
      preferSport: this.translate.instant('universal_activityData_activityPreferences')
    }

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
      hrzone: [0, 0, 0, 0, 0, 0,],
      hrInfo: {
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
      }

    };

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
      planeMaxGForce: 0
    };

    this.groupList.regression = {};
    this.haveDataLen = 0;
    this.groupAnalysis = {};
    this.avgDataRecord = {
      group: {},
      person: {}
    };
    this.personAnalysis = {};
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
      switchMap(res => {
        const { progress } = this.uiFlag;
        this.changeProgress(progress === 100 ? 10 : progress);
        this.initReportContent();
        const effectGroupId = (res as any).group.selectGroup.split('-'),
              completeGroupId = this.groupService.getCompleteGroupId(effectGroupId),
              { id: currentGroupId } = this.groupInfo;
              
        // 若所選群組不變，則沿用之前的成員清單
        if (currentGroupId === completeGroupId) {
          return of([res, this.memberList]);
        } else {
          this.groupInfo = this.assignGroupInfo(completeGroupId);
          const listBody = {
            token: this.utils.getToken(),
            groupId: completeGroupId,
            groupLevel: this.utils.displayGroupLevel(completeGroupId),
            infoType: 5,
            avatarType: 3
          };

          return this.groupService.fetchGroupMemberList(listBody).pipe(
            map(listRes => {
              const { apiCode, resultCode, resultMessage, info: { groupMemberInfo } } = listRes as any;
              if (resultCode !== 200) {
                this.uiFlag.noData = true;
                this.utils.handleError(resultCode, apiCode, resultMessage);
                return [res, []];
              } else {
                return [res, groupMemberInfo];
              }
  
            })
  
          )

        }

      }),
      takeUntil(this.ngUnsubscribe)
    ).subscribe(resArr => {
      // 避免連續送出
      if (this.uiFlag.progress >= 10 && this.uiFlag.progress < 100) {
        this.changeProgress(30);
        // 團體分析可篩選的階層
        const { level } = this.groupInfo;
        this.groupFilterLevel = this.groupFilterLevel.filter(_level => _level >= +level);

        const [condition, memberList] = resArr as any,
              { 
                date: { 
                  startTimestamp,
                  endTimestamp
                },
                group: {
                  selectGroup
                }
              } = condition;
        const {
                date: { 
                  startTimestamp: preStartTimestamp,
                  endTimestamp: preEndTimestamp
                },
                group: {
                  selectGroup: preSelectGroup
                }
              } = this.reportConditionOpt;

        // 日期範圍大於52天則取週報告
        this.reportTime.type = moment(endTimestamp).diff(moment(startTimestamp), 'day') <= 52 ? 1 : 2;
        const notReGetData = (
          this.uiFlag.inited
          && startTimestamp === preStartTimestamp
          && endTimestamp === preEndTimestamp
          && selectGroup === preSelectGroup
        );

        // 若只更動運動類型，則不再call api取得數據
        if (notReGetData) {
          this.reportConditionOpt = this.utils.deepCopy(condition);
          this.personAnalysis = this.utils.deepCopy(memberList.analysisObj);
          this.createReport(this.sameTimeGroupData);
        } else {
          this.reportConditionOpt = this.utils.deepCopy(condition);
          // 若群組id不變，則使用已儲存之人員清單
          let memIdArr: Array<number>;
          if (selectGroup === preSelectGroup && this.uiFlag.inited) {
            memIdArr = [...this.memberList.noRepeatList];
          } else {
            if (!this.uiFlag.inited) this.uiFlag.inited = true;
            this.memberList.analysisObj = {};
            this.createGroupAnalysisObj(this.groupList.originList);
            const memIdSet = this.handlePersonAnalysisObj(memberList);
            memIdArr = (Array.from(memIdSet) as Array<number>).sort((a, b) => a - b);
            this.memberList.noRepeatList = this.utils.deepCopy(memIdArr);
          }

          this.personAnalysis = this.utils.deepCopy(this.memberList.analysisObj);
          this.getMemberData(memIdArr);
        }

      }

    });

  }

  /**
   * 取得面面所需的指定群組資訊
   * @param id {string}-group id
   * @author kidin-1100422
   */
  assignGroupInfo(id: string) {
    const {
      brands,
      branches,
      coaches
    } = this.groupList.originList;

    const { groupIcon: brandIcon, groupName: brandName } = brands[0],
          level = this.utils.displayGroupLevel(id);
    switch (level) {
      case GroupLevel.brand:
        return this.groupInfo = {
          name: brandName,
          id,
          icon: brandIcon,
          parents: null,
          level
        };
      case GroupLevel.branch:
        const { groupIcon: _branchIcon, groupName: _branchName } = this.getGroupInfo(id, branches);
        return this.groupInfo = {
          name: _branchName,
          id,
          icon: _branchIcon,
          parents: brandName,
          level
        };
      case GroupLevel.class:
        const { groupIcon: _coachIcon, groupName: _coachName } = this.getGroupInfo(id, coaches),
              branchGroupId = `${this.groupService.getPartGroupId(id, 4)}-0-0`,
              { groupName: branchName } = this.getGroupInfo(branchGroupId, branches);
        return this.groupInfo = {
          name: _coachName,
          id,
          icon: _coachIcon,
          parents: `${brandName}\\${branchName}`,
          level
        };

    }

  }

  /**
   * 查找指定id在群組列表的序列位置
   * @param id {string}-groupId
   * @param list {Array<any>}-group list
   * @author kidin-1100422
   */
  getGroupInfo(id: string, list: Array<any>) {
    for (let i = 0, len = list.length; i < len; i++) {
      const { groupId } = list[i];
      if (groupId === id) {
        return list[i];
      }
    }

  }

  /**
   * 取得目標群組成員數據
   * @author kidin-1100414
   */
  getMemberData(idList: Array<number>) {
    const { startTimestamp, endTimestamp } = this.reportConditionOpt.date,
          body = {
            token: this.utils.getToken(),
            type: this.reportTime.type,
            targetUserId: idList,
            filterStartTime: moment(startTimestamp).format('YYYY-MM-DDTHH:mm:ss.SSSZ'),
            filterEndTime: moment(endTimestamp).format('YYYY-MM-DDTHH:mm:ss.SSSZ'),
          };

    this.reportService.fetchSportSummaryArray(body).subscribe(res => {
      this.sameTimeGroupData = res;
      if (res.length && res.length > 0) {
        this.uiFlag.noData = false;
        this.changeProgress(70);
        this.createReport(res);
      } else {
        this.uiFlag.noData = true;
        this.changeProgress(100);
      }
      
    });

  }

  /**
   * 建立圖表用時間軸陣列，用來與數據之時間比對用
   * @param date {startTimestamp, endTimestamp}
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
   * @param data {Array<any>}-api 2104的數據
   * @author kidin-1100414
   */
  createReport(data: Array<any>) {
    const dataKey = this.reportTime.type === 1 ? 'reportActivityDays' : 'reportActivityWeeks',
          mixData = [],
          activityPeopleSet = new Set<number>();
    let haveData = false;
    data.forEach(_data => {
      const { resultCode, userId } = _data,
            activity = _data[dataKey];
      // 針對關閉隱私權的使用者建立對應物件
      if (resultCode !== 403) {
        this.personAnalysis[userId].openPrivacy = true;
        activity.forEach(_activity => {
          // 根據運動類別篩選數據
          const { startTime, activities } = _activity;
          activities.forEach(_activities => {
            const { type: sportType } = _activities,
                  { sportType: currentSportType } = this.reportConditionOpt;
            if (currentSportType === SportCode.all || currentSportType == sportType) {
              haveData = true;
              mixData.push({
                activities: [_activities],
                startTime
              });
  
              // 計算該運動類別活動人數用
              if (currentSportType !== SportCode.all) activityPeopleSet.add(_data.userId);
              this.countPersonAnalysis(userId, _activities);
            };

          });

        });

        if (activity.length !== 0) this.createRangeTrend(userId, activity);
      }
      
    });

    if (!haveData) {
      this.uiFlag.noData = true;
      this.changeProgress(100);
    } else {
      this.translate.get('hellow world').pipe(
        takeUntil(this.ngUnsubscribe)
      ).subscribe(() => {
        this.uiFlag.noData = false;
        const { sportType, date: {startTimestamp, endTimestamp} } = this.reportConditionOpt,
              rangeUnit = this.translate.instant('universal_time_day'),
              activePeopleNum = sportType === SportCode.all ? data.length : activityPeopleSet.size;
        this.reportTime = {
          create: moment().format('YYYY-MM-DD HH:mm'),
          endDate: moment(endTimestamp).format('YYYY-MM-DD'),
          range: `${moment(endTimestamp).diff(moment(startTimestamp), 'day') + 1}${rangeUnit}`,
          diffWeek: (moment(endTimestamp).diff(moment(startTimestamp), 'day') + 1) / 7,
          type: this.reportTime.type
        };

        this.info = {activePeopleNum, ...this.info};
        this.handleFinalPersonAvgData();
        this.handleMixData(mixData);
        this.handleGroupAnalysis(this.personAnalysis);
        this.createAnalysisTable(this.reportConditionOpt.sportType);
        this.changeProgress(100);
        this.updateUrl();
      });
      
    }

  }

  /**
   * 將個人分析加總過後的平均數據再除有效筆數
   * @author kidin-1100607
   */
  handleFinalPersonAvgData() {
    for (let uid in this.personAnalysis) {

      if (this.personAnalysis.hasOwnProperty(uid) && this.avgDataRecord.person[uid] !== undefined) {
        const currentUser = this.personAnalysis[uid];
        for (let key in currentUser) {

          if (currentUser.hasOwnProperty(key) && key.toLowerCase().includes('avg')) {
            this.personAnalysis[uid][key] = (this.personAnalysis[uid][key] / this.avgDataRecord.person[uid][key]) || 0;
          }

        }

      }

    }

  }

  /**
   * 將所有成員數據進行排序與統計以生成概要數據與圖表
   * @param mix {Array<any>}-所有成員數據
   * @author kidin-1100415
   */
  handleMixData(mixData: Array<any>) {
    const { sportType } = this.reportConditionOpt;
    mixData.sort((a, b) => moment(a.startTime).valueOf() - moment(b.startTime).valueOf());
    const dateArr = this.createChartXaxis(this.reportConditionOpt.date, this.reportTime.type),
          noRepeatDateData = this.mergeSameDateData(mixData),
          needKey = this.getNeedKey(this.reportConditionOpt.sportType);
    let infoData = {},
        dataIdx = 0;
    for (let i = 0, len = dateArr.length; i < len; i++) {
      // 若無該日數據，則以補0方式呈現圖表數據。
      const xAxisTimestamp = dateArr[i],
            { startTimestamp, activities } = noRepeatDateData[dataIdx] || { startTimestamp: undefined, activities: undefined };
      if (xAxisTimestamp === startTimestamp) {
        let sameDateData = {};
        const activitiesLen = activities.length;
        for (let j = 0; j < activitiesLen; j++) {
          const _activity = activities[j];
          if (sportType === SportCode.all) this.createAnalysisChartData(_activity);

          for (let k = 0, keyLen = needKey.length; k < keyLen; k++) {
            const key = needKey[k];
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

              // 將數據加總以呈現概要資訊
              if (infoData[key] !== undefined) {
                infoData[key] += value;
              } else {
                infoData = {[key]: value, ...infoData};
              }

              // 將各數據加總，之後均化產生趨勢圖表
              if (sameDateData[key] !== undefined) {
                sameDateData[key] += value;
              } else {
                sameDateData = {[key]: value, ...sameDateData};
              }

            }

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

        this.createChartData(zeroData, 1, xAxisTimestamp);
      }

    }

    this.getTrendAvgValue();
    this.info = { ...infoData, ...this.info };
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
   * 事先建立團體分析物件，以便後續計算數據與處理成員清單
   * @param groupList {any}-api 1103回覆的群組列表
   * @author kidin-1100511
   */
  createGroupAnalysisObj(groupList: any) {
    this.groupList.analysisObj = {};
    const { brands, branches, coaches } = groupList,
          { id, level, name, parents } = this.groupInfo;
    switch (level) {
      case GroupLevel.class:
        this.groupList.analysisObj = {
          [id]: {
            level: 60,
            name,
            parentsName: parents.split('\\')[1],
            memberList: [],
            memberSet: new Set<number>()
          },
          ...this.groupList.analysisObj
        };
        break;
      case GroupLevel.branch:
        coaches.forEach(_coach => {
          const { groupId: _coachId, groupName: _coachName } = _coach,
                _parentId = `${this.groupService.getPartGroupId(_coachId, 4)}-0-0`;
          if (_parentId === id) {
            this.groupList.analysisObj = {
              [_coachId]: {
                level: 60,
                name: _coachName,
                parentsName: name,
                memberList: [],
                memberSet: new Set<number>()
              },
              ...this.groupList.analysisObj
            };

          }
    
        });

        this.groupList.analysisObj = {
          [id]: {
            level: 40,
            name: name,
            parentsName: parents,
            memberList: [],
            memberSet: new Set<number>()
          },
          ...this.groupList.analysisObj
        };
        break;
      case GroupLevel.brand:
        coaches.forEach(_coach => {
          const { groupId: _coachId, groupName } = _coach;
          let parentsName: string;
          for (let i = 0, len = branches.length; i < len; i++) {
            const { groupId: _branchId, groupName: _branchName } = branches[i],
                  partCoachId = this.groupService.getPartGroupId(_branchId, 4),
                  partBranchId = this.groupService.getPartGroupId(_coachId, 4);

            if (partBranchId === partCoachId) {
              parentsName = _branchName;
              break;
            }

          }
    
          this.groupList.analysisObj = {
            [_coachId]: {
              level: 60,
              name: groupName,
              parentsName,
              memberList: [],
              memberSet: new Set<number>()
            },
            ...this.groupList.analysisObj
          };
    
        });

        const { groupId: brandId, groupName: brandName } = brands[0];
        branches.forEach(_branch => {
          const { groupId: _branchId, groupName } = _branch;
          this.groupList.analysisObj = {
            [_branchId]: {
              level: 40,
              name: groupName,
              parentsName: brandName,
              memberList: [],
              memberSet: new Set<number>()
            },
            ...this.groupList.analysisObj
          };
  
        });

        this.groupList.analysisObj = {
          [brandId]: {
            level: 30,
            name: brandName,
            parentsName: '',
            memberList: [],
            memberSet: new Set<number>()
          },
          ...this.groupList.analysisObj
        };
        break;
    }

  }

  /**
   * 建立個人分析物件以方便後續數據計算，並回傳不重複之成員id
   * @param memList {Array<any>}-api 1103回傳的資料
   * @param level {number}-群組階層
   * @author kidin-1100525
   */
  handlePersonAnalysisObj(memList: Array<any>) {
    const { id, level } = this.groupInfo,
          memIdSet = new Set();
    memList.forEach(_list => {
      const { groupId: _memGroupId, memberId, memberName } = _list;
      // 取得不重複的所有成員id，用來call api 2104
      memIdSet.add(memberId);

      // 依據成員所屬群組進行歸納，已便顯示分析選單
      this.groupList.analysisObj[_memGroupId].memberSet.add(memberId);
      const { name: _grouphName } = this.groupList.analysisObj[_memGroupId];
      switch (level) {
        case GroupLevel.class:
          if (_memGroupId === id) {
            this.createPersonAnalysisObj(memberId, memberName, _grouphName, _memGroupId);
          }
          break;
        case GroupLevel.branch:
          const parentsGroupId = `${this.groupService.getPartGroupId(_memGroupId, 4)}-0-0`;
          this.groupList.analysisObj[parentsGroupId].memberSet.add(memberId);
          if (parentsGroupId === id) {
            this.createPersonAnalysisObj(memberId, memberName, _grouphName, _memGroupId);
          }
          break;
        case GroupLevel.brand:
          const branchGroupId = `${this.groupService.getPartGroupId(_memGroupId, 4)}-0-0`,
                brandGroupId = `${this.groupService.getPartGroupId(_memGroupId, 3)}-0-0-0`;
          this.groupList.analysisObj[branchGroupId].memberSet.add(memberId);
          this.groupList.analysisObj[brandGroupId].memberSet.add(memberId);
          this.createPersonAnalysisObj(memberId, memberName, _grouphName, _memGroupId);
          break;
      }

    });

    return memIdSet;
  }

  /**
   * 生成個人分析物件，方便後續計算個人分析數據
   * @param userId {number}
   * @param userName {string}
   * @param groupName {string}
   * @param groupId {string}
   * @author kidin-1100524
   */
  createPersonAnalysisObj(userId: number, userName: string, groupName: string, groupId: string) {
    if (this.memberList.analysisObj[userId]) {
      this.memberList.analysisObj[userId].belongGroup.push({
        name: groupName,
        groupId: groupId
      })
    } else {
      this.memberList.analysisObj = {
        [userId]: {
          openPrivacy: false,
          name: userName,
          belongGroup: [{
            name: groupName,
            groupId: groupId
          }]
        },
        ...this.memberList.analysisObj
      };

    }

  }

  /**
   * 統計個人用分析數據
   * @param userId {number}-使用者id
   * @param data {any}-一個單位日期/類別的數據
   * @param startTime {string}-該筆運動檔案時間
   * @author kidin-1100512
   */
  countPersonAnalysis(userId: number, data: any) {
    const reportSportType = this.reportConditionOpt.sportType,
          needKey = this.getNeedKey(reportSportType);
    for (let i = 0, len = needKey.length; i < len; i++) {
      const key = needKey[i],
            value = +data[key],
            isAvgData = key.toLowerCase().includes('avg');
      let currentUser = this.personAnalysis[userId];
      if (value !== undefined) {

        if (currentUser[key] !== undefined) {
          currentUser[key] += isAvgData ? value * data.totalActivities : value;          
        } else {
          
          if (isAvgData) {
            this.personAnalysis[userId] = {
              [key]: value * data.totalActivities,
              ...this.personAnalysis[userId]
            };

          } else {
            this.personAnalysis[userId] = {
              [key]: value,
              ...this.personAnalysis[userId]
            };

          }

        }

        // 若平均數據為0或undefined，則另外計算該數據筆數
        if (isAvgData && value !== 0) {
          let currAnalysisType = this.avgDataRecord.person;
          if (currAnalysisType.hasOwnProperty(userId)) {

            if (currAnalysisType[userId].hasOwnProperty(key)) {
              currAnalysisType[userId][key] += data.totalActivities;
            } else {
              this.avgDataRecord.person[userId] = {
                [key]: data.totalActivities,
                ...this.avgDataRecord.person[userId]
              }

            }

          } else {
            this.avgDataRecord.person = {
              [userId]: {
                [key]: data.totalActivities
              },
              ...this.avgDataRecord.person
            }

          }
          
        }

      }

    }

    // 依不同運動類別的特殊分析數據進行處理
    switch (reportSportType) {
      case SportCode.all:
        const {type: sportType, totalActivities} = data,
              { perTypeCount } = this.personAnalysis[userId],
              sportTypeArrIndex = +sportType - 1;
        if (perTypeCount) {
          perTypeCount[sportTypeArrIndex].count += totalActivities;
        } else {
          // Object.keys(enum) => ["keys", "value"]，故長度除2
          const sportTypeLen = (Object.keys(SportCode)
            .filter(_key => typeof _key === 'string').length / 2) - 2;  // 扣掉rest和all兩個類別
          let typeCountArr = [];
          for (let i = 0; i < sportTypeLen; i++) {
            typeCountArr.push({
              type: i + 1,
              count: 0
            })
          }

          typeCountArr[sportTypeArrIndex].count += totalActivities;
          this.personAnalysis[userId] = {
            perTypeCount: typeCountArr,
            ...this.personAnalysis[userId]
          }
        }
        break;
      case SportCode.weightTrain:
        const { weightTrainingInfo, totalActivities: weightTrainActivities } = data;
        weightTrainingInfo.forEach(_info => {
          const { muscle, totalReps, totalSets, totalWeightKg } = _info;
          if (!this.personAnalysis[userId].totalSets) {
            const muscleGroupArr = [
              { muscleGroup: 0, count: 0 },
              { muscleGroup: 1, count: 0 },
              { muscleGroup: 2, count: 0 },
              { muscleGroup: 3, count: 0 },
              { muscleGroup: 4, count: 0 },
              { muscleGroup: 5, count: 0 }
            ];
            this.personAnalysis[userId] = {
              totalSets: 0,
              muscleGroupCount: muscleGroupArr,
              armMuscle: [0, 0, 0],  // [totalWeight, reps, sets]
              pectoralsMuscle: [0, 0, 0],
              shoulderMuscle: [0, 0, 0],
              backMuscle: [0, 0, 0],
              abdominalMuscle: [0, 0, 0],
              legMuscle: [0, 0, 0],
              ...this.personAnalysis[userId]
            }

          }

          this.personAnalysis[userId].totalSets += totalSets;
          const {
                  muscleGroupCount,
                  armMuscle,
                  pectoralsMuscle,
                  shoulderMuscle,
                  backMuscle,
                  abdominalMuscle,
                  legMuscle,
                } = this.personAnalysis[userId],
                belongMuscleGroup = this.reportService.getBelongMuscleGroup(+muscle);
          
          muscleGroupCount[belongMuscleGroup].count += weightTrainActivities;
          switch (belongMuscleGroup) {
            case MuscleGroup.armMuscle:
              armMuscle[0] += totalWeightKg;
              armMuscle[1] += totalReps;
              armMuscle[2] += totalSets;
              break;
            case MuscleGroup.pectoralsMuscle:
              pectoralsMuscle[0] += totalWeightKg;
              pectoralsMuscle[1] += totalReps;
              pectoralsMuscle[2] += totalSets;
              break;
            case MuscleGroup.shoulderMuscle:
              shoulderMuscle[0] += totalWeightKg;
              shoulderMuscle[1] += totalReps;
              shoulderMuscle[2] += totalSets;
              break;
            case MuscleGroup.backMuscle:
              backMuscle[0] += totalWeightKg;
              backMuscle[1] += totalReps;
              backMuscle[2] += totalSets;
              break;
            case MuscleGroup.abdominalMuscle:
              abdominalMuscle[0] += totalWeightKg;
              abdominalMuscle[1] += totalReps;
              abdominalMuscle[2] += totalSets;
              break;
            case MuscleGroup.legMuscle:
              legMuscle[0] += totalWeightKg;
              legMuscle[1] += totalReps;
              legMuscle[2] += totalSets;
              break;
          }

        });

        break;
    }

  }

  /**
   * 統計團體用分析數據
   * @param personData {any}-個人分析數據
   * @param avgDataRecord {any}-個人平均數據分別所佔筆數
   * @author kidin-1100512
   */
  handleGroupAnalysis(personData: any) {
    this.groupAnalysis = this.utils.deepCopy(this.groupList.analysisObj);
    for (let gid in (this.groupAnalysis as any)) {
      if (this.groupAnalysis.hasOwnProperty(gid)) {
        const { memberSet, memberList } = this.groupAnalysis[gid],
              idList = Array.from(memberSet);
        idList.forEach(_idList => {
          const _id  = _idList as number;
          if (personData.hasOwnProperty(_id)) {
            const { name, openPrivacy, totalActivities } = personData[_id];
            memberList.push({
              name,
              userId: _id,
              openPrivacy
            });

            if (openPrivacy && totalActivities && totalActivities > 0) {

              if (this.groupAnalysis[gid].activityPeople !== undefined) {
                this.groupAnalysis[gid].activityPeople += 1;
              } else {
                this.groupAnalysis[gid] = {
                  activityPeople: 1,
                  ...this.groupAnalysis[gid]
                };

              }

              for (let key in personData[_id]) {
                const excludeKey = [
                  'belongGroup',
                  'name',
                  'openPrivacy',
                  'perTypeCount',
                  'totalWeightKg',
                  'totalReps',
                  'totalSets',
                  'muscleGroupCount',
                  'armMuscle',
                  'pectoralsMuscle',
                  'shoulderMuscle',
                  'backMuscle',
                  'abdominalMuscle',
                  'legMuscle'
                ];
                if (!excludeKey.includes(key)) {
                  // 數據加總
                  if (this.groupAnalysis[gid].hasOwnProperty(key)) {
                    this.groupAnalysis[gid][key] += personData[_id][key];
                  } else {
                    this.groupAnalysis[gid] = {
                      [key]: personData[_id][key],
                      ...this.groupAnalysis[gid]
                    };

                  }

                  // 紀錄平均數據有效人數
                  if (key.toLowerCase().includes('avg') && personData[_id][key] !== 0) {
                    const { group } = this.avgDataRecord;
                    if (group.hasOwnProperty(gid)) {
                      let currentGroup = group[gid];
                      if (currentGroup.hasOwnProperty(key)) {
                        currentGroup[key] += 1;
                      } else {
                        this.avgDataRecord.group[gid] = {
                          [key]: 1,
                          ...this.avgDataRecord.group[gid]
                        };

                      }

                    } else {
                      this.avgDataRecord.group = {
                        [gid]: {
                          [key]: 1
                        },
                        ...this.avgDataRecord.group
                      };

                    }
                    
                  }

                }

              }

            }

          }

        });

        this.createGroupRegression(gid);
      }
      
    }

  }

  /**
   * 建立群組區間趨勢
   * @param groupId {string}-群組id
   * @author kidin-1100527
   */
  createGroupRegression(groupId: string) {
    const regressionData = this.groupList.regression[groupId];
    for (let _dataType in regressionData) {
      if (regressionData.hasOwnProperty(_dataType)) {
        const { data, date } = regressionData[_dataType],
              slope = new SimpleLinearRegression(date, data).slope || 0;
        let trend: Regression = null;
        if (slope > 0) {
          trend = 'up';
        } else if (slope < 0) {
          trend = 'down';
        }

        Object.assign(this.groupAnalysis[groupId], {
          [`${_dataType}Trend`]: trend
        });

      }

    }

  }

  /**
   * 根據運動類別及視窗寬度建立群組及個人可設定的數據
   * @param sportType {SportType}-運動類別
   * @author kidin-1100517
   */
  createAnalysisTable(sportType: SportType) {
    let groupDef = [],
        personDef = [];
    groupDef = [
      'name',
      'memberNum',
      'stroke',
      'totalTime'
    ];

    personDef = [
      'name',
      'stroke',
      'totalTime'
    ];
    switch (sportType) {
      case SportCode.all:
        this.groupTable.showDataDef = groupDef.concat([
          'benefitTime',
          'pai',
          'calories',
          'hrZone'
        ]);

        this.personTable.showDataDef = personDef.concat([
          'benefitTime',
          'pai',
          'calories',
          'preferSport',
          'hrZone'
        ]);
        break;
      case SportCode.run:
        this.groupTable.showDataDef = groupDef.concat([
          'totalDistance',
          'avgPace',
          'avgCadence',
          'calories',
          'hrZone'
        ]);

        this.personTable.showDataDef = personDef.concat([
          'totalDistance',
          'avgPace',
          'avgCadence',
          'calories',
          'hrZone'
        ]);
        break;
      case SportCode.cycle:
        this.groupTable.showDataDef = groupDef.concat([
          'totalDistance',
          'avgSpeed',
          'avgCadence',
          'avgPower',
          'calories',
          'hrZone'
        ]);

        this.personTable.showDataDef = personDef.concat([
          'totalDistance',
          'avgSpeed',
          'avgCadence',
          'avgPower',
          'calories',
          'hrZone'
        ]);
        break;
      case SportCode.weightTrain:
        this.groupTable.showDataDef = groupDef.concat([
          'totalActivityTime'
        ]);
        
        this.personTable.showDataDef = personDef.concat([
          'totalActivityTime',
          'totalWeight',
          'totalSets',
          'preferMuscleGroup',
          'armMuscle',
          'pectoralsMuscle',
          'shoulderMuscle',
          'backMuscle',
          'abdominalMuscle',
          'legMuscle'
        ]);
        break;
      case SportCode.swim:
        this.groupTable.showDataDef = groupDef.concat([
          'totalDistance',
          'avgPace',
          'avgCadence',
          'calories',
          'hrZone'
        ]);

        this.personTable.showDataDef = personDef.concat([
          'totalDistance',
          'avgPace',
          'avgCadence',
          'calories',
          'hrZone'
        ]);
        break;
      case SportCode.aerobic:
        this.groupTable.showDataDef = groupDef.concat([
          'avgHr',
          'calories',
          'hrZone'
        ]);

        this.personTable.showDataDef = personDef.concat([
          'avgHr',
          'calories',
          'hrZone'
        ]);
        break;
      case SportCode.row:
        this.groupTable.showDataDef = groupDef.concat([
          'totalDistance',
          'avgPace',
          'avgCadence',
          'avgPower',
          'calories',
          'hrZone'
        ]);

        this.personTable.showDataDef = personDef.concat([
          'totalDistance',
          'avgPace',
          'avgCadence',
          'avgPower',
          'calories',
          'hrZone'
        ]);
        break;
      case SportCode.ball:
        this.groupTable.showDataDef = groupDef.concat([
          'totalDistance',
          'calories',
          'hrZone'
        ]);

        this.personTable.showDataDef = personDef.concat([
          'totalDistance',
          'calories',
          'hrZone'
        ]);
        break;
    }

    this.setDisplayCol();
    this.groupTable.list.sort = this.groupSortTable;
    this.personTable.list.sort = this.personSortTable;
    this.groupTable.list.data = Object.keys(this.groupAnalysis).sort();
    this.personTable.list.data = Object.keys(this.personAnalysis);
  }

  /**
   * 建立區間趨勢
   * @param userId {number}
   * @param userData {any}
   * @author kidin-1100518
   */
  createRangeTrend(userId: number, userData: any) {
    const { sportType: selectSportType } = this.reportConditionOpt;
    let regressionObj = {
      timestampArr: []
    };
    userData.forEach(_data => {
      const { startTime, activities } = _data,
            startTimestamp = moment(startTime).valueOf();
      activities.forEach(_activity => {
        const {
          type: sportType,
          totalActivities,
          totalSecond,
          totalActivitySecond,
          calories,
          totalHrZone0Second,
          totalHrZone1Second,
          totalHrZone2Second,
          totalHrZone3Second,
          totalHrZone4Second,
          totalHrZone5Second,
          totalDistanceMeters,
          avgSpeed,
          runAvgCadence,
          cycleAvgCadence,
          cycleAvgWatt,
          swimAvgCadence,
          avgHeartRateBpm,
          rowingAvgCadence,
          rowingAvgWatt,
          totalMinusGforceX,
          totalMinusGforceY,
          totalMinusGforceZ,
          totalPlusGforceX,
          totalPlusGforceY,
          totalPlusGforceZ,
          totalWeightKg,
          weightTrainingInfo
        } = _activity;
        if (sportType == selectSportType || selectSportType === SportCode.all) {
          regressionObj.timestampArr.push(startTimestamp);
          regressionObj = this.handleRegression(regressionObj, 'totalActivities', totalActivities, userId, startTimestamp);
          regressionObj = this.handleRegression(regressionObj, 'totalSecond', totalSecond, userId, startTimestamp);
          regressionObj = this.handleRegression(regressionObj, 'calories', calories, userId, startTimestamp);
          switch (selectSportType) {
            case SportCode.all:
              const benefitSecond = 
                totalHrZone2Second + totalHrZone3Second + totalHrZone4Second + totalHrZone5Second;
                regressionObj = this.handleRegression(regressionObj, 'benefitTime', benefitSecond, userId, startTimestamp);
              
              const hrZone = [
                      totalHrZone0Second,
                      totalHrZone1Second,
                      totalHrZone2Second,
                      totalHrZone3Second,
                      totalHrZone4Second,
                      totalHrZone5Second
                    ],
                    pai = this.reportService.countPai(hrZone, 1 / 7);  // 一天的pai值
              regressionObj = this.handleRegression(regressionObj, 'pai', pai, userId, startTimestamp);
              break;
            case SportCode.run:
              regressionObj = this.handleRegression(regressionObj, 'totalDistance', totalDistanceMeters, userId, startTimestamp);
              regressionObj = this.handleRegression(regressionObj, 'avgPace', avgSpeed, userId, startTimestamp);
              regressionObj = this.handleRegression(regressionObj, 'avgCadence', runAvgCadence, userId, startTimestamp);
              break;
            case SportCode.cycle:
              regressionObj = this.handleRegression(regressionObj, 'totalDistance', totalDistanceMeters, userId, startTimestamp);
              regressionObj = this.handleRegression(regressionObj, 'avgSpeed', avgSpeed, userId, startTimestamp);
              regressionObj = this.handleRegression(regressionObj, 'avgCadence', cycleAvgCadence, userId, startTimestamp);
              regressionObj = this.handleRegression(regressionObj, 'avgPower', cycleAvgWatt, userId, startTimestamp);
              break;
            case SportCode.weightTrain:
              regressionObj = this.handleRegression(regressionObj, 'totalWeight', totalWeightKg, userId, startTimestamp);
              let ttlSets = 0,
                  muscleGroupTtlKg = [0, 0, 0, 0, 0, 0];
              weightTrainingInfo.forEach(_part => {
                const { muscle, totalSets, totalWeightKg: ttlWeightKg } = _part,
                      belongMuscleGroup = this.reportService.getBelongMuscleGroup(+muscle);
                ttlSets += totalSets;
                muscleGroupTtlKg[belongMuscleGroup] += ttlWeightKg;
              });
              
              regressionObj = this.handleRegression(regressionObj, 'totalActivitySecond', totalActivitySecond, userId, startTimestamp);
              regressionObj = this.handleRegression(regressionObj, 'totalSets', ttlSets, userId, startTimestamp);
              regressionObj = this.handleRegression(regressionObj, 'armMuscle', muscleGroupTtlKg[0], userId, startTimestamp);
              regressionObj = this.handleRegression(regressionObj, 'pectoralsMuscle', muscleGroupTtlKg[1], userId, startTimestamp);
              regressionObj = this.handleRegression(regressionObj, 'shoulderMuscle', muscleGroupTtlKg[2], userId, startTimestamp);
              regressionObj = this.handleRegression(regressionObj, 'backMuscle', muscleGroupTtlKg[3], userId, startTimestamp);
              regressionObj = this.handleRegression(regressionObj, 'abdominalMuscle', muscleGroupTtlKg[4], userId, startTimestamp);
              regressionObj = this.handleRegression(regressionObj, 'legMuscle', muscleGroupTtlKg[5], userId, startTimestamp);
              break;
            case SportCode.swim:
              regressionObj = this.handleRegression(regressionObj, 'totalDistance', totalDistanceMeters, userId, startTimestamp);
              regressionObj = this.handleRegression(regressionObj, 'avgPace', avgSpeed, userId, startTimestamp);
              regressionObj = this.handleRegression(regressionObj, 'avgCadence', swimAvgCadence, userId, startTimestamp);
              break;
            case SportCode.aerobic:
              regressionObj = this.handleRegression(regressionObj, 'avgHr', avgHeartRateBpm, userId, startTimestamp);
              break;
            case SportCode.row:
              regressionObj = this.handleRegression(regressionObj, 'totalDistance', totalDistanceMeters, userId, startTimestamp);
              regressionObj = this.handleRegression(regressionObj, 'avgPace', avgSpeed, userId, startTimestamp);
              regressionObj = this.handleRegression(regressionObj, 'avgCadence', rowingAvgCadence, userId, startTimestamp);
              regressionObj = this.handleRegression(regressionObj, 'avgPower', rowingAvgWatt, userId, startTimestamp);
              break;
            case SportCode.ball:
              regressionObj = this.handleRegression(regressionObj, 'totalDistance', totalDistanceMeters, userId, startTimestamp);
              const planeGElement = [
                      totalMinusGforceX,
                      totalMinusGforceY,
                      totalPlusGforceX,
                      totalPlusGforceY
                    ],
                    planeGForce = this.reportService.pythagorean(planeGElement);
              regressionObj = this.handleRegression(regressionObj, 'totalPlaneGForce', planeGForce, userId, startTimestamp);
              regressionObj = this.handleRegression(regressionObj, 'totalPlusZGForce', totalPlusGforceZ, userId, startTimestamp);
              regressionObj = this.handleRegression(regressionObj, 'totalMinZGForce', totalMinusGforceZ, userId, startTimestamp);
              break;
          }

        }

      });

    });

    for (let _key in regressionObj) {
      if (regressionObj.hasOwnProperty(_key) && _key !== 'timestampArr') {
        const slope = new SimpleLinearRegression(regressionObj['timestampArr'], regressionObj[_key]).slope || 0;
        let trend: Regression = null;
        if (slope > 0) {
          trend = 'up';
        } else if (slope < 0) {
          trend = 'down';
        }

        this.personAnalysis[userId] = {
          [`${_key}Trend`]: trend,
          ...this.personAnalysis[userId]
        };

      }

    }

  }

  /**
   * 判斷物件是否有該區間趨勢的類別，並將數據儲存
   * @param obj {any}-儲存區間趨勢數據用物件
   * @param key {string}-欲建立區間趨勢的類別
   * @param value {number | string}-欲建立區間趨勢的類別數據
   * @param userId {number}-成員id
   * @param timestamp {number}-該數據起始時間
   * @author kidin-1100526
   */
  handleRegression(obj: any, key: string, value: number | string, userId: number, timestamp: number) {
    const numValue = +value;
    if (obj.hasOwnProperty(key)) {
      obj[key].push(numValue);
    } else {
      obj = {
        [key]: [numValue],
        ...obj
      };
    }

    if (this.reportConditionOpt.sportType !== SportCode.weightTrain) {
      this.mergeGroupData(key, numValue, userId, timestamp);
    }
    
    return obj;
  }

  /**
   * 將數據合併至所屬群組
   * @param key {string}-欲建立區間趨勢的類別
   * @param value {number}-欲建立區間趨勢的類別數據
   * @param userId {number}-成員所id
   * @param timestamp {number}-該數據起始時間
   * @author kidin-1100526
   */
  mergeGroupData(key: string, value: number, userId: number, timestamp: number) {
    const { analysisObj } = this.groupList;
    for (let _groupId in analysisObj) {

      if (analysisObj[_groupId].memberSet.has(userId)) {
        let _group = this.groupList.regression[_groupId];
        if (_group) {
          const _regressionEle = _group[key];
          if (_regressionEle) {
            _regressionEle.data.push(value);
            _regressionEle.date.push(timestamp);
          } else {
            this.groupList.regression[_groupId] = {
              [key]: {
                data: [value],
                date: [timestamp]
              },
              ...this.groupList.regression[_groupId]
            }
  
          }
  
        } else {
          this.groupList.regression = {
            [_groupId]: {
              [key]: {
                data: [value],
                date: [timestamp]
              } 
            },
            ...this.groupList.regression
          }
  
        }

      }

    }

  }

  /**
   * 根據視窗寬度預設可顯示的欄位(含名稱)
   * @author kidin-1100517
   */
  setDisplayCol() {
    const { max } = this.tableColumn,
          { sportType } = this.reportConditionOpt,
          opt = JSON.parse(this.utils.getLocalStorageObject(`groupReport-${sportType}`));
    if (opt) {
      let { group, person } = opt;
      // 避免之後修改移除某個欄位但是localStroage卻存有舊設定造成設定錯誤
      group = group.filter(_group => this.groupTable.showDataDef.includes(_group));

      // 避免之後修改移除某個欄位但是localStroage卻存有舊設定造成設定錯誤
      person = person.filter(_person => this.personTable.showDataDef.includes(_person));

      if (group.length > max) {
        group.length = max;
        this.saveAnalysisOpt(sportType, opt);
      }

      if (person.length > max) {
        person.length = max;
        this.saveAnalysisOpt(sportType, opt);
      }

      this.groupTableOpt = group;
      this.personTableOpt = person;
    } else {
      const { sportType } = this.reportConditionOpt;
      this.setDefaultGroupCol(max, sportType);
      this.setDefaultPersonCol(max, sportType);
      const newOpt = {
        group: this.groupTableOpt,
        person: this.personTableOpt
      };

      this.saveAnalysisOpt(sportType, newOpt);
    }

  }

  /**
   * 儲存分析設定
   * @param sportType {SportType}-運動類別
   * @param opt {{group: Array<string>; person: Array<string>}}
   * @author kidin-1100525
   */
  saveAnalysisOpt(sportType: SportType, opt: {group: Array<string>; person: Array<string>}) {
    const optStr = JSON.stringify(opt);
    this.utils.setLocalStorageObject(`groupReport-${sportType}`, optStr);
  }

  /**
   * 根據可顯示的欄位數目及運動類別，設定群組分析顯示欄位
   * @param len {number}-可顯示的欄位數目
   * @param sportType {SportType}-運動類別
   * @author kidin-1100518
   */
  setDefaultGroupCol(len: number, sportType: SportType) {
    switch (sportType) {
      case SportCode.all:
      case SportCode.aerobic:
        this.groupTableOpt = [
          'name',
          'memberNum',
          'stroke',
          'totalTime',
          'calories',
          'hrZone'
        ];
        break;
      case SportCode.run:
      case SportCode.swim:
      case SportCode.row:
        this.groupTableOpt = [
          'name',
          'memberNum',
          'totalTime',
          'totalDistance',
          'avgPace',
          'hrZone'
        ];
        break;
      case SportCode.cycle:
        this.groupTableOpt = [
          'name',
          'memberNum',
          'totalTime',
          'totalDistance',
          'avgSpeed',
          'hrZone'
        ];
        break;
      case SportCode.weightTrain:
        this.groupTableOpt = [
          'name',
          'memberNum',
          'totalActivityTime',
          'stroke',
          'totalTime'
        ];
        break;
      case SportCode.ball:
        this.groupTableOpt = [
          'name',
          'memberNum',
          'totalTime',
          'totalDistance',
          'calories',
          'hrZone'
        ];
        break;
    }

    if (this.groupTableOpt.length > len) this.groupTableOpt.length = len;
  }

  /**
   * 根據可顯示的欄位數目及運動類別，設定個人分析顯示欄位
   * @param len {number}-可顯示的欄位數目
   * @param sportType {SportType}-運動類別
   * @author kidin-1100518
   */
  setDefaultPersonCol(len: number, sportType: SportType) {
    switch (sportType) {
      case SportCode.all:
        this.personTableOpt = [
          'name',
          'totalTime',
          'benefitTime',
          'calories',
          'preferSport',
          'hrZone'
        ];
        break;
      case SportCode.run:
      case SportCode.swim:
      case SportCode.row:
        this.personTableOpt = [
          'name',
          'totalTime',
          'totalDistance',
          'calories',
          'avgPace',
          'hrZone'
        ];
        break;
      case SportCode.cycle:
        this.personTableOpt = [
          'name',
          'totalTime',
          'totalDistance',
          'calories',
          'avgSpeed',
          'hrZone'
        ];
        break;
      case SportCode.weightTrain:
        this.personTableOpt = [
          'name',
          'totalActivityTime',
          'totalWeight',
          'totalSets',
          'preferMuscleGroup',
          'armMuscle'
        ];
        break;
      case SportCode.aerobic:
        this.personTableOpt = [
          'name',
          'totalTime',
          'calories',
          'avgHr',
          'hrZone'
        ];
        break;
      case SportCode.ball:
        this.personTableOpt = [
          'name',
          'stroke',
          'totalTime',
          'totalDistance',
          'calories',
          'hrZone'
        ];
        break;
    }

    if (this.personTableOpt.length > len) this.personTableOpt.length = len;
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
        this.createSpeedPaceChart(strokeData, denominator, startTimestamp, SportCode.run);
        this.createCadenceChart(strokeData, denominator, startTimestamp, SportCode.run);
        break;
      case SportCode.cycle:
        this.createHrZoneChart(strokeData, startTimestamp);
        this.createThresholdChart(strokeData, startTimestamp);
        this.createDistanceChart(strokeData, startTimestamp);
        this.createPowerChart(strokeData, denominator, startTimestamp, SportCode.cycle);
        this.createSpeedPaceChart(strokeData, denominator, startTimestamp, SportCode.cycle);
        this.createCadenceChart(strokeData, denominator, startTimestamp, SportCode.cycle);
        break;
      case SportCode.weightTrain:
        break;
      case SportCode.swim:
        this.createHrZoneChart(strokeData, startTimestamp);
        this.createDistanceChart(strokeData, startTimestamp);
        this.createSpeedPaceChart(strokeData, denominator, startTimestamp, SportCode.swim);
        this.createCadenceChart(strokeData, denominator, startTimestamp, SportCode.swim);
        this.createSwolfChart(strokeData, denominator, startTimestamp);
        break;
      case SportCode.aerobic:
        this.createHrZoneChart(strokeData, startTimestamp);
        break;
      case SportCode.row:
        this.createHrZoneChart(strokeData, startTimestamp);
        this.createDistanceChart(strokeData, startTimestamp);
        this.createPowerChart(strokeData, denominator, startTimestamp, SportCode.row);
        this.createSpeedPaceChart(strokeData, denominator, startTimestamp, SportCode.row);
        this.createCadenceChart(strokeData, denominator, startTimestamp, SportCode.row);
        break;
      case SportCode.ball:
        this.createHrZoneChart(strokeData, startTimestamp);
        this.createDistanceChart(strokeData, startTimestamp);
        this.createTotalGForceChart(strokeData, startTimestamp);
        this.createExtremeGForceChart(strokeData, denominator, startTimestamp);
        this.createSpeedPaceChart(strokeData, denominator, startTimestamp, SportCode.ball);
        this.createExtremePlaneChart(strokeData, denominator, startTimestamp);
        this.createTotalPlaneChart(strokeData, startTimestamp);
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
   * 建立總時間或總活動時間趨勢圖
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
   * @param denominator {number}-該天（週）運動總筆數
   * @param startTimestamp {number}-該天（週）起始時間
   * @param type {SportType}-運動類型
   * @author kidin-1100505
   */
  createPowerChart(data: any, denominator: number, startTimestamp: number, type: SportType) {
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

    const avgWatt = data[avgRef] / denominator,
          maxWatt = data[maxRef] / denominator,
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
   * @param denominator {number}-該天（週）運動總筆數
   * @param startTimestamp {number}-該天（週）起始時間
   * @param type {SportType}-運動類型
   * @author kidin-1100505
   */
  createSpeedPaceChart(data: any, denominator: number, startTimestamp: number, type: SportType) {
    const { avgSpeed, avgMaxSpeed } = data,
          { unit: userUnit } = this.userInfo;
    let avgVal,
        avgMaxVal;
    switch (type) {
      case SportCode.cycle:
      case SportCode.ball:
        if (userUnit === unit.metric) {  // km/h
          avgVal = (avgSpeed / denominator) || 0;
          avgMaxVal = (avgMaxSpeed / denominator) || 0;
        } else {  // mi/h
          avgVal = ((avgSpeed / mi) / denominator) || 0;
          avgMaxVal = ((avgMaxSpeed / mi) / denominator) || 0;
        }
        break;
      case SportCode.run:
      case SportCode.swim:
      case SportCode.row:
        avgVal = (avgSpeed / denominator) || 0;
        avgMaxVal = (avgMaxSpeed / denominator) || 0;
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
   * @param denominator {number}-該天（週）運動總筆數
   * @param startTimestamp {number}-該天（週）起始時間
   * @param type {SportType}-運動類型
   * @author kidin-1100505
   */
  createCadenceChart(data: any, denominator: number, startTimestamp: number, type: SportType) {
    let avgCadence: number,
        rangeMaxCadence: number;
    switch (type) {
      case SportCode.run:
        const { runAvgCadence, avgRunMaxCadence } = data;
        avgCadence = (runAvgCadence / denominator) || 0;
        rangeMaxCadence = (avgRunMaxCadence / denominator) || 0;
        break
      case SportCode.cycle:
        const { cycleAvgCadence, avgCycleMaxCadence } = data;
        avgCadence = (cycleAvgCadence / denominator) || 0;
        rangeMaxCadence = (avgCycleMaxCadence / denominator) || 0;
        break
      case SportCode.swim:
        const { swimAvgCadence, avgSwimMaxCadence } = data;
        avgCadence = (swimAvgCadence / denominator) || 0;
        rangeMaxCadence = (avgSwimMaxCadence / denominator) || 0;
        break
      case SportCode.row:
        const { rowingAvgCadence, avgRowingMaxCadence } = data;
        avgCadence = (rowingAvgCadence / denominator) || 0;
        rangeMaxCadence = (avgRowingMaxCadence / denominator) || 0;
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
   * @param denominator {number}-該天（週）運動總筆數
   * @param startTimestamp {number}-該天（週）起始時間
   * @author kidin-1100505
   */
  createSwolfChart(data: any, denominator: number, startTimestamp: number) {
    const { dataArr, maxSwolf, minSwolf } = this.chart.swolfTrend,
          avgSwolf = (data.avgSwolf / denominator) || 0,
          bestSwolf = (data.bestSwolf / denominator) || 0;
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
   * @param denominator {number}-該天（週）運動總筆數
   * @param startTimestamp {number}-該天（週）起始時間
   * @author kidin-1100506
   */
  createExtremeGForceChart(data: any, denominator: number, startTimestamp: number) {
    const {
      maxGforceX,
      maxGforceY,
      maxGforceZ,
      miniGforceX,
      miniGforceY,
      miniGforceZ,
    } = data;

    const maxGForceX = maxGforceX / denominator || 0,
          maxGForceY = maxGforceY / denominator || 0,
          maxGForceZ = maxGforceZ / denominator || 0,
          miniGForceX = miniGforceX / denominator || 0,
          miniGForceY = miniGforceY / denominator || 0,
          miniGForceZ = miniGforceZ / denominator || 0;

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
   * @param denominator {number}-該天（週）運動總筆數
   * @param startTimestamp {number}-該天（週）起始時間
   * @author kidin-1100517
   */
  createExtremePlaneChart(data: any, denominator: number, startTimestamp: number) {
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

    const capitaMaxPlaneG = (maxPlaneG / denominator) || 0,
          { maxPlaneMaxGForce, planeMaxGForce } = this.chart.extremePlaneGForce;
    planeMaxGForce.push([startTimestamp, capitaMaxPlaneG]);
    this.totalCount.planeMaxGForce += capitaMaxPlaneG;
    if (capitaMaxPlaneG > maxPlaneMaxGForce) {
      this.chart.extremePlaneGForce.maxPlaneMaxGForce = capitaMaxPlaneG;
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
    let [z0, z1, z2, z3, z4, z5] = this.chart.hrzone;
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
    let [z0, z1, z2, z3, z4, z5, z6] = this.chart.thresholdZone;
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
        return commonData.concat(ballData);
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
   * 點擊分析設定紐
   * @param e {MouseEvent}
   * @param obj {SettingObj}-分析列表類別
   * @author kidin-1100514
   */
  handleShowOpt(e: MouseEvent, obj: SettingObj) {
    e.stopPropagation();  // 避免和訂閱的事件衝突
    if (this[`${obj}Table`].showOpt) {
      this.closeAllMenu();
    } else {
      this.closeAllMenu();
      this[`${obj}Table`].showOpt = true;
      this.subscribeScrollAndClick();
    }

    this.changeDetectorRef.markForCheck();
  }

  /**
   * 關閉所有浮動選單
   * @author kidin-1100520
   */
  closeAllMenu() {
    this.groupTable.showOpt = false;
    this.personTable.showOpt = false;
    this.initAnalysisMenu();
    this.unsubscribeEvent();
    this.changeDetectorRef.markForCheck();
  }

  /**
   * 初始化分析列表之聚焦選單（關閉選單）
   * @author kidin-1100520
   */
  initAnalysisMenu() {
    this.analysisMenu = {
      type: null,
      focusId: null,
      x: null,
      y: null
    };

  }

  /**
   * 訂閱捲動和點擊事件
   * @author kidin-1100520
   */
  subscribeScrollAndClick() {
    const scrollEle = document.querySelectorAll('.main-body'),
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
   * 變更欄位設定
   * @param e {MatCheckboxChange}
   * @param type {SettingObj}-分析列表類別
   * @author kidin-1100520
   */
  changeTableOpt(e: MatCheckboxChange, type: SettingObj) {
    const { checked, source: { value } } = e;
    if (!checked) {
      this[`${type}TableOpt`] = this[`${type}TableOpt`].filter(_opt => _opt !== value);
    } else {
      this[`${type}TableOpt`].push(value);
    }

    const { sportType } = this.reportConditionOpt,
          opt = {
            group: this.groupTableOpt,
            person: this.personTableOpt
          };
    this.saveAnalysisOpt(sportType, opt);
    this.changeDetectorRef.markForCheck();
  }

  /**
   * 取消訂閱捲動和點擊事件
   * @author kidin-1100520
   */
  unsubscribeEvent() {
    this.scrollAndClickEvent.unsubscribe();
  }

  /**
   * 覆蓋目前網址與預覽列印網址
   * @param resetUrl {boolean}
   * @author kidin-1100414
   */
  updateUrl(resetUrl: boolean = true) {
    const { sportType, date: {startTimestamp, endTimestamp} } = this.reportConditionOpt,
          { id } = this.groupInfo,
          { origin } = location,
          hashGroupId = this.hashIdService.handleGroupIdEncode(id),
          startDate = moment(startTimestamp).format('YYYY-MM-DD'),
          endDate = moment(endTimestamp).format('YYYY-MM-DD');
    let seeMore = '';
    if (this.groupTable.showAll) seeMore += 'g';
    if (this.personTable.showAll) seeMore += 'p';
    this.previewUrl = `${origin
      }/dashboard/group-info/${hashGroupId
      }/sports-report?startdate=${startDate
      }&enddate=${endDate
      }&sporttype=${sportType
      }&seemore=${seeMore
      }&ipm=s
    `;

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
   * 將群組或個人分析數據進行排序
   * @param type {SettingObj}-群組或個人分析
   * @author kidin-1100317
   */
  arrangeData(type: SettingObj) {
    this[`${type}Table`].sorted = true;
    const sortCategory = this[`${type}SortTable`].active,
          sortDirection = this[`${type}SortTable`].direction;
    this[`${type}Table`].sortType = sortCategory;
    this.sortData(type, this[`${type}Table`].list.data, sortCategory, sortDirection === 'asc');
    this.changeDetectorRef.markForCheck();
  }
  
  /**
   * 依使用者點選的類別取得對應的數據
   * @param type {SettingObj}
   * @param id {string}-id
   * @param table {string}-欲排序的列表
   * @return Array<string>-排序依據
   * @return number
   * @author kidin-1100317
   */
  getSortData(type: SettingObj, id: string, col: string): number {
    const { sportType } = this.reportConditionOpt,
          dataSource = this[`${type}Analysis`][id],
          denominator = type === 'group' ? dataSource.activityPeople : 1,
          stroke = dataSource.totalActivities;
    if (stroke === undefined && col !== 'name') return undefined;
    switch (col) {
      case 'name':
        return dataSource.name;
      case 'memberNum':
        return dataSource.activityPeople;
      case 'stroke':
        return stroke / denominator;
      case 'totalTime':
        const ref = sportType === SportCode.weightTrain ? 'totalActivitySecond' : 'totalSecond';
        return +dataSource[ref] / denominator;
      case 'benefitTime':
        const { 
                totalHrZone2Second: z2,
                totalHrZone3Second: z3,
                totalHrZone4Second: z4,
                totalHrZone5Second: z5
              } = dataSource,
              benefitTime = z2 + z3 + z4 + z5;
        return (benefitTime / denominator) || 0;
      case 'totalCalories':
        return (
          dataSource.totalHrZone2Second
          + dataSource.totalHrZone3Second
          + dataSource.totalHrZone4Second
          + dataSource.totalHrZone5Second
        ) / denominator;
      case 'pai':
        const { 
                totalHrZone0Second: zone0,
                totalHrZone1Second: zone1,
                totalHrZone2Second: zone2,
                totalHrZone3Second: zone3,
                totalHrZone4Second: zone4,
                totalHrZone5Second: zone5
              } = dataSource,
              hrZone = [zone0, zone1, zone2, zone3, zone4, zone5],
              totalPai = this.reportService.countPai(hrZone, this.reportTime.diffWeek);
        return totalPai / denominator;
      case 'calories':
        return dataSource.calories / denominator;
      case 'totalDistance':
        return dataSource.totalDistanceMeters / denominator;
      case 'avgPace':
        return (3600 / ((dataSource.avgSpeed / denominator) / stroke)) || 3600;
      case 'avgSpeed':
        return (dataSource.avgSpeed / denominator) / stroke;
      case 'avgCadence':
        switch (sportType) {
          case SportCode.run:
            return (dataSource.runAvgCadence / denominator) / stroke;
          case SportCode.cycle:
            return (dataSource.cycleAvgCadence / denominator) / stroke;
          case SportCode.swim:
            return (dataSource.swimAvgCadence / denominator) / stroke;
          case SportCode.row:
            return (dataSource.rowingAvgCadence / denominator) / stroke;
        }
      case 'avgPower':
        switch (sportType) {
          case SportCode.cycle:
            return (dataSource.cycleAvgWatt / denominator) / stroke;
          case SportCode.row:
            return (dataSource.rowingAvgWatt / denominator) / stroke;
        }
      case 'avgHr':
        return (dataSource.avgHeartRateBpm / denominator) / stroke;
      case 'totalPlaneGForce':
        const xyGForce = [
                dataSource.totalPlusGforceX,
                dataSource.totalPlusGforceY,
                dataSource.totalMinusGforceX,
                dataSource.totalMinusGforceY
              ],
              ttlPlaneGForce = this.reportService.pythagorean(xyGForce);
        return ttlPlaneGForce / denominator;
      case 'totalPlusZGForce':
        return Math.abs(dataSource.totalPlusGforceZ / denominator);
      case 'totalMinZGForce':
        return Math.abs(dataSource.totalMinZGForce / denominator);
      case 'totalWeight':
        return dataSource.totalWeightKg / denominator;
      case 'totalSets':
        return dataSource.totalSets / denominator;
      case 'armMuscle':
      case 'pectoralsMuscle':
      case 'shoulderMuscle':
      case 'backMuscle':
      case 'abdominalMuscle':
      case 'legMuscle':
        const [
          totalKg,
          totalReps,
          totalSets
        ] = dataSource[col];
        if (totalSets !== 0) {
          return totalKg / denominator;  // 直接用總重排序
        } else {
          return undefined;
        }

    }

  }
  
  /**
   * 將數據進行排序
   * @param type {SettingObj}
   * @param data {Array<any>}
   * @param sortCategory {string}-排序依據
   * @param asc {boolean}-是否升冪
   * @author kidin-1100317
   */
  sortData(type: SettingObj, data: Array<any>, sortCategory: string, asc: boolean) {
    let sortDenominator = 0,
        swaped = true,
        [...sortData] = data;
    for (let i = 0, len = sortData.length; i < len && swaped; i++) {
      swaped = false;
      for (let j = 0; j < len - 1 - i; j++) {
        let _dataA = this.getSortData(type, sortData[j], sortCategory),
            _dataB = this.getSortData(type, sortData[j + 1], sortCategory);
        // 排序時一併找出最大值
        if (_dataA > sortDenominator) {
          sortDenominator = _dataA;
        } else if (_dataB > sortDenominator) {
          sortDenominator = _dataB;
        }

        const noDataCond = _dataA === undefined && _dataB !== undefined,
              ascCond = _dataB !== undefined && asc && _dataB < _dataA,
              descCond = _dataB !== undefined && !asc && _dataB > _dataA;
        // 無成績者皆必排最後
        if (noDataCond || ascCond || descCond) {
          swaped = true;
          [sortData[j], sortData[j + 1]] = [sortData[j + 1], sortData[j]];
        }

      }

    }

    this[`${type}Table`].list.data = sortData;
    if (sortCategory !== 'name') {
      sortData.map(_data => {
        const sortItemData = this.getSortData(type, _data, sortCategory);
        let numerator: number;
        if (sortItemData) {
          numerator = sortCategory === 'avgPace' ? +(3600 / sortItemData).toFixed(0) : +sortItemData.toFixed(0);
        } else {
          numerator = 0;
        }

        let ratio: string;
        if (sortDenominator !== 0) {
          ratio = `${((numerator / sortDenominator) * 100).toFixed(0)}%`;
        } else {
          ratio = '0%';
        }
        
        Object.assign(this[`${type}Analysis`][_data], { ratio });
      });

    }

  }

  /**
   * 顯示指定對象選單
   * @param e {MouseEvent}
   * @param type {SettingObj}-分析列表類別
   * @param id {string}-群組或使用者id
   * @author kidin-1100524
   */
  showAnalysisInfoMenu(e: MouseEvent, type: SettingObj, id: string) {
    e.stopPropagation();
    this.closeAllMenu();
    this.subscribeScrollAndClick();
    const menuPosition = {
      x: `${e.clientX}px`,
      y: `${e.clientY}px`
    };

    // 點選位置太靠右則將選單往左移。
    if (e.view.innerWidth - e.clientX < 270) {
      menuPosition.x = `${e.view.innerWidth - 270}px`;
    }

    // 點選位置太靠下則將選單往上移。
    if (e.view.innerHeight - e.clientY < 280) {
      menuPosition.y = `${e.view.innerHeight - 280}px`;
    }

    this.analysisMenu = {
      type,
      focusId: id,
      x: menuPosition.x,
      y: menuPosition.y
    };

    this.changeDetectorRef.markForCheck();
  }

  /**
   * 根據使用者點擊項目，新開項目視窗
   * @param obj {SettingObj}-項目類別
   * @param page {'info' | 'sportReport'}-欲新開視窗之頁面
   * @param id {string}-群組或成員id
   * @author kidin-1100524
   */
  goPage(obj: SettingObj, page: 'info' | 'sportsReport', id: string) {
    const { startTimestamp, endTimestamp } = this.reportConditionOpt.date,
          startDateString = moment(startTimestamp).format('YYYY-MM-DD'),
          endDateString = moment(endTimestamp).format('YYYY-MM-DD');
    let url: string,
        hashId: string;
    if (obj === 'group') {
      hashId = this.hashIdService.handleGroupIdEncode(id);
      switch (page) {
        case 'info':
          url = `/dashboard/group-info/${hashId}`;
          break;
        case 'sportsReport':
          url = `/dashboard/group-info/${hashId}/sports-report?startdate=${startDateString}&enddate=${endDateString}`;
          break;
      }
    } else {
      hashId = this.hashIdService.handleUserIdEncode(id);
      switch (page) {
        case 'info':
          url = `/user-profile/${hashId}`;
          break;
        case 'sportsReport':
          url = `/user-profile/${hashId}/sport-report?startdate=${startDateString}&enddate=${endDateString}`;
          break;
      }

    }

    window.open(url);
  }

  /**
   * 該分析列表顯示所有人員
   * @param type {SettingObj}-分析列表類別
   * @author kidin-1100519
   */
  showAllData(type: SettingObj) {
    this[`${type}Table`].showAll = true;
    this.updateUrl();
    this.changeDetectorRef.markForCheck();
  }

  /**
   * 列印
   */
  print() {
    window.print();
  }

  /**
   * 變更組別篩選條件
   * @param e {MatCheckboxChange}
   * @author kidin-1100803
   */
  changeGroupFilter(e: MatCheckboxChange) {
    const { checked, source: { value } } = e;
    if (checked) {
      this.groupFilterLevel.push(+value);
    } else {
      this.groupFilterLevel = this.groupFilterLevel.filter(_level => _level != +value);
    }

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