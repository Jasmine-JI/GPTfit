import { Component, OnInit, Output, OnChanges, OnDestroy, EventEmitter } from '@angular/core';
import moment from 'moment';
import { Subject } from 'rxjs';
import { first, takeUntil, tap, switchMap } from 'rxjs/operators';
import { ActivatedRoute } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';

import { UtilsService } from '@shared/services/utils.service';
import { HashIdService } from '@shared/services/hash-id.service';
import { UserProfileService } from '../../../services/user-profile.service';
import { ReportService } from '../../../services/report.service';
import * as _Highcharts from 'highcharts';
import { ReportConditionOpt } from '../../../models/report-condition';

const Highcharts: any = _Highcharts; // 不檢查highchart型態

@Component({
  selector: 'app-report-content',
  templateUrl: './report-content.component.html',
  styleUrls: ['./report-content.component.scss']
})
export class ReportContentComponent implements OnInit, OnChanges, OnDestroy {

  private ngUnsubscribe = new Subject();

  /**
   * 報告頁面可讓使用者篩選的條件
   */
  reportConditionOpt: ReportConditionOpt = {
    reportType: 'sport',
    date: {
      startTimestamp: moment().startOf('day').subtract(6, 'days').valueOf(),
      endTimestamp: moment().endOf('day').valueOf(),
    },
    sportType: 99,
    hideConfirmBtn: true
  }

  // UI控制相關變數-kidin-1090115
  isLoading = true;
  isRxjsLoading = true;
  isPreviewMode = false;
  initialChartComplated = false;
  nodata = false;
  dataDateRange = '';
  showReport = false;
  selectType = 99;
  proficiency = 'metacarpus'; // 預設進階者
  description: string;
  handleMuscleData = false;

  // 資料儲存用變數-kidin-1090115
  @Output() showPrivacyUi = new EventEmitter();
  token: string;
  userId: number;
  reportCategory = 99;
  reportStartTime = '';
  reportEndTime = '';
  reportEndDate = '';
  period = '';
  reportStartDate = '';
  reportRangeType = 1;
  reportCreatedTime = moment().format('YYYY/MM/DD HH:mm');
  fileInfo: any;
  activitiesList: any;
  previewUrl = '';
  activityLength = 0;
  categoryActivityLength = 0;
  totalTime = '';
  avgTime = '';
  totalCalories = 0;
  avgCalories = 0;
  totalDistance = 0;
  totalWeight = 0;
  totalHrZoneZero = 0;
  totalHrZoneOne = 0;
  totalHrZoneTwo = 0;
  totalHrZoneThree = 0;
  totalHrZoneFour = 0;
  totalHrZoneFive = 0;
  bestCalories = 0;
  bestCadence = 0;
  avgCadence = 0;
  bestHR = 0;
  avgHR = 0;
  bestPace = '';
  avgPace = '';
  bestSwolf = 0;
  avgSwolf = 0;
  bestSpeed = 0;
  avgSpeed = 0;
  bestPower = 0;
  avgPower = 0;

  // 圖表用數據-kidin-1090115
  userWeight = 70; // 預設使用者體重為70kg
  chartTimeStamp = [];
  searchDate = [];
  perTypeLength = [];
  perTypeTime = [];
  typeHrZone = [];
  perHrZoneData = [];
  perDate = [];
  targetUserHRSetting: object;
  perCalories = [];
  perSpeedData = [];
  perPaceData = [];
  perCadenceData = [];
  perSwolfData = [];
  perHRData = [];
  perPowerData = [];
  perAvgHR = [];
  perActivityTime = [];
  hrZoneRange = {
    HRBase: 0,
    z0: 'Z0',
    z1: 'Z1',
    z2: 'Z2',
    z3: 'Z3',
    z4: 'Z4',
    z5: 'Z5',
  };
  typeList = [];
  trainingPart = [];
  proficiencyCoefficient = 2;
  level = ['1%', '50%', '100%'];
  muscleTrendList: Array<any> = [];

  constructor(
    private utilsService: UtilsService,
    private hashIdService: HashIdService,
    private route: ActivatedRoute,
    private userProfileService: UserProfileService,
    private reportService: ReportService,
    private translate: TranslateService
  ) { }

  ngOnInit() {
    this.token = this.utilsService.getToken() || '';
    this.getRxjsData();

    // 確認ngx translate套件已經載入再產生翻譯-kidin-1090415
    this.translate.get('hello.world').subscribe(() => {
      this.description = this.translate.instant('universal_activityData_muscleColorIllustration');
    });

    // 確認是否為預覽列印頁面-kidin-1090205
    if (location.search.indexOf('ipm=s') > -1) {
      this.isPreviewMode = true;
      this.getProficiency(location.search);
    }

    this.reportService.setReportCondition(this.reportConditionOpt);

    if (
      location.search.indexOf('startdate=') > -1
      || location.search.indexOf('enddate=') > -1
      || location.search.indexOf('sport=') > -1
    ) {
      this.queryStringShowData();
    }

  }

  ngOnChanges () {}

  // 從query string取得重訓程度-kidin-1090415
  getProficiency (query) {
    const queryString = query.replace('?', '').split('&');
    for (let i = 0; i < queryString.length; i++) {

      if (queryString[i].indexOf('selectProficiency=') > -1) {
        const proficiency = queryString[i].replace('selectProficiency=', '');
        this.handleproficiency(+proficiency);
      }

    }

  }

  // 依query string顯示資料-kidin-20191226
  queryStringShowData () {
    const queryString = location.search.replace('?', '').split('&');
    for (let i = 0; i < queryString.length; i++) {
      if (queryString[i].indexOf('startdate=') > -1) {
        this.reportStartTime = moment(queryString[i].replace('startdate=', '')).format('YYYY-MM-DDT00:00:00.000Z');
      } else if (queryString[i].indexOf('enddate=') > -1) {
        this.reportEndTime = moment(queryString[i].replace('enddate=', '')).format('YYYY-MM-DDT23:59:59.999Z');
      } else if (queryString[i].indexOf('sport=') > -1) {
        this.reportCategory = +queryString[i].replace('sport=', '');
      }

    }

    this.createReport();
  }

  // 從rxjs取得儲存數據-kidin-1090415
  getRxjsData () {
    const hashUserId = this.route.snapshot.paramMap.get('userId');
    if (hashUserId === null) {
      this.userProfileService.getRxUserProfile().pipe(
        tap(userProfileRes => {
          this.fileInfo = userProfileRes;
          this.userWeight = this.fileInfo.bodyWeight;
          this.userId = this.fileInfo.userId;

          // 取得登入者心率區間-kidin-1090727
          const userAge = moment().diff(this.fileInfo.birthday, 'years'),
                userHRBase = this.fileInfo.heartRateBase,
                userMaxHR = this.fileInfo.heartRateMax,
                userRestHR = this.fileInfo.heartRateResting;

          this.getUserBodyInfo(userHRBase, userAge, userMaxHR, userRestHR);
        }),
        // 使用rxjs訂閱搜索日期使搜索日期更改時可以即時切換-kidin-1090121
        switchMap(() => this.reportService.getReportCondition().pipe(
          tap(reportAddition => {
            this.reportStartTime = moment(reportAddition.date.startTimestamp).format('YYYY-MM-DDTHH:mm:ss.SSSZ');
            this.reportEndTime = moment(reportAddition.date.endTimestamp).format('YYYY-MM-DDTHH:mm:ss.SSSZ');
            this.reportEndDate = this.reportEndTime.split('T')[0].replace(/-/g, '/');
            this.switchPeriod();
            this.createReport();

            this.reportCategory = reportAddition.sportType;
            this.loadCategoryData(reportAddition.sportType);
          })
        )),
        takeUntil(this.ngUnsubscribe)
      ).subscribe();

    } else {
      this.userId = +this.hashIdService.handleUserIdDecode(hashUserId);
      this.hrZoneRange['HRBase'] = 0;
      this.hrZoneRange['z0'] = 'Z0';
      this.hrZoneRange['z1'] = 'Z1';
      this.hrZoneRange['z2'] = 'Z2';
      this.hrZoneRange['z3'] = 'Z3';
      this.hrZoneRange['z4'] = 'Z4';
      this.hrZoneRange['z5'] = 'Z5';

      // 使用rxjs訂閱搜索日期使搜索日期更改時可以即時切換-kidin-1090121
      this.reportService.getReportCondition().pipe(
        takeUntil(this.ngUnsubscribe)
      ).subscribe(response => {
        this.reportStartTime = moment(response.date.startTimestamp).format('YYYY-MM-DDTHH:mm:ss.SSSZ');
        this.reportEndTime = moment(response.date.endTimestamp).format('YYYY-MM-DDTHH:mm:ss.SSSZ');
        this.reportEndDate = this.reportEndTime.split('T')[0].replace(/-/g, '/');
        this.switchPeriod();
        this.createReport();

        this.reportCategory = response.sportType;
        this.loadCategoryData(response.sportType);
      });
    }

  }

  // 建立運動報告-kidin-1090117
  createReport() {
    if (this.userId) {
      this.isLoading = true;
      this.initVariable();

      // 1個月內取日概要陣列，半年以上取周概要陣列-kidin_1090122
      this.checkReportRangeType(this.reportStartTime, this.reportEndTime);

      const body = {
        token: this.token || '',
        type: this.reportRangeType,
        targetUserId: [this.userId],
        filterStartTime: this.reportStartTime,
        filterEndTime: this.reportEndTime
      };

      this.reportService.fetchSportSummaryArray(body).subscribe(res => {
        if (res[0].resultCode === 400 || res[0].resultCode === 401 || res[0].resultCode === 402 || res[0].resultCode === 403) {
          this.isLoading = false;
          this.updateUrl('false');
          return this.showPrivacyUi.emit(true);
        } else if (res[0].resultCode === 200) {
          this.showPrivacyUi.emit(false);
          const dataLength = res[0].reportInfo.totalPoint;
          if (dataLength === 0) {
            this.nodata = true;
            this.isLoading = false;
            this.updateUrl('false');
          } else {
            if (this.reportRangeType === 1) {
              this.activitiesList = res[0].reportActivityDays;
              this.dataDateRange = 'day';
              this.updateUrl('true');
            } else {
              this.activitiesList = res[0].reportActivityWeeks;
              this.dataDateRange = 'week';
              this.updateUrl('true');
            }

            this.showReport = true;

            const startDay = moment(this.reportStartTime),
                  endDay = moment(this.reportEndTime);

            this.createTimeStampArr(endDay.diff(startDay, 'days') + 1);
            this.calPerCategoryData();
          }
        } else {
          console.log('Error');
        }
      });

    }

  }

