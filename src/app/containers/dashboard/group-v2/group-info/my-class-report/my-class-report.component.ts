import { Component, OnInit, OnDestroy, ViewChild, ElementRef, Renderer2, } from '@angular/core';
import { GroupDetailInfo, UserSimpleInfo } from '../../../models/group-detail';
import { GroupService } from '../../../services/group.service';
import { UtilsService } from '../../../../../shared/services/utils.service';
import { Subject, combineLatest } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import moment from 'moment';
import { ActivityService } from '../../../../../shared/services/activity.service';
import { QrcodeService } from '../../../../portal/services/qrcode.service';
import { getOptions } from 'highcharts';
import { TranslateService } from '@ngx-translate/core';
import { UserProfileService } from '../../../../../shared/services/user-profile.service';
import { Router } from '@angular/router';
import { HashIdService } from '../../../../../shared/services/hash-id.service';
import { SportsReportContent } from '../../../../../shared/models/sports-report'
import { chart, charts, color, each } from 'highcharts';
import { ReportService } from '../../../../../shared/services/report.service';
import { ReportConditionOpt } from '../../../../../shared/models/report-condition';
import { HrZoneRange } from '../../../../../shared/models/chart-data';


// 建立圖表用-kidin-1081212
class ChartOptions {
  constructor (dataset, colorIdx) {
    return {
      chart: {
        height: 400,
        spacingTop: 20,
        spacingBottom: 20,
        zoomType: 'x'
      },
      title: {
        text: dataset.name,
        align: 'left',
        margin: 0,
        x: 30,
        style: ''
      },
      credits: {
        enabled: false
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
          labels: null
        },
        minPadding: 0.01,
        maxPadding: 0.01,
        tickAmount: 1
      },
      plotOptions: {
        column: {
            pointPlacement: 0,
        },
        series: {
          pointPadding: 0,
          groupPadding: 0
        }
      },
      tooltip: {
        pointFormat: '{point.y}',
        xDateFormat: '%H:%M:%S',
        shadow: false,
        style: {
          fontSize: '14px'
        },
        valueDecimals: dataset.valueDecimals,
        split: true,
        share: true
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
            valueSuffix: ' ' + dataset.unit
          },
          dataLabels: {
            enabled: false
          }
        }
      ]
    };
  }
}

const errMsg = `Error.<br />Please try again later.`;

