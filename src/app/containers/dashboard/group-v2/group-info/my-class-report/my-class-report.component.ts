import { Component, OnInit, OnDestroy, ViewChild, ElementRef, Renderer2 } from '@angular/core';
import { GroupDetailInfo, UserSimpleInfo } from '../../../models/group-detail';
import { Subject, combineLatest } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import dayjs from 'dayjs';
import { getOptions } from 'highcharts';
import { TranslateService } from '@ngx-translate/core';
import {
  UserService,
  HashIdService,
  AuthService,
  Api10xxService,
  Api11xxService,
  Api21xxService,
  Api70xxService,
  ReportService,
} from '../../../../../core/services';
import { Router } from '@angular/router';
import { chart, charts, color, each } from 'highcharts';
import { ReportConditionOpt } from '../../../../../shared/models/report-condition';
import { HrZoneRange } from '../../../../../shared/models/chart-data';
import { HrBase } from '../../../../../shared/enum/personal';
import { ProfessionalService } from '../../../../professional/services/professional.service';
import {
  displayGroupLevel,
  getUrlQueryStrings,
  setUrlQueryString,
} from '../../../../../core/utils';

// 建立圖表用-kidin-1081212
class ChartOptions {
  constructor(dataset, colorIdx) {
    return {
      chart: {
        height: 400,
        spacingTop: 20,
        spacingBottom: 20,
        zoomType: 'x',
      },
      title: {
        text: dataset.name,
        align: 'left',
        margin: 0,
        x: 30,
        style: '',
      },
      credits: {
        enabled: false,
      },
      xAxis: {
        crosshair: true,
        events: {},
        type: '',
      },
      yAxis: {
        title: {
          text: null,
          min: null,
          max: null,
          tickInterval: null,
          labels: null,
        },
        minPadding: 0.01,
        maxPadding: 0.01,
        tickAmount: 1,
      },
      plotOptions: {
        column: {
          pointPlacement: 0,
        },
        series: {
          pointPadding: 0,
          groupPadding: 0,
        },
      },
      tooltip: {
        pointFormat: '{point.y}',
        xDateFormat: '%H:%M:%S',
        shadow: false,
        style: {
          fontSize: '14px',
        },
        valueDecimals: dataset.valueDecimals,
        split: true,
        share: true,
      },
      series: [
        {
          data: dataset.data,
          name: dataset.name,
          type: dataset.type,
          innerSize: '',
          color: getOptions().colors[colorIdx],
          fillOpacity: 0.3,
          tooltip: {
            valueSuffix: ' ' + dataset.unit,
          },
          dataLabels: {
            enabled: false,
          },
        },
      ],
    };
  }
}

const errMsg = `Error.<br />Please try again later.`;

@Component({
  selector: 'app-my-class-report',
  templateUrl: './my-class-report.component.html',
  styleUrls: ['./my-class-report.component.scss', '../group-child-page.scss'],
})
export class MyClassReportComponent implements OnInit, OnDestroy {
  private ngUnsubscribe = new Subject();

  /**
   * UI會用到的各個flag
   */
  uiFlag = {
    isDebugMode: false,
    isPreviewMode: false,
    isLoading: false,
    noData: true,
  };

  /**
   * 此群組相關資料
   */
  groupInfo = <GroupDetailInfo>{};

  /**
   * 使用者個人資訊（含權限）
   */
  userSimpleInfo: UserSimpleInfo;

  /**
   * 產生報告所需資料
   */
  sportsReportContent = {
    pageType: 'my-class',
    sportType: 1,
    dateRange: {
      startTimestamp: null,
      endTimestamp: null,
    },
    image: null,
    nameInfo: {
      name: null,
    },
    sportsInfo: {
      numOfData: null,
    },
  };

  /***************************************** 以下舊code ***********************************************/

  // UI操控相關變數-kidin-1081210
  reportCompleted = true;
  isPreviewMode = false;
  isLoading = false;
  isSelected = 'aWeek';
  isSelectDateRange = false;
  hasResData: boolean;
  initialChartComplated = true;
  isDebug = false;
  showAllLessonInfo = false;
  showAllCoachInfo = false;
  urlOpenReprot = false;

  // 資料儲存用變數-kidin-1081210
  token: string;
  previewUrl: string;
  userId: string;
  brandImg: string;
  brandName: string;
  branchName: string;
  selectDate = {
    startDate: dayjs().subtract(6, 'day').format('YYYY-MM-DDT00:00:00.000Z'),
    endDate: dayjs().format('YYYY-MM-DDT23:59:59.999Z'),
  };
  startDate: string;
  reportCreatedTime = dayjs().format('YYYY-MM-DD HH:mm');
  groupImg: string;
  groupId: string;
  sportType = 99;
  activityLength: number;
  fileInfo: any;
  totalTime: string;
  totalDistance: number;
  avgSpeed: number;
  avgHR: number;
  totalCalories: number;
  burnedCalories: number;
  dateList: Array<string>;
  avgSpeedList: Array<any>;
  avgHRList: Array<any>;
  caloriesList: Array<any>;
  userData: any;
  deviceInfo: any;
  groupData: any;
  coachInfo = {
    nickname: '',
    avatarUrl: '',
    description: '',
  };
  deviceImgUrl: string;
  lessonTotalInfo: string;
  lessonPartInfo: string;
  coachTotalInfo: string;
  coachPartInfo: string;
  avgHRZone: string;
  classLink: HTMLElement;

