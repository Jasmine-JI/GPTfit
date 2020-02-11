import { Component, OnInit, Output, OnChanges, EventEmitter } from '@angular/core';
import * as moment from 'moment';
import { ActivatedRoute } from '@angular/router';
import { Router } from '@angular/router';

import { TranslateService } from '@ngx-translate/core';

import { ActivityService } from '../../../services/activity.service';
import { UtilsService } from '@shared/services/utils.service';
import { HashIdService } from '@shared/services/hash-id.service';
import { UserProfileService } from '../../../services/user-profile.service';
import { ReportService } from '../../../services/report.service';
import { UserInfoService } from '../../../../containers/dashboard/services/userInfo.service';
import { startTimeRange } from '@angular/core/src/profile/wtf_impl';


@Component({
  selector: 'app-report-content',
  templateUrl: './report-content.component.html',
  styleUrls: ['./report-content.component.scss']
})
export class ReportContentComponent implements OnInit, OnChanges {

  // UI控制相關變數-kidin-1090115
  isLoading = true;
  isRxjsLoading = true;
  isPreviewMode = false;
  initialChartComplated = false;
  nodata = false;
  dataDateRange = '';

  // 資料儲存用變數-kidin-1090115
  @Output() showPrivacyUi = new EventEmitter();
  token: string;
  userId: string;
  reportCategory = '99';
  reportStartTime = '';
  reportEndTime = '';
  reportEndDate = '';
  period = '';
  selectPeriod = '';
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

  constructor(
    private router: Router,
    private activityService: ActivityService,
    private utilsService: UtilsService,
    private hashIdService: HashIdService,
    private route: ActivatedRoute,
    private userProfileService: UserProfileService,
    private reportService: ReportService,
    private translate: TranslateService,
    private userInfoService: UserInfoService
  ) { }

  ngOnInit() {
    this.token = this.utilsService.getToken();

    // 確認是否為預覽列印頁面-kidin-1090205
    if (location.search.indexOf('ipm=s') > -1) {
      this.isPreviewMode = true;
    }

    const hashUserId = this.route.snapshot.paramMap.get('userId');
    if (hashUserId === null) {
      const userBody = {
        token: this.token,
        avatarType: '2'
      };
      this.userProfileService.getUserProfile(userBody).subscribe(res => {
        this.fileInfo = res.info;
        this.userId = this.fileInfo.nameId;

        // 使用rxjs訂閱搜索日期使搜索日期更改時可以即時切換-kidin-1090121
        this.reportService.getReportAdditon().subscribe(response => {
          this.reportStartTime = response[0].value;
          this.reportEndTime = response[1].value;
          this.reportEndDate = this.reportEndTime.split('T')[0].replace(/-/g, '/');
          this.switchPeriod(response[2].value);
          this.createReport();
        });
      });
    } else {
      this.userId = this.hashIdService.handleUserIdDecode(hashUserId);

      // 使用rxjs訂閱搜索日期使搜索日期更改時可以即時切換-kidin-1090121
      this.reportService.getReportAdditon().subscribe(response => {
        this.reportStartTime = response[0].value;
        this.reportEndTime = response[1].value;
        this.reportEndDate = this.reportEndTime.split('T')[0].replace(/-/g, '/');
        this.switchPeriod(response[2].value);
        this.createReport();
      });
    }

    // 使用rxjs訂閱運動類別使運動類別更改時可以即時切換-kidin-1090121
    this.reportService.getreportCategory().subscribe(res => {
      this.reportCategory = res;
      this.loadCategoryData(res);
    });
  }

  ngOnChanges () {}

