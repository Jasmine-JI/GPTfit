import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import * as moment from 'moment';
import { TranslateService } from '@ngx-translate/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { UtilsService } from '@shared/services/utils.service';
import { HashIdService } from '@shared/services/hash-id.service';
import { ReportService } from '../../services/report.service';
import { UserProfileService } from '../../services/user-profile.service';

@Component({
  selector: 'app-my-life-tracking',
  templateUrl: './my-life-tracking.component.html',
  styleUrls: ['./my-life-tracking.component.scss']
})
export class MyLifeTrackingComponent implements OnInit, OnDestroy {

  private ngUnsubscribe = new Subject();

  // UI控制相關變數-kidin-1090115
  isLoading = false;
  isPreviewMode = false;
  reportCompleted = true;
  initialChartComplated = false;
  nodata = false;
  noStepData = true;
  noHRData = true;
  noSleepData = true;
  noConstituteData = true;
  noFitTimeData = true;
  dataDateRange = 'day';
  showReport = false;
  selectedIndex = 0;
  periodTimes = [];
  windowWidth = window.innerWidth;

  // 資料儲存用變數-kidin-1090115
  token: string;
  userId: number;
  fileInfo: any;
  timeType = 0;
  filterStartTime = moment()
    .subtract(6, 'days')
    .format('YYYY/MM/DD');
  filterEndTime = moment().format('YYYY/MM/DD');
  reportStartTime: string;
  reportEndTime: string;
  today = moment().format('YYYY/MM/DD');
  endWeekDay = moment()
    .add(6 - +moment().format('d'), 'days')
    .format('YYYY/MM/DD');
  startDate = '';
  endDate = moment().format('YYYY-MM-DD');
  reportEndDate = '';
  selectPeriod = '7';
  period = `7 ${this.translate.instant('universal_time_day')}`;
  reportRangeType = 1;
  reportCreatedTime = moment().format('YYYY/MM/DD HH:mm');
  timeZoneStr = '';
  previewUrl = '';

  infoData = {
    validStroke: 0,
    height: 0,
    weight: 0,
    age: 0,
    gender: 0,
    fatRate: 0,
    fatRateComment: '',
    fatRateColor: '',
    muscleRate: 0,
    muscleRateComment: '',
    muscleRateColor: '',
    skeletonRate: 0,
    moistureRate: 0,
    moistureRateComment: '',
    moistureRateColor: '',
    proteinRate: 0,
    basalMetabolicRate: 0,
    FFMI: 0
  };

  recordData = {
    avgStep: 0,
    avgDistance: 0,
    stepReachReps: 0,
    avgMaxHR: 0,
    avgRestHR: 0,
    avgSleepTime: '',
    avgDeepSleepTime: '',
    avgLightSleepTime: ''
  };

  trendData = {
    bestFitTime: 0,
    avgFitTime: 0
  };

  sortResultData = [];

  // 圖表用數據-kidin-1090215
  chartTimeStamp = [];
  searchDate = [];
  stepData: any = {
    stepList: [],
    targetStepList: [],
    date: [],
    colorSet: ['#6fd205', '#7f7f7f', '#eb5293']
  };

  HRData: any = {
    maxHRList: [],
    restHRList: [],
    date: [],
    colorSet: ['#e23333', '#31df93', '#ababab']
  };

  sleepData: any = {
    totalSleepList: [],
    deepSleepList: [],
    lightSleepList: [],
    awakeList: [],
    date: []
  };

  weightData = {
    weightList: [],
    colorSet: [
      [0, '#7ee33a'],
      [0.5, 'yellow'],
      [1, 'red']
    ]
  };

  constituteData = {
    fatRateList: [],
    fatRateColorSet: [
      [0, '#e0a63a'],
      [1, '#e04fc4']
    ],
    muscleRateList: [],
    muscleRateColorSet: [
      [0, '#3ae5da'],
      [1, '#299fc6']
    ]
  };

  fitTimeData: any = {
    fitTimeList: [],
    date: [],
    colorSet: '#f8b551'
  };

  constructor(
    private utilsService: UtilsService,
    private hashIdService: HashIdService,
    private route: ActivatedRoute,
    private reportService: ReportService,
    private translate: TranslateService,
    private userProfileService: UserProfileService
  ) { }

  ngOnInit() {

    this.token = this.utilsService.getToken() || '';

    // 確認是否為預覽列印頁面-kidin-1090215
    if (location.search.indexOf('ipm=s') > -1) {
      this.isPreviewMode = true;
    }

    // 確認url是否有query string-kidin-1090205
    this.getTimeZone();
    if (
      location.search.indexOf('startdate=') > -1 &&
      location.search.indexOf('enddate=') > -1 &&
      location.search.indexOf('selectPeriod=') > -1
    ) {
      this.queryStringShowData();
      this.getUserId('url');
    } else {
      this.reportEndTime = moment().format(`YYYY-MM-DDT23:59:59${this.timeZoneStr}`);
      this.reportStartTime = moment()
        .subtract(6, 'days')
        .format(`YYYY-MM-DDT00:00:00${this.timeZoneStr}`);

      this.getUserId('click');
    }

  }