  // 依據選擇的搜索日期切換顯示-kidin-1090121
  switchPeriod () {
    // 用get方法確認translate套件已完成載入(Bug 1147)-kidin-1090316
    this.translate.get('hello.world').subscribe(() => {
      const diffDay = moment(this.reportEndTime).diff(moment(this.reportStartTime), 'days') + 1;
      this.period = `${diffDay} ${this.translate.instant(
        'universal_time_day'
      )}`;

      // 52天內取日概要陣列，52天以上取周概要陣列-kidin_1090211
      if (diffDay <= 52) {
        this.reportRangeType = 1;
        this.dataDateRange = 'day';
      } else {
        this.reportRangeType = 2;
        this.dataDateRange = 'week';
      }

      this.period = `${diffDay} ${this.translate.instant(
        'universal_time_day'
      )}`;

    });

  }

  // 取得使用者資訊並計算心率區間範圍()-kidin-1090203
  getUserBodyInfo (userHRBase, userAge, userMaxHR, userRestHR) {
    if (userAge !== null) {
      if (userMaxHR && userRestHR) {
        if (userHRBase === 0) {
          // 區間數值採無條件捨去法
          this.hrZoneRange['HRBase'] = userHRBase;
          this.hrZoneRange['z0'] = Math.floor((220 - userAge) * 0.5) + '';
          this.hrZoneRange['z1'] = Math.floor((220 - userAge) * 0.6 - 1) + '';
          this.hrZoneRange['z2'] = Math.floor((220 - userAge) * 0.7 - 1) + '';
          this.hrZoneRange['z3'] = Math.floor((220 - userAge) * 0.8 - 1) + '';
          this.hrZoneRange['z4'] = Math.floor((220 - userAge) * 0.9 - 1) + '';
          this.hrZoneRange['z5'] = Math.floor((220 - userAge) * 1) + '';
        } else {
          this.hrZoneRange['HRBase'] = userHRBase;
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
          this.hrZoneRange['HRBase'] = userHRBase;
          this.hrZoneRange['z0'] = Math.floor((220 - userAge) * 0.5) + '';
          this.hrZoneRange['z1'] = Math.floor((220 - userAge) * 0.6 - 1) + '';
          this.hrZoneRange['z2'] = Math.floor((220 - userAge) * 0.7 - 1) + '';
          this.hrZoneRange['z3'] = Math.floor((220 - userAge) * 0.8 - 1) + '';
          this.hrZoneRange['z4'] = Math.floor((220 - userAge) * 0.9 - 1) + '';
          this.hrZoneRange['z5'] = Math.floor((220 - userAge) * 1) + '';
        } else {
          this.hrZoneRange['HRBase'] = userHRBase;
          this.hrZoneRange['z0'] = Math.floor(((220 - userAge) - userRestHR) * (0.55)) + userRestHR;
          this.hrZoneRange['z1'] = Math.floor(((220 - userAge) - userRestHR) * (0.6)) + userRestHR;
          this.hrZoneRange['z2'] = Math.floor(((220 - userAge) - userRestHR) * (0.65)) + userRestHR;
          this.hrZoneRange['z3'] = Math.floor(((220 - userAge) - userRestHR) * (0.75)) + userRestHR;
          this.hrZoneRange['z4'] = Math.floor(((220 - userAge) - userRestHR) * (0.85)) + userRestHR;
          this.hrZoneRange['z5'] = Math.floor(((220 - userAge) - userRestHR) * (1)) + userRestHR;
        }
      }
    } else {
      this.hrZoneRange['HRBase'] = 0;
      this.hrZoneRange['z0'] = 'Z0';
      this.hrZoneRange['z1'] = 'Z1';
      this.hrZoneRange['z2'] = 'Z2';
      this.hrZoneRange['z3'] = 'Z3';
      this.hrZoneRange['z4'] = 'Z4';
      this.hrZoneRange['z5'] = 'Z5';
    }
  }

  // 初始化變數
  initVariable () {
    this.nodata = false;
    this.handleMuscleData = false;
    this.activityLength = 0;
    this.totalTime = '00:00';
    this.avgTime = '00:00';
    this.totalDistance = 0;
    this.totalWeight = 0;
    this.totalHrZoneZero = 0;
    this.totalHrZoneOne = 0;
    this.totalHrZoneThree = 0;
    this.totalHrZoneFour = 0;
    this.totalHrZoneFive = 0;
    this.avgCalories = 0;
    this.totalCalories = 0;
    this.reportService.setTypeAllData({}, {}, {}, {}, {}, {}, {}, {});
    this.perHrZoneData = [];
    this.perTypeLength = [];
    this.perTypeTime = [];
    this.typeHrZone = [];
    this.perDate = [];
    this.chartTimeStamp = [];
    this.searchDate = [];
    this.trainingPart = [];
    this.muscleTrendList = [];
  }

  // 建立報告期間的timeStamp讓圖表使用-kidin-1090324
  createTimeStampArr (range) {

    this.searchDate = [
      moment(this.reportStartTime.split('T')[0], 'YYYY-MM-DD').valueOf(),
      moment(this.reportEndTime.split('T')[0], 'YYYY-MM-DD').valueOf()
    ];

    if (this.dataDateRange === 'day') {

      for (let i = 0; i < range; i++) {
        this.chartTimeStamp.push(this.searchDate[0] + 86400000 * i);
      }

    } else {
      const weekCoefficient = this.findDate();

      for (let i = 0; i < weekCoefficient.weekNum; i++) {
        this.chartTimeStamp.push(weekCoefficient.startDate + 86400000 * i * 7);
      }

    }

  }

  // 根據搜索時間取得周報告第一周的開始日期和週數-kidin-1090324
  findDate () {

    const week = {
      startDate: 0,
      weekNum: 0
    };

    let weekEndDate;

    // 周報告開頭是星期日-kidin-1090312
    if (moment(this.searchDate[0]).isoWeekday() !== 7) {
      week.startDate = this.searchDate[0] - 86400 * 1000 * moment(this.searchDate[0]).isoWeekday();
    } else {
      week.startDate = this.searchDate[0];
    }

    if (moment(this.searchDate[0]).isoWeekday() !== 7) {
      weekEndDate = this.searchDate[1] - 86400 * 1000 * moment(this.searchDate[1]).isoWeekday();
    } else {
      weekEndDate = this.searchDate[1];
    }

    week.weekNum = ((weekEndDate - week.startDate) / (86400 * 1000 * 7)) + 1;

    return week;
  }