  // 建立運動報告-kidin-1090117
  createReport() {
    this.isLoading = true;

    // 取得目標年齡-kidin-1090205
    const getLoginBody = {
      avatarType: 2,
      iconType: 2,
      token: this.token
    };
    this.userInfoService.getLogonData(getLoginBody).subscribe(res => {
      if (res.resultCode !== +200 || +this.userId !== +res.info.nameId) {
        this.targetUserHRSetting = {
          userAge: null,
          userHRBase: null,
          userMaxHR: null,
          userRestHR: null
        };
      } else {
        this.targetUserHRSetting = {
          userAge: moment().diff(res.info.birthday, 'years'),
          userHRBase: res.info.heartRateBase,
          userMaxHR: res.info.heartRateMax,
          userRestHR: res.info.heartRateResting
        };
      }
    });

    this.initVariable();

    // 1個月內取日概要陣列，半年以上取周概要陣列-kidin_1090122
    const body = {
      token: this.token || '',
      type: this.reportRangeType,
      targetUserId: this.userId,
      filterStartTime: this.reportStartTime,
      filterEndTime: this.reportEndTime
    };

    this.reportService.fetchSportSummaryArray(body).subscribe(res => {
      if (res.resultCode === 400 || res.resultCode === 401 || res.resultCode === 402) {
        this.isLoading = false;
        this.updateUrl('false');
        return this.showPrivacyUi.emit(true);
      } else if (res.resultCode === 200) {
        this.showPrivacyUi.emit(false);
        const dataLength = res.reportInfo.totalPoint;
        if (dataLength === 0) {
          this.nodata = true;
          this.isLoading = false;
          this.updateUrl('false');
        } else {
          if (this.reportRangeType === 1) {
            this.activitiesList = res.reportActivityDays;
            this.dataDateRange = 'day';
            this.updateUrl('true');
          } else {
            this.activitiesList = res.reportActivityWeeks;
            this.dataDateRange = 'week';
            this.updateUrl('true');
          }

          this.calPerCategoryData(dataLength);
        }
      } else {
        console.log('Sever Error');
      }
    });
  }

  // 依據選擇的搜索日期切換顯示-kidin-1090121
  switchPeriod (period: string) {
    switch (period) {
      case '7':
        this.reportRangeType = 1;
        this.selectPeriod = '7';
        this.period = `7${this.translate.instant(
          'Dashboard.SportReport.day'
        )}`;
      break;
      case '30':
        this.reportRangeType = 1;
        this.selectPeriod = '30';
        this.period = `30${this.translate.instant(
          'Dashboard.SportReport.day'
        )}`;
      break;
      case '182':
        this.reportRangeType = 2;
        this.selectPeriod = '182';
        this.period = `6${this.translate.instant(
          'Dashboard.SportReport.month'
        )}`;
      break;
      case '364':
        this.reportRangeType = 2;
        this.selectPeriod = '364';
        this.period = `12${this.translate.instant(
          'Dashboard.SportReport.month'
        )}`;
      break;
    }
  }

  // 初始化變數
  initVariable () {
    this.nodata = false;
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
    this.reportService.setTypeAllData({}, {}, {}, {}, {}, {}, {});
    this.perHrZoneData = [];
    this.perTypeLength = [];
    this.perTypeTime = [];
    this.typeHrZone = [];
    this.perDate = [];
  }