  // 圖表用數據-kidin-1081211
  showHRZoneChartTarget = false;
  showcaloriesBurnedChartTarget = false;
  showavgHRChartTarget = false;
  showcaloriesChartTarget = false;
  charts = [];
  chartDatas = [];
  chartTargetList = [];
  HRZoneColorSet = [
    { y: 0, color: '#70b1f3' },
    { y: 0, color: '#64e0ec' },
    { y: 0, color: '#abf784' },
    { y: 0, color: '#f7f25b' },
    { y: 0, color: '#f3b353' },
    { y: 0, color: '#f36953' },
  ];
  colorIdx = 0;
  hrZoneRange = <HrZoneRange>{
    hrBase: HrBase.max,
    z0: 'Z0',
    z1: 'Z1',
    z2: 'Z2',
    z3: 'Z3',
    z4: 'Z4',
    z5: 'Z5',
  };

  /**
   * 報告頁面可讓使用者篩選的條件
   */
  reportConditionOpt: ReportConditionOpt = {
    brandType: 1,
    pageType: 'sport',
    date: {
      startTimestamp: dayjs().startOf('day').subtract(6, 'day').valueOf(),
      endTimestamp: dayjs().endOf('day').valueOf(),
      type: 'sevenDay',
    },
    sportType: 99,
    hideConfirmBtn: true,
  };

  @ViewChild('container', { static: false })
  container: ElementRef;
  @ViewChild('HRZoneChartTarget', { static: false })
  HRZoneChartTarget: ElementRef;
  @ViewChild('caloriesBurnedChartTarget', { static: false })
  caloriesBurnedChartTarget: ElementRef;
  @ViewChild('avgSpeedChartTarget', { static: false })
  avgSpeedChartTarget: ElementRef;
  @ViewChild('avgHRChartTarget', { static: false })
  avgHRChartTarget: ElementRef;
  @ViewChild('caloriesChartTarget', { static: false })
  caloriesChartTarget: ElementRef;

  constructor(
    private api11xxService: Api11xxService,
    private api21xxService: Api21xxService,
    private userService: UserService,
    private hashIdService: HashIdService,
    private router: Router,
    private api70xxService: Api70xxService,
    private renderer: Renderer2,
    private translateService: TranslateService,
    private reportService: ReportService,
    private authService: AuthService,
    private api10xxService: Api10xxService,
    private professionalService: ProfessionalService
  ) {}

  ngOnInit(): void {
    this.initPage();
    const { search } = location;
    const queryObj = getUrlQueryStrings(search);
    const { ipm, debug, startdate, enddate, sportType, id } = queryObj;
    if (ipm) this.isPreviewMode = true;
    if (debug) this.isDebug = true;

    if (startdate && enddate && sportType && id) {
      this.urlOpenReprot = true;
      this.queryStringShowData(queryObj);
    } else {
      this.reportService.setReportCondition(this.reportConditionOpt);
      this.getReportSelectedCondition();
    }

    charts.length = 0; // 初始化global highchart物件，可避免HighCharts.Charts為 undefined -kidin-1081212
  }

  /**
   * 取得已儲存的群組詳細資訊、階層群組資訊、使用者資訊
   * @author kidin-1091020
   */
  initPage() {
    combineLatest([
      this.professionalService.getRxGroupDetail(),
      this.professionalService.getRxCommerceInfo(),
      this.professionalService.getUserSimpleInfo(),
    ])
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((resArr) => {
        this.groupInfo = resArr[0];
        Object.assign(resArr[0], { groupLevel: displayGroupLevel(resArr[0].groupId) });
        Object.assign(resArr[0], { expired: resArr[1].expired });
        Object.assign(resArr[0], { commerceStatus: resArr[1].commerceStatus });
        this.userSimpleInfo = resArr[2];
      });
  }

  // 依query string顯示資料-kidin-20191226
  queryStringShowData(queryObj: any) {
    const { startdate, enddate, sportType, id } = queryObj;
    if (startdate) {
      this.startDate = startdate;
      this.reportConditionOpt.date.startTimestamp = dayjs(startdate).valueOf();
    }

    if (enddate) this.reportConditionOpt.date.endTimestamp = dayjs(enddate).valueOf();
    if (sportType) this.sportType = +sportType;
    if (id) this.userId = this.hashIdService.handleGroupIdDecode(id);

    if (!this.isPreviewMode) {
      this.reportConditionOpt.date.type = 'custom';
      this.reportService.setReportCondition(this.reportConditionOpt);
      this.getReportSelectedCondition();
    } else {
      const dateFormat = 'YYYY-MM-DDTHH:mm:ss.SSSZ';
      this.selectDate = {
        startDate: dayjs(this.reportConditionOpt.date.startTimestamp).format(dateFormat),
        endDate: dayjs(this.reportConditionOpt.date.endTimestamp).format(dateFormat),
      };

      this.handleSubmitSearch();
    }
  }