  // 取得當地時區並加以處理-kidin-109024
  getTimeZone () {
    const timeZoneMinite = new Date();
    const timeZone = -(timeZoneMinite.getTimezoneOffset() / 60);
    if (timeZone < 10 && timeZone >= 0) {
      this.timeZoneStr = `+0${timeZone}:00`;
    } else if (timeZone > 10) {
      this.timeZoneStr = `+${timeZone}:00`;
    } else if (timeZone > -10 && timeZone < 0) {
      this.timeZoneStr = `-0${timeZone}:00`;
    } else {
      this.timeZoneStr = `-${timeZone}:00`;
    }
  }

  // 依query string顯示資料-kidin-20191226
  queryStringShowData () {
    const queryString = location.search.replace('?', '').split('&');
    for (let i = 0; i < queryString.length; i++) {
      if (queryString[i].indexOf('startdate=') > -1) {
        this.filterStartTime = queryString[i].replace('startdate=', '').replace(/-/g, '/');
        this.reportStartTime = moment(queryString[i]
          .replace('startdate=', ''), 'YYYY-MM-DD')
          .format(`YYYY-MM-DDT00:00:00${this.timeZoneStr}`);
      } else if (queryString[i].indexOf('enddate=') > -1) {
        this.filterEndTime = queryString[i].replace('enddate=', '').replace(/-/g, '/');
        this.reportEndTime = moment(queryString[i]
          .replace('enddate=', ''), 'YYYY-MM-DD')
          .format(`YYYY-MM-DDT23:59:59${this.timeZoneStr}`);
      } else if (queryString[i].indexOf('selectPeriod=') > -1) {
        this.selectPeriod = queryString[i].replace('selectPeriod=', '');

        switch (this.selectPeriod) {
          case '7':
            this.selectedIndex = 0;
            this.reportRangeType = 1;
            this.dataDateRange = 'day';
            this.period = `7 ${this.translate.instant('universal_time_day')}`;
            break;
          case '30':
            this.selectedIndex = 1;
            this.reportRangeType = 1;
            this.dataDateRange = 'day';
            this.period = `30 ${this.translate.instant('universal_time_day')}`;
            break;
          case '182':
            this.selectedIndex = 2;
            this.reportRangeType = 2;
            this.dataDateRange = 'week';
            this.period = `6 ${this.translate.instant('universal_time_month')}`;
            break;
          default:
            this.selectedIndex = 3;
            this.reportRangeType = 2;
            this.dataDateRange = 'week';
            this.period = `12 ${this.translate.instant('universal_time_month')}`;
            break;
        }
      }
    }

  }

  // 取得userId-kidin-1090224
  getUserId (action) {
    const hashUserId = this.route.snapshot.paramMap.get('userId');
    if (hashUserId === null) {

      this.userProfileService.getRxUserProfile().pipe(
        takeUntil(this.ngUnsubscribe)
      ).subscribe(res => {
        this.fileInfo = res;
        this.userId = this.fileInfo.userId;

        if (action === 'click') {
          this.generateTimePeriod();
        } else {
          this.createReport();
        }

      });
    } else {
      this.userId = this.hashIdService.handleUserIdDecode(hashUserId);

      if (action === 'click') {
          this.generateTimePeriod();
        } else {
          this.createReport();
        }
    }

  }

  // 選擇日期長度-kidin-1090224
  changeGroupInfo (e) {
    this.timeType = e.index;
    this.filterEndTime = moment().format('YYYY/MM/DD');
    const day = moment().format('d');
    if (this.timeType === 0) {
      this.reportRangeType = 1;
      this.dataDateRange = 'day';
      this.selectPeriod = '7';
      this.period = `7 ${this.translate.instant('universal_time_day')}`;
      this.filterStartTime = moment()
        .subtract(6, 'days')
        .format('YYYY/MM/DD');
    } else if (this.timeType === 1) {
      this.reportRangeType = 1;
      this.dataDateRange = 'day';
      this.selectPeriod = '30';
      this.period = `30 ${this.translate.instant('universal_time_day')}`;
      this.filterStartTime = moment()
        .subtract(29, 'days')
        .format('YYYY/MM/DD');
    } else if (this.timeType === 2) {
      this.reportRangeType = 2;
      this.dataDateRange = 'week';
      this.selectPeriod = '182';
      this.period = `6 ${this.translate.instant('universal_time_month')}`;
      this.filterStartTime = moment()
        .subtract(day, 'days')
        .subtract(26, 'weeks')
        .format('YYYY/MM/DD');
      this.filterEndTime = moment()
        .add(6 - +day, 'days')
        .format('YYYY/MM/DD');
    } else {
      this.reportRangeType = 2;
      this.dataDateRange = 'week';
      this.selectPeriod = '364';
      this.period = `12 ${this.translate.instant('universal_time_month')}`;
      this.filterStartTime = moment()
        .subtract(day, 'days')
        .subtract(52, 'weeks')
        .format('YYYY/MM/DD');
      this.filterEndTime = moment()
        .add(6 - +day, 'days')
        .format('YYYY/MM/DD');
    }

    let filterEndTime = moment().format(`YYYY-MM-DDT23:59:59${this.timeZoneStr}`);

    let filterStartTime = '';
    if (this.timeType === 0) {
      filterStartTime = moment()
        .subtract(6, 'days')
        .format(`YYYY-MM-DDT00:00:00${this.timeZoneStr}`);
    } else if (this.timeType === 1) {
      filterStartTime = moment()
        .subtract(29, 'days')
        .format(`YYYY-MM-DDT00:00:00${this.timeZoneStr}`);
    } else if (this.timeType === 2) {
      filterStartTime = moment()
        .subtract(day, 'days')
        .subtract(26, 'weeks')
        .format(`YYYY-MM-DDT00:00:00${this.timeZoneStr}`);
      filterEndTime = moment()
        .add(6 - +day, 'days')
        .format(`YYYY-MM-DDT23:59:59${this.timeZoneStr}`);
    } else {
      filterStartTime = moment()
        .subtract(day, 'days')
        .subtract(52, 'weeks')
        .format(`YYYY-MM-DDT00:00:00${this.timeZoneStr}`);
      filterEndTime = moment()
        .add(6 - +day, 'days')
        .format(`YYYY-MM-DDT23:59:59${this.timeZoneStr}`);
    }

    this.reportStartTime = filterStartTime;
    this.reportEndTime = filterEndTime;

    this.generateTimePeriod();
  }