  // 計算各種所需數據-kidin-1090120
  calPerCategoryData (dataLength) {
    const typeAllHrZoneData = [],
          typeAllCalories = [],
          typeAllDataDate = [],
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
          typeRowMaxPower = [];

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
        typeRowHrZoneFive = 0;

    for (let i = 0; i < dataLength; i++) {
      this.activityLength += +this.activitiesList[i].activities[0]['totalActivities'];
      typeAllTotalTrainTime += +this.activitiesList[i].activities[0]['totalSecond'];
      typeAllCalories.unshift(this.activitiesList[i].activities[0]['calories']);
      typeAllDataDate.unshift(this.activitiesList[i].startTime.split('T')[0]);

      // 確認是否有距離數據-kidin-1090204
      if (this.activitiesList[i].activities[0]['totalDistanceMeters']) {
        typeAllTotalDistance += this.activitiesList[i].activities[0]['totalDistanceMeters'];
      }

      // 確認是否有重量數據-kidin-1090204
      if (this.activitiesList[i].activities[0]['totalWeightKg']) {
        typeAllTotalWeight += this.activitiesList[i].activities[0]['totalWeightKg'];
      }

      // 活動成效分佈圖和心率區間趨勢用資料-kidin-1090203
      if (this.activitiesList[i].activities[0]['totalHrZone0Second'] !== null) {
        typeAllHrZoneZero += this.activitiesList[i].activities[0]['totalHrZone0Second'];
        typeAllHrZoneOne += this.activitiesList[i].activities[0]['totalHrZone1Second'];
        typeAllHrZoneTwo += this.activitiesList[i].activities[0]['totalHrZone2Second'];
        typeAllHrZoneThree += this.activitiesList[i].activities[0]['totalHrZone3Second'];
        typeAllHrZoneFour += this.activitiesList[i].activities[0]['totalHrZone4Second'];
        typeAllHrZoneFive += this.activitiesList[i].activities[0]['totalHrZone5Second'];
        if (
          this.activitiesList[i].activities[0]['totalHrZone0Second'] +
          this.activitiesList[i].activities[0]['totalHrZone1Second'] +
          this.activitiesList[i].activities[0]['totalHrZone2Second'] +
          this.activitiesList[i].activities[0]['totalHrZone3Second'] +
          this.activitiesList[i].activities[0]['totalHrZone4Second'] +
          this.activitiesList[i].activities[0]['totalHrZone5Second'] !== 0
        ) {
          typeAllHrZoneData.unshift([
            this.activitiesList[i].activities[0].type,
            this.activitiesList[i].activities[0]['totalHrZone0Second'],
            this.activitiesList[i].activities[0]['totalHrZone1Second'],
            this.activitiesList[i].activities[0]['totalHrZone2Second'],
            this.activitiesList[i].activities[0]['totalHrZone3Second'],
            this.activitiesList[i].activities[0]['totalHrZone4Second'],
            this.activitiesList[i].activities[0]['totalHrZone5Second'],
            this.activitiesList[i].startTime.split('T')[0]
          ]);
        }
      }

      // 根據不同類別計算數據-kidin-1090204
      switch (this.activitiesList[i].activities[0].type) {
        case '1':
          typeRunLength += +this.activitiesList[i].activities[0]['totalActivities'];
          typeRunTotalTrainTime += +this.activitiesList[i].activities[0]['totalSecond'];
          typeRunCalories.unshift(this.activitiesList[i].activities[0]['calories']);
          typeRunTotalDistance += this.activitiesList[i].activities[0]['totalDistanceMeters'];
          typeRunDataDate.unshift(this.activitiesList[i].startTime.split('T')[0]);
          typeRunSpeed.unshift(this.activitiesList[i].activities[0]['avgSpeed']);
          typeRunMaxSpeed.unshift(this.activitiesList[i].activities[0]['avgMaxSpeed']);
          typeRunCadence.unshift(this.activitiesList[i].activities[0]['runAvgCadence']);
          typeRunMaxCadence.unshift(this.activitiesList[i].activities[0]['avgRunMaxCadence']);
          typeRunHR.unshift(this.activitiesList[i].activities[0]['avgHeartRateBpm']);
          typeRunMaxHR.unshift(this.activitiesList[i].activities[0]['avgMaxHeartRateBpm']);


          // 確認是否有心率數據-kidin-1090204
          if (this.activitiesList[i].activities[0]['totalHrZone0Second'] !== null) {
            typeRunHrZoneZero += this.activitiesList[i].activities[0]['totalHrZone0Second'];
            typeRunHrZoneOne += this.activitiesList[i].activities[0]['totalHrZone1Second'];
            typeRunHrZoneTwo += this.activitiesList[i].activities[0]['totalHrZone2Second'];
            typeRunHrZoneThree += this.activitiesList[i].activities[0]['totalHrZone3Second'];
            typeRunHrZoneFour += this.activitiesList[i].activities[0]['totalHrZone4Second'];
            typeRunHrZoneFive += this.activitiesList[i].activities[0]['totalHrZone5Second'];
            if (
              this.activitiesList[i].activities[0]['totalHrZone0Second'] +
              this.activitiesList[i].activities[0]['totalHrZone1Second'] +
              this.activitiesList[i].activities[0]['totalHrZone2Second'] +
              this.activitiesList[i].activities[0]['totalHrZone3Second'] +
              this.activitiesList[i].activities[0]['totalHrZone4Second'] +
              this.activitiesList[i].activities[0]['totalHrZone5Second'] !== 0
            ) {
              typeRunHrZoneData.unshift([
                this.activitiesList[i].activities[0].type,
                this.activitiesList[i].activities[0]['totalHrZone0Second'],
                this.activitiesList[i].activities[0]['totalHrZone1Second'],
                this.activitiesList[i].activities[0]['totalHrZone2Second'],
                this.activitiesList[i].activities[0]['totalHrZone3Second'],
                this.activitiesList[i].activities[0]['totalHrZone4Second'],
                this.activitiesList[i].activities[0]['totalHrZone5Second'],
                this.activitiesList[i].startTime.split('T')[0]
              ]);
            }
          }

          break;
        case '2':
          typeCycleLength += +this.activitiesList[i].activities[0]['totalActivities'];
          typeCycleTotalTrainTime += +this.activitiesList[i].activities[0]['totalSecond'];
          typeCycleCalories.unshift(this.activitiesList[i].activities[0]['calories']);
          typeCycleTotalDistance += this.activitiesList[i].activities[0]['totalDistanceMeters'];
          typeCycleDataDate.unshift(this.activitiesList[i].startTime.split('T')[0]);
          typeCycleSpeed.unshift(this.activitiesList[i].activities[0]['avgSpeed']);
          typeCycleMaxSpeed.unshift(this.activitiesList[i].activities[0]['avgMaxSpeed']);
          typeCycleCadence.unshift(this.activitiesList[i].activities[0]['cycleAvgCadence']);
          typeCycleMaxCadence.unshift(this.activitiesList[i].activities[0]['avgCycleMaxCadence']);
          typeCycleHR.unshift(this.activitiesList[i].activities[0]['avgHeartRateBpm']);
          typeCycleMaxHR.unshift(this.activitiesList[i].activities[0]['avgMaxHeartRateBpm']);
          typeCyclePower.unshift(this.activitiesList[i].activities[0]['cycleAvgWatt']);
          typeCycleMaxPower.unshift(this.activitiesList[i].activities[0]['avgCycleMaxWatt']);

          if (this.activitiesList[i].activities[0]['totalHrZone0Second'] !== null) {
            typeCycleHrZoneZero += this.activitiesList[i].activities[0]['totalHrZone0Second'];
            typeCycleHrZoneOne += this.activitiesList[i].activities[0]['totalHrZone1Second'];
            typeCycleHrZoneTwo += this.activitiesList[i].activities[0]['totalHrZone2Second'];
            typeCycleHrZoneThree += this.activitiesList[i].activities[0]['totalHrZone3Second'];
            typeCycleHrZoneFour += this.activitiesList[i].activities[0]['totalHrZone4Second'];
            typeCycleHrZoneFive += this.activitiesList[i].activities[0]['totalHrZone5Second'];
            if (
              this.activitiesList[i].activities[0]['totalHrZone0Second'] +
              this.activitiesList[i].activities[0]['totalHrZone1Second'] +
              this.activitiesList[i].activities[0]['totalHrZone2Second'] +
              this.activitiesList[i].activities[0]['totalHrZone3Second'] +
              this.activitiesList[i].activities[0]['totalHrZone4Second'] +
              this.activitiesList[i].activities[0]['totalHrZone5Second'] !== 0
            ) {
              typeCycleHrZoneData.unshift([
                this.activitiesList[i].activities[0].type,
                this.activitiesList[i].activities[0]['totalHrZone0Second'],
                this.activitiesList[i].activities[0]['totalHrZone1Second'],
                this.activitiesList[i].activities[0]['totalHrZone2Second'],
                this.activitiesList[i].activities[0]['totalHrZone3Second'],
                this.activitiesList[i].activities[0]['totalHrZone4Second'],
                this.activitiesList[i].activities[0]['totalHrZone5Second'],
                this.activitiesList[i].startTime.split('T')[0]
              ]);
            }
          }

          break;
        case '3':
          typeWeightTrainLength += +this.activitiesList[i].activities[0]['totalActivities'];
          typeWeightTrainTotalTrainTime += +this.activitiesList[i].activities[0]['totalSecond'];
          typeWeightTrainCalories.unshift(this.activitiesList[i].activities[0]['calories']);
          typeWeightTrainTotalWeight += this.activitiesList[i].activities[0]['totalWeightKg'];
          typeWeightTrainDataDate.unshift(this.activitiesList[i].startTime.split('T')[0]);

          break;
        case '4':
          typeSwimLength += +this.activitiesList[i].activities[0]['totalActivities'];
          typeSwimTotalTrainTime += +this.activitiesList[i].activities[0]['totalSecond'];
          typeSwimCalories.unshift(this.activitiesList[i].activities[0]['calories']);
          typeSwimTotalDistance += this.activitiesList[i].activities[0]['totalDistanceMeters'];
          typeSwimDataDate.unshift(this.activitiesList[i].startTime.split('T')[0]);
          typeSwimSpeed.unshift(this.activitiesList[i].activities[0]['avgSpeed']);
          typeSwimMaxSpeed.unshift(this.activitiesList[i].activities[0]['avgMaxSpeed']);
          typeSwimCadence.unshift(this.activitiesList[i].activities[0]['swimAvgCadence']);
          typeSwimMaxCadence.unshift(this.activitiesList[i].activities[0]['avgSwimMaxCadence']);
          typeSwimSwolf.unshift(this.activitiesList[i].activities[0]['avgSwolf']);
          typeSwimMaxSwolf.unshift(this.activitiesList[i].activities[0]['bestSwolf']);
          typeSwimHR.unshift(this.activitiesList[i].activities[0]['avgHeartRateBpm']);
          typeSwimMaxHR.unshift(this.activitiesList[i].activities[0]['avgMaxHeartRateBpm']);

          if (this.activitiesList[i].activities[0]['totalHrZone0Second'] !== null) {
            typeSwimHrZoneZero += this.activitiesList[i].activities[0]['totalHrZone0Second'];
            typeSwimHrZoneOne += this.activitiesList[i].activities[0]['totalHrZone1Second'];
            typeSwimHrZoneTwo += this.activitiesList[i].activities[0]['totalHrZone2Second'];
            typeSwimHrZoneThree += this.activitiesList[i].activities[0]['totalHrZone3Second'];
            typeSwimHrZoneFour += this.activitiesList[i].activities[0]['totalHrZone4Second'];
            typeSwimHrZoneFive += this.activitiesList[i].activities[0]['totalHrZone5Second'];
            if (
              this.activitiesList[i].activities[0]['totalHrZone0Second'] +
              this.activitiesList[i].activities[0]['totalHrZone1Second'] +
              this.activitiesList[i].activities[0]['totalHrZone2Second'] +
              this.activitiesList[i].activities[0]['totalHrZone3Second'] +
              this.activitiesList[i].activities[0]['totalHrZone4Second'] +
              this.activitiesList[i].activities[0]['totalHrZone5Second'] !== 0
            ) {
              typeSwimHrZoneData.unshift([
                this.activitiesList[i].activities[0].type,
                this.activitiesList[i].activities[0]['totalHrZone0Second'],
                this.activitiesList[i].activities[0]['totalHrZone1Second'],
                this.activitiesList[i].activities[0]['totalHrZone2Second'],
                this.activitiesList[i].activities[0]['totalHrZone3Second'],
                this.activitiesList[i].activities[0]['totalHrZone4Second'],
                this.activitiesList[i].activities[0]['totalHrZone5Second'],
                this.activitiesList[i].startTime.split('T')[0]
              ]);
            }
          }

          break;
        case '5':
          typeAerobicLength += +this.activitiesList[i].activities[0]['totalActivities'];
          typeAerobicTotalTrainTime += +this.activitiesList[i].activities[0]['totalSecond'];
          typeAerobicCalories.unshift(this.activitiesList[i].activities[0]['calories']);
          typeAerobicDataDate.unshift(this.activitiesList[i].startTime.split('T')[0]);
          typeAerobicHR.unshift(this.activitiesList[i].activities[0]['avgHeartRateBpm']);
          typeAerobicMaxHR.unshift(this.activitiesList[i].activities[0]['avgMaxHeartRateBpm']);

          if (this.activitiesList[i].activities[0]['totalHrZone0Second'] !== null) {
            typeAerobicHrZoneZero += this.activitiesList[i].activities[0]['totalHrZone0Second'];
            typeAerobicHrZoneOne += this.activitiesList[i].activities[0]['totalHrZone1Second'];
            typeAerobicHrZoneTwo += this.activitiesList[i].activities[0]['totalHrZone2Second'];
            typeAerobicHrZoneThree += this.activitiesList[i].activities[0]['totalHrZone3Second'];
            typeAerobicHrZoneFour += this.activitiesList[i].activities[0]['totalHrZone4Second'];
            typeAerobicHrZoneFive += this.activitiesList[i].activities[0]['totalHrZone5Second'];
            if (
              this.activitiesList[i].activities[0]['totalHrZone0Second'] +
              this.activitiesList[i].activities[0]['totalHrZone1Second'] +
              this.activitiesList[i].activities[0]['totalHrZone2Second'] +
              this.activitiesList[i].activities[0]['totalHrZone3Second'] +
              this.activitiesList[i].activities[0]['totalHrZone4Second'] +
              this.activitiesList[i].activities[0]['totalHrZone5Second'] !== 0
            ) {
              typeAerobicHrZoneData.unshift([
                this.activitiesList[i].activities[0].type,
                this.activitiesList[i].activities[0]['totalHrZone0Second'],
                this.activitiesList[i].activities[0]['totalHrZone1Second'],
                this.activitiesList[i].activities[0]['totalHrZone2Second'],
                this.activitiesList[i].activities[0]['totalHrZone3Second'],
                this.activitiesList[i].activities[0]['totalHrZone4Second'],
                this.activitiesList[i].activities[0]['totalHrZone5Second'],
                this.activitiesList[i].startTime.split('T')[0]
              ]);
            }
          }

          break;
        case '6':
          typeRowLength += +this.activitiesList[i].activities[0]['totalActivities'];
          typeRowTotalTrainTime += +this.activitiesList[i].activities[0]['totalSecond'];
          typeRowCalories.unshift(this.activitiesList[i].activities[0]['calories']);
          typeRowTotalDistance += this.activitiesList[i].activities[0]['totalDistanceMeters'];
          typeRowDataDate.unshift(this.activitiesList[i].startTime.split('T')[0]);
          typeRowSpeed.unshift(this.activitiesList[i].activities[0]['avgSpeed']);
          typeRowMaxSpeed.unshift(this.activitiesList[i].activities[0]['avgMaxSpeed']);
          typeRowCadence.unshift(this.activitiesList[i].activities[0]['rowingAvgCadence']);
          typeRowMaxCadence.unshift(this.activitiesList[i].activities[0]['avgRowingMaxCadence']);
          typeRowHR.unshift(this.activitiesList[i].activities[0]['avgHeartRateBpm']);
          typeRowMaxHR.unshift(this.activitiesList[i].activities[0]['avgMaxHeartRateBpm']);
          typeRowPower.unshift(this.activitiesList[i].activities[0]['rowingAvgWatt']);
          typeRowMaxPower.unshift(this.activitiesList[i].activities[0]['rowingMaxWatt']);

          if (this.activitiesList[i].activities[0]['totalHrZone0Second'] !== null) {
            typeRowHrZoneZero += this.activitiesList[i].activities[0]['totalHrZone0Second'];
            typeRowHrZoneOne += this.activitiesList[i].activities[0]['totalHrZone1Second'];
            typeRowHrZoneTwo += this.activitiesList[i].activities[0]['totalHrZone2Second'];
            typeRowHrZoneThree += this.activitiesList[i].activities[0]['totalHrZone3Second'];
            typeRowHrZoneFour += this.activitiesList[i].activities[0]['totalHrZone4Second'];
            typeRowHrZoneFive += this.activitiesList[i].activities[0]['totalHrZone5Second'];
            if (
              this.activitiesList[i].activities[0]['totalHrZone0Second'] +
              this.activitiesList[i].activities[0]['totalHrZone1Second'] +
              this.activitiesList[i].activities[0]['totalHrZone2Second'] +
              this.activitiesList[i].activities[0]['totalHrZone3Second'] +
              this.activitiesList[i].activities[0]['totalHrZone4Second'] +
              this.activitiesList[i].activities[0]['totalHrZone5Second'] !== 0
            ) {
              typeRowHrZoneData.unshift([
                this.activitiesList[i].activities[0].type,
                this.activitiesList[i].activities[0]['totalHrZone0Second'],
                this.activitiesList[i].activities[0]['totalHrZone1Second'],
                this.activitiesList[i].activities[0]['totalHrZone2Second'],
                this.activitiesList[i].activities[0]['totalHrZone3Second'],
                this.activitiesList[i].activities[0]['totalHrZone4Second'],
                this.activitiesList[i].activities[0]['totalHrZone5Second'],
                this.activitiesList[i].startTime.split('T')[0]
              ]);
            }
          }

          break;
      }
    }

    const typeAllAvgTrainTime = (typeAllTotalTrainTime / this.activityLength) || 0,
          typeRunAvgTrainTime = (typeRunTotalTrainTime / typeRunLength) || 0,
          typeCycleAvgTrainTime = (typeCycleTotalTrainTime / typeCycleLength) || 0,
          typeWeightTrainAvgTrainTime = (typeWeightTrainTotalTrainTime / typeWeightTrainLength) || 0,
          typeSwimAvgTrainTime = (typeSwimTotalTrainTime / typeSwimLength) || 0,
          typeAerobicAvgTrainTime = (typeAerobicTotalTrainTime / typeAerobicLength) || 0,
          typeRowAvgTrainTime = (typeRowTotalTrainTime / typeRowLength) || 0;

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
      perTypeLength: [typeRunLength, typeCycleLength, typeWeightTrainLength, typeSwimLength, typeAerobicLength, typeRowLength],
      perTypeTime: [
        typeRunAvgTrainTime,
        typeCycleAvgTrainTime,
        typeWeightTrainAvgTrainTime,
        typeSwimAvgTrainTime,
        typeAerobicAvgTrainTime,
        typeRowAvgTrainTime
      ],
      perHrZoneData: typeAllHrZoneData,
      perCaloriesData: this.computeSameDayData(typeAllCalories, [], typeAllDataDate, 'calories')
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
      perHrZoneData: typeRunHrZoneData,
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
      perHrZoneData: typeCycleHrZoneData,
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
      perHrZoneData: typeSwimHrZoneData,
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
      perHrZoneData: typeAerobicHrZoneData,
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
      perHrZoneData: typeRowHrZoneData,
      perCaloriesData: this.computeSameDayData(typeRowCalories, [], typeRowDataDate, 'calories'),
      perPaceData: this.computePace(typeRowSpeed, typeRowMaxSpeed, typeRowDataDate, 6),
      perCadenceData: this.computeSportData(typeRowCadence, typeRowMaxCadence, typeRowDataDate, 'cadence'),
      perHRData: this.computeSportData(typeRowHR, typeRowMaxHR, typeRowDataDate, 'HR'),
      perPowerData: this.computeSportData(typeRowPower, typeRowMaxPower, typeRowDataDate, 'power')
    };