  /**
   * 取得使用者所篩選的條件
   * @author kidin-1091029
   */
  getReportSelectedCondition() {
    const dateFormat = 'YYYY-MM-DDTHH:mm:ss.SSSZ';
    this.reportService
      .getReportCondition()
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((res) => {
        if (res.date) {
          this.selectDate = {
            startDate: dayjs(res.date.startTimestamp).format(dateFormat),
            endDate: dayjs(res.date.endTimestamp).format(dateFormat),
          };

          this.sportType = res.sportType;
          this.handleSubmitSearch();
        }
      });
  }

  // 使用者送出表單後顯示相關資料-kidin-1081209
  handleSubmitSearch() {
    this.token = this.authService.token;
    this.reportCompleted = false;
    this.initVariable();
    this.getUserInfo();
    this.getGroupInfo();

    // 根據條件取得多筆運動檔案資料-kidin-1081211
    let targetUser;
    let author;
    if (this.isDebug) {
      targetUser = '99';
      author = this.userId;
    } else {
      targetUser = '1';
      author = '';
    }

    const urlArr = location.pathname.split('/');
    const body = {
      token: this.token,
      searchTime: {
        type: '1',
        fuzzyTime: [],
        filterStartTime: this.selectDate.startDate,
        filterEndTime: this.selectDate.endDate,
        filterSameTime: '1',
      },
      searchRule: {
        activity: this.sportType,
        targetUser: targetUser,
        fileInfo: {
          author: author,
          dispName: '',
          equipmentSN: '',
          class: this.hashIdService.handleGroupIdDecode(urlArr[urlArr.length - 2]),
          teacher: '',
          tag: '',
        },
      },
      display: {
        activityLapLayerDisplay: '3',
        activityLapLayerDataField: [],
        activityPointLayerDisplay: '2', // 心率區間用，待2020/4月取消串接point資料-kidin-1081213
        activityPointLayerDataField: ['heartRateBpm'], // 心率區間用，待2020/4月取消串接point資料-kidin-1081213
      },
      page: '0',
      pageCounts: '1000',
    };
    this.sendRequest(body);
  }

  // 取得群組資訊-kidin-1090326
  getGroupInfo() {
    // 先從service取得群組資訊，若取不到再call api-kidin-1081210
    this.professionalService
      .getGroupInfo()
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((res) => {
        this.groupData = res;
        if (
          Object.prototype.hasOwnProperty.call(this.groupData, 'groupId') &&
          this.groupData.groupId === this.groupId
        ) {
          this.groupId = this.groupData.groupId;
          this.showGroupInfo();
        } else {
          const urlArr = location.pathname.split('/');
          this.groupId = this.hashIdService.handleGroupIdDecode(urlArr[urlArr.length - 2]);
          const groupBody = {
            token: this.token,
            groupId: this.groupId,
            findRoot: '1',
            avatarType: '2',
          };

          this.api11xxService.fetchGroupListDetail(groupBody).subscribe((result) => {
            this.groupData = result.info;
            this.professionalService.saveGroupInfo(this.groupData);
            this.showGroupInfo();
          });
        }
      });
  }

  // 初始化變數-kidin-1081211
  initVariable() {
    this.initialChartComplated = false;
    this.showHRZoneChartTarget = false;
    this.showcaloriesBurnedChartTarget = false;
    this.showavgHRChartTarget = false;
    this.showcaloriesChartTarget = false;
    this.dateList = [];
    this.avgSpeedList = [];
    this.avgHRList = [];
    this.caloriesList = [];
    this.HRZoneColorSet = [
      { y: 0, color: '#70b1f3' },
      { y: 0, color: '#64e0ec' },
      { y: 0, color: '#abf784' },
      { y: 0, color: '#f7f25b' },
      { y: 0, color: '#f3b353' },
      { y: 0, color: '#f36953' },
    ];
    this.colorIdx = 0;
  }

  // 取得登入者資訊-kidin-1090326
  getUserInfo() {
    this.userService
      .getUser()
      .rxUserProfile.pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((res) => {
        if (+this.userId !== res.userId) {
          this.hrZoneRange['hrBase'] = HrBase.max;
          this.hrZoneRange['z0'] = 'Z0';
          this.hrZoneRange['z1'] = 'Z1';
          this.hrZoneRange['z2'] = 'Z2';
          this.hrZoneRange['z3'] = 'Z3';
          this.hrZoneRange['z4'] = 'Z4';
          this.hrZoneRange['z5'] = 'Z5';
        } else {
          const userAge = dayjs().diff(res.birthday, 'year'),
            userHRBase = res.heartRateBase,
            userMaxHR = res.heartRateMax,
            userRestHR = res.heartRateResting;

          this.getUserBodyInfo(userHRBase, userAge, userMaxHR, userRestHR);
        }
      });
  }