  shiftPreTime() {
    if (this.timeType === 0) {
      this.filterEndTime = moment(this.filterStartTime)
        .subtract(1, 'days')
        .format('YYYY/MM/DD');
      this.filterStartTime = moment(this.filterEndTime)
        .subtract(6, 'days')
        .format('YYYY/MM/DD');
    } else if (this.timeType === 1) {
      this.filterEndTime = moment(this.filterStartTime)
        .subtract(1, 'days')
        .format('YYYY/MM/DD');
      this.filterStartTime = moment(this.filterEndTime)
        .subtract(29, 'days')
        .format('YYYY/MM/DD');
    } else if (this.timeType === 2) {
      this.filterEndTime = moment(this.filterStartTime)
        .subtract(1, 'days')
        .format('YYYY/MM/DD');
      this.filterStartTime = moment(this.filterEndTime)
        .subtract(6, 'days')
        .subtract(26, 'weeks')
        .format('YYYY/MM/DD');
    } else {
      this.filterEndTime = moment(this.filterStartTime)
        .subtract(1, 'days')
        .format('YYYY/MM/DD');
      this.filterStartTime = moment(this.filterEndTime)
        .subtract(6, 'days')
        .subtract(52, 'weeks')
        .format('YYYY/MM/DD');
    }
    this.reportEndTime = moment(this.filterEndTime).format(
      `YYYY-MM-DDT23:59:59${this.timeZoneStr}`
    );
    this.reportStartTime = moment(this.filterStartTime).format(
      `YYYY-MM-DDT00:00:00${this.timeZoneStr}`
    );

    this.generateTimePeriod();
  }

  shiftNextTime() {
    if (
      this.filterEndTime !== this.today ||
      this.filterEndTime !== this.endWeekDay
    ) {
      if (this.timeType === 0) {
        this.filterStartTime = moment(this.filterEndTime)
          .add(1, 'days')
          .format('YYYY/MM/DD');
        this.filterEndTime = moment(this.filterStartTime)
          .add(6, 'days')
          .format('YYYY/MM/DD');
      } else if (this.timeType === 1) {
        this.filterStartTime = moment(this.filterEndTime)
          .add(1, 'days')
          .format('YYYY/MM/DD');
        this.filterEndTime = moment(this.filterStartTime)
          .add(29, 'days')
          .format('YYYY/MM/DD');
      } else if (this.timeType === 2) {
        this.filterStartTime = moment(this.filterEndTime)
          .add(1, 'days')
          .format('YYYY/MM/DD');
        this.filterEndTime = moment(this.filterStartTime)
          .add(6, 'days')
          .add(26, 'weeks')
          .format('YYYY/MM/DD');
      } else {
        this.filterStartTime = moment(this.filterEndTime)
          .add(1, 'days')
          .format('YYYY/MM/DD');
        this.filterEndTime = moment(this.filterStartTime)
          .add(6, 'days')
          .add(52, 'weeks')
          .format('YYYY/MM/DD');
      }
      this.reportEndTime = moment(this.filterEndTime).format(
        `YYYY-MM-DDT23:59:59${this.timeZoneStr}`
      );
      this.reportStartTime = moment(this.filterStartTime).format(
        `YYYY-MM-DDT00:00:00${this.timeZoneStr}`
      );

      this.generateTimePeriod();
    }
  }

  generateTimePeriod() {
    this.periodTimes = [];
    let stamp = moment(this.filterStartTime).unix();
    const stopDay = moment(this.filterEndTime).format('d');
    let stopTime = '';
    if (this.timeType === 2 || this.timeType === 3) {
      const stopTimeStamp =
        moment(this.filterEndTime)
          .subtract(stopDay, 'days')
          .unix() +
        86400 * 7;
      stopTime = moment.unix(stopTimeStamp).format('YYYY-MM-DD');
    } else {
      const stopStamp = moment(this.filterEndTime).unix() + 86400;
      stopTime = moment.unix(stopStamp).format('YYYY-MM-DD');
    }
    while (moment.unix(stamp).format('YYYY-MM-DD') !== stopTime) {
      if (this.timeType === 2 || this.timeType === 3) {
        this.periodTimes.push((stamp + 86400 * 6) * 1000);
        stamp = stamp + 86400 * 7;
      } else {
        this.periodTimes.push(stamp * 1000);
        stamp = stamp + 86400;
      }
    }

    this.createReport();
  }