    this.reportService.setTypeAllData(
      typeAllData,
      typeRunData,
      typeCycleData,
      typeWeightTrainData,
      typeSwimData,
      typeAerobicData,
      typeRowData,
    );
    this.isLoading = false;

    this.loadCategoryData(this.reportCategory);
  }

  // 使時間依照xxxx/XX/XX格式顯示-kidin-1090120
  formatTime (time: number) {
    const hour = Math.floor((time) / 3600);
    const minute = Math.floor((time % 3600) / 60);
    const second = time - (hour * 3600) - (minute * 60);
    if (hour === 0) {
      return `${this.fillTwoDigits(minute)}:${this.fillTwoDigits(second)}`;
    } else {
      return `${this.fillTwoDigits(hour)}:${this.fillTwoDigits(minute)}:${this.fillTwoDigits(second)}`;
    }
  }

  // 時間補零-kidin-1081211
  fillTwoDigits (num: number) {
    const timeStr = '0' + num;
    return timeStr.substr(-2);
  }

  // 根據運動類別使用rxjs從service取得資料-kidin-1090120
  loadCategoryData (type: string) {
    this.isRxjsLoading = true;
    this.reportService.getTypeData(type).subscribe(res => {
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

        if (res.distance) {
          this.totalDistance = res.distance;
        }

        if (res.weightKg) {
          this.totalWeight = res.weightKg;
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
      pace,
      bestPace,
      date: finalDate,
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
          cadence: finalData,
          bestCadence: bestFinalData,
          date: finalDate,
          colorSet: ['#aafc42', '#d6ff38', '#f56300'],
          oneRangeBestCadence: oneRangeBest,
          avgCadence: perTypeAvg
        };
      case 'heartRate':
        return {
          HR: finalData,
          bestHR: bestFinalData,
          date: finalDate,
          colorSet: ['#aafc42', '#d6ff38', '#f56300'],
          oneRangeBestHR: oneRangeBest,
          avgHR: perTypeAvg
        };
      case 'calories':
        return {
          calories: finalData,
          bestCalories: bestFinalData,
          date: finalDate,
          colorSet: ['#f8b551'],
          oneRangeBestCalories: oneRangeBest,
          avgCalories: perTypeAvg
        };
      case 'swolf':
        return {
          swolf: finalData,
          bestSwolf: bestFinalData,
          date: finalDate,
          colorSet: ['#aafc42', '#d6ff38', '#7fd9ff'],
          oneRangeBestSwolf: oneRangeBest,
          avgSwolf: perTypeAvg
        };
      case 'speed':
        return {
          speed: finalData,
          bestSpeed: bestFinalData,
          date: finalDate,
          colorSet: ['#ff00ff', '#ffff00', '#ffff00'],
          oneRangeBestSpeed: oneRangeBest,
          avgSpeed: perTypeAvg
        };
      case 'power':
        return {
          power: finalData,
          bestPower: bestFinalData,
          date: finalDate,
          colorSet: ['#aafc42', '#d6ff38', '#f56300'],
          oneRangeBestPower: oneRangeBest,
          avgPower: perTypeAvg
        };
      case 'HR':
        return {
          HR: finalData,
          bestHR: bestFinalData,
          date: finalDate,
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
            calories: finalData,
            bestcalories: bestFinalData,
            date: finalDate,
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
            calories: finalData,
            date: finalDate,
            colorSet: '#f8b551',
            oneRangeBestCalories: oneRangeBest,
            avgCalories: total / date.length,
            totalCalories: total
          };
      }
    }
  }

  // 將搜尋的類別和範圍處理過後加入query string並更新現在的url和預覽列印的url-kidin-1090205
  updateUrl (hasData) {
    let newUrl;
    if (hasData === 'true') {
      const startDateString = this.reportStartTime.split('T')[0],
            endDateString = this.reportEndTime.split('T')[0];
      let searchString;

      searchString =
        `sport=${this.reportCategory}&startdate=${startDateString}&enddate=${endDateString}&selectPeriod=${this.selectPeriod}`;

      if (location.search.indexOf('?') > -1) {
        if (
          location.search.indexOf('sport=') > -1 &&
          location.search.indexOf('startdate=') > -1 &&
          location.search.indexOf('enddate=') > -1 &&
          location.search.indexOf('selectPeriod=') > -1
        ) {
          // 將舊的sr query string換成新的-kidin-1090205
          const preUrl = location.pathname;
          const queryString = location.search.replace('?', '').split('&');
          let newSufUrl = '';
          for (let i = 0; i < queryString.length; i++) {
            if (
              queryString[i].indexOf('sport=') === -1 &&
              queryString[i].indexOf('startdate=') === -1 &&
              queryString[i].indexOf('enddate=') === -1 &&
              queryString[i].indexOf('selectPeriod=') === -1
            ) {
              newSufUrl = `${newSufUrl}&${queryString[i]}`;
            }
          }
          newUrl = `${preUrl}?${searchString}${newSufUrl}`;
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

  print() {
    window.print();
  }

}