  // 計算各種所需數據-kidin-1090120
  calPerCategoryData () {
    const typeList = [],
          typeAllHrZoneData = [],
          typeAllCalories = [],
          typeAllDataDate = [],
          typeAllavgHr = [],
          typeAllActivityTime = [],
          typeRunHrZoneData = [],
          typeRunCalories = [],
          typeRunDataDate = [],
          typeRunSpeed = [],
          typeRunMaxSpeed = [],
          typeRunCadence = [],
          typeRunMaxCadence = [],
          typeRunHR = [],
          typeRunMaxHR = [],
          typeCycleHrZoneData = [],
          typeCycleCalories = [],
          typeCycleDataDate = [],
          typeCycleSpeed = [],
          typeCycleMaxSpeed = [],
          typeCycleCadence = [],
          typeCycleMaxCadence = [],
          typeCycleHR = [],
          typeCycleMaxHR = [],
          typeCyclePower = [],
          typeCycleMaxPower = [],
          typeWeightTrainCalories = [],
          typeWeightTrainDataDate = [],
          typeSwimHrZoneData = [],
          typeSwimCalories = [],
          typeSwimDataDate = [],
          typeSwimSpeed = [],
          typeSwimMaxSpeed = [],
          typeSwimCadence = [],
          typeSwimMaxCadence = [],
          typeSwimSwolf = [],
          typeSwimMaxSwolf = [],
          typeSwimHR = [],
          typeSwimMaxHR = [],
          typeAerobicHrZoneData = [],
          typeAerobicCalories = [],
          typeAerobicDataDate = [],
          typeAerobicHR = [],
          typeAerobicMaxHR = [],
          typeRowHrZoneData = [],
          typeRowCalories = [],
          typeRowDataDate = [],
          typeRowSpeed = [],
          typeRowMaxSpeed = [],
          typeRowCadence = [],
          typeRowMaxCadence = [],
          typeRowHR = [],
          typeRowMaxHR = [],
          typeRowPower = [],
          typeRowMaxPower = [],
          typeBallHrZoneData = [],
          typeBallCalories = [],
          typeBallDataDate = [],
          typeBallSpeed = [],
          typeBallMaxSpeed = [],
          typeBallHR = [],
          typeBallMaxHR = [];

    let typeAllTotalTrainTime = 0,
        typeAllTotalDistance = 0,
        typeAllTotalWeight = 0,
        typeAllHrZoneZero = 0,
        typeAllHrZoneOne = 0,
        typeAllHrZoneTwo = 0,
        typeAllHrZoneThree = 0,
        typeAllHrZoneFour = 0,
        typeAllHrZoneFive = 0,
        typeRunLength = 0,
        typeRunTotalTrainTime = 0,
        typeRunTotalDistance = 0,
        typeRunHrZoneZero = 0,
        typeRunHrZoneOne = 0,
        typeRunHrZoneTwo = 0,
        typeRunHrZoneThree = 0,
        typeRunHrZoneFour = 0,
        typeRunHrZoneFive = 0,
        typeCycleLength = 0,
        typeCycleTotalTrainTime = 0,
        typeCycleTotalDistance = 0,
        typeCycleHrZoneZero = 0,
        typeCycleHrZoneOne = 0,
        typeCycleHrZoneTwo = 0,
        typeCycleHrZoneThree = 0,
        typeCycleHrZoneFour = 0,
        typeCycleHrZoneFive = 0,
        typeWeightTrainLength = 0,
        typeWeightTrainTotalTrainTime = 0,
        typeWeightTrainTotalWeight = 0,
        typeSwimLength = 0,
        typeSwimTotalTrainTime = 0,
        typeSwimTotalDistance = 0,
        typeSwimHrZoneZero = 0,
        typeSwimHrZoneOne = 0,
        typeSwimHrZoneTwo = 0,
        typeSwimHrZoneThree = 0,
        typeSwimHrZoneFour = 0,
        typeSwimHrZoneFive = 0,
        typeAerobicLength = 0,
        typeAerobicTotalTrainTime = 0,
        typeAerobicHrZoneZero = 0,
        typeAerobicHrZoneOne = 0,
        typeAerobicHrZoneTwo = 0,
        typeAerobicHrZoneThree = 0,
        typeAerobicHrZoneFour = 0,
        typeAerobicHrZoneFive = 0,
        typeRowLength = 0,
        typeRowTotalTrainTime = 0,
        typeRowTotalDistance = 0,
        typeRowHrZoneZero = 0,
        typeRowHrZoneOne = 0,
        typeRowHrZoneTwo = 0,
        typeRowHrZoneThree = 0,
        typeRowHrZoneFour = 0,
        typeRowHrZoneFive = 0,
        typeBallLength = 0,
        typeBallTotalTrainTime = 0,
        typeBallTotalDistance = 0,
        typeBallHrZoneZero = 0,
        typeBallHrZoneOne = 0,
        typeBallHrZoneTwo = 0,
        typeBallHrZoneThree = 0,
        typeBallHrZoneFour = 0,
        typeBallHrZoneFive = 0;

    if (this.activitiesList === undefined) {
      setTimeout(() => {
        this.calPerCategoryData();
      });

      return false;
    }

    for (let i = 0; i < this.activitiesList.length; i++) {
      typeAllDataDate.unshift(this.activitiesList[i].startTime.split('T')[0]);

      let sameDayCalories = 0;
      for (let j = 0; j < this.activitiesList[i].activities.length; j++) {
        const perStrokeData = this.activitiesList[i].activities[j];

        sameDayCalories += perStrokeData['calories'];

        this.activityLength += +perStrokeData['totalActivities'];
        typeAllTotalTrainTime += +perStrokeData['totalSecond'];
        typeList.unshift(+perStrokeData['type']);
        typeAllavgHr.unshift(perStrokeData['avgHeartRateBpm']);
        typeAllActivityTime.unshift(
          perStrokeData['totalSecond'] / perStrokeData['totalActivities']
        );

        // 確認是否有距離數據-kidin-1090204
        if (perStrokeData['totalDistanceMeters']) {
          typeAllTotalDistance += perStrokeData['totalDistanceMeters'];
        }

        // 確認是否有重量數據-kidin-1090204
        if (perStrokeData['totalWeightKg']) {
          typeAllTotalWeight += perStrokeData['totalWeightKg'];
        }

        // 活動成效分佈圖和心率區間趨勢用資料-kidin-1090203
        if (perStrokeData['totalHrZone0Second'] !== null) {
          typeAllHrZoneZero += perStrokeData['totalHrZone0Second'];
          typeAllHrZoneOne += perStrokeData['totalHrZone1Second'];
          typeAllHrZoneTwo += perStrokeData['totalHrZone2Second'];
          typeAllHrZoneThree += perStrokeData['totalHrZone3Second'];
          typeAllHrZoneFour += perStrokeData['totalHrZone4Second'];
          typeAllHrZoneFive += perStrokeData['totalHrZone5Second'];
          if (
            perStrokeData['totalHrZone0Second'] +
            perStrokeData['totalHrZone1Second'] +
            perStrokeData['totalHrZone2Second'] +
            perStrokeData['totalHrZone3Second'] +
            perStrokeData['totalHrZone4Second'] +
            perStrokeData['totalHrZone5Second'] !== 0
          ) {
            typeAllHrZoneData.unshift([
              perStrokeData.type,
              perStrokeData['totalHrZone0Second'],
              perStrokeData['totalHrZone1Second'],
              perStrokeData['totalHrZone2Second'],
              perStrokeData['totalHrZone3Second'],
              perStrokeData['totalHrZone4Second'],
              perStrokeData['totalHrZone5Second'],
              this.activitiesList[i].startTime.split('T')[0]
            ]);
          }
        }

        // 根據不同類別計算數據-kidin-1090204
        switch (perStrokeData.type) {
          case '1':
            typeRunLength += +perStrokeData['totalActivities'];
            typeRunTotalTrainTime += +perStrokeData['totalSecond'];
            typeRunCalories.unshift(perStrokeData['calories']);
            typeRunTotalDistance += perStrokeData['totalDistanceMeters'];
            typeRunDataDate.unshift(this.activitiesList[i].startTime.split('T')[0]);
            typeRunSpeed.unshift(perStrokeData['avgSpeed']);
            typeRunMaxSpeed.unshift(perStrokeData['avgMaxSpeed']);
            typeRunCadence.unshift(perStrokeData['runAvgCadence']);
            typeRunMaxCadence.unshift(perStrokeData['avgRunMaxCadence']);
            typeRunHR.unshift(perStrokeData['avgHeartRateBpm']);
            typeRunMaxHR.unshift(perStrokeData['avgMaxHeartRateBpm']);


            // 確認是否有心率數據-kidin-1090204
            if (perStrokeData['totalHrZone0Second'] !== null) {
              typeRunHrZoneZero += perStrokeData['totalHrZone0Second'];
              typeRunHrZoneOne += perStrokeData['totalHrZone1Second'];
              typeRunHrZoneTwo += perStrokeData['totalHrZone2Second'];
              typeRunHrZoneThree += perStrokeData['totalHrZone3Second'];
              typeRunHrZoneFour += perStrokeData['totalHrZone4Second'];
              typeRunHrZoneFive += perStrokeData['totalHrZone5Second'];
              if (
                perStrokeData['totalHrZone0Second'] +
                perStrokeData['totalHrZone1Second'] +
                perStrokeData['totalHrZone2Second'] +
                perStrokeData['totalHrZone3Second'] +
                perStrokeData['totalHrZone4Second'] +
                perStrokeData['totalHrZone5Second'] !== 0
              ) {
                typeRunHrZoneData.unshift([
                  perStrokeData.type,
                  perStrokeData['totalHrZone0Second'],
                  perStrokeData['totalHrZone1Second'],
                  perStrokeData['totalHrZone2Second'],
                  perStrokeData['totalHrZone3Second'],
                  perStrokeData['totalHrZone4Second'],
                  perStrokeData['totalHrZone5Second'],
                  this.activitiesList[i].startTime.split('T')[0]
                ]);
              }
            }

            break;
          case '2':
            typeCycleLength += +perStrokeData['totalActivities'];
            typeCycleTotalTrainTime += +perStrokeData['totalSecond'];
            typeCycleCalories.unshift(perStrokeData['calories']);
            typeCycleTotalDistance += perStrokeData['totalDistanceMeters'];
            typeCycleDataDate.unshift(this.activitiesList[i].startTime.split('T')[0]);
            typeCycleSpeed.unshift(perStrokeData['avgSpeed']);
            typeCycleMaxSpeed.unshift(perStrokeData['avgMaxSpeed']);
            typeCycleCadence.unshift(perStrokeData['cycleAvgCadence']);
            typeCycleMaxCadence.unshift(perStrokeData['avgCycleMaxCadence']);
            typeCycleHR.unshift(perStrokeData['avgHeartRateBpm']);
            typeCycleMaxHR.unshift(perStrokeData['avgMaxHeartRateBpm']);
            typeCyclePower.unshift(perStrokeData['cycleAvgWatt']);
            typeCycleMaxPower.unshift(perStrokeData['avgCycleMaxWatt']);

            if (perStrokeData['totalHrZone0Second'] !== null) {
              typeCycleHrZoneZero += perStrokeData['totalHrZone0Second'];
              typeCycleHrZoneOne += perStrokeData['totalHrZone1Second'];
              typeCycleHrZoneTwo += perStrokeData['totalHrZone2Second'];
              typeCycleHrZoneThree += perStrokeData['totalHrZone3Second'];
              typeCycleHrZoneFour += perStrokeData['totalHrZone4Second'];
              typeCycleHrZoneFive += perStrokeData['totalHrZone5Second'];
              if (
                perStrokeData['totalHrZone0Second'] +
                perStrokeData['totalHrZone1Second'] +
                perStrokeData['totalHrZone2Second'] +
                perStrokeData['totalHrZone3Second'] +
                perStrokeData['totalHrZone4Second'] +
                perStrokeData['totalHrZone5Second'] !== 0
              ) {
                typeCycleHrZoneData.unshift([
                  perStrokeData.type,
                  perStrokeData['totalHrZone0Second'],
                  perStrokeData['totalHrZone1Second'],
                  perStrokeData['totalHrZone2Second'],
                  perStrokeData['totalHrZone3Second'],
                  perStrokeData['totalHrZone4Second'],
                  perStrokeData['totalHrZone5Second'],
                  this.activitiesList[i].startTime.split('T')[0]
                ]);
              }
            }

            break;
          case '3':
            typeWeightTrainLength += +perStrokeData['totalActivities'];
            typeWeightTrainTotalTrainTime += +perStrokeData['totalSecond'];
            typeWeightTrainCalories.unshift(perStrokeData['calories']);
            typeWeightTrainTotalWeight += perStrokeData['totalWeightKg'];
            typeWeightTrainDataDate.unshift(this.activitiesList[i].startTime.split('T')[0]);
            this.trainingPart.unshift({
              part: perStrokeData['weightTrainingInfo'],
              startDate: moment(this.activitiesList[i].startTime.split('T')[0], 'YYYY-MM-DD').valueOf()
            });

            break;
          case '4':
            typeSwimLength += +perStrokeData['totalActivities'];
            typeSwimTotalTrainTime += +perStrokeData['totalSecond'];
            typeSwimCalories.unshift(perStrokeData['calories']);
            typeSwimTotalDistance += perStrokeData['totalDistanceMeters'];
            typeSwimDataDate.unshift(this.activitiesList[i].startTime.split('T')[0]);
            typeSwimSpeed.unshift(perStrokeData['avgSpeed']);
            typeSwimMaxSpeed.unshift(perStrokeData['avgMaxSpeed']);
            typeSwimCadence.unshift(perStrokeData['swimAvgCadence']);
            typeSwimMaxCadence.unshift(perStrokeData['avgSwimMaxCadence']);
            typeSwimSwolf.unshift(perStrokeData['avgSwolf']);
            typeSwimMaxSwolf.unshift(perStrokeData['bestSwolf']);
            typeSwimHR.unshift(perStrokeData['avgHeartRateBpm']);
            typeSwimMaxHR.unshift(perStrokeData['avgMaxHeartRateBpm']);

            if (perStrokeData['totalHrZone0Second'] !== null) {
              typeSwimHrZoneZero += perStrokeData['totalHrZone0Second'];
              typeSwimHrZoneOne += perStrokeData['totalHrZone1Second'];
              typeSwimHrZoneTwo += perStrokeData['totalHrZone2Second'];
              typeSwimHrZoneThree += perStrokeData['totalHrZone3Second'];
              typeSwimHrZoneFour += perStrokeData['totalHrZone4Second'];
              typeSwimHrZoneFive += perStrokeData['totalHrZone5Second'];
              if (
                perStrokeData['totalHrZone0Second'] +
                perStrokeData['totalHrZone1Second'] +
                perStrokeData['totalHrZone2Second'] +
                perStrokeData['totalHrZone3Second'] +
                perStrokeData['totalHrZone4Second'] +
                perStrokeData['totalHrZone5Second'] !== 0
              ) {
                typeSwimHrZoneData.unshift([
                  perStrokeData.type,
                  perStrokeData['totalHrZone0Second'],
                  perStrokeData['totalHrZone1Second'],
                  perStrokeData['totalHrZone2Second'],
                  perStrokeData['totalHrZone3Second'],
                  perStrokeData['totalHrZone4Second'],
                  perStrokeData['totalHrZone5Second'],
                  this.activitiesList[i].startTime.split('T')[0]
                ]);
              }
            }

            break;
          case '5':
            typeAerobicLength += +perStrokeData['totalActivities'];
            typeAerobicTotalTrainTime += +perStrokeData['totalSecond'];
            typeAerobicCalories.unshift(perStrokeData['calories']);
            typeAerobicDataDate.unshift(this.activitiesList[i].startTime.split('T')[0]);
            typeAerobicHR.unshift(perStrokeData['avgHeartRateBpm']);
            typeAerobicMaxHR.unshift(perStrokeData['avgMaxHeartRateBpm']);

            if (perStrokeData['totalHrZone0Second'] !== null) {
              typeAerobicHrZoneZero += perStrokeData['totalHrZone0Second'];
              typeAerobicHrZoneOne += perStrokeData['totalHrZone1Second'];
              typeAerobicHrZoneTwo += perStrokeData['totalHrZone2Second'];
              typeAerobicHrZoneThree += perStrokeData['totalHrZone3Second'];
              typeAerobicHrZoneFour += perStrokeData['totalHrZone4Second'];
              typeAerobicHrZoneFive += perStrokeData['totalHrZone5Second'];
              if (
                perStrokeData['totalHrZone0Second'] +
                perStrokeData['totalHrZone1Second'] +
                perStrokeData['totalHrZone2Second'] +
                perStrokeData['totalHrZone3Second'] +
                perStrokeData['totalHrZone4Second'] +
                perStrokeData['totalHrZone5Second'] !== 0
              ) {
                typeAerobicHrZoneData.unshift([
                  perStrokeData.type,
                  perStrokeData['totalHrZone0Second'],
                  perStrokeData['totalHrZone1Second'],
                  perStrokeData['totalHrZone2Second'],
                  perStrokeData['totalHrZone3Second'],
                  perStrokeData['totalHrZone4Second'],
                  perStrokeData['totalHrZone5Second'],
                  this.activitiesList[i].startTime.split('T')[0]
                ]);
              }
            }

            break;
          case '6':
            typeRowLength += +perStrokeData['totalActivities'];
            typeRowTotalTrainTime += +perStrokeData['totalSecond'];
            typeRowCalories.unshift(perStrokeData['calories']);
            typeRowTotalDistance += perStrokeData['totalDistanceMeters'];
            typeRowDataDate.unshift(this.activitiesList[i].startTime.split('T')[0]);
            typeRowSpeed.unshift(perStrokeData['avgSpeed']);
            typeRowMaxSpeed.unshift(perStrokeData['avgMaxSpeed']);
            typeRowCadence.unshift(perStrokeData['rowingAvgCadence']);
            typeRowMaxCadence.unshift(perStrokeData['avgRowingMaxCadence']);
            typeRowHR.unshift(perStrokeData['avgHeartRateBpm']);
            typeRowMaxHR.unshift(perStrokeData['avgMaxHeartRateBpm']);
            typeRowPower.unshift(perStrokeData['rowingAvgWatt']);
            typeRowMaxPower.unshift(perStrokeData['rowingMaxWatt']);

            if (perStrokeData['totalHrZone0Second'] !== null) {
              typeRowHrZoneZero += perStrokeData['totalHrZone0Second'];
              typeRowHrZoneOne += perStrokeData['totalHrZone1Second'];
              typeRowHrZoneTwo += perStrokeData['totalHrZone2Second'];
              typeRowHrZoneThree += perStrokeData['totalHrZone3Second'];
              typeRowHrZoneFour += perStrokeData['totalHrZone4Second'];
              typeRowHrZoneFive += perStrokeData['totalHrZone5Second'];
              if (
                perStrokeData['totalHrZone0Second'] +
                perStrokeData['totalHrZone1Second'] +
                perStrokeData['totalHrZone2Second'] +
                perStrokeData['totalHrZone3Second'] +
                perStrokeData['totalHrZone4Second'] +
                perStrokeData['totalHrZone5Second'] !== 0
              ) {
                typeRowHrZoneData.unshift([
                  perStrokeData.type,
                  perStrokeData['totalHrZone0Second'],
                  perStrokeData['totalHrZone1Second'],
                  perStrokeData['totalHrZone2Second'],
                  perStrokeData['totalHrZone3Second'],
                  perStrokeData['totalHrZone4Second'],
                  perStrokeData['totalHrZone5Second'],
                  this.activitiesList[i].startTime.split('T')[0]
                ]);
              }
            }

            break;
          case '7':
            typeBallLength += +perStrokeData['totalActivities'];
            typeBallTotalTrainTime += +perStrokeData['totalSecond'];
            typeBallCalories.unshift(perStrokeData['calories']);
            typeBallTotalDistance += perStrokeData['totalDistanceMeters'];
            typeBallDataDate.unshift(this.activitiesList[i].startTime.split('T')[0]);
            typeBallSpeed.unshift(perStrokeData['avgSpeed']);
            typeBallMaxSpeed.unshift(perStrokeData['avgMaxSpeed']);
            typeBallHR.unshift(perStrokeData['avgHeartRateBpm']);
            typeBallMaxHR.unshift(perStrokeData['avgMaxHeartRateBpm']);

            if (perStrokeData['totalHrZone0Second'] !== null) {
              typeBallHrZoneZero += perStrokeData['totalHrZone0Second'];
              typeBallHrZoneOne += perStrokeData['totalHrZone1Second'];
              typeBallHrZoneTwo += perStrokeData['totalHrZone2Second'];
              typeBallHrZoneThree += perStrokeData['totalHrZone3Second'];
              typeBallHrZoneFour += perStrokeData['totalHrZone4Second'];
              typeBallHrZoneFive += perStrokeData['totalHrZone5Second'];
              if (
                perStrokeData['totalHrZone0Second'] +
                perStrokeData['totalHrZone1Second'] +
                perStrokeData['totalHrZone2Second'] +
                perStrokeData['totalHrZone3Second'] +
                perStrokeData['totalHrZone4Second'] +
                perStrokeData['totalHrZone5Second'] !== 0
              ) {
                typeBallHrZoneData.unshift([
                  perStrokeData.type,
                  perStrokeData['totalHrZone0Second'],
                  perStrokeData['totalHrZone1Second'],
                  perStrokeData['totalHrZone2Second'],
                  perStrokeData['totalHrZone3Second'],
                  perStrokeData['totalHrZone4Second'],
                  perStrokeData['totalHrZone5Second'],
                  this.activitiesList[i].startTime.split('T')[0]
                ]);
              }
            }

            break;
        }
      }

      typeAllCalories.unshift(sameDayCalories);
    }

    const typeAllAvgTrainTime = (typeAllTotalTrainTime / this.activityLength) || 0,
          typeRunAvgTrainTime = (typeRunTotalTrainTime / typeRunLength) || 0,
          typeCycleAvgTrainTime = (typeCycleTotalTrainTime / typeCycleLength) || 0,
          typeWeightTrainAvgTrainTime = (typeWeightTrainTotalTrainTime / typeWeightTrainLength) || 0,
          typeSwimAvgTrainTime = (typeSwimTotalTrainTime / typeSwimLength) || 0,
          typeAerobicAvgTrainTime = (typeAerobicTotalTrainTime / typeAerobicLength) || 0,
          typeRowAvgTrainTime = (typeRowTotalTrainTime / typeRowLength) || 0,
          typeBallAvgTrainTime = (typeBallTotalTrainTime / typeBallLength) || 0;

    const typeAllData = {
      activityLength: this.activityLength,
      totalTime: this.formatTime(typeAllTotalTrainTime),
      avgTime: this.formatTime(typeAllAvgTrainTime),
      distance: typeAllTotalDistance,
      weightKg: typeAllTotalWeight,
      HrZoneZero: typeAllHrZoneZero,
      HrZoneOne: typeAllHrZoneOne,
      HrZoneTwo: typeAllHrZoneTwo,
      HrZoneThree: typeAllHrZoneThree,
      HrZoneFour: typeAllHrZoneFour,
      HrZoneFive: typeAllHrZoneFive,
      perTypeLength: [typeRunLength, typeCycleLength, typeWeightTrainLength, typeSwimLength, typeAerobicLength, typeRowLength, typeBallLength],
      perTypeTime: [
        typeRunAvgTrainTime,
        typeCycleAvgTrainTime,
        typeWeightTrainAvgTrainTime,
        typeSwimAvgTrainTime,
        typeAerobicAvgTrainTime,
        typeRowAvgTrainTime,
        typeBallAvgTrainTime
      ],
      perHrZoneData: this.computeSameHRZoneData(typeAllHrZoneData),
      perCaloriesData: this.computeSameDayData(typeAllCalories, [], typeAllDataDate, 'calories'),
      typeList: typeList,
      perAvgHR: typeAllavgHr,
      perActivityTime: typeAllActivityTime
    };

    const typeRunData = {
      activityLength: typeRunLength,
      totalTime: this.formatTime(typeRunTotalTrainTime),
      avgTime: this.formatTime(typeRunAvgTrainTime),
      distance: typeRunTotalDistance,
      HrZoneZero: typeRunHrZoneZero,
      HrZoneOne: typeRunHrZoneOne,
      HrZoneTwo: typeRunHrZoneTwo,
      HrZoneThree: typeRunHrZoneThree,
      HrZoneFour: typeRunHrZoneFour,
      HrZoneFive: typeRunHrZoneFive,
      perHrZoneData: this.computeSameHRZoneData(typeRunHrZoneData),
      perCaloriesData: this.computeSameDayData(typeRunCalories, [], typeRunDataDate, 'calories'),
      perPaceData: this.computePace(typeRunSpeed, typeRunMaxSpeed, typeRunDataDate, 1),
      perCadenceData: this.computeSportData(typeRunCadence, typeRunMaxCadence, typeRunDataDate, 'cadence'),
      perHRData: this.computeSportData(typeRunHR, typeRunMaxHR, typeRunDataDate, 'HR')
    };

    const typeCycleData = {
      activityLength: typeCycleLength,
      totalTime: this.formatTime(typeCycleTotalTrainTime),
      avgTime: this.formatTime(typeCycleAvgTrainTime),
      distance: typeCycleTotalDistance,
      HrZoneZero: typeCycleHrZoneZero,
      HrZoneOne: typeCycleHrZoneOne,
      HrZoneTwo: typeCycleHrZoneTwo,
      HrZoneThree: typeCycleHrZoneThree,
      HrZoneFour: typeCycleHrZoneFour,
      HrZoneFive: typeCycleHrZoneFive,
      perHrZoneData: this.computeSameHRZoneData(typeCycleHrZoneData),
      perCaloriesData: this.computeSameDayData(typeCycleCalories, [], typeCycleDataDate, 'calories'),
      perSpeedData: this.computeSportData(typeCycleSpeed, typeCycleMaxSpeed, typeCycleDataDate, 'speed'),
      perCadenceData: this.computeSportData(typeCycleCadence, typeCycleMaxCadence, typeCycleDataDate, 'cadence'),
      perHRData: this.computeSportData(typeCycleHR, typeCycleMaxHR, typeCycleDataDate, 'HR'),
      perPowerData: this.computeSportData(typeCyclePower, typeCycleMaxPower, typeCycleDataDate, 'power')
    };

    const typeWeightTrainData = {
      activityLength: typeWeightTrainLength,
      totalTime: this.formatTime(typeWeightTrainTotalTrainTime),
      avgTime: this.formatTime(typeWeightTrainAvgTrainTime),
      weightKg: typeWeightTrainTotalWeight,
      perCaloriesData: this.computeSameDayData(typeWeightTrainCalories, [], typeWeightTrainDataDate, 'calories'),
      trainingPart: this.trainingPart
    };

    const typeSwimData = {
      activityLength: typeSwimLength,
      totalTime: this.formatTime(typeSwimTotalTrainTime),
      avgTime: this.formatTime(typeSwimAvgTrainTime),
      distance: typeSwimTotalDistance,
      HrZoneZero: typeSwimHrZoneZero,
      HrZoneOne: typeSwimHrZoneOne,
      HrZoneTwo: typeSwimHrZoneTwo,
      HrZoneThree: typeSwimHrZoneThree,
      HrZoneFour: typeSwimHrZoneFour,
      HrZoneFive: typeSwimHrZoneFive,
      perHrZoneData: this.computeSameHRZoneData(typeSwimHrZoneData),
      perCaloriesData: this.computeSameDayData(typeSwimCalories, [], typeSwimDataDate, 'calories'),
      perPaceData: this.computePace(typeSwimSpeed, typeSwimMaxSpeed, typeSwimDataDate, 4),
      perCadenceData: this.computeSportData(typeSwimCadence, typeSwimMaxCadence, typeSwimDataDate, 'cadence'),
      perSwolfData: this.computeSportData(typeSwimSwolf, typeSwimMaxSwolf, typeSwimDataDate, 'swolf'),
      perHRData: this.computeSportData(typeSwimHR, typeSwimMaxHR, typeSwimDataDate, 'HR')
    };

    const typeAerobicData = {
      activityLength: typeAerobicLength,
      totalTime: this.formatTime(typeAerobicTotalTrainTime),
      avgTime: this.formatTime(typeAerobicAvgTrainTime),
      HrZoneZero: typeAerobicHrZoneZero,
      HrZoneOne: typeAerobicHrZoneOne,
      HrZoneTwo: typeAerobicHrZoneTwo,
      HrZoneThree: typeAerobicHrZoneThree,
      HrZoneFour: typeAerobicHrZoneFour,
      HrZoneFive: typeAerobicHrZoneFive,
      perHrZoneData: this.computeSameHRZoneData(typeAerobicHrZoneData),
      perCaloriesData: this.computeSameDayData(typeAerobicCalories, [], typeAerobicDataDate, 'calories'),
      perHRData: this.computeSportData(typeAerobicHR, typeAerobicMaxHR, typeAerobicDataDate, 'HR')
    };

    const typeRowData = {
      activityLength: typeRowLength,
      totalTime: this.formatTime(typeRowTotalTrainTime),
      avgTime: this.formatTime(typeRowAvgTrainTime),
      distance: typeRowTotalDistance,
      HrZoneZero: typeRowHrZoneZero,
      HrZoneOne: typeRowHrZoneOne,
      HrZoneTwo: typeRowHrZoneTwo,
      HrZoneThree: typeRowHrZoneThree,
      HrZoneFour: typeRowHrZoneFour,
      HrZoneFive: typeRowHrZoneFive,
      perHrZoneData: this.computeSameHRZoneData(typeRowHrZoneData),
      perCaloriesData: this.computeSameDayData(typeRowCalories, [], typeRowDataDate, 'calories'),
      perPaceData: this.computePace(typeRowSpeed, typeRowMaxSpeed, typeRowDataDate, 6),
      perCadenceData: this.computeSportData(typeRowCadence, typeRowMaxCadence, typeRowDataDate, 'cadence'),
      perHRData: this.computeSportData(typeRowHR, typeRowMaxHR, typeRowDataDate, 'HR'),
      perPowerData: this.computeSportData(typeRowPower, typeRowMaxPower, typeRowDataDate, 'power')
    };

    const typeBallData = {
      activityLength: typeBallLength,
      totalTime: this.formatTime(typeBallTotalTrainTime),
      avgTime: this.formatTime(typeBallAvgTrainTime),
      distance: typeBallTotalDistance,
      HrZoneZero: typeBallHrZoneZero,
      HrZoneOne: typeBallHrZoneOne,
      HrZoneTwo: typeBallHrZoneTwo,
      HrZoneThree: typeBallHrZoneThree,
      HrZoneFour: typeBallHrZoneFour,
      HrZoneFive: typeBallHrZoneFive,
      perHrZoneData: this.computeSameHRZoneData(typeBallHrZoneData),
      perCaloriesData: this.computeSameDayData(typeBallCalories, [], typeBallDataDate, 'calories'),
      perPaceData: this.computePace(typeBallSpeed, typeBallMaxSpeed, typeBallDataDate, 6),
      perHRData: this.computeSportData(typeBallHR, typeBallMaxHR, typeBallDataDate, 'HR')
    };

    this.reportService.setTypeAllData(
      typeAllData,
      typeRunData,
      typeCycleData,
      typeWeightTrainData,
      typeSwimData,
      typeAerobicData,
      typeRowData,
      typeBallData
    );
    this.isLoading = false;

    this.loadCategoryData(this.reportCategory);
  }