  // 建立報告-kidin-1090117
  createReport () {
    this.isLoading = true;

    this.initVariable();

    const body = {
      token: this.token || '',
      type: this.reportRangeType,
      targetUserId: [this.userId],
      filterStartTime: this.reportStartTime,
      filterEndTime: this.reportEndTime
    };

    this.searchDate = [
      moment(this.reportStartTime.split('T')[0], 'YYYY-MM-DD').valueOf(),
      moment(this.reportEndTime.split('T')[0], 'YYYY-MM-DD').valueOf()
    ];

    this.createTimeStampArr(+this.selectPeriod);

    this.reportService.fetchTrackingSummaryArray(body).subscribe(res => {
      if (Array.isArray(res)) {
        this.reportCompleted = true;
        this.reportEndDate = this.reportEndTime.split('T')[0];
        this.checkReportEndDate();

        const currentYear = moment().year();

        // 確認隱私權有無開放-kidin-1090215
        if (+res[0].resultCode === 200) {
          let lifeTrackingData;

          if (this.reportRangeType === 1) {
            lifeTrackingData = res[0].reportLifeTrackingDays;
          } else {
            lifeTrackingData = res[0].reportLifeTrackingWeeks;
          }

          if (lifeTrackingData.length !== 0) {
            this.nodata = false;
            this.showReport = true;
            this.updateUrl('true');

            this.infoData.validStroke = lifeTrackingData.length;
            this.infoData.gender = lifeTrackingData[0].gender;
            this.infoData.age = +currentYear - +lifeTrackingData[0].birthYear;

            const heightList = [],
                  weightList = [],
                  muscleRateList = [],
                  fatRateList = [],
                  skeletonRateList = [],
                  moistureRateList = [],
                  proteinRateList = [],
                  basalMetabolicRateList = [],
                  FFMI = [],

                  step = {
                    totalSteps: 0,
                    totalDistance: 0,
                    totalLength: 0
                  },

                  HR = {
                    totalMaxHR: 0,
                    totalRestHR: 0,
                    totalLength: 0
                  },

                  sleep = {
                    totalSleepTime: 0,
                    totalDeepSleepTime: 0,
                    totalLightSleepTime: 0,
                    totalLength: 0
                  },

                  fitTime = {
                    totalFitTime: 0,
                    totalLength: 0,
                    bestFitTime: 0
                  };

            for (let j = 0; j < lifeTrackingData.length; j++) {

              if (lifeTrackingData[j].bodyHeight !== null) {
                heightList.unshift(lifeTrackingData[j].bodyHeight);
              }

              if (lifeTrackingData[j].bodyWeight !== null) {
                weightList.unshift([
                  moment(lifeTrackingData[j].startTime.split('T')[0], 'YYYY-MM-DD').valueOf(),
                  lifeTrackingData[j].bodyWeight
                ]);
              }

              // FFMI＝〔體重（Kg）×（100％－體脂率）〕÷ 身高2（m）-kidin-1090215
              if (lifeTrackingData[j].muscleRate !== null && lifeTrackingData[j].muscleRate !== 0) {
                muscleRateList.unshift([
                  moment(lifeTrackingData[j].startTime.split('T')[0], 'YYYY-MM-DD').valueOf(),
                  lifeTrackingData[j].muscleRate
                ]);

                fatRateList.unshift([
                  moment(lifeTrackingData[j].startTime.split('T')[0], 'YYYY-MM-DD').valueOf(),
                  lifeTrackingData[j].fatRate
                ]);

                skeletonRateList.unshift([
                  moment(lifeTrackingData[j].startTime.split('T')[0], 'YYYY-MM-DD').valueOf(),
                  lifeTrackingData[j].skeletonRate
                ]);

                moistureRateList.unshift([
                  moment(lifeTrackingData[j].startTime.split('T')[0], 'YYYY-MM-DD').valueOf(),
                  lifeTrackingData[j].moistureRate
                ]);

                proteinRateList.unshift([
                  moment(lifeTrackingData[j].startTime.split('T')[0], 'YYYY-MM-DD').valueOf(),
                  lifeTrackingData[j].proteinRate
                ]);

                basalMetabolicRateList.unshift([
                  moment(lifeTrackingData[j].startTime.split('T')[0], 'YYYY-MM-DD').valueOf(),
                  lifeTrackingData[j].basalMetabolicRate
                ]);

                const height = lifeTrackingData[j].bodyHeight / 100,
                      weight = lifeTrackingData[j].bodyWeight,
                      fatRate = lifeTrackingData[j].fatRate,
                      countFFMI = (weight * ((100 - fatRate) / 100)) / Math.pow(height, 2);
                FFMI.unshift(countFFMI);
              }

              // 步數資料-kidin-1090304
              if (lifeTrackingData[j].totalStep !== 0 && lifeTrackingData[j].totalStep !== null) {
                this.noStepData = false;
                step.totalSteps += lifeTrackingData[j].totalStep;
                step.totalDistance += lifeTrackingData[j].totalDistanceMeters;
                step.totalLength++;

                this.stepData.targetStepList.unshift(lifeTrackingData[j].targetStep);
                this.stepData.stepList.unshift(lifeTrackingData[j].totalStep);
                this.stepData.date.unshift(moment(lifeTrackingData[j].startTime.split('T')[0], 'YYYY-MM-DD').valueOf());

              }

              // 休息心率資料-kidin-1090304
              if (lifeTrackingData[j].maxHeartRate !== 0 && lifeTrackingData[j].maxHeartRate !== null) {
                this.noHRData = false;
                HR.totalRestHR += lifeTrackingData[j].restHeartRate;
                HR.totalMaxHR += lifeTrackingData[j].maxHeartRate;
                HR.totalLength++;

                this.HRData.restHRList.unshift(lifeTrackingData[j].restHeartRate);
                this.HRData.maxHRList.unshift(lifeTrackingData[j].maxHeartRate);
                this.HRData.date.unshift(moment(lifeTrackingData[j].startTime.split('T')[0], 'YYYY-MM-DD').valueOf());
              }

              // 睡眠資料-kidin-1090304
              if (lifeTrackingData[j].totalSleepSecond !== 0 && lifeTrackingData[j].totalSleepSecond !== null) {
                this.noSleepData = false;
                sleep.totalSleepTime += lifeTrackingData[j].totalSleepSecond;
                sleep.totalDeepSleepTime += lifeTrackingData[j].totalDeepSecond;
                sleep.totalLightSleepTime += lifeTrackingData[j].totalLightSecond;
                sleep.totalLength++;

                this.sleepData.totalSleepList.unshift(lifeTrackingData[j].totalSleepSecond);
                this.sleepData.deepSleepList.unshift(lifeTrackingData[j].totalDeepSecond);
                this.sleepData.lightSleepList.unshift(lifeTrackingData[j].totalLightSecond);
                this.sleepData.awakeList.unshift(
                  lifeTrackingData[j].totalSleepSecond - lifeTrackingData[j].totalDeepSecond - lifeTrackingData[j].totalLightSecond
                  );
                this.sleepData.date.unshift(moment(lifeTrackingData[j].startTime.split('T')[0], 'YYYY-MM-DD').valueOf());
              }

              // 燃脂時間資料-kidin-1090304
              if (lifeTrackingData[j].totalFitSecond !== 0  && lifeTrackingData[j].totalFitSecond !== null) {
                this.noFitTimeData = false;
                fitTime.totalFitTime += lifeTrackingData[j].totalFitSecond;
                fitTime.totalLength++;

                if (lifeTrackingData[j].totalFitSecond > fitTime.bestFitTime) {
                  fitTime.bestFitTime = lifeTrackingData[j].totalFitSecond;
                }

                this.fitTimeData.fitTimeList.unshift(lifeTrackingData[j].totalFitSecond);
                this.fitTimeData.date.unshift(moment(lifeTrackingData[j].startTime.split('T')[0], 'YYYY-MM-DD').valueOf());
              }

            }

            this.stepData = this.filterRepeatData(
              this.stepData.date,
              this.stepData.stepList,
              this.stepData.targetStepList,
              [],
              [],
              'add',
              'step'
            );

            this.HRData = this.filterRepeatData(
              this.HRData.date,
              this.HRData.restHRList,
              this.HRData.maxHRList,
              [],
              [],
              'avg',
              'hr'
            );

            this.sleepData = this.filterRepeatData(
              this.sleepData.date,
              this.sleepData.totalSleepList,
              this.sleepData.deepSleepList,
              this.sleepData.lightSleepList,
              this.sleepData.awakeList,
              'avg',
              'sleep'
            );

            this.fitTimeData = this.filterRepeatData(
              this.fitTimeData.date,
              this.fitTimeData.fitTimeList,
              [],
              [],
              [],
              'add',
              'fitTime'
            );

            // 比照多人report資料格式-kidin-1090316
            const filterWeightData = this.filterRepeatBodyData(weightList),
                  fillWeightData = this.fillVacancyData(filterWeightData);
            this.weightData.weightList = [fillWeightData];

            if (muscleRateList.length !== 0) {
              this.noConstituteData = false;

              const filterMuscleRateData = this.filterRepeatBodyData(muscleRateList),
                    fillMuscleRateData = this.fillVacancyData(filterMuscleRateData);
              this.constituteData.muscleRateList = [fillMuscleRateData];

              const filterFatRateData = this.filterRepeatBodyData(fatRateList),
                    fillFatRateData = this.fillVacancyData(filterFatRateData);
              this.constituteData.fatRateList = [fillFatRateData];
            }

            // 取該期間最新的身體素質-kidin-1090224
            this.infoData.height = heightList[heightList.length - 1];
            this.infoData.weight = weightList[weightList.length - 1][1];

            if (fatRateList.length !== 0) {
              this.infoData.fatRate = fatRateList[fatRateList.length - 1][1];
              this.infoData.muscleRate = muscleRateList[muscleRateList.length - 1][1];
              this.infoData.skeletonRate = skeletonRateList[skeletonRateList.length - 1][1];
              this.infoData.moistureRate = moistureRateList[moistureRateList.length - 1][1];
              this.infoData.proteinRate = proteinRateList[proteinRateList.length - 1][1];
              this.infoData.basalMetabolicRate = basalMetabolicRateList[basalMetabolicRateList.length - 1][1];
              this.infoData.FFMI = FFMI[FFMI.length - 1];
            }

            this.recordData.avgStep = (step.totalSteps / step.totalLength || 0);
            this.recordData.avgDistance = (step.totalDistance / step.totalLength || 0);
            this.recordData.avgMaxHR = (HR.totalMaxHR / HR.totalLength || 0);
            this.recordData.avgRestHR = (HR.totalRestHR / HR.totalLength || 0);
            this.recordData.avgSleepTime = this.formatTime(sleep.totalSleepTime / sleep.totalLength || 0);
            this.recordData.avgDeepSleepTime = this.formatTime(sleep.totalDeepSleepTime / sleep.totalLength || 0);
            this.recordData.avgLightSleepTime = this.formatTime(sleep.totalLightSleepTime / sleep.totalLength || 0);

            this.trendData.bestFitTime = fitTime.bestFitTime / 60;
            this.trendData.avgFitTime = ((fitTime.totalFitTime / fitTime.totalLength) / 60 || 0);

            this.setComment(this.infoData);

            this.isLoading = false;
          } else {
            this.nodata = true;
            this.isLoading = false;
            this.updateUrl('false');
          }
        }
      } else {
        this.nodata = true;
        this.isLoading = false;
        this.updateUrl('false');
      }
    });
  }