  // 取得使用者資訊並計算心率區間範圍()-kidin-1090203
  getUserBodyInfo(userHRBase, userAge, userMaxHR, userRestHR) {
    if (userAge !== null) {
      if (userMaxHR && userRestHR) {
        if (userHRBase === HrBase.max) {
          // 區間數值採無條件捨去法
          this.hrZoneRange['hrBase'] = userHRBase;
          this.hrZoneRange['z0'] = Math.floor((220 - userAge) * 0.5 - 1);
          this.hrZoneRange['z1'] = Math.floor((220 - userAge) * 0.6 - 1);
          this.hrZoneRange['z2'] = Math.floor((220 - userAge) * 0.7 - 1);
          this.hrZoneRange['z3'] = Math.floor((220 - userAge) * 0.8 - 1);
          this.hrZoneRange['z4'] = Math.floor((220 - userAge) * 0.9 - 1);
          this.hrZoneRange['z5'] = Math.floor((220 - userAge) * 1);
        } else {
          this.hrZoneRange['hrBase'] = userHRBase;
          this.hrZoneRange['z0'] = Math.floor((userMaxHR - userRestHR) * 0.55) + userRestHR;
          this.hrZoneRange['z1'] = Math.floor((userMaxHR - userRestHR) * 0.6) + userRestHR;
          this.hrZoneRange['z2'] = Math.floor((userMaxHR - userRestHR) * 0.65) + userRestHR;
          this.hrZoneRange['z3'] = Math.floor((userMaxHR - userRestHR) * 0.75) + userRestHR;
          this.hrZoneRange['z4'] = Math.floor((userMaxHR - userRestHR) * 0.85) + userRestHR;
          this.hrZoneRange['z5'] = Math.floor((userMaxHR - userRestHR) * 1) + userRestHR;
        }
      } else {
        if (userHRBase === HrBase.max) {
          // 區間數值採無條件捨去法
          this.hrZoneRange['hrBase'] = userHRBase;
          this.hrZoneRange['z0'] = Math.floor((220 - userAge) * 0.5 - 1);
          this.hrZoneRange['z1'] = Math.floor((220 - userAge) * 0.6 - 1);
          this.hrZoneRange['z2'] = Math.floor((220 - userAge) * 0.7 - 1);
          this.hrZoneRange['z3'] = Math.floor((220 - userAge) * 0.8 - 1);
          this.hrZoneRange['z4'] = Math.floor((220 - userAge) * 0.9 - 1);
          this.hrZoneRange['z5'] = Math.floor((220 - userAge) * 1);
        } else {
          this.hrZoneRange['hrBase'] = userHRBase;
          this.hrZoneRange['z0'] = Math.floor((220 - userAge - userRestHR) * 0.55) + userRestHR;
          this.hrZoneRange['z1'] = Math.floor((220 - userAge - userRestHR) * 0.6) + userRestHR;
          this.hrZoneRange['z2'] = Math.floor((220 - userAge - userRestHR) * 0.65) + userRestHR;
          this.hrZoneRange['z3'] = Math.floor((220 - userAge - userRestHR) * 0.75) + userRestHR;
          this.hrZoneRange['z4'] = Math.floor((220 - userAge - userRestHR) * 0.85) + userRestHR;
          this.hrZoneRange['z5'] = Math.floor((220 - userAge - userRestHR) * 1) + userRestHR;
        }
      }
    } else {
      this.hrZoneRange['hrBase'] = HrBase.max;
      this.hrZoneRange['z0'] = 'Z0';
      this.hrZoneRange['z1'] = 'Z1';
      this.hrZoneRange['z2'] = 'Z2';
      this.hrZoneRange['z3'] = 'Z3';
      this.hrZoneRange['z4'] = 'Z4';
      this.hrZoneRange['z5'] = 'Z5';
    }
  }

  // 顯示群組資料-kidin-1081227
  showGroupInfo() {
    const groupIcon = this.groupData.groupIcon;
    const brandIcon = this.groupData.groupRootInfo[2].brandIcon;
    this.groupImg =
      groupIcon && groupIcon.length > 0 ? groupIcon : '/assets/images/group-default.svg';
    this.brandImg =
      brandIcon && brandIcon.length > 0 ? brandIcon : '/assets/images/group-default.svg';
    this.brandName = this.groupData.groupRootInfo[2].brandName;
    this.branchName = this.groupData.groupRootInfo[3].branchName;

    this.handleInfo(this.groupData.groupDesc, 'lessonInfo');
  }