  // 使時間依照xxxx/XX/XX格式顯示-kidin-1090120
  formatTime (time: number) {
    const hour = Math.floor((time) / 3600),
          minute = Math.floor((time % 3600) / 60),
          second = time - (hour * 3600) - (minute * 60);
    if (hour === 0) {
      return `${this.fillTwoDigits(minute)}:${this.fillTwoDigits(second)}`;
    } else {
      return `${hour}:${this.fillTwoDigits(minute)}:${this.fillTwoDigits(second)}`;
    }
  }

  // 時間補零-kidin-1081211
  fillTwoDigits (num: number) {
    const timeStr = '0' + Math.floor(num);
    return timeStr.substr(-2);
  }

  // 根據運動類別使用rxjs從service取得資料-kidin-1090120
  loadCategoryData (type: number) {
    this.isRxjsLoading = true;

    // 初始化global highchart物件，可避免HighCharts.Charts為 undefined -kidin-1081212
    Highcharts.charts.forEach((_highChart, idx) => {
      if (_highChart !== undefined) {
        _highChart.destroy();
      }
    });
    Highcharts.charts.length = 0;

    this.reportService.getTypeData(type).pipe(first()).subscribe(res => {
      this.categoryActivityLength = res.activityLength;
      this.updateUrl('true');
      if (this.categoryActivityLength === undefined || this.categoryActivityLength === 0) {
        this.nodata = true;
      } else {
        this.totalTime = res.totalTime;
        this.avgTime = res.avgTime;
        this.perTypeLength = res.perTypeLength;
        this.perTypeTime = res.perTypeTime;
        this.typeHrZone = [
          res.HrZoneZero,
          res.HrZoneOne,
          res.HrZoneTwo,
          res.HrZoneThree,
          res.HrZoneFour,
          res.HrZoneFive
        ];
        this.perHrZoneData = res.perHrZoneData;

        this.perCalories = res.perCaloriesData;
        this.totalCalories = res.perCaloriesData.totalCalories;
        this.bestCalories = res.perCaloriesData.oneRangeBestCalories;
        this.avgCalories = res.perCaloriesData.avgCalories;
        this.typeList = res.typeList;
        this.perAvgHR = res.perAvgHR;
        this.perActivityTime = res.perActivityTime;

        if (res.distance || res.distance === 0) {
          this.totalDistance = res.distance;
        }

        if (res.weightKg || res.weightKg === 0) {
          this.totalWeight = res.weightKg;
        }

        if (res.trainingPart) {
          this.trainingPart = res.trainingPart;
        }

        if (res.perSpeedData) {
          this.perSpeedData = res.perSpeedData;
          this.bestSpeed = res.perSpeedData.oneRangeBestSpeed;
          this.avgSpeed = res.perSpeedData.avgSpeed;
        }

        if (res.perPaceData) {
          this.perPaceData = res.perPaceData;
          this.bestPace = res.perPaceData.oneRangeBestPace;
          this.avgPace = res.perPaceData.avgPace;
        }

        if (res.perCadenceData) {
          this.perCadenceData = res.perCadenceData;
          this.bestCadence = res.perCadenceData.oneRangeBestCadence;
          this.avgCadence = res.perCadenceData.avgCadence;
        }

        if (res.perSwolfData) {
          this.perSwolfData = res.perSwolfData;
          this.bestSwolf = res.perSwolfData.oneRangeBestSwolf;
          this.avgSwolf = res.perSwolfData.avgSwolf;
        }

        if (res.perHRData) {
          this.perHRData = res.perHRData;
          this.bestHR = res.perHRData.oneRangeBestHR;
          this.avgHR = res.perHRData.avgHR;
        }

        if (res.perPowerData) {
          this.perPowerData = res.perPowerData;
          if (res.perPowerData.oneRangeBestPower !== null) {
            this.bestPower = res.perPowerData.oneRangeBestPower;
            this.avgPower = res.perPowerData.avgPower;
          } else {
            this.bestPower = 0;
            this.avgPower = 0;
          }
        }

        this.nodata = false;
      }
      this.isRxjsLoading = false;
    });
  }

