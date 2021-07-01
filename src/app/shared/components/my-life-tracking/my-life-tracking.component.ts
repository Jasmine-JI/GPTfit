import { Component, OnInit, OnDestroy, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import moment from 'moment';
import { takeUntil, tap } from 'rxjs/operators';
import { Subject, Subscription, fromEvent } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import { UtilsService } from '../../services/utils.service';
import { ReportService } from '../../services/report.service';
import { ReportConditionOpt } from '../../models/report-condition';
import { mi, Unit, unit } from '../../models/bs-constant';
import { UserProfileService } from '../../services/user-profile.service';
import { stepColor } from '../../models/chart-data';
import { Sex, sex } from '../../../containers/dashboard/models/userProfileInfo';
import { chart } from 'highcharts';
import highcharts from 'highcharts';

type CommentType = 'fatRate' | 'muscleRate' | 'moistureRate';

@Component({
  selector: 'app-my-life-tracking',
  templateUrl: './my-life-tracking.component.html',
  styleUrls: ['./my-life-tracking.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MyLifeTrackingComponent implements OnInit, OnDestroy {
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
    inited: false
  };

  /**
   * 報告頁面可讓使用者篩選的條件
   */
  reportConditionOpt: ReportConditionOpt = {
    reportType: 'lifeTracking',
    date: {
      startTimestamp: moment().startOf('day').subtract(6, 'days').valueOf(),
      endTimestamp: moment().endOf('day').valueOf(),
      type: 'sevenDay'
    },
    hideConfirmBtn: true
  };

  /**
   * 報告概要資訊
   */
  info = {};

  /**
   * 圖表用數據
   */
  chart = {
    stepTrend: {
      totalStep: 0,
      totalDistance: 0,
      reachTimes: 0,
      trendData: []
    },
    restHrTrend: {
      maxHr: [],
      restHr: [],
      ttlMaxHr: 0,
      ttlRestHr: 0,
      avgMaxHr: 0,
      avgRestHr: 0,
      dataLen: 0
    },
    sleepTrend: {
      ttlAvgSleepSecond: 0,
      ttlAvgDeepSleepSecond: 0,
      ttlAvgLightSleepSecond: 0,
      dataLen: 0,
      trendData: {
        deep: [],
        light: [],
        standUp: []
      }
    },
    bodyDiagram: [],
    BMITrend: {
      data: {
        top: 0,
        bottom: null,
        arr: []
      },
      zeroDataBefore: true,
      noData: true
    },
    fatRateTrend: {
      data: {
        top: 0,
        bottom: null,
        arr: []
      },
      zeroDataBefore: true,
      noData: true
    },
    muscleRateTrend: {
      data: {
        top: 0,
        bottom: null,
        arr: []
      },
      zeroDataBefore: true,
      noData: true
    },
    fitTimeTrend: {
      maxMin: 0,
      avgMin: 0,
      ttlSecond: 0,
      haveDataLen: 0,
      dataArr: []
    }
  }

  /**
   * 頁面所需相關時間日期資訊
   */
  reportTime = {
    endDate: null,
    range: null,
    create: null,
    diffWeek: 0,
    type: <1 | 2>1, // 1: 日報告 2: 週報告
    typeTranslate: ''
  };

  /**
   * 使用者概要資訊
   */
  userInfo = {
    id: null,
    name: '',
    accessRight: null,
    unit: <Unit>unit.metric,
    icon: ''
  }

  readonly tableLength = 8; // 分析列表預設顯示長度
  readonly unitEnum = unit;
  readonly mi = mi;
  dateLen = 0; // 報告橫跨天數/週數
  previewUrl: string;
  windowWidth = 320;  // 視窗寬度
  columnTranslate = {};  // 分析列表所需的欄位名稱翻譯
  xAxisArr = []; // 圖表x軸全部值

  constructor(
    private utils: UtilsService,
    private reportService: ReportService,
    private translate: TranslateService,
    private userProfileService: UserProfileService,
    private changeDetectorRef: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.subscribeWindowSize();
    this.checkQueryString(location.search);
    this.getLoginUserInfo();
  }
  
  /**
   * 訂閱視窗寬度
   * @author kidin-1100616
   */
  subscribeWindowSize() {
    const resize = fromEvent(window, 'resize');
    this.resizeEvent = resize.pipe(
      takeUntil(this.ngUnsubscribe)
    ).subscribe(e => {
      this.windowWidth = (e as any).target.innerWidth;
      this.changeDetectorRef.markForCheck();
    });

  }

  /**
   * 從query string取得參數
   * @param queryString {string}
   * @author kidin-1100616
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
      const {
        userId,
        unit,
        systemAccessRight,
        avatarUrl,
        nickname
      } = res as any;
      this.userInfo = {
        name: nickname,
        id: userId,
        accessRight: systemAccessRight,
        unit,
        icon: avatarUrl
      };

      this.reportService.setReportCondition(this.reportConditionOpt);
      this.getReportSelectedCondition();
    });

  }

  /**
   * 取得使用者所篩選的條件
   * @author kidin-1100616
   */
  getReportSelectedCondition() {
    this.reportService.getReportCondition().pipe(
      tap(() => {
        const { progress } = this.uiFlag;
        this.changeProgress(progress === 100 ? 10 : progress);
        this.initReportContent();
      }),
      takeUntil(this.ngUnsubscribe)
    ).subscribe(resArr => {
      // 避免連續送出
      if (this.uiFlag.progress >= 10 && this.uiFlag.progress < 100) {
        this.changeProgress(30);
        const condition = resArr as any,
              { date: { startTimestamp, endTimestamp }} = condition;
        // 日期範圍大於52天則取週報告
        this.reportTime.type = moment(endTimestamp).diff(moment(startTimestamp), 'day') <= 52 ? 1 : 2;
        this.reportConditionOpt = this.utils.deepCopy(condition);
        this.getData(this.userInfo.id);
      }

    });

  }

  /**
   * 初始化報告變數
   * @author kidin-1100617
   */
  initReportContent() {
    this.info = {};
    this.xAxisArr = [];
    this.chart = {
      stepTrend: {
        totalStep: 0,
        totalDistance: 0,
        reachTimes: 0,
        trendData: []
      },
      restHrTrend: {
        maxHr: [],
        restHr: [],
        ttlMaxHr: 0,
        ttlRestHr: 0,
        avgMaxHr: 0,
        avgRestHr: 0,
        dataLen: 0
      },
      sleepTrend: {
        ttlAvgSleepSecond: 0,
        ttlAvgDeepSleepSecond: 0,
        ttlAvgLightSleepSecond: 0,
        dataLen: 0,
        trendData: {
          deep: [],
          light: [],
          standUp: []
        }
      },
      bodyDiagram: [],
      BMITrend: {
        data: {
          top: 0,
          bottom: null,
          arr: []
        },
        zeroDataBefore: true,
        noData: true
      },
      fatRateTrend: {
        data: {
          top: 0,
          bottom: null,
          arr: []
        },
        zeroDataBefore: true,
        noData: true
      },
      muscleRateTrend: {
        data: {
          top: 0,
          bottom: null,
          arr: []
        },
        zeroDataBefore: true,
        noData: true
      },
      fitTimeTrend: {
        maxMin: 0,
        avgMin: 0,
        ttlSecond: 0,
        haveDataLen: 0,
        dataArr: []
      }

    }

  }

  /**
   * 取得目標群組成員數據
   * @param id {number}-user id
   * @author kidin-1100617
   */
   getData(id: number) {
    const { startTimestamp, endTimestamp } = this.reportConditionOpt.date,
          body = {
            token: this.utils.getToken(),
            type: this.reportTime.type,
            targetUserId: [id],
            filterStartTime: moment(startTimestamp).format('YYYY-MM-DDTHH:mm:ss.SSSZ'),
            filterEndTime: moment(endTimestamp).format('YYYY-MM-DDTHH:mm:ss.SSSZ'),
          };

    this.reportService.fetchTrackingSummaryArray(body).subscribe(res => {
      if (res.length && res.length > 0) {
        this.uiFlag.noData = false;
        this.changeProgress(70);
        this.createReport(res[0]);
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
   * @param data {Array<any>}-api 2107的數據
   * @author kidin-1100617
   */
  createReport(data: Array<any>) {
    const dataKey = this.reportTime.type === 1 ? 'reportLifeTrackingDays' : 'reportLifeTrackingWeeks',
          lifeTracking = data[dataKey],
          { resultCode } = data as any;
    let haveData = false;
    if (resultCode === 200) {
      if (lifeTracking.length > 0) {
        haveData = true;
      }

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
          type: this.reportTime.type,
          typeTranslate: this.translate.instant(this.reportTime.type === 1 ? 'universal_time_day' : 'universal_time_week')
        };

        this.createbodyDiagram();
        this.handleData(lifeTracking);
        this.changeProgress(100);
        this.updateUrl();
      });
      
    }

  }

  /**
   * 取得報告所需數據的key
   * @returns {Array<string>}-報告所需數據的key
   * @author kidin-1100617
   */
  getNeedKey(): Array<string> {
    return [
      'birthYear',
      'bodyHeight',
      'bodyWeight',
      'fatRate',
      'gender',
      'muscleRate',
      'restHeartRate',
      'maxHeartRate',
      'targetStep',
      'totalDeepSecond',
      'totalDistanceMeters',
      'totalFitSecond',
      'totalLightSecond',
      'totalSleepSecond',
      'totalStandUpSecond',
      'totalStep',
      'skeletonRate',
      'moistureRate',
      'proteinRate',
      'basalMetabolicRate'
    ];

  }

  /**
   * 取得概要分析中，只更新最新值的key
   * @author kidin-1100618
   */
  getLatestKey(): Array<string> {
    return [
      'gender',
      'birthYear',
      'bodyHeight',
      'bodyWeight',
      'fatRate',
      'muscleRate',
      'skeletonRate',
      'moistureRate',
      'proteinRate',
      'basalMetabolicRate'
    ];

  }

  /**
   * 將所有成員數據進行排序與統計以生成概要數據與圖表
   * @param data {Array<any>}-生活追蹤數據
   * @author kidin-1100617
   */
   handleData(data: Array<any>) {
    data.sort((a, b) => moment(a.startTime).valueOf() - moment(b.startTime).valueOf());
    this.xAxisArr = this.createChartXaxis(this.reportConditionOpt.date, this.reportTime.type);
    const noRepeatDateData = this.mergeSameDateData(data),
          needKey = this.getNeedKey();
    let dataIdx = 0;
    for (let i = 0, len = this.xAxisArr.length; i < len; i++) {
      // 若無該日數據，則以補0方式呈現圖表數據。
      const xAxisTimestamp = this.xAxisArr[i],
            oneStrokeData = noRepeatDateData[dataIdx],
            { startTimestamp, tracking } = oneStrokeData || { startTime: undefined, tracking: undefined };

      if (xAxisTimestamp === startTimestamp) {

        if (this.info['stroke']) {
          this.info['stroke'] += 1;
        } else {
          this.info['stroke'] = 1;
        }

        let sameDateData = {};
        const trackingLen = tracking.length;
        for (let j = 0; j < trackingLen; j++) {
          const _tracking = tracking[j];
          for (let k = 0, keyLen = needKey.length; k < keyLen; k++) {
            const _key = needKey[k],
                  isLatestKey = this.getLatestKey().includes(_key);

            if (_tracking.hasOwnProperty(_key)) {
              let value: number;
              value = +_tracking[_key];

              // 將各數據加總，之後均化產生趨勢圖表
              if (sameDateData[_key] !== undefined && !isLatestKey) {
                sameDateData[_key] += value;
              } else {
                sameDateData[_key] = value;
              }

              // 休息心率圖表計算平均用
              const restHrKey = [
                'restHeartRate',
                'maxHeartRate'
              ];
              if (restHrKey.includes(_key)) {

                if (sameDateData[`${_key}EffectCount`]) {
                  sameDateData[`${_key}EffectCount`]++;
                } else {
                  sameDateData[`${_key}EffectCount`] = 1;
                }

              }

            }

            const finalValue = sameDateData[_key],
                  isValidValue = _key === 'gender' || finalValue ? true : false;
            if (isValidValue) {
              // 部份數據只取最新的值，ex.體重
              if (isLatestKey || this.info[_key] === undefined) {
                this.info[_key] = finalValue;
              } else {
                this.info[_key] += finalValue;
              }

            }
            
          }

        }

        this.createChartData(sameDateData, xAxisTimestamp);
        dataIdx++;
      } else {
        let zeroData = {};
        for (let l = 0, keyLen = needKey.length; l < keyLen; l++) {
          const key = needKey[l];
          zeroData = {[key]: 0, ...zeroData};
        }

        this.createChartData(zeroData, xAxisTimestamp);
      }

    }

    this.handleFinalInfo();
    this.getTrendAvgValue();
  }

  /**
   * 計算最新的年齡、FFMI、BMI數據，以及根據數據給予相對應評語
   * @author kidin-1100625
   */
  handleFinalInfo() {
    const {
      birthYear,
      bodyHeight,
      bodyWeight,
      fatRate,
      muscleRate,
      moistureRate,
      gender
    } = this.info as any;

    let age: number;
    if (birthYear) {
      age = this.reportService.countAge(birthYear);
      this.info['age'] = age;
    }

    if (bodyHeight && bodyWeight) {
      this.info['BMI'] = this.reportService.countBMI(bodyHeight, bodyWeight);
      if (fatRate) {
        this.info['FFMI'] = this.reportService.countFFMI(bodyHeight, bodyWeight, fatRate);
      }

    }

    // 因connect可以單獨手動輸入體脂率，故獨立判斷
    if (fatRate) this.info['fatRateComment'] = this.getComment('fatRate', fatRate, gender, age >= 30);
    
    // 因connect可以單獨手動輸入肌肉率，故獨立判斷
    if (muscleRate) this.info['muscleRateComment'] = this.getComment('muscleRate', muscleRate, gender, age >= 30);

    // 因connect可以單獨手動輸入水分率，故獨立判斷
    if (moistureRate) this.info['moistureRateComment'] = this.getComment('moistureRate', moistureRate, gender);
  }

  /**
   * 根據數據取得評語
   * @param commentType {CommentType}-評語類別
   * @param value {number}-數值
   * @param gender {Sex}-性別
   * @param overThirty {boolean}-是否超過30歲
   * @author kidin-1100628
   */
  getComment(
    commentType: CommentType,
    value: number,
    gender: Sex,
    overThirty: boolean = false
  ) {
    let boundary: Array<number>,
        i18KeyArr: Array<string>,
        bgColorArr: Array<string>;
    switch (commentType) {
      case 'fatRate':
        i18KeyArr = [
          'universal_activityData_low',
          'universal_activityData_Standard',
          'universal_activityData_high'
        ];
        bgColorArr = ['#2398c3', '#43ca81', '#ec6941'];
        if (gender === sex.male) {
          boundary = overThirty ? [17, 25] : [14, 20];
        } else {
          boundary = overThirty ? [20, 30] : [17, 25];
        }


        break;
      case 'muscleRate':
        i18KeyArr = [
          'universal_activityData_low',
          'universal_activityData_Standard',
          'universal_activityData_good'
        ];
        bgColorArr = ['#ec6941', '#43ca81', '#2398c3'];
        if (gender === sex.male) {
          boundary = overThirty ? [17, 25] : [14, 20];
        } else {
          boundary = overThirty ? [20, 30] : [17, 25];
        }

        break;
      case 'moistureRate':
        i18KeyArr = [
          'universal_activityData_low',
          'universal_activityData_Standard',
          'universal_activityData_high'
        ];
        bgColorArr = ['#ec6941', '#43ca81', '#2398c3'];
        boundary = gender === sex.male ? [55, 65] : [45, 60];
        break;
    }

    if (value < boundary[0]) {
      return {
        i18Key: i18KeyArr[0],
        bgColor: bgColorArr[0]
      };
    } else if (value >= boundary[0] && value < boundary[1]) {
      return {
        i18Key: i18KeyArr[1],
        bgColor: bgColorArr[1]
      };
    } else {
      return {
        i18Key: i18KeyArr[2],
        bgColor: bgColorArr[2]
      };

    }

  }

  /**
   * 製作各圖表所需數據
   * @param strokeData {any}-一個時間單位（日/週）加總的資料
   * @param startTimestamp {number}-該筆數據開始時間
   * @author kidin-1100617
   */
  createChartData(strokeData: any, startTimestamp: number) {
    this.createStepTrendChart(strokeData, startTimestamp);
    this.createRestHrTrendChart(strokeData, startTimestamp);
    this.createSleepTrendChart(strokeData, startTimestamp);
    this.createBMITrendChart(strokeData, startTimestamp);
    this.createFatRateTrendChart(strokeData, startTimestamp);
    this.createMuscleRateTrendChart(strokeData, startTimestamp);
    this.cheateFitTimeTrendChart(strokeData, startTimestamp);
  }

  /**
   * 取得趨勢圖表所需平均值
   * @author kidin-1100617
   */
  getTrendAvgValue() {
    const { fitTimeTrend: { ttlSecond, haveDataLen } } = this.chart;
    if (haveDataLen > 0) {
      this.chart.fitTimeTrend.avgMin = parseFloat(((ttlSecond / 60) / haveDataLen).toFixed(0));
    }
    
  }

  /**
   * 將同一天的數據合併
   * (時區不同的數據以同年同月同日合併為同一天)
   * (跨年時週報告會有複數同週的週別數據)
   * @param data {Array<any>}
   * @author kidin-1100419
   */
  mergeSameDateData(data: Array<any>) {
    let sameDateData = {};
    const result = [];
    for (let i = 0, len = data.length; i < len; i++) {
      const { startTime, ...rest } = data[i],
            { startTime: nextStartTime } = data[i + 1] || { startTime: undefined },
            startDate = startTime.split('T')[0],
            nextStartDate = nextStartTime ? nextStartTime.split('T')[0] : undefined;
      if (nextStartDate === startDate) {

        if (!sameDateData['startTimestamp']) {
          sameDateData = {
            startTimestamp: moment(startDate, 'YYYY-MM-DD').valueOf(),
            tracking: [rest]
          };
        } else {
          sameDateData['tracking'] = sameDateData['tracking'].concat([rest]);
        }

      } else {

        if (!sameDateData['startTimestamp']) {
          result.push({
            startTimestamp: moment(startDate, 'YYYY-MM-DD').valueOf(),
            tracking: [rest]
          });
        } else {
          sameDateData['tracking'] = sameDateData['tracking'].concat([rest]);
          result.push(sameDateData);
          sameDateData = {};
        }
        
      }

    }

    return result;
  }

  /**
   * 建立步數趨勢圖數據
   * @param strokeData {any}-一個時間單位（日/週）加總的資料
   * @param startTimestamp {number}-開始時間timestamp
   * @author kidin-1100621
   */
  createStepTrendChart(strokeData: any, startTimestamp: number) {
    const { totalStep, targetStep, totalDistanceMeters } = strokeData,
          { stepTrend } = this.chart;
    stepTrend.totalDistance += totalDistanceMeters;
    stepTrend.totalStep += totalStep;
    if (targetStep) {
      if (totalStep >= targetStep) {
        stepTrend.reachTimes ++;
        stepTrend.trendData.push({
            x: startTimestamp,
            y: totalStep,
            z: totalStep,  // tooltip數據用
            t: targetStep,  // tooltip數據用
            color: stepColor.reach
        });
      } else {
        const discolorPoint = totalStep / targetStep;
        stepTrend.trendData.push({
          x: startTimestamp,
          y: targetStep,
          z: totalStep,  // tooltip數據用
          t: targetStep,  // tooltip數據用
          color: {
            linearGradient: {
              x1: 0,
              x2: 0,
              y1: 1,
              y2: 0
            },
            stops: [
              [0, stepColor.step],
              [discolorPoint, stepColor.step],
              [discolorPoint + 0.01, stepColor.target],
              [1, stepColor.target]
            ]
          }

        });

      }

    } else {
      stepTrend.trendData.push({
        x: startTimestamp,
        y: 0,
        z: 0,  // tooltip數據用
        t: 0,  // tooltip數據用
      });

    }

  }

  /**
   * 建立休息心率趨勢圖
   * @param strokeData {any}-一個時間單位（日/週）加總的資料
   * @param startTimestamp {number}-起始日期timestamp
   * @author kidin-1100622
   */
  createRestHrTrendChart(strokeData: any, startTimestamp: number) {
    const {
            restHeartRate,
            maxHeartRate,
            restHeartRateEffectCount,
            maxHeartRateEffectCount
          } = strokeData,
          oneRangeAvgRestHr = parseFloat((restHeartRate / restHeartRateEffectCount).toFixed(0)),
          oneRangeAvgMaxHr = parseFloat((maxHeartRate / maxHeartRateEffectCount).toFixed(0)),
          { restHrTrend } = this.chart;
    if (oneRangeAvgRestHr && oneRangeAvgMaxHr) {
      const chartStart = this.xAxisArr[0],
            firstDateNoData = restHrTrend.dataLen === 0 && startTimestamp !== chartStart;
      // 若第一天（週）無資料，則用後面的值遞補拉延長線美化圖表
      if (firstDateNoData) {
        restHrTrend.maxHr.push({
          x: chartStart,
          y: oneRangeAvgMaxHr,
          marker: {
            enabled: false  // 遞補值不顯示標標記
          }
        });
        restHrTrend.restHr.push({
          x: chartStart,
          y: oneRangeAvgRestHr,
          marker: {
            enabled: false // 遞補值不顯示標標記
          }
        });
      }

      restHrTrend.dataLen++;
      restHrTrend.ttlMaxHr += oneRangeAvgMaxHr;
      restHrTrend.ttlRestHr += oneRangeAvgRestHr;
      restHrTrend.maxHr.push([startTimestamp, oneRangeAvgMaxHr]);
      restHrTrend.restHr.push([startTimestamp, oneRangeAvgRestHr]);
    } else if (startTimestamp === this.xAxisArr[this.xAxisArr.length - 1]) {
      // 最後一天（週）無資料，則用前面的值遞補拉延長線美化圖表
      if (restHrTrend.dataLen !== 0) {
        const currentDataLen = restHrTrend.maxHr.length,
              finalRestHr = restHrTrend.restHr[currentDataLen - 1][1],
              finalMaxHr = restHrTrend.maxHr[currentDataLen - 1][1];
        restHrTrend.maxHr.push({
          x: startTimestamp,
          y: finalMaxHr,
          marker: {
            enabled: false  // 遞補值不顯示標標記
          }
        });
        restHrTrend.restHr.push({
          x: startTimestamp,
          y: finalRestHr,
          marker: {
            enabled: false // 遞補值不顯示標標記
          }
        });

      }

    }

  }

  /**
   * 建立睡眠趨勢圖
   * @param strokeData {any}-一個時間單位（日/週）加總的資料
   * @param startTimestamp {number}-起始日期timestamp
   * @author kidin-1100622
   */
  createSleepTrendChart(strokeData: any, startTimestamp: number) {
    const { 
      totalSleepSecond,
      totalDeepSecond,
      totalLightSecond,
      totalStandUpSecond
     } = strokeData;
    const { sleepTrend } = this.chart;
    if (totalSleepSecond) {
      let ttlStandUpSecond: number;
      // 裝置清醒時間較晚上線，故無清醒時間時，使用總睡眠時間減去深面與淺眠時間
      if (totalStandUpSecond) {
        ttlStandUpSecond = totalStandUpSecond;
      } else {
        ttlStandUpSecond = totalSleepSecond - totalDeepSecond - totalLightSecond;
      }

      sleepTrend.dataLen++;
      sleepTrend.ttlAvgSleepSecond += totalSleepSecond;
      sleepTrend.ttlAvgDeepSleepSecond += totalDeepSecond;
      sleepTrend.ttlAvgLightSleepSecond += totalLightSecond;
      sleepTrend.trendData.deep.push([startTimestamp, totalDeepSecond]);
      sleepTrend.trendData.light.push([startTimestamp, totalLightSecond]);
      sleepTrend.trendData.standUp.push([startTimestamp, ttlStandUpSecond]);
    } else {
      sleepTrend.trendData.deep.push([startTimestamp, 0]);
      sleepTrend.trendData.light.push([startTimestamp, 0]);
      sleepTrend.trendData.standUp.push([startTimestamp, 0]);
    }

  }

  /**
   * 建立身體素質圖表與數據
   * @param personData {any}-個人分析數據
   * @author kidin-1100622
   */
  createbodyDiagram() {

  }

  /**
   * 建立BMI趨勢圖
   * @param strokeData {any}-一個時間單位（日/週）加總的資料
   * @param startTimestamp {number}-起始日期timestamp
   * @author kidin-1100622
   */
  createBMITrendChart(strokeData: any, startTimestamp: number) {
    const { bodyHeight, bodyWeight } = strokeData,
          { BMITrend } = this.chart,
          { arr } = BMITrend.data,
          currentDataLen = arr.length;
    if (bodyHeight && bodyWeight) {
      const weight = parseFloat(bodyWeight.toFixed(1)),
            height = parseFloat(bodyHeight.toFixed(1)),
            BMI = this.reportService.countBMI(height, weight);
      BMITrend.noData = false;
      // 將前面為0的數據用後面的值補值
      if (BMITrend.zeroDataBefore) {
        if (currentDataLen !== 0) BMITrend.data.arr = BMITrend.data.arr.map(_data => [_data[0], BMI]);
        BMITrend.zeroDataBefore = false;
      }

      BMITrend.data.arr.push([startTimestamp, BMI]);
      // 取得圖表上下界
      const { top, bottom } = BMITrend.data;
      if (BMI > top) {
        BMITrend.data.top = BMI;
      }

      if (!bottom || BMI < bottom) {
        BMITrend.data.bottom = BMI;
      }

    } else {
      // 使用前面數值補值
      if (BMITrend.zeroDataBefore || currentDataLen === 0) {
        BMITrend.data.arr.push([startTimestamp, 0]);
      } else {
        const beforeValue = arr[currentDataLen - 1][1];
        BMITrend.data.arr.push([startTimestamp, beforeValue]);
      }
      
    }

  }

  /**
   * 建立體脂率趨勢圖
   * @param strokeData {any}-一個時間單位（日/週）加總的資料
   * @param startTimestamp {number}-起始日期timestamp
   * @author kidin-1100622
   */
  createFatRateTrendChart(strokeData: any, startTimestamp: number) {
    const { fatRate } = strokeData,
          { fatRateTrend } = this.chart,
          { arr } = fatRateTrend.data,
          currentDataLen = arr.length;
    if (fatRate) {
      const avgFatRate = parseFloat(fatRate.toFixed(1));
      fatRateTrend.noData = false;
      // 將前面為0的數據用後面的值補值
      if (fatRateTrend.zeroDataBefore) {
        if (currentDataLen !== 0) fatRateTrend.data.arr = fatRateTrend.data.arr.map(_data => [_data[0], avgFatRate]);
        fatRateTrend.zeroDataBefore = false;
      }

      fatRateTrend.data.arr.push([startTimestamp, avgFatRate]);
      // 取得圖表上下界
      const { top, bottom } = fatRateTrend.data;
      if (avgFatRate > top) {
        fatRateTrend.data.top = avgFatRate;
      }

      if (!bottom || avgFatRate < bottom) {
        fatRateTrend.data.bottom = avgFatRate;
      }

    } else {
      // 使用前面數值補值
      if (fatRateTrend.zeroDataBefore || currentDataLen === 0) {
        fatRateTrend.data.arr.push([startTimestamp, 0]);
      } else {
        const beforeValue = arr[arr.length - 1][1];
        fatRateTrend.data.arr.push([startTimestamp, beforeValue]);
      }

    }


  }

  /**
   * 建立肌肉率趨勢圖
   * @param strokeData {any}-一個時間單位（日/週）加總的資料
   * @param startTimestamp {number}-起始日期timestamp
   * @author kidin-1100622
   */
  createMuscleRateTrendChart(strokeData: any, startTimestamp: number) {
    const { muscleRate } = strokeData,
          { muscleRateTrend } = this.chart,
          { arr } = muscleRateTrend.data,
          currentDataLen = arr.length;
    if (muscleRate) {
      const avgMuscleRate = parseFloat(muscleRate.toFixed(1));
      muscleRateTrend.noData = false;
      // 將前面為0的數據用後面的值補值
      if (muscleRateTrend.zeroDataBefore) {
        if (currentDataLen !== 0) muscleRateTrend.data.arr = muscleRateTrend.data.arr.map(_data => [_data[0], avgMuscleRate]);
        muscleRateTrend.zeroDataBefore = false;
      }

      muscleRateTrend.data.arr.push([startTimestamp, avgMuscleRate]);
      // 取得圖表上下界
      const { top, bottom } = muscleRateTrend.data;
      if (avgMuscleRate > top) {
        muscleRateTrend.data.top = avgMuscleRate;
      }

      if (!bottom || avgMuscleRate < bottom) {
        muscleRateTrend.data.bottom = avgMuscleRate;
      }

    } else {
      // 使用前面數值補值
      if (muscleRateTrend.zeroDataBefore || currentDataLen === 0) {
        muscleRateTrend.data.arr.push([startTimestamp, 0]);
      } else {
        const beforeValue = arr[arr.length - 1][1];
        muscleRateTrend.data.arr.push([startTimestamp, beforeValue]);
      }

    }


  }

  /**
   * 建立燃脂時間趨勢圖
   * @param strokeData {any}-一個時間單位（日/週）加總的資料
   * @param startTimestamp {number}-起始日期timestamp
   * @author kidin-1100622
   */
  cheateFitTimeTrendChart(strokeData: any, startTimestamp: number) {
    const { totalFitSecond } = strokeData,
          ttlFitMin = parseFloat((totalFitSecond / 60).toFixed(0)),
          { fitTimeTrend } = this.chart;
    if (totalFitSecond) {
      fitTimeTrend.haveDataLen++;
      fitTimeTrend.ttlSecond += totalFitSecond;
      fitTimeTrend.dataArr.push([startTimestamp, ttlFitMin]);
      if (ttlFitMin > fitTimeTrend.maxMin) {
        fitTimeTrend.maxMin = ttlFitMin;
      }

    } else {
      fitTimeTrend.dataArr.push([startTimestamp, 0]);
    }

  }

  /**
   * 更新預覽列印url
   * @author kidin-1100617
   */
  updateUrl() {
    const { date: {startTimestamp, endTimestamp} } = this.reportConditionOpt,
          { origin } = location,
          startDate = moment(startTimestamp).format('YYYY-MM-DD'),
          endDate = moment(endTimestamp).format('YYYY-MM-DD');
    this.previewUrl = `${origin
      }/dashboard/life-tracking?startdate=${startDate
      }&enddate=${endDate
      }&ipm=s
    `;
  }

  print() {
    window.print();
  }

  /**
   * 變更載入頁面進度，並檢查頁面渲染（避免loading bar出不來）
   * @author kidin-1100624
   */
   changeProgress(progress: number) {
    this.uiFlag.progress = progress;
    this.changeDetectorRef.markForCheck();
  }

  // 解除rxjs訂閱-kidin-1090325
  ngOnDestroy () {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }
}