  // 取得多筆活動資料並處理-kidin-1081211
  sendRequest(body) {
    this.changeLoadingStatus(true);
    this.api21xxService.fetchMultiActivityData(body).subscribe((res) => {
      const { resultCode, info, activities } = res;
      if (resultCode !== 200) {
        this.hasResData = false;
        this.updateUrl('false');
        this.reportCompleted = true;
        this.initialChartComplated = true;
        this.changeLoadingStatus(false);
      } else {
        const allActivities = this.mergeActivitiesList(info, activities);
        this.activityLength = allActivities.length;
        if (this.activityLength === 0) {
          this.hasResData = false;
          this.updateUrl('false');
          this.reportCompleted = true;
          this.initialChartComplated = true;
          this.changeLoadingStatus(false);
        } else {
          this.isSelectDateRange = false;
          this.hasResData = true;
          const infoData = allActivities[0];
          this.fileInfo = infoData.fileInfo;

          let timeCount = 0;
          let HRCount = 0;
          let caloriesCount = 0;
          let HRZoneZero = 0;
          let HRZoneOne = 0;
          let HRZoneTwo = 0;
          let HRZoneThree = 0;
          let HRZoneFour = 0;
          let HRZoneFive = 0;

          for (let i = 0; i < this.activityLength; i++) {
            const activityItem = allActivities[i].activityInfoLayer;
            const {
              totalSecond,
              avgHeartRateBpm,
              calories,
              totalHrZone0Second,
              totalHrZone1Second,
              totalHrZone2Second,
              totalHrZone3Second,
              totalHrZone4Second,
              totalHrZone5Second,
            } = activityItem;
            timeCount += totalSecond;
            HRCount += avgHeartRateBpm;
            caloriesCount += calories;

            // 取得心率區間-kidin-1081213
            if (totalHrZone0Second !== null) {
              HRZoneZero += totalHrZone0Second > 0 ? totalHrZone0Second : 0;
              HRZoneOne += totalHrZone1Second > 0 ? totalHrZone1Second : 0;
              HRZoneTwo += totalHrZone2Second > 0 ? totalHrZone2Second : 0;
              HRZoneThree += totalHrZone3Second > 0 ? totalHrZone3Second : 0;
              HRZoneFour += totalHrZone4Second > 0 ? totalHrZone4Second : 0;
              HRZoneFive += totalHrZone5Second > 0 ? totalHrZone5Second : 0;
            } else {
              // 計算心率區間-kidin-1081213
              const hrBpm = allActivities[i].activityPointLayer;
              const resolutionSeconds = 3;
              for (let j = 0; j < hrBpm.length; j++) {
                const { heartRateBpm } = hrBpm[j];
                const { z0, z1, z2, z3, z4 } = this.hrZoneRange;
                if (heartRateBpm !== 0) {
                  if (heartRateBpm >= z0 && heartRateBpm < z1) {
                    HRZoneOne += resolutionSeconds;
                  } else if (heartRateBpm >= (z1 as any) + 1 && heartRateBpm < z2) {
                    HRZoneTwo += resolutionSeconds;
                  } else if (heartRateBpm >= (z2 as any) + 1 && heartRateBpm < z3) {
                    HRZoneThree += resolutionSeconds;
                  } else if (heartRateBpm >= (z3 as any) + 1 && heartRateBpm < z4) {
                    HRZoneFour += resolutionSeconds;
                  } else if (heartRateBpm >= (z4 as any) + 1) {
                    HRZoneFive += resolutionSeconds;
                  } else {
                    HRZoneZero += resolutionSeconds;
                  }
                }
              }
            }

            this.dateList.unshift(this.formatDate(allActivities[i].fileInfo.creationDate));
            this.avgHRList.unshift(avgHeartRateBpm);
            this.caloriesList.unshift(calories);
          }

          this.calculateTotalTime(timeCount);
          this.avgHR = HRCount / this.activityLength;
          this.totalCalories = caloriesCount;
          this.burnedCalories = this.totalCalories / 7700;

          const totalHRSecond =
            HRZoneZero + HRZoneOne + HRZoneTwo + HRZoneThree + HRZoneFour + HRZoneFive;
          if (totalHRSecond !== 0) {
            this.HRZoneColorSet[0].y = this.handleMathRound((HRZoneZero / totalHRSecond) * 100);
            this.HRZoneColorSet[1].y = this.handleMathRound((HRZoneOne / totalHRSecond) * 100);
            this.HRZoneColorSet[2].y = this.handleMathRound((HRZoneTwo / totalHRSecond) * 100);
            this.HRZoneColorSet[3].y = this.handleMathRound((HRZoneThree / totalHRSecond) * 100);
            this.HRZoneColorSet[4].y = this.handleMathRound((HRZoneFour / totalHRSecond) * 100);
            this.HRZoneColorSet[5].y = this.handleMathRound((HRZoneFive / totalHRSecond) * 100);

            this.findAvgHRZone(this.HRZoneColorSet);
          }
          const coachId = this.fileInfo.teacher.split('?userId=')[1];
          this.initHighChart();
          this.getClassDetails(this.fileInfo.equipmentSN, coachId);
          this.updateUrl('true');

          setTimeout(() => {
            this.getReportInfo();
          });

          this.changeLoadingStatus(false);
        }
      }
    });

    this.reportCompleted = true;
  }

  /**
   * 將單一類別課程與複合式課程清單合併
   * @param singleTypeInfo {any}-單一類別課程資訊
   * @param complexTypeInfo {Array<any>}-複合式類別課程資訊
   */
  mergeActivitiesList(singleTypeInfo: any, complexTypeInfo: Array<any>) {
    const { activities } = singleTypeInfo;
    if (!complexTypeInfo || complexTypeInfo.length === 0) return activities;
    return (activities || []).concat(complexTypeInfo).sort((_a, _b) => {
      const _aCreationTimestamp = dayjs(_a.fileInfo.creationDate).valueOf();
      const _bCreationTimestamp = dayjs(_b.fileInfo.creationDate).valueOf();
      return _aCreationTimestamp - _bCreationTimestamp;
    });
  }