  // 刪除為0的數據並整合後計算配速-kidin-1090206
  computePace (speed: Array<number>, maxSpeed: Array<number>, date: Array<string>, type: number) {
    const pace = [],
          bestPace = [],
          finalDate = [];
    let oneRangeBestSpeed = 0,
        totalSpeed = 0;
    for (let i = 0; i < date.length; i++) {
      if (speed[i] !== 0 || maxSpeed[i] !== 0) {
        totalSpeed += speed[i];

        if (maxSpeed[i] > oneRangeBestSpeed) {
          oneRangeBestSpeed = maxSpeed[i];
        }

        const timeStamp = moment(date[i], 'YYYY-MM-DD').valueOf();
          finalDate.push(timeStamp);

          // 根據不同運動類別做配速計算-kidin-1090206
          switch (type) {
            case 1:  // 跑步
              pace.push((60 / speed[i]) * 60);
              bestPace.push((60 / maxSpeed[i]) * 60);
              break;
            case 4:  // 游泳
              pace.push((60 / speed[i]) * 60 / 10);
              bestPace.push((60 / maxSpeed[i]) * 60 / 10);
              break;
            case 6:  // 划船
              pace.push((60 / speed[i]) * 60 / 2);
              bestPace.push((60 / maxSpeed[i]) * 60 / 2);
              break;
          }
      }
    }

    const perTypeBestPace = this.switchPace(oneRangeBestSpeed, type);
    const perTypeAvgPace = this.switchPace((totalSpeed / date.length), type);

    const colorSet = ['#6a4db8', '#e04c62', '#ffd451'];

    return {
      pace: this.fillVacancyData(pace, finalDate, 'avg', 'pace'),
      bestPace: this.fillVacancyData(bestPace, finalDate, 'min', 'pace'),
      date: this.chartTimeStamp,
      colorSet,
      oneRangeBestPace: perTypeBestPace,
      avgPace: perTypeAvgPace
    };
  }