@Component({
  selector: 'app-my-class-report',
  templateUrl: './my-class-report.component.html',
  styleUrls: ['./my-class-report.component.scss', '../group-child-page.scss']
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
    noData: true
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
  sportsReportContent: SportsReportContent = {
    reportType: 'my-class',
    sportType: 1,
    dateRange: {
      startTimestamp: null,
      endTimestamp: null
    },
    image: null,
    nameInfo: {
      name: null
    },
    sportsInfo: {
      numOfData: null
    }
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
    startDate: moment().subtract(6, 'days').format('YYYY-MM-DDT00:00:00.000Z'),
    endDate: moment().format('YYYY-MM-DDT23:59:59.999Z')
  };
  startDate: string;
  reportCreatedTime = moment().format('YYYY-MM-DD HH:mm');
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
    description: ''
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
    { y: 0, color: '#f36953' }
  ];
  colorIdx = 0;
  hrZoneRange = <HrZoneRange>{
    hrBase: 0,
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
    reportType: 'sport',
    date: {
      startTimestamp: moment().startOf('day').subtract(6, 'days').valueOf(),
      endTimestamp: moment().endOf('day').valueOf(),
      type: 'sevenDay'
    },
    sportType: 99,
    hideConfirmBtn: true
  }

  @ViewChild('container', {static: false})
  container: ElementRef;
  @ViewChild('HRZoneChartTarget', {static: false})
  HRZoneChartTarget: ElementRef;
  @ViewChild('caloriesBurnedChartTarget', {static: false})
  caloriesBurnedChartTarget: ElementRef;
  @ViewChild('avgSpeedChartTarget', {static: false})
  avgSpeedChartTarget: ElementRef;
  @ViewChild('avgHRChartTarget', {static: false})
  avgHRChartTarget: ElementRef;
  @ViewChild('caloriesChartTarget', {static: false})
  caloriesChartTarget: ElementRef;

  constructor(
    private groupService: GroupService,
    private utils: UtilsService,
    private activityService: ActivityService,
    private translate: TranslateService,
    private userProfileService: UserProfileService,
    private hashIdService: HashIdService,
    private router: Router,
    private qrcodeService: QrcodeService,
    private renderer: Renderer2,
    private translateService: TranslateService,
    private reportService: ReportService
  ) {}

  ngOnInit(): void {
    this.initPage();

    if (location.search.indexOf('ipm=s') > -1) {
      this.isPreviewMode = true;
    }

    if (location.search.indexOf('debug=') > -1) {
      this.isDebug = true;
    }

    if (
      location.search.indexOf('startdate=') > -1 &&
      location.search.indexOf('enddate=') > -1 &&
      location.search.indexOf('sportType=') > -1 &&
      location.search.indexOf('id=')
    ) {
      this.urlOpenReprot = true;
      this.queryStringShowData();
    } else {
      this.reportService.setReportCondition(this.reportConditionOpt);
      this.getReportSelectedCondition();
    }

    charts.length = 0;  // 初始化global highchart物件，可避免HighCharts.Charts為 undefined -kidin-1081212
  }

  /**
   * 取得已儲存的群組詳細資訊、階層群組資訊、使用者資訊
   * @author kidin-1091020
   */
  initPage() {
    combineLatest([
      this.groupService.getRxGroupDetail(),
      this.groupService.getRxCommerceInfo(),
      this.groupService.getUserSimpleInfo()
    ]).pipe(
      takeUntil(this.ngUnsubscribe)
    ).subscribe(resArr => {
      this.groupInfo = resArr[0];
      Object.assign(resArr[0], {groupLevel: this.utils.displayGroupLevel(resArr[0].groupId)});
      Object.assign(resArr[0], {expired: resArr[1].expired});
      Object.assign(resArr[0], {commerceStatus: resArr[1].commerceStatus});
      this.userSimpleInfo = resArr[2];
    })

  }

  // 依query string顯示資料-kidin-20191226
  queryStringShowData () {
    const queryString = location.search.replace('?', '').split('&');
    for (let i = 0; i < queryString.length; i++) {
      if (queryString[i].indexOf('startdate=') > -1) {
        this.startDate = queryString[i].replace('startdate=', '');
        this.reportConditionOpt.date.startTimestamp = moment(queryString[i].replace('startdate=', '')).valueOf();
      } else if (queryString[i].indexOf('enddate=') > -1) {
        this.reportConditionOpt.date.endTimestamp = moment(queryString[i].replace('endDate=', '')).valueOf();
      } else if (queryString[i].indexOf('sportType=') > -1) {
        this.sportType = +queryString[i].replace('sportType=', '');
      } else if (queryString[i].indexOf('id=') > -1) {
        this.userId = this.hashIdService.handleGroupIdDecode(queryString[i].replace('id=', ''));
      }
    }

    if (!this.isPreviewMode) {
      this.reportConditionOpt.date.type = 'custom';
      this.reportService.setReportCondition(this.reportConditionOpt);
      this.getReportSelectedCondition();
    } else {
      this.selectDate = {
        startDate: moment(this.reportConditionOpt.date.startTimestamp).format('YYYY-MM-DDTHH:mm:ss.SSSZ'),
        endDate: moment(this.reportConditionOpt.date.endTimestamp).format('YYYY-MM-DDTHH:mm:ss.SSSZ')
      }

      this.handleSubmitSearch();
    }

  }

  /**
   * 取得使用者所篩選的條件
   * @author kidin-1091029
   */
  getReportSelectedCondition() {
    this.reportService.getReportCondition().pipe(
      takeUntil(this.ngUnsubscribe)
    ).subscribe(res => {
      if (res.date) {
        this.selectDate = {
          startDate: moment(res.date.startTimestamp).format('YYYY-MM-DDTHH:mm:ss.SSSZ'),
          endDate: moment(res.date.endTimestamp).format('YYYY-MM-DDTHH:mm:ss.SSSZ')
        };
  
        this.sportType = res.sportType;
        this.handleSubmitSearch();
      }

    });

  }

  // 使用者送出表單後顯示相關資料-kidin-1081209
  handleSubmitSearch () {
    this.token = this.utils.getToken() || '';
    this.reportCompleted = false;
    this.initVariable();
    this.getUserInfo();
    this.getGroupInfo();

    // 根據條件取得多筆運動檔案資料-kidin-1081211
    let targetUser,
        author;
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
        filterSameTime: '1'
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
          tag: ''
        }
      },
      display: {
        activityLapLayerDisplay: '3',
        activityLapLayerDataField: [],
        activityPointLayerDisplay: '2',  // 心率區間用，待2020/4月取消串接point資料-kidin-1081213
        activityPointLayerDataField: ['heartRateBpm'] // 心率區間用，待2020/4月取消串接point資料-kidin-1081213
      },
      page: '0',
      pageCounts: '1000'
    };
    this.sendRequest(body);
  }

  // 取得群組資訊-kidin-1090326
  getGroupInfo () {
    // 先從service取得群組資訊，若取不到再call api-kidin-1081210
    this.groupService.getGroupInfo().pipe(
      takeUntil(this.ngUnsubscribe)
    ).subscribe(res => {
      this.groupData = res;
      if (this.groupData.hasOwnProperty('groupId') && this.groupData.groupId === this.groupId) {
        this.groupId = this.groupData.groupId;
        this.showGroupInfo();
      } else {
        const urlArr = location.pathname.split('/');
        this.groupId = this.hashIdService.handleGroupIdDecode(urlArr[urlArr.length - 2]);
        const groupBody = {
          token: this.token,
          groupId: this.groupId,
          findRoot: '1',
          avatarType: '2'
        };

        this.groupService.fetchGroupListDetail(groupBody).subscribe(result => {
          this.groupData = result.info;
          this.groupService.saveGroupInfo(this.groupData);
          this.showGroupInfo();
        });
      }
    });
  }

  // 初始化變數-kidin-1081211
  initVariable () {
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
      { y: 0, color: '#f36953' }
    ];
    this.colorIdx = 0;
  }

  // 取得登入者資訊-kidin-1090326
  getUserInfo () {
    this.userProfileService.getRxUserProfile().pipe(
      takeUntil(this.ngUnsubscribe)
    ).subscribe(res => {
      if (+this.userId !== res.userId) {
        this.hrZoneRange['hrBase'] = 0;
        this.hrZoneRange['z0'] = 'Z0';
        this.hrZoneRange['z1'] = 'Z1';
        this.hrZoneRange['z2'] = 'Z2';
        this.hrZoneRange['z3'] = 'Z3';
        this.hrZoneRange['z4'] = 'Z4';
        this.hrZoneRange['z5'] = 'Z5';
      } else {
        const userAge = moment().diff(res.birthday, 'years'),
              userHRBase = res.heartRateBase,
              userMaxHR = res.heartRateMax,
              userRestHR = res.heartRateResting;

        this.getUserBodyInfo(userHRBase, userAge, userMaxHR, userRestHR);
      }

    });

  }

  // 取得使用者資訊並計算心率區間範圍()-kidin-1090203
  getUserBodyInfo (userHRBase, userAge, userMaxHR, userRestHR) {
    if (userAge !== null) {
      if (userMaxHR && userRestHR) {
        if (userHRBase === 0) {
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
          this.hrZoneRange['z0'] = Math.floor((userMaxHR - userRestHR) * (0.55)) + userRestHR;
          this.hrZoneRange['z1'] = Math.floor((userMaxHR - userRestHR) * (0.6)) + userRestHR;
          this.hrZoneRange['z2'] = Math.floor((userMaxHR - userRestHR) * (0.65)) + userRestHR;
          this.hrZoneRange['z3'] = Math.floor((userMaxHR - userRestHR) * (0.75)) + userRestHR;
          this.hrZoneRange['z4'] = Math.floor((userMaxHR - userRestHR) * (0.85)) + userRestHR;
          this.hrZoneRange['z5'] = Math.floor((userMaxHR - userRestHR) * (1)) + userRestHR;
        }
      } else {
        if (userHRBase === 0) {
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
          this.hrZoneRange['z0'] = Math.floor(((220 - userAge) - userRestHR) * (0.55)) + userRestHR;
          this.hrZoneRange['z1'] = Math.floor(((220 - userAge) - userRestHR) * (0.6)) + userRestHR;
          this.hrZoneRange['z2'] = Math.floor(((220 - userAge) - userRestHR) * (0.65)) + userRestHR;
          this.hrZoneRange['z3'] = Math.floor(((220 - userAge) - userRestHR) * (0.75)) + userRestHR;
          this.hrZoneRange['z4'] = Math.floor(((220 - userAge) - userRestHR) * (0.85)) + userRestHR;
          this.hrZoneRange['z5'] = Math.floor(((220 - userAge) - userRestHR) * (1)) + userRestHR;
        }
      }
    } else {
      this.hrZoneRange['hrBase'] = 0;
      this.hrZoneRange['z0'] = 'Z0';
      this.hrZoneRange['z1'] = 'Z1';
      this.hrZoneRange['z2'] = 'Z2';
      this.hrZoneRange['z3'] = 'Z3';
      this.hrZoneRange['z4'] = 'Z4';
      this.hrZoneRange['z5'] = 'Z5';
    }
  }

  // 顯示群組資料-kidin-1081227
  showGroupInfo () {
    const groupIcon = this.groupData.groupIcon;
      const brandIcon = this.groupData.groupRootInfo[2].brandIcon;
      this.groupImg =
        (
          groupIcon && groupIcon.length > 0
              ? groupIcon
              : '/assets/images/group-default.svg'
        );
      this.brandImg =
        (
          brandIcon && brandIcon.length > 0
              ? brandIcon
              : '/assets/images/group-default.svg'
        );
      this.brandName = this.groupData.groupRootInfo[2].brandName;
      this.branchName = this.groupData.groupRootInfo[3].branchName;

      this.handleInfo(this.groupData.groupDesc, 'lessonInfo');
  }

  // 取得多筆活動資料並處理-kidin-1081211
  sendRequest (body) {
    this.changeLoadingStatus(true);
    this.activityService.fetchMultiActivityData(body).subscribe(res => {
      const activity = res.info.activities;
      if (res.resultCode !== 200) {
        this.hasResData = false;
        this.updateUrl('false');
        this.reportCompleted = true;
        this.initialChartComplated = true;
        this.changeLoadingStatus(false);
      } else {
        this.activityLength = activity.length;
        if (this.activityLength === 0) {
          this.hasResData = false;
          this.updateUrl('false');
          this.reportCompleted = true;
          this.initialChartComplated = true;
          this.changeLoadingStatus(false);
        } else {
          this.isSelectDateRange = false;
          this.hasResData = true;
          const infoData = activity[0];
          this.fileInfo = infoData.fileInfo;

          let timeCount = 0,
              HRCount = 0,
              caloriesCount = 0,
              HRZoneZero = 0,
              HRZoneOne = 0,
              HRZoneTwo = 0,
              HRZoneThree = 0,
              HRZoneFour = 0,
              HRZoneFive = 0;

          for (let i = 0; i < this.activityLength; i++) {
            const activityItem = activity[i].activityInfoLayer;
            timeCount += activityItem.totalSecond;
            HRCount += activityItem.avgHeartRateBpm;
            caloriesCount += activityItem.calories;

            // 取得心率區間-kidin-1081213
            if (activityItem.totalHrZone0Second !== null) {
              HRZoneZero += activityItem.totalHrZone0Second > 0 ? activityItem.totalHrZone0Second : 0;
              HRZoneOne += activityItem.totalHrZone1Second > 0 ? activityItem.totalHrZone1Second : 0;
              HRZoneTwo += activityItem.totalHrZone2Second > 0 ? activityItem.totalHrZone2Second : 0;
              HRZoneThree += activityItem.totalHrZone3Second > 0 ? activityItem.totalHrZone3Second : 0;
              HRZoneFour += activityItem.totalHrZone4Second > 0 ? activityItem.totalHrZone4Second : 0;
              HRZoneFive += activityItem.totalHrZone5Second > 0 ? activityItem.totalHrZone5Second : 0;
            } else {
              // 計算心率區間-kidin-1081213
              const hrBpm = activity[i].activityPointLayer,
              resolutionSeconds = 3;
              for (let j = 0; j < hrBpm.length; j++) {
                if (hrBpm[j].heartRateBpm !== 0) {
                  if (hrBpm[j].heartRateBpm.heartRateBpm >= this.hrZoneRange.z0 && hrBpm[j].heartRateBpm < this.hrZoneRange.z1) {
                    HRZoneOne += resolutionSeconds;
                  } else if (hrBpm[j].heartRateBpm >= (this.hrZoneRange.z1 as any) + 1 && hrBpm[j].heartRateBpm < this.hrZoneRange.z2) {
                    HRZoneTwo += resolutionSeconds;
                  } else if (hrBpm[j].heartRateBpm >= (this.hrZoneRange.z2 as any) + 1 && hrBpm[j].heartRateBpm < this.hrZoneRange.z3) {
                    HRZoneThree += resolutionSeconds;
                  } else if (hrBpm[j].heartRateBpm >= (this.hrZoneRange.z3 as any) + 1 && hrBpm[j].heartRateBpm < this.hrZoneRange.z4) {
                    HRZoneFour += resolutionSeconds;
                  } else if (hrBpm[j].heartRateBpm >= (this.hrZoneRange.z4 as any) + 1) {
                    HRZoneFive += resolutionSeconds;
                  } else {
                    HRZoneZero += resolutionSeconds;
                  }
                }
              }
            }

            this.dateList.unshift(this.formatDate(activity[i].fileInfo.creationDate));
            this.avgHRList.unshift(activityItem.avgHeartRateBpm);
            this.caloriesList.unshift(activityItem.calories);
          }

          this.calculateTotalTime(timeCount);
          this.avgHR = HRCount / this.activityLength;
          this.totalCalories = caloriesCount;
          this.burnedCalories = this.totalCalories / 7700;

          const totalHRSecond = HRZoneZero + HRZoneOne + HRZoneTwo + HRZoneThree + HRZoneFour + HRZoneFive;
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

  // 取得變數內容並將部分變數替換成html element-kidin-1090623
  getReportInfo () {
    const targetDiv = document.getElementById('reportInfo');
    this.translateService.get('hellow world').subscribe(() => {
      targetDiv.innerHTML = this.translateService.instant('universal_group_myReportOnPeriod', {
        'class': `[<span id="classLink" class="activity-Link">${this.fileInfo.dispName}</span>]`,
        'startDate': moment(this.selectDate.startDate).format('YYYY-MM-DD'),
        'endDate': moment(this.selectDate.endDate).format('YYYY-MM-DD'),
        'number': `<span class="fileAmount">${this.activityLength}</span>`
      });

    });

    this.classLink = document.getElementById('classLink');
    this.classLink.addEventListener('click', this.visitClass.bind(this));
  }

  // 取得平均心率座落的區間-kidin-1090326
  findAvgHRZone (hrZone) {
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
        this.avgHRZone = `${this.translateService.instant('universal_activityData_limit_generalZone')} ${mostHRZone}%`;
        break;
      case 1:
        this.avgHRZone = `${this.translateService.instant('universal_activityData_warmUpZone')} ${mostHRZone}%`;
        break;
      case 2:
        this.avgHRZone = `${this.translateService.instant('universal_activityData_aerobicZone')} ${mostHRZone}%`;
        break;
      case 3:
        this.avgHRZone = `${this.translateService.instant('universal_activityData_enduranceZone')} ${mostHRZone}%`;
        break;
      case 4:
        this.avgHRZone = `${this.translateService.instant('universal_activityData_marathonZone')} ${mostHRZone}%`;
        break;
      case 5:
        this.avgHRZone = `${this.translateService.instant('universal_activityData_anaerobicZone')} ${mostHRZone}%`;
        break;
    }
  }

  // 將搜尋的類別和範圍處理過後加入query string並更新現在的url和預覽列印的url-kidin-1081226
  updateUrl (str) {
    let newUrl;
    if (str === 'true') {
      const startDateString = this.selectDate.startDate.split('T')[0],
            endDateString = this.selectDate.endDate.split('T')[0];
      let searchString;

      let userId: string;
      if (this.fileInfo.author.indexOf('?') > 0) {
        userId = this.hashIdService.handleUserIdEncode(
          this.fileInfo.author
            .split('?')[1]
            .split('=')[1]
            .replace(')', '')
        );
      } else {
        userId = this.hashIdService.handleUserIdEncode(
          this.fileInfo.author.replace(')', '')
        );
      }

      searchString = `startdate=${startDateString}&enddate=${endDateString}&sportType=${this.sportType}&id=${userId}`;

      if (location.search.indexOf('?') > -1) {
        if (
          location.search.indexOf('startdate=') > -1 &&
          location.search.indexOf('enddate=') > -1 &&
          location.search.indexOf('sportType=') > -1 &&
          location.search.indexOf('id=') > -1
        ) {
          // 將舊的sr query string換成新的-kidin-1081226
          const preUrl = location.pathname;
          const queryString = location.search.replace('?', '').split('&');
          let newSufUrl = '';
          for (let i = 0; i < queryString.length; i++) {
            if (
              queryString[i].indexOf('startdate=') === -1 &&
              queryString[i].indexOf('enddate=') === -1 &&
              queryString[i].indexOf('sportType=') === -1 &&
              queryString[i].indexOf('id=') === -1
            ) {
              newSufUrl = `${newSufUrl}&${queryString[i]}`;
            }
          }
          newUrl = `${preUrl}?${searchString} ${newSufUrl}`;
        } else {
          newUrl = location.pathname + location.search + `&${searchString}`;
        }
      } else {
        newUrl = location.pathname + `?${searchString}`;
      }

      this.previewUrl = newUrl + '&ipm=s';
    } else {
      newUrl = location.pathname;
    }

    if (history.pushState) {
      window.history.pushState({path: newUrl}, '', newUrl);
    }
  }

  // 計算多筆資料合計的總運動時間-kidin-1081211
  calculateTotalTime (timeCount) {
    if (timeCount < 60) {
      this.totalTime = `00:${this.fillTwoDigits(timeCount)}`;
    } else if ( timeCount < 3600) {
      const minute = Math.floor((timeCount) / 60);
      const second = timeCount % 60;
      this.totalTime = `${this.fillTwoDigits(minute)}:${this.fillTwoDigits(second)}`;
    } else {
      const hour = Math.floor((timeCount) / 3600);
      const minute = Math.floor((timeCount % 3600) / 60);
      const second = timeCount - (hour * 3600) - (minute * 60);
      this.totalTime = `${hour}:${this.fillTwoDigits(minute)}:${this.fillTwoDigits(second)}`;
    }
  }

  // 時間補零-kidin-1081211
  fillTwoDigits (num: number) {
    const timeStr = '0' + Math.floor(num);
    return timeStr.substr(-2);
  }

  // 使檔案創建日期符合格式-kidin-1081211
  formatDate (date: string) {
    const month = date.slice(5, 7);
    const day = date.slice(8, 10);
    return `${month}/${day}`;
  }

  // 將數字取四捨五入至第一位-kidin-1081227
  handleMathRound (num) {
    if (num % 1 === 0) {
      return num;
    } else {
      return Number(parseFloat(num).toFixed(1));
    }
  }

  // 初始化highChart-kidin-1081211
  initHighChart () {
    // 將之前生成的highchart卸除避免新生成的highchart無法顯示-kidin-1081219
    charts.forEach((_highChart, idx) => {
      if (_highChart !== undefined) {
        _highChart.destroy();
      }
    });
    charts.length = 0;  // 初始化global highchart物件，可避免HighCharts.Charts為 undefined -kidin-1081212
    this.chartDatas.length = 0;
    this.chartTargetList.length = 0;

    // 平均心率區間落點圖表-kidin-1081212
    const HRZoneDataset = {
      name: 'Heart Rate Zone',
      data: this.HRZoneColorSet,
      unit: '%',
      type: 'column',
      valueDecimals: 1
    };
    const HRZoneChartOptions = new ChartOptions(HRZoneDataset, this.colorIdx);
    HRZoneChartOptions['plotOptions'].column['pointPlacement'] = 0;
    HRZoneChartOptions['series'][0].dataLabels = {
      enabled: true,
      formatter: function () {
        return this.y + '%';
      }
    };
    HRZoneChartOptions['series'][0].showInLegend = false;
    HRZoneChartOptions['chart'].zoomType = '';
    HRZoneChartOptions['xAxis'].categories = [
      this.translateService.instant('universal_activityData_limit_generalZone'),
      this.translateService.instant('universal_activityData_warmUpZone'),
      this.translateService.instant('universal_activityData_aerobicZone'),
      this.translateService.instant('universal_activityData_enduranceZone'),
      this.translateService.instant('universal_activityData_marathonZone'),
      this.translateService.instant('universal_activityData_anaerobicZone')
    ];
    HRZoneChartOptions['yAxis'].labels = {
      formatter: function () {
        return this.value + '%';
      }
    };

    this.chartDatas.push({ HRZoneChartTarget: HRZoneChartOptions, isSyncExtremes: false });
    this.chartTargetList.push('HRZoneChartTarget');

    const chartHeight = 260;  // 折線圖高度設定-kidin-1081227

    // 平均心率圖表-kidin-1081216
    const avgHRDataset = {
      name: 'Average Heart Rate',
      data: this.avgHRList,
      unit: 'bmp',
      type: 'area',
      valueDecimals: 1
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
                y2: 1
            },
            stops: [
                [0, getOptions().colors[this.colorIdx]],
                [1, color(getOptions().colors[this.colorIdx]).setOpacity(0).get('rgba')]
            ]
        },
        marker: {
            radius: 2
        },
        lineWidth: 1,
        states: {
            hover: {
                lineWidth: 1
            }
        }
      }
    };

    this.chartDatas.push({ avgHRChartTarget: avgHRChartOptions, isSyncExtremes: true });
    this.chartTargetList.push('avgHRChartTarget');

    // 卡路里圖表-kidin-1081216
    const caloriesDataset = {
      name: 'Calories',
      data: this.caloriesList,
      unit: 'cal',
      type: 'area',
      valueDecimals: 1
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
                y2: 1
            },
            stops: [
                [0, getOptions().colors[this.colorIdx]],
                [1, color(getOptions().colors[this.colorIdx]).setOpacity(0).get('rgba')]
            ]
        },
        marker: {
            radius: 2
        },
        lineWidth: 1,
        states: {
            hover: {
                lineWidth: 1
            }
        }
      }
    };

    this.chartDatas.push({ caloriesChartTarget: caloriesChartOptions, isSyncExtremes: true });
    this.chartTargetList.push('caloriesChartTarget');

    // 根據圖表清單依序將圖表顯示出來-kidin-1081217
    const chartTargetList = this.chartTargetList;
    setTimeout(() => {
      this.chartDatas.forEach((_option, idx) => {
        this[`show${chartTargetList[idx]}`] = true;
        _option[
          chartTargetList[idx]
        ].xAxis.events.setExtremes = this.syncExtremes.bind(
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

      this.renderer.listen(this.container.nativeElement, 'mousemove', e =>
        this.handleSynchronizedPoint(e, this.chartDatas)
      );
      this.renderer.listen(this.container.nativeElement, 'touchmove', e =>
        this.handleSynchronizedPoint(e, this.chartDatas)
      );
      this.renderer.listen(this.container.nativeElement, 'touchstart', e =>
        this.handleSynchronizedPoint(e, this.chartDatas)
      );
    }, 3000);
  }

  // 調整縮放會同步-kidin-1081212
  syncExtremes(num, finalDatas, e) {
    const thisChart = this.charts[num];
    if (e.trigger !== 'syncExtremes') {
      each(charts, function(_chart, idx) {
        if (_chart !== thisChart && _chart && finalDatas[idx].isSyncExtremes) {
          if (_chart.xAxis[0].setExtremes) {
            _chart.xAxis[0].setExtremes(e.min, e.max, undefined, false, {
              trigger: 'syncExtremes'
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

  getClassDetails (SN, coachId) {
    // 取得裝置資訊-kidin-1081218
    const deviceDody = {
      'token': '',
      'queryType': '1',
      'queryArray': SN
    };
    this.qrcodeService.getProductInfo(deviceDody).subscribe(res => {
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
      avatarType: '2'
    };

    this.userProfileService.getUserProfile(bodyForCoach).subscribe(res => {
      if (res.processResult.resultCode === 200) {
        this.coachInfo = res.userProfile;
      } else {
        this.coachInfo = {
          avatarUrl: '/assets/images/user2.png',
          description: '',
          nickname: 'No data'
        };

      }

      this.handleInfo(this.coachInfo.description, 'coachInfo');
    });

  }

  // 連結至個人頁面-kidin-1081223
  visitAuthor() {
    this.router.navigateByUrl(
      `/user-profile/${this.hashIdService.handleUserIdEncode(
        this.fileInfo.author
          .split('?')[1]
          .split('=')[1]
          .replace(')', '')
      )}`
    );

  }

  // 連結至課程頁面-kidin-1090624
  visitClass () {
    this.router.navigateByUrl(
      `/dashboard/group-info/${this.hashIdService.handleGroupIdEncode(this.groupInfo.groupId)}/group-introduction`
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