  // 取得變數內容並將部分變數替換成html element-kidin-1090623
  getReportInfo() {
    const targetDiv = document.getElementById('reportInfo');
    this.translateService.get('hellow world').subscribe(() => {
      targetDiv.innerHTML = this.translateService.instant('universal_group_myReportOnPeriod', {
        class: `[<span id="classLink" class="activity-Link">${this.fileInfo.dispName}</span>]`,
        startDate: dayjs(this.selectDate.startDate).format('YYYY-MM-DD'),
        endDate: dayjs(this.selectDate.endDate).format('YYYY-MM-DD'),
        number: `<span class="fileAmount">${this.activityLength}</span>`,
      });
    });

    this.classLink = document.getElementById('classLink');
    this.classLink.addEventListener('click', this.visitClass.bind(this));
  }

  // 取得平均心率座落的區間-kidin-1090326
  findAvgHRZone(hrZone) {
    let mostHRZone = 0,
      idx = 0;

    for (let i = 0; i < hrZone.length; i++) {
      if (hrZone[i].y > mostHRZone) {
        mostHRZone = hrZone[i].y;
        idx = i;
      }
    }

    switch (idx) {
      case 0:
        this.avgHRZone = `${this.translateService.instant(
          'universal_activityData_limit_generalZone'
        )} ${mostHRZone}%`;
        break;
      case 1:
        this.avgHRZone = `${this.translateService.instant(
          'universal_activityData_warmUpZone'
        )} ${mostHRZone}%`;
        break;
      case 2:
        this.avgHRZone = `${this.translateService.instant(
          'universal_activityData_aerobicZone'
        )} ${mostHRZone}%`;
        break;
      case 3:
        this.avgHRZone = `${this.translateService.instant(
          'universal_activityData_enduranceZone'
        )} ${mostHRZone}%`;
        break;
      case 4:
        this.avgHRZone = `${this.translateService.instant(
          'universal_activityData_marathonZone'
        )} ${mostHRZone}%`;
        break;
      case 5:
        this.avgHRZone = `${this.translateService.instant(
          'universal_activityData_anaerobicZone'
        )} ${mostHRZone}%`;
        break;
    }
  }

  // 將搜尋的類別和範圍處理過後加入query string並更新現在的url和預覽列印的url
  updateUrl(str) {
    const { pathname, search } = location;
    let newUrl = pathname;
    if (str === 'true') {
      const startDateString = this.selectDate.startDate.split('T')[0];
      const endDateString = this.selectDate.endDate.split('T')[0];
      const { author } = this.fileInfo;
      const userId =
        author.indexOf('?') > 0
          ? author.split('?')[1].split('=')[1].replace(')', '')
          : author.replace(')', '');
      const hashUserId = this.hashIdService.handleUserIdEncode(userId);
      const queryObj = getUrlQueryStrings(search);
      const newSearch = setUrlQueryString({
        ...queryObj,
        startdate: startDateString,
        enddate: endDateString,
        sportType: this.sportType,
        id: hashUserId,
      });
      newUrl += newSearch;
      this.previewUrl = `${newUrl}&ipm=s`;
    }

    if (history.pushState) window.history.pushState({ path: newUrl }, '', newUrl);
  }

  // 計算多筆資料合計的總運動時間-kidin-1081211
  calculateTotalTime(timeCount) {
    if (timeCount < 60) {
      this.totalTime = `00:${this.fillTwoDigits(timeCount)}`;
    } else if (timeCount < 3600) {
      const minute = Math.floor(timeCount / 60);
      const second = timeCount % 60;
      this.totalTime = `${this.fillTwoDigits(minute)}:${this.fillTwoDigits(second)}`;
    } else {
      const hour = Math.floor(timeCount / 3600);
      const minute = Math.floor((timeCount % 3600) / 60);
      const second = timeCount - hour * 3600 - minute * 60;
      this.totalTime = `${hour}:${this.fillTwoDigits(minute)}:${this.fillTwoDigits(second)}`;
    }
  }

  // 時間補零-kidin-1081211
  fillTwoDigits(num: number) {
    const timeStr = '0' + Math.floor(num);
    return timeStr.slice(-2);
  }

  // 使檔案創建日期符合格式-kidin-1081211
  formatDate(date: string) {
    const month = date.slice(5, 7);
    const day = date.slice(8, 10);
    return `${month}/${day}`;
  }

  // 將數字取四捨五入至第一位-kidin-1081227
  handleMathRound(num) {
    if (num % 1 === 0) {
      return num;
    } else {
      return Number(parseFloat(num).toFixed(1));
    }
  }