  // 配速換算-kidin-1090206
  switchPace (value, type) {
    let pace;
    switch (type) {
      case 1:
        pace = 60 / value * 60;
        break;
      case 4:
        pace = (60 / value * 60) / 10;
        break;
      case 6:
        pace = (60 / value * 60) / 2;
        break;
    }

    if (pace > 3600) {
      pace = 3600;
    }
    const yVal = pace,
          paceMin = Math.floor(yVal / 60),
          paceSec = Math.round(yVal - paceMin * 60),
          timeMin = ('0' + paceMin).slice(-2),
          timeSecond = ('0' + paceSec).slice(-2);

    if (timeMin === '00') {
      return `0'${timeSecond}`;
    } else {
      return `${timeMin}'${timeSecond}`;
    }
  }

  // 刪除為0的數據並整合-kidin-0190206
  computeSportData (data: Array<number>, bestData: Array<number>, date: Array<string>, type: string) {
    const finalDate = [],
          finalData = [],
          bestFinalData = [];
    let oneRangeBest = 0,
        total = 0;
    for (let i = 0; i < date.length; i++) {
      if (data[i] !== 0 || bestData[i] !== 0) {
        const timeStamp = moment(date[i], 'YYYY-MM-DD').valueOf();

        finalDate.push(timeStamp);
        finalData.push(data[i]);
        bestFinalData.push(bestData[i]);

        if (i === 0) {
          oneRangeBest = bestData[i];
        } else if (type !== 'swolf' && bestData[i] > oneRangeBest) {
          oneRangeBest = bestData[i];
        } else if (type === 'swolf' && bestData[i] < oneRangeBest) {
          oneRangeBest = bestData[i];
        }

        total += data[i];
      }
    }

    const perTypeAvg = total / finalDate.length;

    switch (type) {
      case 'cadence':
        return {
          cadence: this.fillVacancyData(finalData, finalDate, 'avg', 'cadence'),
          bestCadence: this.fillVacancyData(bestFinalData, finalDate, 'max', 'cadence'),
          date: this.chartTimeStamp,
          colorSet: ['#aafc42', '#d6ff38', '#f56300'],
          oneRangeBestCadence: oneRangeBest,
          avgCadence: perTypeAvg
        };
      case 'heartRate':
        return {
          HR: this.fillVacancyData(finalData, finalDate, 'avg', 'heartRate'),
          bestHR: this.fillVacancyData(bestFinalData, finalDate, 'max', 'heartRate'),
          date: this.chartTimeStamp,
          colorSet: ['#aafc42', '#d6ff38', '#f56300'],
          oneRangeBestHR: oneRangeBest,
          avgHR: perTypeAvg
        };
      case 'swolf':
        return {
          swolf: this.fillVacancyData(finalData, finalDate, 'avg', 'swolf'),
          bestSwolf: this.fillVacancyData(bestFinalData, finalDate, 'min', 'swolf'),
          date: this.chartTimeStamp,
          colorSet: ['#aafc42', '#d6ff38', '#7fd9ff'],
          oneRangeBestSwolf: oneRangeBest,
          avgSwolf: perTypeAvg
        };
      case 'speed':
        return {
          speed: this.fillVacancyData(finalData, finalDate, 'avg', 'speed'),
          bestSpeed: this.fillVacancyData(bestFinalData, finalDate, 'max', 'speed'),
          date: this.chartTimeStamp,
          colorSet: ['#ff00ff', '#ffff00', '#ffff00'],
          oneRangeBestSpeed: oneRangeBest,
          avgSpeed: perTypeAvg
        };
      case 'power':
        return {
          power: this.fillVacancyData(finalData, finalDate, 'avg', 'power'),
          bestPower: this.fillVacancyData(bestFinalData, finalDate, 'max', 'power'),
          date: this.chartTimeStamp,
          colorSet: ['#aafc42', '#d6ff38', '#f56300'],
          oneRangeBestPower: oneRangeBest,
          avgPower: perTypeAvg
        };
      case 'HR':
        return {
          HR: this.fillVacancyData(finalData, finalDate, 'avg', 'HR'),
          bestHR: this.fillVacancyData(bestFinalData, finalDate, 'max', 'HR'),
          date: this.chartTimeStamp,
          colorSet: [
            'rgb(70, 156, 245)',
            'rgb(64, 218, 232)',
            'rgb(86, 255, 0)',
            'rgb(214, 207, 1)',
            'rgb(234, 164, 4)',
            'rgba(243, 105, 83)'
          ],
          oneRangeBestHR: oneRangeBest,
          avgHR: perTypeAvg
        };
    }
  }