  // 初始化變數-kidin-1090215
  initVariable () {
    this.noStepData = true;
    this.noHRData = true;
    this.noSleepData = true;
    this.noConstituteData = true;
    this.noFitTimeData = true;

    this.infoData = {
      validStroke: 0,
      height: 0,
      weight: 0,
      age: 0,
      gender: 0,
      fatRate: 0,
      fatRateComment: '',
      fatRateColor: '',
      muscleRate: 0,
      muscleRateComment: '',
      muscleRateColor: '',
      skeletonRate: 0,
      moistureRate: 0,
      moistureRateComment: '',
      moistureRateColor: '',
      proteinRate: 0,
      basalMetabolicRate: 0,
      FFMI: 0
    };

    this.recordData.stepReachReps = 0;

    this.stepData = {
      stepList: [],
      targetStepList: [],
      date: [],
      colorSet: ['#6fd205', '#7f7f7f', '#eb5293']
    };

    this.HRData = {
      maxHRList: [],
      restHRList: [],
      date: [],
      colorSet: ['#e23333', '#31df93', '#ababab']
    };

    this.sleepData = {
      totalSleepList: [],
      deepSleepList: [],
      lightSleepList: [],
      awakeList: [],
      date: []
    };

    this.weightData = {
      weightList: [],
      colorSet: [
        [0, '#7ee33a'],
        [0.5, 'yellow'],
        [1, 'red']
      ]
    };

    this.constituteData = {
      fatRateList: [],
      fatRateColorSet: [
        [0, '#e0a63a'],
        [1, '#e04fc4']
      ],
      muscleRateList: [],
      muscleRateColorSet: [
        [0, '#3ae5da'],
        [1, '#299fc6']
      ]
    };

    this.fitTimeData = {
      fitTimeList: [],
      date: [],
      colorSet: '#f8b551'
    };

    this.chartTimeStamp = [];
  }