  // 初始化highChart-kidin-1081211
  initHighChart() {
    // 將之前生成的highchart卸除避免新生成的highchart無法顯示-kidin-1081219
    charts.forEach((_highChart, idx) => {
      if (_highChart !== undefined) {
        _highChart.destroy();
      }
    });
    charts.length = 0; // 初始化global highchart物件，可避免HighCharts.Charts為 undefined -kidin-1081212
    this.chartDatas.length = 0;
    this.chartTargetList.length = 0;

    // 平均心率區間落點圖表-kidin-1081212
    const HRZoneDataset = {
      name: 'Heart Rate Zone',
      data: this.HRZoneColorSet,
      unit: '%',
      type: 'column',
      valueDecimals: 1,
    };
    const HRZoneChartOptions = new ChartOptions(HRZoneDataset, this.colorIdx);
    HRZoneChartOptions['plotOptions'].column['pointPlacement'] = 0;
    HRZoneChartOptions['series'][0].dataLabels = {
      enabled: true,
      formatter: function () {
        return this.y + '%';
      },
    };
    HRZoneChartOptions['series'][0].showInLegend = false;
    HRZoneChartOptions['chart'].zoomType = '';
    HRZoneChartOptions['xAxis'].categories = [
      this.translateService.instant('universal_activityData_limit_generalZone'),
      this.translateService.instant('universal_activityData_warmUpZone'),
      this.translateService.instant('universal_activityData_aerobicZone'),
      this.translateService.instant('universal_activityData_enduranceZone'),
      this.translateService.instant('universal_activityData_marathonZone'),
      this.translateService.instant('universal_activityData_anaerobicZone'),
    ];
    HRZoneChartOptions['yAxis'].labels = {
      formatter: function () {
        return this.value + '%';
      },
    };

    this.chartDatas.push({ HRZoneChartTarget: HRZoneChartOptions, isSyncExtremes: false });
    this.chartTargetList.push('HRZoneChartTarget');

    const chartHeight = 260; // 折線圖高度設定-kidin-1081227

    // 平均心率圖表-kidin-1081216
    const avgHRDataset = {
      name: 'Average Heart Rate',
      data: this.avgHRList,
      unit: 'bmp',
      type: 'area',
      valueDecimals: 1,
    };
    this.colorIdx = 5;
    const avgHRChartOptions = new ChartOptions(avgHRDataset, this.colorIdx);
    avgHRChartOptions['chart'].height = chartHeight;
    avgHRChartOptions['xAxis'].categories = this.dateList;
    avgHRChartOptions['plotOptions'] = {
      area: {
        fillColor: {
          linearGradient: {
            x1: 0,
            y1: 0,
            x2: 0,
            y2: 1,
          },
          stops: [
            [0, getOptions().colors[this.colorIdx]],
            [1, color(getOptions().colors[this.colorIdx]).setOpacity(0).get('rgba')],
          ],
        },
        marker: {
          radius: 2,
        },
        lineWidth: 1,
        states: {
          hover: {
            lineWidth: 1,
          },
        },
      },
    };

    this.chartDatas.push({ avgHRChartTarget: avgHRChartOptions, isSyncExtremes: true });
    this.chartTargetList.push('avgHRChartTarget');

    // 卡路里圖表-kidin-1081216
    const caloriesDataset = {
      name: 'Calories',
      data: this.caloriesList,
      unit: 'cal',
      type: 'area',
      valueDecimals: 1,
    };
    this.colorIdx = 3;
    const caloriesChartOptions = new ChartOptions(caloriesDataset, this.colorIdx);
    caloriesChartOptions['chart'].height = chartHeight;
    caloriesChartOptions['xAxis'].type = '';
    caloriesChartOptions['xAxis'].dateTimeLabelFormats = null;
    caloriesChartOptions['xAxis'].categories = this.dateList;
    caloriesChartOptions['plotOptions'] = {
      area: {
        fillColor: {
          linearGradient: {
            x1: 0,
            y1: 0,
            x2: 0,
            y2: 1,
          },
          stops: [
            [0, getOptions().colors[this.colorIdx]],
            [1, color(getOptions().colors[this.colorIdx]).setOpacity(0).get('rgba')],
          ],
        },
        marker: {
          radius: 2,
        },
        lineWidth: 1,
        states: {
          hover: {
            lineWidth: 1,
          },
        },
      },
    };

    this.chartDatas.push({ caloriesChartTarget: caloriesChartOptions, isSyncExtremes: true });
    this.chartTargetList.push('caloriesChartTarget');

    // 根據圖表清單依序將圖表顯示出來-kidin-1081217
    const chartTargetList = this.chartTargetList;
    setTimeout(() => {
      this.chartDatas.forEach((_option, idx) => {
        this[`show${chartTargetList[idx]}`] = true;
        _option[chartTargetList[idx]].xAxis.events.setExtremes = this.syncExtremes.bind(
          this,
          idx,
          this.chartDatas
        );
        this.charts[idx] = chart(
          this[chartTargetList[idx]].nativeElement,
          _option[chartTargetList[idx]]
        );
      });
      this.initialChartComplated = true;

      this.renderer.listen(this.container.nativeElement, 'mousemove', (e) =>
        this.handleSynchronizedPoint(e, this.chartDatas)
      );
      this.renderer.listen(this.container.nativeElement, 'touchmove', (e) =>
        this.handleSynchronizedPoint(e, this.chartDatas)
      );
      this.renderer.listen(this.container.nativeElement, 'touchstart', (e) =>
        this.handleSynchronizedPoint(e, this.chartDatas)
      );
    }, 3000);
  }