  // 將日期相同的心率區間做整合並轉成highcharts所需的資料格式-kidin-1090325
  computeSameHRZoneData (data: Array<number>) {
    const finalData = {
        zoneZero: [],
        zoneOne: [],
        zoneTwo: [],
        zoneThree: [],
        zoneFour: [],
        zoneFive: []
      },
      sameDayData = {
        zoneZero: 0,
        zoneOne: 0,
        zoneTwo: 0,
        zoneThree: 0,
        zoneFour: 0,
        zoneFive: 0
      };

    for (let i = 0; i < data.length; i++) {

      if (i === 0 || data[i][7] === data[i - 1][7]) {
        sameDayData.zoneZero += data[i][1],
        sameDayData.zoneOne += data[i][2],
        sameDayData.zoneTwo += data[i][3],
        sameDayData.zoneThree += data[i][4],
        sameDayData.zoneFour += data[i][5],
        sameDayData.zoneFive += data[i][6];

        if (i === data.length - 1) {
          const timeStamp = moment(data[i][7], 'YYYY-MM-DD').valueOf();
          finalData.zoneZero.push([timeStamp, sameDayData.zoneZero]);
          finalData.zoneOne.push([timeStamp, sameDayData.zoneOne]);
          finalData.zoneTwo.push([timeStamp, sameDayData.zoneTwo]);
          finalData.zoneThree.push([timeStamp, sameDayData.zoneThree]);
          finalData.zoneFour.push([timeStamp, sameDayData.zoneFour]);
          finalData.zoneFive.push([timeStamp, sameDayData.zoneFive]);

        }
      } else {
        let timeStamp = moment(data[i - 1][7], 'YYYY-MM-DD').valueOf();
        finalData.zoneZero.push([timeStamp, sameDayData.zoneZero]);
        finalData.zoneOne.push([timeStamp, sameDayData.zoneOne]);
        finalData.zoneTwo.push([timeStamp, sameDayData.zoneTwo]);
        finalData.zoneThree.push([timeStamp, sameDayData.zoneThree]);
        finalData.zoneFour.push([timeStamp, sameDayData.zoneFour]);
        finalData.zoneFive.push([timeStamp, sameDayData.zoneFive]);

        if (i !== data.length - 1 ) {
          sameDayData.zoneZero = data[i][1],
          sameDayData.zoneOne = data[i][2],
          sameDayData.zoneTwo = data[i][3],
          sameDayData.zoneThree = data[i][4],
          sameDayData.zoneFour = data[i][5],
          sameDayData.zoneFive = data[i][6];
        } else {
          timeStamp = moment(data[i][7], 'YYYY-MM-DD').valueOf();
          finalData.zoneZero.push([timeStamp, data[i][1]]);
          finalData.zoneOne.push([timeStamp, data[i][2]]);
          finalData.zoneTwo.push([timeStamp, data[i][3]]);
          finalData.zoneThree.push([timeStamp, data[i][4]]);
          finalData.zoneFour.push([timeStamp, data[i][5]]);
          finalData.zoneFive.push([timeStamp, data[i][6]]);
        }

      }
    }

    return this.fillVacancyData(finalData, [], 'avg', 'HRZone');
  }

  // 將日期相同的數據做整合-kidin-1090210
  computeSameDayData (data: Array<number>, bestData: Array<number>, date: Array<string>, type: string) {
    const finalDate = [],
          finalData = [];
    let sameDayData = 0,
        sameDayLength = 0,
        oneRangeBest = 0,
        total = 0;

    if (bestData.length !== 0) {
      const bestFinalData = [];
      let sameDayBestData = 0;

      for (let i = 0; i < date.length; i++) {
        total += data[i];
        if (bestData[i] > oneRangeBest) {
          oneRangeBest = bestData[i];
        }

        if (i === 0 || date[i] === date[i - 1]) {
          sameDayData += data[i];
          sameDayBestData += bestData[i];
          sameDayLength++;
          if (bestData[i] > sameDayBestData) {
            sameDayBestData = bestData[i];
          }

          if (i === date.length - 1) {
            finalData.push(sameDayData / sameDayLength);
            bestFinalData.push(sameDayBestData);
            finalDate.push(moment(date[i], 'YYYY-MM-DD').valueOf());
          }

        // 若數據日期變更，則將之前的數據整合並儲存後再重新計算新的日期數據-kidin-0190210
        } else if (i !== 0 && date[i] !== date[i - 1]) {
          finalData.push(sameDayData / sameDayLength);
          bestFinalData.push(sameDayBestData);
          finalDate.push(moment(date[i - 1], 'YYYY-MM-DD').valueOf());

          if (i !== date.length - 1) {
            sameDayData = data[i];
            sameDayBestData = bestData[i];
            sameDayLength = 1;
          } else {
            finalData.push(data[i]);
            bestFinalData.push(bestData[i]);
            finalDate.push(moment(date[i], 'YYYY-MM-DD').valueOf());
          }

        }
      }

      // 有可能會追加計算其他類別的數據，故不寫死-kidin-1090210
      switch (type) {
        case 'calories':
          return {
            calories: this.fillVacancyData(finalData, finalDate, 'avg', 'calories'),
            bestcalories: bestFinalData,
            date: this.chartTimeStamp,
            colorSet: ['#f8b551'],
            oneRangeBestCalories: oneRangeBest,
            avgCalories: total / date.length,
            totalCalories: total
          };
      }

    } else {
      for (let i = 0; i < date.length; i++) {
        total += data[i];

        if (i === 0 || date[i] === date[i - 1]) {
          sameDayData += data[i];
          if (sameDayData > oneRangeBest) {
            oneRangeBest = sameDayData;
          }

          if (i === date.length - 1) {
            finalData.push(sameDayData);
            finalDate.push(moment(date[i], 'YYYY-MM-DD').valueOf());
          }

        // 若數據日期變更，則將之前的數據整合並儲存後再重新計算新的日期數據-kidin-0190210
        } else if (i !== 0 && date[i] !== date[i - 1]) {
          if (sameDayData > oneRangeBest) {
            oneRangeBest = sameDayData;
          }

          finalData.push(sameDayData);
          finalDate.push(moment(date[i - 1], 'YYYY-MM-DD').valueOf());

          if (i !== date.length - 1) {
            sameDayData = data[i];
          } else {
            if (data[i] > oneRangeBest) {
              oneRangeBest = data[i];
            }

            finalData.push(data[i]);
            finalDate.push(moment(date[i], 'YYYY-MM-DD').valueOf());
          }

        }
      }

      // 有可能會追加計算其他類別的數據，故不寫死-kidin-1090210
      switch (type) {
        case 'calories':
          return {
            calories: this.fillVacancyData(finalData, finalDate, 'add', 'calories'),
            date: this.chartTimeStamp,
            colorSet: '#f8b551',
            oneRangeBestCalories: oneRangeBest,
            avgCalories: total / date.length,
            totalCalories: total
          };
      }
    }
  }