  // 建立報告期間的timeStamp讓圖表使用-kidin-1090312
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

  // 根據搜索時間取得周報告第一周的開始日期和週數-kidin-1090312
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

  // 依據選取日期和報告類型（日/週）將缺漏的數值以其他日期現有數值填補-kidin-1090313
  fillVacancyData (data) {

    if (data.length === 0) {
      return [];
    } else {

      let idx = 0;
      const newData = [];

      for (let i = 0; i < this.chartTimeStamp.length; i++) {

        if (idx >= data.length) {
          newData.push([this.chartTimeStamp[i], data[data.length - 1][1]]);
        } else if (this.chartTimeStamp[i] !== data[idx][0]) {
          newData.push([this.chartTimeStamp[i], data[idx][1]]);
        } else {
          newData.push(data[idx]);
          idx++;
        }

      }

      return newData;
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
        `startdate=${startDateString}&enddate=${endDateString}&selectPeriod=${this.selectPeriod}`;

      if (location.search.indexOf('?') > -1) {
        if (
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
              queryString[i].indexOf('startdate=') === -1 &&
              queryString[i].indexOf('enddate=') === -1 &&
              queryString[i].indexOf('selectPeriod=') === -1
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

    /***待api 支援 debug mode-kidin-1090326
    if (history.pushState) {
      window.history.pushState({path: newUrl}, '', newUrl);
    }
    ***/
  }

  // 將秒數轉換成其他時間格式-kidin-1090217
  formatTime (second) {
    const totalSec = Math.round(second),
          hr = Math.floor(totalSec / 3600),
          min = Math.round((totalSec - hr * 3600) / 60);

    // 剛好59分30秒～59分59秒四捨五入後進位的情況-kidin-1090217
    if (min === 60) {
      return `${hr + 1}:00`;
    } else if (hr === 0 && min === 0) {
      return `-:--`;
    } else {
      const timeTotalMin = ('0' + min).slice(-2);
      return `${hr}:${timeTotalMin}`;
    }

  }

  // 確認週報告日期是否為未來日期-kidin-1090227
  checkReportEndDate () {
    const checkDate = moment(this.reportEndDate, 'YYYY/MM/DD');
    if (checkDate.diff(moment(), 'day') > 0) {
      this.reportEndDate = moment().format('YYYY/MM/DD');
    }
  }

  // 過濾重複日期的資料，並只抓取重複有效值的最後一筆-kidin-1090304
  filterRepeatData (date, dataA, dataB, dataC, dataD, act, type) {
    const resDate = [],
          resDataA = [],
          resDataB = [],
          resDataC = [],
          resDataD = [];
    let sameDay = null,
        sameDayDataA = null,
        sameDayDataB = null,
        sameDayDataC = null,
        sameDayDataD = null,
        reachTargetTimes = 0;

    for (let i = 0; i < date.length; i++) {
      if (date[i] !== date[i + 1] && sameDay === null) {
        resDate.push(date[i]);
        resDataA.push(dataA[i]);
        resDataB.push(dataB[i]);
        resDataC.push(dataC[i]);
        resDataD.push(dataD[i]);

        if (type === 'step' && dataA[i] > dataB[i]) {
          reachTargetTimes++;
        }

      } else if (date[i] !== date[i + 1] && sameDay !== null) {

        switch (act) {
          case 'add':
            resDate.push(sameDay);
            resDataA.push(sameDayDataA + dataA[i]);
            resDataB.push(sameDayDataB + dataB[i]);
            resDataC.push(sameDayDataC + dataC[i]);
            resDataD.push(sameDayDataD + dataD[i]);
            break;
          case 'avg':
            resDate.push(sameDay);
            resDataA.push((sameDayDataA + dataA[i]) / 2);
            resDataB.push((sameDayDataB + dataB[i]) / 2);
            resDataC.push((sameDayDataC + dataC[i]) / 2);
            resDataD.push((sameDayDataD + dataD[i]) / 2);
            break;
        }

        sameDay = null;
        if (type === 'step' && sameDayDataA > sameDayDataB) {
          reachTargetTimes++;
        }

        sameDay = null,
        sameDayDataA = null,
        sameDayDataB = null;
        sameDayDataC = null,
        sameDayDataD = null;
      } else if (date[i] === date[i + 1]) {
        sameDay = date[i];
        sameDayDataA += dataA[i];
        sameDayDataB += dataB[i];
        sameDayDataC += dataC[i];
        sameDayDataD += dataD[i];
      }

    }

    switch (type) {
      case 'step':
        this.recordData.stepReachReps = reachTargetTimes;

        return {
          stepList: resDataA,
          targetStepList: resDataB,
          date: resDate,
          colorSet: ['#6fd205', '#7f7f7f', '#eb5293']
        };
      case 'hr':
        return {
          restHRList: resDataA,
          maxHRList: resDataB,
          date: resDate,
          colorSet: ['#e23333', '#31df93', '#ababab']
        };
      case 'sleep':
        if (this.sleepData.deepSleepList[0] !== undefined) {
          return {
            totalSleepList: resDataA,
            deepSleepList: resDataB,
            lightSleepList: resDataC,
            awakeList: resDataD,
            date: resDate
          };
        } else {
          return {
            totalSleepList: resDataA,
            deepSleepList: dataB,
            lightSleepList: dataC,
            awakeList: dataD,
            date: resDate
          };
        }
      case 'fitTime':
        return {
          fitTimeList: resDataA,
          date: resDate,
          colorSet: '#f8b551'
        };
    }
  }

  // 過濾身體素質重複日期的資料-kidin-1090330
  filterRepeatBodyData (bodyData) {
    const newData = [];
    bodyData.map((_data, idx) => {
      if (idx === 0 || bodyData[idx][0] !== bodyData[idx - 1][0]) {
        newData.push(_data);
      }
    });

    return newData;
  }

  // 依性別和年紀，分別為體脂率、肌肉率、水分率多寡下評語-kidin-1090225
  setComment (body) {
    if (body.age < 30) {
      if (body.gender === 0) {

        if (body.muscleRate < 42 && body.muscleRate > 0) {
          this.infoData.muscleRateComment = this.translate.instant('universal_activityData_low');
          this.infoData.muscleRateColor = '#ec6941';
        } else if (body.muscleRate < 56 && body.muscleRate >= 42) {
          this.infoData.muscleRateComment = this.translate.instant('universal_activityData_Standard');
          this.infoData.muscleRateColor = '#43ca81';
        } else if (body.muscleRate >= 56) {
          this.infoData.muscleRateComment = this.translate.instant('universal_activityData_good');
          this.infoData.muscleRateColor = '#2398c3';
        }

        if (body.fatRate < 14 && body.fatRate > 0) {
          this.infoData.fatRateComment = this.translate.instant('universal_activityData_low');
          this.infoData.fatRateColor = '#2398c3';
        } else if (body.fatRate < 20 && body.fatRate >= 14) {
          this.infoData.fatRateComment = this.translate.instant('universal_activityData_Standard');
          this.infoData.fatRateColor = '#43ca81';
        } else if (body.fatRate >= 20) {
          this.infoData.fatRateComment = this.translate.instant('universal_activityData_high');
          this.infoData.fatRateColor = '#ec6941';
        }

        if (body.moistureRate < 55 && body.moistureRate > 0) {
          this.infoData.moistureRateComment = this.translate.instant('universal_activityData_low');
          this.infoData.moistureRateColor = '#ec6941';
        } else if (body.moistureRate < 65 && body.moistureRate >= 55) {
          this.infoData.moistureRateComment = this.translate.instant('universal_activityData_Standard');
          this.infoData.moistureRateColor = '#43ca81';
        } else if (body.moistureRate >= 65) {
          this.infoData.moistureRateComment = this.translate.instant('universal_activityData_high');
          this.infoData.moistureRateColor = '#2398c3';
        }

      } else {

        if (body.muscleRate < 35 && body.muscleRate > 0) {
          this.infoData.muscleRateComment = this.translate.instant('universal_activityData_low');
          this.infoData.muscleRateColor = '#ec6941';
        } else if (body.muscleRate < 41 && body.muscleRate >= 35) {
          this.infoData.muscleRateComment = this.translate.instant('universal_activityData_Standard');
          this.infoData.muscleRateColor = '#43ca81';
        } else if (body.muscleRate >= 41) {
          this.infoData.muscleRateComment = this.translate.instant('universal_activityData_good');
          this.infoData.muscleRateColor = '#2398c3';
        }

        if (body.fatRate < 17 && body.fatRate > 0) {
          this.infoData.fatRateComment = this.translate.instant('universal_activityData_low');
          this.infoData.fatRateColor = '#2398c3';
        } else if (body.fatRate < 25 && body.fatRate >= 17) {
          this.infoData.fatRateComment = this.translate.instant('universal_activityData_Standard');
          this.infoData.fatRateColor = '#43ca81';
        } else if (body.fatRate >= 25) {
          this.infoData.fatRateComment = this.translate.instant('universal_activityData_high');
          this.infoData.fatRateColor = '#ec6941';
        }

        if (body.moistureRate < 45 && body.moistureRate > 0) {
          this.infoData.moistureRateComment = this.translate.instant('universal_activityData_low');
          this.infoData.moistureRateColor = '#ec6941';
        } else if (body.moistureRate < 60 && body.moistureRate >= 45) {
          this.infoData.moistureRateComment = this.translate.instant('universal_activityData_Standard');
          this.infoData.moistureRateColor = '#43ca81';
        } else if (body.moistureRate >= 60) {
          this.infoData.moistureRateComment = this.translate.instant('universal_activityData_high');
          this.infoData.moistureRateColor = '#2398c3';
        }

      }
    } else {
      if (body.gender === 0) {

        if (body.muscleRate < 40 && body.muscleRate > 0) {
          this.infoData.muscleRateComment = this.translate.instant('universal_activityData_low');
          this.infoData.muscleRateColor = '#ec6941';
        } else if (body.muscleRate < 50 && body.muscleRate >= 40) {
          this.infoData.muscleRateComment = this.translate.instant('universal_activityData_Standard');
          this.infoData.muscleRateColor = '#43ca81';
        } else if (body.muscleRate >= 50) {
          this.infoData.muscleRateComment = this.translate.instant('universal_activityData_good');
          this.infoData.muscleRateColor = '#2398c3';
        }

        if (body.fatRate < 17 && body.fatRate > 0) {
          this.infoData.fatRateComment = this.translate.instant('universal_activityData_low');
          this.infoData.fatRateColor = '#2398c3';
        } else if (body.fatRate < 25 && body.fatRate >= 17) {
          this.infoData.fatRateComment = this.translate.instant('universal_activityData_Standard');
          this.infoData.fatRateColor = '#43ca81';
        } else if (body.fatRate >= 25) {
          this.infoData.fatRateComment = this.translate.instant('universal_activityData_high');
          this.infoData.fatRateColor = '#ec6941';
        }

        if (body.moistureRate < 55 && body.moistureRate > 0) {
          this.infoData.moistureRateComment = this.translate.instant('universal_activityData_low');
          this.infoData.moistureRateColor = '#ec6941';
        } else if (body.moistureRate < 65 && body.moistureRate >= 55) {
          this.infoData.moistureRateComment = this.translate.instant('universal_activityData_Standard');
          this.infoData.moistureRateColor = '#43ca81';
        } else if (body.moistureRate >= 65) {
          this.infoData.moistureRateComment = this.translate.instant('universal_activityData_high');
          this.infoData.moistureRateColor = '#2398c3';
        }

      } else {

        if (body.muscleRate < 31 && body.muscleRate > 0) {
          this.infoData.muscleRateComment = this.translate.instant('universal_activityData_low');
          this.infoData.muscleRateColor = '#ec6941';
        } else if (body.muscleRate < 36 && body.muscleRate >= 31) {
          this.infoData.muscleRateComment = this.translate.instant('universal_activityData_Standard');
          this.infoData.muscleRateColor = '#43ca81';
        } else if (body.muscleRate >= 36) {
          this.infoData.muscleRateComment = this.translate.instant('universal_activityData_good');
          this.infoData.muscleRateColor = '#2398c3';
        }

        if (body.fatRate < 20 && body.fatRate > 0) {
          this.infoData.fatRateComment = this.translate.instant('universal_activityData_low');
          this.infoData.fatRateColor = '#2398c3';
        } else if (body.fatRate < 30 && body.fatRate >= 20) {
          this.infoData.fatRateComment = this.translate.instant('universal_activityData_Standard');
          this.infoData.fatRateColor = '#43ca81';
        } else if (body.fatRate >= 30) {
          this.infoData.fatRateComment = this.translate.instant('universal_activityData_high');
          this.infoData.fatRateColor = '#ec6941';
        }

        if (body.moistureRate < 45 && body.moistureRate > 0) {
          this.infoData.moistureRateComment = this.translate.instant('universal_activityData_low');
          this.infoData.moistureRateColor = '#ec6941';
        } else if (body.moistureRate < 60 && body.moistureRate >= 45) {
          this.infoData.moistureRateComment = this.translate.instant('universal_activityData_Standard');
          this.infoData.moistureRateColor = '#43ca81';
        } else if (body.moistureRate >= 60) {
          this.infoData.moistureRateComment = this.translate.instant('universal_activityData_high');
          this.infoData.moistureRateColor = '#2398c3';
        }

      }
    }

  }

  print() {
    window.print();
  }

  // 頁面卸除後將url reset避免污染其他頁面及解除rxjs訂閱-kidin-1090325
  ngOnDestroy () {
    window.history.pushState({path: location.pathname}, '', location.pathname);
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }
}