  // 調整縮放會同步-kidin-1081212
  syncExtremes(num, finalDatas, e) {
    const thisChart = this.charts[num];
    if (e.trigger !== 'syncExtremes') {
      each(charts, function (_chart, idx) {
        if (_chart !== thisChart && _chart && finalDatas[idx].isSyncExtremes) {
          if (_chart.xAxis[0].setExtremes) {
            _chart.xAxis[0].setExtremes(e.min, e.max, undefined, false, {
              trigger: 'syncExtremes',
            });
          }
        }
      });
    }
  }

  // 滑動Hchart時，使所有圖表的聚焦位置跟著移動-kidin-1081212
  handleSynchronizedPoint(e, finalDatas) {
    for (let i = 0; i < charts.length; i = i + 1) {
      const _chart: any = charts[i];
      if (_chart !== undefined) {
        if (finalDatas[0].isSyncExtremes) {
          const event = _chart.pointer.normalize(e); // 取得圖表上的座標
          const point = _chart.series[0].searchPoint(event, true); // 取得滑鼠在圖表停留的位置
          if (point && point.index) {
            point.highlight(e);
          }
        }
      }
    }
  }

  getClassDetails(SN, coachId) {
    // 取得裝置資訊-kidin-1081218
    const deviceDody = {
      token: '',
      queryType: '1',
      queryArray: SN,
    };
    this.api70xxService.fetchGetProductInfo(deviceDody).subscribe((res) => {
      if (res) {
        this.deviceInfo = res.info.productInfo[0];
        if (location.hostname === '192.168.1.235') {
          this.deviceImgUrl = `http://app.alatech.com.tw/app/public_html/products${this.deviceInfo.modelImg}`;
        } else {
          this.deviceImgUrl = `http://${location.hostname}/app/public_html/products${this.deviceInfo.modelImg}`;
        }
      }
    });

    // 取得教練資訊-kidin-1081218
    const bodyForCoach = {
      token: this.token,
      targetUserId: coachId,
      avatarType: '2',
    };

    this.api10xxService.fetchGetUserProfile(bodyForCoach).subscribe((res) => {
      if (res.processResult.resultCode === 200) {
        this.coachInfo = res.userProfile;
      } else {
        this.coachInfo = {
          avatarUrl: '/assets/images/user2.png',
          description: '',
          nickname: 'No data',
        };
      }

      this.handleInfo(this.coachInfo.description, 'coachInfo');
    });
  }

  // 連結至個人頁面-kidin-1081223
  visitAuthor() {
    this.router.navigateByUrl(
      `/user-profile/${this.hashIdService.handleUserIdEncode(
        this.fileInfo.author.split('?')[1].split('=')[1].replace(')', '')
      )}`
    );
  }

  // 連結至課程頁面-kidin-1090624
  visitClass() {
    this.router.navigateByUrl(
      `/dashboard/group-info/${this.hashIdService.handleGroupIdEncode(
        this.groupInfo.groupId
      )}/group-introduction`
    );
  }

  // 將過長的介紹隱藏-kidin-1090326
  handleInfo(str, type) {
    switch (type) {
      case 'lessonInfo':
        this.lessonTotalInfo = str.replace(/\r\n|\n/g, '').trim();
        if (this.lessonTotalInfo.length > 40) {
          this.lessonPartInfo = this.lessonTotalInfo.substring(0, 40);
          this.showAllLessonInfo = false;
        } else {
          this.lessonPartInfo = this.lessonTotalInfo;
          this.showAllLessonInfo = true;
        }

        break;
      case 'coachInfo':
        this.coachTotalInfo = str.replace(/\r\n|\n/g, '').trim();
        if (this.coachTotalInfo.length > 40) {
          this.coachPartInfo = this.coachTotalInfo.substring(0, 40);
          this.showAllCoachInfo = false;
        } else {
          this.coachPartInfo = this.coachTotalInfo;
          this.showAllCoachInfo = true;
        }

        break;
    }
  }

  // 將過長的介紹全顯示-kidin-1090326
  handleExtendCoachInfo(type) {
    switch (type) {
      case 'lessonInfo':
        this.lessonPartInfo = this.lessonTotalInfo;
        this.showAllLessonInfo = true;

        break;
      case 'coachInfo':
        this.coachPartInfo = this.coachTotalInfo;
        this.showAllCoachInfo = true;

        break;
    }
  }

  print() {
    window.print();
  }

  /**
   * 改變loading狀態
   * @param status {boolean}-loading狀態
   * @author kidin-1091210
   */
  changeLoadingStatus(status: boolean) {
    this.isLoading = status;
    this.reportService.setReportLoading(status);
  }

  /**
   * 取消rxjs訂閱和卸除highchart
   */
  ngOnDestroy() {
    // 將之前生成的highchart卸除避免新生成的highchart無法顯示-kidin-1081219
    charts.forEach((_highChart, idx) => {
      if (_highChart !== undefined) {
        _highChart.destroy();
      }
    });

    if (this.classLink) {
      this.classLink.removeEventListener('click', this.visitClass.bind(this));
    }

    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }
}