  // 依據選取日期和報告類型（日/週）將缺漏的數值以0填補，並處理重複日期的資料-kidin-1090324
  fillVacancyData (data, date, act, type) {
    switch (type) {
      case 'HRZone':
        if (data.zoneZero.length === 0) {
          return {
            zoneZero: [],
            zoneOne: [],
            zoneTwo: [],
            zoneThree: [],
            zoneFour: [],
            zoneFive: []
          };

        } else {
          let idx = 0;
          const newData = {
            zoneZero: [],
            zoneOne: [],
            zoneTwo: [],
            zoneThree: [],
            zoneFour: [],
            zoneFive: []
          };

          let sameDateData = [];  // 處理週報告跨年會有重複週別的問題
          for (let i = 0; i < this.chartTimeStamp.length; i++) {

            if (sameDateData.length !== 0 && this.chartTimeStamp[i] === data.zoneZero[idx][0]) {
              newData.zoneZero.push([this.chartTimeStamp[i], (sameDateData[0] + data.zoneZero[idx][1]) / 2]);
              newData.zoneOne.push([this.chartTimeStamp[i], (sameDateData[1] + data.zoneOne[idx][1]) / 2]);
              newData.zoneTwo.push([this.chartTimeStamp[i], (sameDateData[2] + data.zoneTwo[idx][1]) / 2]);
              newData.zoneThree.push([this.chartTimeStamp[i], (sameDateData[3] + data.zoneThree[idx][1]) / 2]);
              newData.zoneFour.push([this.chartTimeStamp[i], (sameDateData[4] + data.zoneFour[idx][1]) / 2]);
              newData.zoneFive.push([this.chartTimeStamp[i], (sameDateData[5] + data.zoneFive[idx][1]) / 2]);

              sameDateData.length = 0;
              idx++;
            } else if (data.zoneZero[idx + 1] && data.zoneZero[idx][0] === data.zoneZero[idx + 1][0]) {
              sameDateData = [
                data.zoneZero[idx][1],
                data.zoneOne[idx][1],
                data.zoneTwo[idx][1],
                data.zoneThree[idx][1],
                data.zoneFour[idx][1],
                data.zoneFive[idx][1],
              ];
              idx++;
              i--;
            } else if (data.zoneZero[idx] && this.chartTimeStamp[i] === data.zoneZero[idx][0]) {
              newData.zoneZero.push(data.zoneZero[idx]);
              newData.zoneOne.push(data.zoneOne[idx]);
              newData.zoneTwo.push(data.zoneTwo[idx]);
              newData.zoneThree.push(data.zoneThree[idx]);
              newData.zoneFour.push(data.zoneFour[idx]);
              newData.zoneFive.push(data.zoneFive[idx]);

              idx++;
            } else if (
              idx === 0
              || idx >= data.zoneZero.length
              || (data.zoneZero[idx + 1] && data.zoneZero[idx][0] !== data.zoneZero[idx + 1][0])
              ) {
               if (idx >= data.zoneZero.length) {
                newData.zoneZero.push([this.chartTimeStamp[i], 0]);
                newData.zoneOne.push([this.chartTimeStamp[i], 0]);
                newData.zoneTwo.push([this.chartTimeStamp[i], 0]);
                newData.zoneThree.push([this.chartTimeStamp[i], 0]);
                newData.zoneFour.push([this.chartTimeStamp[i], 0]);
                newData.zoneFive.push([this.chartTimeStamp[i], 0]);
              } else if (this.chartTimeStamp[i] !== data.zoneZero[idx][0]) {
                newData.zoneZero.push([this.chartTimeStamp[i], 0]);
                newData.zoneOne.push([this.chartTimeStamp[i], 0]);
                newData.zoneTwo.push([this.chartTimeStamp[i], 0]);
                newData.zoneThree.push([this.chartTimeStamp[i], 0]);
                newData.zoneFour.push([this.chartTimeStamp[i], 0]);
                newData.zoneFive.push([this.chartTimeStamp[i], 0]);
              } else {
                newData.zoneZero.push(data.zoneZero[idx]);
                newData.zoneOne.push(data.zoneOne[idx]);
                newData.zoneTwo.push(data.zoneTwo[idx]);
                newData.zoneThree.push(data.zoneThree[idx]);
                newData.zoneFour.push(data.zoneFour[idx]);
                newData.zoneFive.push(data.zoneFive[idx]);

                idx++;
              }

            } else {
              newData.zoneZero.push([this.chartTimeStamp[i], 0]);
              newData.zoneOne.push([this.chartTimeStamp[i], 0]);
              newData.zoneTwo.push([this.chartTimeStamp[i], 0]);
              newData.zoneThree.push([this.chartTimeStamp[i], 0]);
              newData.zoneFour.push([this.chartTimeStamp[i], 0]);
              newData.zoneFive.push([this.chartTimeStamp[i], 0]);
            }

          }

          return newData;
        }

      default:
        if (data.length === 0) {
          return [];
        } else {

          let idx = 0,
              sameDateData = 0;  // 處理週報告跨年會有重複週別的問題
          const newData = [];
          for (let i = 0; i < this.chartTimeStamp.length; i++) {

            if (sameDateData !== 0 && this.chartTimeStamp[i] === date[idx]) {

              switch (act) {
                case 'avg':
                  newData.push((sameDateData + data[idx]) / 2);
                  break;
                case 'max':
                  newData.push(
                    sameDateData > data[idx] ? sameDateData : data[idx]
                  );
                  break;
                case 'min':
                  newData.push(
                    sameDateData > data[idx] ? data[idx] : sameDateData
                  );
                  break;
                case 'add':
                  newData.push(sameDateData + data[idx]);
                  break;
              }

              sameDateData = 0;
              idx++;

            } else if (date[idx + 1] && date[idx] === date[idx + 1]) {
              sameDateData = data[idx];
              idx++;
              i--;

            } else if (this.chartTimeStamp[i] === date[idx]) {
              newData.push(data[idx]);
              idx++;
            } else if (
              idx === 0
              || idx >= date.length
              || (date[idx + 1] && date[idx] !== date[idx + 1])
            ) {

              if (idx >= date.length) {
                newData.push(null);
              } else if (this.chartTimeStamp[i] !== date[idx]) {
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
  }

  // 點擊運定項目後該類別相關資料特別顯示-kidin-1090214
  assignCategory (category) {
    if (category === this.selectType) {
      this.selectType = 99;
    } else {
      this.selectType = category;
    }
  }

  // 新增該部位趨勢圖表-kidin-1090406
  handleClickMuscleList (data) {

    const muscleGroup = data[0];
    for (let i = 0; i < muscleGroup.length; i++) {

      if (this.handleMuscleData === false) {

        const partList = [];
        for (const list in muscleGroup[i].trainList) {

          if (muscleGroup[i].trainList.hasOwnProperty(list)) {

            partList.push([
              list,
              [
                this.chartTimeStamp,
                this.fillVacancyData(
                  muscleGroup[i].trainList[list].oneRepMaxChartData,
                  muscleGroup[i].trainList[list].date,
                  'max',
                  'muscle'
                  ),
                this.fillVacancyData(
                  muscleGroup[i].trainList[list].oneRepWeightChartData,
                  muscleGroup[i].trainList[list].date,
                  'avg',
                  'muscle'
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
            this.chartTimeStamp,
            this.fillVacancyData(
              muscleGroup[i].muscleGroupData.oneRepMaxChartData,
              muscleGroup[i].muscleGroupData.date,
              'max',
              'muscle'
              ),
            this.fillVacancyData(
              muscleGroup[i].muscleGroupData.oneRepWeightChartData,
              muscleGroup[i].muscleGroupData.date,
              'avg',
              'muscle'
              )
          ],
          trainList: partList  // 訓練部位清單數據for圖表
        };

        this.muscleTrendList.push(model);

        if (i === muscleGroup.length - 1) {
          this.handleMuscleData = true;
        }

      }

      this.muscleTrendList[i].isFocus = muscleGroup[i].isFocus;

      if (this.isPreviewMode && data[1] === 'init') {
        this.muscleTrendList[i].isFold = muscleGroup[i].isFold;
      }

    }

    this.updateUrl('true');
  }

  // 切換重訓程度-kidin-1090406
  handleproficiency (e) {
    if (e === +e) {

      switch (e) {
        case 1:
          this.proficiency = 'asept';
          this.proficiencyCoefficient = 1;
          this.level = ['1%', '100%', '200%'];
          break;
        case 2:
          this.proficiency = 'metacarpus';
          this.proficiencyCoefficient = 2;
          this.level = ['1%', '50%', '100%'];
          break;
        case 4:
          this.proficiency = 'Novice';
          this.proficiencyCoefficient = 4;
          this.level = ['1%', '25%', '50%'];
          break;
      }

    } else {

      switch (e.value) {
        case 'asept':
          this.proficiencyCoefficient = 1;
          this.level = ['1%', '100%', '200%'];
          break;
        case 'metacarpus':
          this.proficiencyCoefficient = 2;
          this.level = ['1%', '50%', '100%'];
          break;
        case 'Novice':
          this.proficiencyCoefficient = 4;
          this.level = ['1%', '25%', '50%'];
          break;
      }

    }

    this.updateUrl('true');
  }

  // 重訓圖表收合-kidin-1090414
  handleChartFold (idx, act) {
    if (this.muscleTrendList[idx].hasOwnProperty('isFold')) {

      if (this.muscleTrendList[idx].isFold === false || act !== undefined) {
        this.muscleTrendList[idx].isFold = true;
      } else {
        this.muscleTrendList[idx].isFold = false;
      }

    }

    this.updateUrl('true');
  }

  // 將搜尋的類別和範圍處理過後加入query string並更新現在的url和預覽列印的url-kidin-1090205
  updateUrl (hasData) {
    let newUrl;
    if (hasData === 'true') {
      const startDateString = this.reportStartTime.split('T')[0],
            endDateString = this.reportEndTime.split('T')[0];
      let searchString;

      if (this.reportCategory === 3) {

        let selectMuscle = '';
        for (let i = 0; i < this.muscleTrendList.length; i++) {

          if (this.muscleTrendList[i].isFocus === true) {

            if (this.muscleTrendList[i].isFold === true) {
              selectMuscle += `g${this.muscleTrendList[i].id}`;  // 收合用g表示
            } else {
              selectMuscle += `m${this.muscleTrendList[i].id}`;  // 展開用m表示
            }

          }

        }

        searchString =
        `sport=${this.reportCategory
        }&startdate=${startDateString
        }&enddate=${endDateString
        }&selectProficiency=${this.proficiencyCoefficient
        }&selectMuscle=${selectMuscle
        }`;
      } else {
        searchString =
        `sport=${this.reportCategory
        }&startdate=${startDateString
        }&enddate=${endDateString
        }`;
      }

      if (location.search.indexOf('?') > -1) {
        if (
          location.search.indexOf('sport=') > -1 &&
          location.search.indexOf('startdate=') > -1 &&
          location.search.indexOf('enddate=') > -1
        ) {
          // 將舊的sr query string換成新的-kidin-1090205
          const preUrl = location.pathname;
          const queryString = location.search.replace('?', '').split('&');
          let newSufUrl = '';
          for (let i = 0; i < queryString.length; i++) {
            if (
              queryString[i].indexOf('sport=') === -1 &&
              queryString[i].indexOf('startdate=') === -1 &&
              queryString[i].indexOf('enddate=') === -1
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

    /******待api 支援 debug mode-kidin-1090326
    if (history.pushState) {
      window.history.pushState({path: newUrl}, '', newUrl);
    }
    ********/
  }

  print() {
    window.print();
  }

  /**
   * 確認報告類型（日/週）
   * @param startDate {string}-報告開始日期
   * @param endDate {string}-報告結束日期
   * @author kidin-1090926
   */
  checkReportRangeType(startDate: string, endDate: string) {
    if (moment(endDate).diff(moment(startDate), 'days') <= 30) {
      this.reportRangeType = 1;
    } else {
      this.reportRangeType = 2;
    }

  }

  /**
   * 解除rxjs訂閱與初始化篩選器
   * @author kidin-1091211
   */
  ngOnDestroy () {
    this.showReport = false;
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

}
