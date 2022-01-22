import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject, combineLatest, fromEvent, Subscription } from 'rxjs';
import { takeUntil, switchMap, map } from 'rxjs/operators';
import { ReportConditionOpt } from '../../../../shared/models/report-condition';
import moment from 'moment';
import { ReportService } from '../../../../shared/services/report.service';
import { UtilsService } from '../../../../shared/services/utils.service';
import { ActivityService } from '../../../../shared/services/activity.service';
import { CloudrunService } from '../../../../shared/services/cloudrun.service';
import { HashIdService } from '../../../../shared/services/hash-id.service';
import { TranslateService } from '@ngx-translate/core';
import { UserProfileService } from '../../../../shared/services/user-profile.service';
import { Unit } from '../../../../shared/models/bs-constant';
import {
  ZoneTrendData,
  DiscolorTrendData,
  paceTrendColor,
  CompareLineTrendChart,
  FilletTrendChart,
  zoneColor,
  costTimeColor,
  HrZoneRange
} from '../../../../shared/models/chart-data';
import { HrBase } from '../../models/userProfileInfo';


@Component({
  selector: 'app-cloudrun-report',
  templateUrl: './cloudrun-report.component.html',
  styleUrls: ['./cloudrun-report.component.scss']
})
export class CloudrunReportComponent implements OnInit, OnDestroy {

  private ngUnsubscribe = new Subject();
  scrollEvent = new Subscription();
  clickEvent = new Subscription();
  resizeEvent = new Subscription();

  /**
   * ui 會用到的各個flag
   */
  uiFlag = {
    isPreviewMode: false,
    haveUrlCondition: false,
    reportCompleted: false,
    noData: true,
    defaultOpt: true
  }

  /**
   * 報告頁面可讓使用者篩選的條件
   */
  reportConditionOpt: ReportConditionOpt = {
    pageType: 'cloudRun',
    date: {
      startTimestamp: moment().startOf('month').valueOf(),
      endTimestamp: moment().endOf('month').valueOf(),
      type: 'thisMonth'
    },
    sportType: 1,
    cloudRun: {
      mapId: 1,
      month: moment().format('YYYYMM'),
      checkCompletion: true
    },
    hideConfirmBtn: false
  }

  /**
   * 使用者所選時間
   */
  selectDate = {
    startDate: moment().startOf('month').format('YYYY-MM-DDT00:00:00.000Z'),
    endDate: moment().endOf('month').format('YYYY-MM-DDT23:59:59.999Z')
  };

  /**
   * 使用者資訊
   */
  userInfo = {
    id: null,
    unit: <Unit>0,
    name: null,
    icon: null
  }

  /**
   * 概要數據
   */
  infoData = {
    stroke: 0,
    totalSeconds: 0,
    totalSpeed: 0,
    totalCadence: 0,
    totalCalories: 0
  }

  /**
   * 圖表用數據
   */
  chartData = {
    hrTrend: <ZoneTrendData>{
      zoneZero: [],
      zoneOne: [],
      zoneTwo: [],
      zoneThree: [],
      zoneFour: [],
      zoneFive: []
    },
    paceTrend: <DiscolorTrendData>{
      avgPace: null,
      dataArr: [],
      oneRangeBestPace: null,
      minSpeed: null,
      maxSpeed: null,
      colorSet: paceTrendColor
    },
    hrCompareLine: <CompareLineTrendChart>{
      maxHrArr: [],
      hrArr: [],
      avgHR: null,
      oneRangeBestHR: null,
      colorSet: zoneColor
    },
    costTime: <FilletTrendChart>{
      avgCostTime: null,
      bestCostTime: null,
      costTime: [],
      colorSet: costTimeColor,
      date: []
    }
  }

  /**
   * 使用者心率法與各心率區間
   */
  hrZoneRange = <HrZoneRange>{
    hrBase: HrBase.max,
    z0: 'Z0',
    z1: 'Z1',
    z2: 'Z2',
    z3: 'Z3',
    z4: 'Z4',
    z5: 'Z5'
  }

  allData = [];
  allMapList: any;
  mapInfo: any;
  reportEndDate: string;
  reportTimeRange: string;
  createTime: string;
  windowWidth = 320;  // 視窗寬度
  currentMapId = 1;  // 另外設定map id 變數，避免污染子組件ngOnChanges event
  progress = 0;
  previewUrl = '';
  mapSource = 'google';
  compare = {
    urlList: [],
    clickList: []
  }

  constructor(
    private reportService: ReportService,
    private utils: UtilsService,
    private activityService: ActivityService,
    private cloudrunService: CloudrunService,
    private hashIdService: HashIdService,
    private translate: TranslateService,
    private userProfileService: UserProfileService
  ) { }

  ngOnInit(): void {
    this.windowWidth = window.innerWidth;
    this.checkWindowSize();
    this.checkQueryString(location.search);
    this.getNeedInfo();
  }

  /**
   * 訂閱視窗寬度
   * @author kidin-1100316
   */
  checkWindowSize() {
    const resize = fromEvent(window, 'resize');
    this.resizeEvent = resize.pipe(
      takeUntil(this.ngUnsubscribe)
    ).subscribe(e => {
      this.windowWidth = (e as any).target.innerWidth;
    });

  }

  /**
   * 確認是否有query string
   * @param queryString {string}-url query string
   * @author kidin-1100304
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
            this.selectDate.startDate = moment(_value, 'YYYY-MM-DD').startOf('day').format('YYYY-MM-DDTHH:mm:ss.SSSZ');
            this.reportConditionOpt.date.startTimestamp = moment(this.selectDate.startDate).valueOf();
            break;
          case 'enddate':
            this.selectDate.endDate = moment(_value, 'YYYY-MM-DD').endOf('day').format('YYYY-MM-DDTHH:mm:ss.SSSZ');
            this.reportConditionOpt.date.endTimestamp = moment(this.selectDate.endDate).valueOf();
            break;
          case 'mapid':
            this.currentMapId = +_value;
            this.reportConditionOpt.cloudRun.mapId = +_value;
            this.uiFlag.haveUrlCondition = true;
            break;
          case 'source':
            this.mapSource = _value;
            break;
          case 'compare':
            this.compare.urlList = _value.split('p').map(_value => _value);
            break;
          case 'check':
            this.reportConditionOpt.cloudRun.checkCompletion = _value === 'true';
            break;
        }

      });

    }

  }

  /**
   * 取得使用者個人資訊與群組所有階層資訊，並確認多國語系載入
   * @author kidin-11100308
   */   
  getNeedInfo() {
    combineLatest([
      this.userProfileService.getRxUserProfile(),
      this.cloudrunService.getAllMapInfo()
    ]).pipe(
      takeUntil(this.ngUnsubscribe)
    ).subscribe(resArr => {
      const {
        unit,
        userId: id,
        nickname: name,
        avatarUrl: icon,
        heartRateBase,
        heartRateMax,
        heartRateResting,
        birthday
      } = resArr[0] as any;
      const age = this.reportService.countAge(birthday);
      this.userInfo = { unit, name, id, icon };
      this.hrZoneRange = this.utils.getUserHrRange(heartRateBase, age, heartRateMax, heartRateResting);
      this.allMapList = resArr[1];
      if (!this.uiFlag.isPreviewMode && !this.uiFlag.haveUrlCondition) {
        this.reportConditionOpt.cloudRun.mapId = this.allMapList.leaderboard[0].mapId;  // 預設顯示本月例行賽報告
      }

      this.reportService.setReportCondition(this.reportConditionOpt);
      this.getReportSelectedCondition();
    });

  }

  /**
   * 取得使用者所篩選的條件
   * @author kidin-1100308
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
  
        this.handleSubmitSearch('click');
      }

    });

  }

  /**
   * 使用者送出表單後顯示相關資料
   * @param act {string}-觸發此函式的動作
   * @author kidin-1100308
   */
  handleSubmitSearch (act: string) {
    if ([0, 100].includes(this.progress)) { // 避免重複call運動報告
      this.uiFlag.reportCompleted = false;
      this.createReport();

      if (act === 'click') {
        this.updateUrl();
      }

    }

  }

  /**
   * 更新預覽列印網址
   * @author kidin-1100308
   */
  updateUrl() {
    const { startDate, endDate } = this.selectDate,
          { checkCompletion: check } = this.reportConditionOpt.cloudRun,
          startDateString = startDate.split('T')[0],
          endDateString = endDate.split('T')[0];
    let searchString =
      `?ipm=s&startdate=${startDateString}&enddate=${endDateString}&mapid=${this.currentMapId}&source=${this.mapSource}&check=${check}`;

    let compare: string;
    const { clickList } = this.compare;
    if (clickList.length !== 0) {
      compare = `&compare=${clickList.join('p')}`;
      searchString = searchString + compare;
    }

    this.previewUrl = location.pathname + searchString;
  }

  /**
   * 建立雲跑報告
   * @author kidin-1100308
   */
  createReport() {
    const { gpxPath, distance, incline, mapImg, info } = this.allMapList.list[this.currentMapId - 1];
    if (gpxPath) {
      this.progress = 30;
      this.initVar();
      const { startDate, endDate } = this.selectDate;
      this.currentMapId = this.reportConditionOpt.cloudRun.mapId;
      const body = {
        token: this.utils.getToken(),
        searchTime: {
          type: 1,
          fuzzyTime: [],
          filterStartTime: startDate,
          filterEndTime: endDate
        },
        searchRule: {
          activity: 1,
          targetUser: 1,
          // groupId: '',
          fileInfo: {
            fileId: [],
            author: '',
            dispName: '',
            equipmentSN: '',
            class: '',
            teacher: '',
            tag: '',
            cloudRunMapId: this.currentMapId
          }
        },
        display: {
          activityLapLayerDisplay: 3,
          activityLapLayerDataField: [],
          activityPointLayerDisplay: 3,
          activityPointLayerDataField: []
        },
        page: 0,
        pageCounts: 10000
      };

      this.cloudrunService.getMapGpx({gpxPath}).pipe(
        switchMap(gpx => {
          return this.activityService.fetchMultiActivityData(body).pipe(  // 取得使用者數據
            map(data => {
              if (data.resultCode !== 200) {
                this.uiFlag.noData = true;
                const {resultCode, apiCode, resultMessage} = data;
                this.utils.handleError(resultCode, apiCode, resultMessage);
                return [gpx, []];
              } else {
                this.uiFlag.noData = false;
                return [gpx, data.info.activities];
              }

            })

          )

        })
      ).subscribe(response => {
        const { point, altitude } = response[0],
              { city, country, introduce, mapName } = info[this.checkLanguage()];
        this.mapInfo = {
          city,
          country,
          introduce,
          mapName,
          distance,
          incline,
          mapImg,
          point,
          altitude
        };
        this.handleReportTime();
        this.allData = this
          .sortOriginData(response[1])
          .sort((a, b) => moment(a.startTime).valueOf() - moment(b.startTime).valueOf());
        this.handleChartData(this.allData);
        this.progress = 100;
      });

    } else {
      const msg = 'Can not get cloud run gpx file.<br>Please try again later.';
      this.utils.openAlert(msg);
    }

  }

  /**
   * 初始化變數
   * @author kidin-1100315
   */
  initVar() {
    this.chartData = {
      hrTrend: {
        zoneZero: [],
        zoneOne: [],
        zoneTwo: [],
        zoneThree: [],
        zoneFour: [],
        zoneFive: []
      },
      paceTrend: {
        avgPace: null,
        dataArr: [],
        oneRangeBestPace: null,
        minSpeed: null,
        maxSpeed: null,
        colorSet: paceTrendColor
      },
      hrCompareLine: {
        maxHrArr: [],
        hrArr: [],
        avgHR: null,
        oneRangeBestHR: null,
        colorSet: zoneColor
      },
      costTime: {
        avgCostTime: null,
        bestCostTime: null,
        costTime: [],
        colorSet: costTimeColor,
        date: []
      }

    }

  }

  /**
   * 處理顯示的報告日期範圍及建立日期
   * @author kidin-1100311
   */
  handleReportTime() {
    this.translate.get('hellow world').pipe(
      takeUntil(this.ngUnsubscribe)
    ).subscribe(() => {
      this.createTime = moment().format('YYYY-MM-DD HH:mm');
      const { startDate, endDate } = this.selectDate,
            range = moment(endDate).diff(startDate, 'day') + 1;
      this.reportEndDate = endDate.split('T')[0];
      this.reportTimeRange = `${range} ${this.translate.instant('universal_time_day')}`;
    });
    
  }

  /**
   * 整理原始api資料（統計及過濾）
   * @param data {any}-api 2111回傳內容
   * @author kidin-1100309
   */
  sortOriginData(data: any) {
    let stroke = 0,
        totalSeconds = 0,
        totalSpeed = 0,
        totalCadence = 0,
        totalCalories = 0;
    const middleData = [];
    data.forEach(_data => {
      const { activityInfoLayer, fileInfo } = _data,
            record = this.getUserRecord(activityInfoLayer);
      if (record) {
        const { totalSecond, avgSpeed, calories, runAvgCadence } = record;
        stroke++;
        totalSeconds += totalSecond;
        totalSpeed += avgSpeed;
        totalCadence += runAvgCadence;
        totalCalories += calories;
        Object.assign(record, {fileId: fileInfo.fileId});
        middleData.push(record);
      }

    });

    this.infoData = {
      stroke,
      totalSeconds,
      totalSpeed,
      totalCadence,
      totalCalories
    };
    return middleData;
  }

  /**
   * 處理相同日期的數據，並產生圖表用數據
   * @param data {Array<any>}
   * @author kidin-1100401
   */
  handleChartData(data: Array<any>) {
    let oneRangeMaxSpeed = 0,
        oneRangeMinSpeed = null,
        totalSpeed = 0,
        oneRangeMaxHr = 0,
        totalHr = 0,
        oneRangeMinCostTime = null,
        totalCostTime = 0,
        date = [],
        sameDateData = {
          z0: 0,
          z1: 0,
          z2: 0,
          z3: 0,
          z4: 0,
          z5: 0,
          hr: 0,
          maxHr: 0,
          avgHr: 0,
          avgSpeed: 0,
          maxSpeed: 0,
          avgSeconds: 0,
          sameDateLen: 0,
          init() {
            for (let key in this) {

              if (this.hasOwnProperty(key)) {
                if (key !== 'init') this[key] = 0;
              }

            }

          }
        };

    for (let i = 0, len = data.length; i < len; i++) {
      const {
        avgHeartRateBpm,
        maxHeartRateBpm,
        avgSpeed,
        maxSpeed,
        totalHrZone0Second,
        totalHrZone1Second,
        totalHrZone2Second,
        totalHrZone3Second,
        totalHrZone4Second,
        totalHrZone5Second,
        totalSecond,
        startTime
      } = data[i];
      const { startTime: nextStartTime } = data[i + 1] || {startTime: undefined},
            startTimestamp = moment(startTime).startOf('day').valueOf(),
            paceSecond = this.utils.convertSpeed(avgSpeed, 1, this.userInfo.unit, 'second') as number,
            bestPaceSecond = this.utils.convertSpeed(maxSpeed, 1, this.userInfo.unit, 'second') as number;
      let nextStartTimestamp: number;
      if (nextStartTime) nextStartTimestamp = moment(nextStartTime).startOf('day').valueOf();
      if (startTimestamp !== nextStartTimestamp) {
        let { sameDateLen } = sameDateData;
        if (sameDateLen === 0) {
          // 圖表用數據
          this.chartData.hrTrend.zoneZero.push([startTimestamp, totalHrZone0Second || 0]);
          this.chartData.hrTrend.zoneOne.push([startTimestamp, totalHrZone1Second || 0]);
          this.chartData.hrTrend.zoneTwo.push([startTimestamp, totalHrZone2Second || 0]);
          this.chartData.hrTrend.zoneThree.push([startTimestamp, totalHrZone3Second || 0]);
          this.chartData.hrTrend.zoneFour.push([startTimestamp, totalHrZone4Second || 0]);
          this.chartData.hrTrend.zoneFive.push([startTimestamp, totalHrZone5Second || 0]);
          this.chartData.paceTrend.dataArr.push({
            x: startTimestamp,
            y: bestPaceSecond,
            low: paceSecond
          });
          this.chartData.hrCompareLine.hrArr.push([startTimestamp, avgHeartRateBpm]);
          this.chartData.hrCompareLine.maxHrArr.push([startTimestamp, maxHeartRateBpm]);
          this.chartData.costTime.costTime.push(totalSecond);

          // 取得最佳時間
          if (oneRangeMinCostTime === null || totalSecond < oneRangeMinCostTime) oneRangeMinCostTime = totalSecond;

          // 加總數據以取得該日期範圍平均值
          totalSpeed += avgSpeed;
          totalHr += avgHeartRateBpm;
          totalCostTime += totalSecond;
          length++;
        } else {
          sameDateData.z0 += totalHrZone0Second,
          sameDateData.z1 += totalHrZone1Second,
          sameDateData.z2 += totalHrZone2Second,
          sameDateData.z3 += totalHrZone3Second,
          sameDateData.z4 += totalHrZone4Second,
          sameDateData.z5 += totalHrZone5Second,
          sameDateData.avgSpeed += avgSpeed,
          sameDateData.avgHr += avgHeartRateBpm,
          sameDateData.avgSeconds += totalSecond;
          sameDateLen++;

          if (maxSpeed > sameDateData.maxSpeed) sameDateData.maxSpeed = maxSpeed;
          if (maxHeartRateBpm > sameDateData.maxHr) sameDateData.maxHr = maxHeartRateBpm;

          const oneDayAvgSpeed = +(sameDateData.avgSpeed / sameDateLen).toFixed(1),
                oneDayAvgHr = +(sameDateData.avgHr / sameDateLen).toFixed(0),
                oneDayAvgSeconds = +(sameDateData.avgSeconds / sameDateLen).toFixed(0),
                oneDayAvgPace = this.utils.convertSpeed(oneDayAvgSpeed, 1, this.userInfo.unit, 'second') as number,
                sameDateMaxPace = this.utils.convertSpeed(sameDateData.maxSpeed, 1, this.userInfo.unit, 'second') as number;
          // 圖表用數據                
          this.chartData.hrTrend.zoneZero.push([startTimestamp, +(sameDateData.z0 / sameDateLen).toFixed(0)]);
          this.chartData.hrTrend.zoneOne.push([startTimestamp, +(sameDateData.z1 / sameDateLen).toFixed(0)]);
          this.chartData.hrTrend.zoneTwo.push([startTimestamp, +(sameDateData.z2 / sameDateLen).toFixed(0)]);
          this.chartData.hrTrend.zoneThree.push([startTimestamp, +(sameDateData.z3 / sameDateLen).toFixed(0)]);
          this.chartData.hrTrend.zoneFour.push([startTimestamp, +(sameDateData.z4 / sameDateLen).toFixed(0)]);
          this.chartData.hrTrend.zoneFive.push([startTimestamp, +(sameDateData.z5 / sameDateLen).toFixed(0)]);
          this.chartData.paceTrend.dataArr.push({
            x: startTimestamp,
            y: sameDateMaxPace,
            low: oneDayAvgPace
          });
          this.chartData.hrCompareLine.hrArr.push([startTimestamp, oneDayAvgHr]);
          this.chartData.hrCompareLine.maxHrArr.push([startTimestamp, sameDateData.maxHr]);
          this.chartData.costTime.costTime.push(oneDayAvgSeconds);
          

          // 取得最佳時間
          if (oneRangeMinCostTime === null || oneDayAvgSeconds < oneRangeMinCostTime) oneRangeMinCostTime = oneDayAvgSeconds;

          // 加總數據以取得該日期範圍平均值
          totalSpeed += oneDayAvgSpeed;
          totalHr += oneDayAvgHr;
          totalCostTime += oneDayAvgSeconds;
          length++;

          sameDateData.init();
        }

        date.push(startTimestamp);
      } else {
        // 加總相同日期的數據以求得當天平均數據
        sameDateData.z0 += totalHrZone0Second || 0,
        sameDateData.z1 += totalHrZone1Second || 0,
        sameDateData.z2 += totalHrZone2Second || 0,
        sameDateData.z3 += totalHrZone3Second || 0,
        sameDateData.z4 += totalHrZone4Second || 0,
        sameDateData.z5 += totalHrZone5Second || 0,
        sameDateData.avgSpeed += avgSpeed,
        sameDateData.avgHr += avgHeartRateBpm,
        sameDateData.avgSeconds += totalSecond;
        sameDateData.sameDateLen++;

        if (maxSpeed > sameDateData.maxSpeed) sameDateData.maxSpeed = maxSpeed;
        if (maxHeartRateBpm > sameDateData.maxHr) sameDateData.maxHr = maxHeartRateBpm;
      }

      // 取得最大（佳）值和最小值
      if (maxSpeed > oneRangeMaxSpeed) oneRangeMaxSpeed = maxSpeed;
      if (oneRangeMinSpeed === null || oneRangeMinSpeed > avgSpeed) oneRangeMinSpeed = avgSpeed;
      if (maxHeartRateBpm > oneRangeMaxHr) oneRangeMaxHr = maxHeartRateBpm;
    }

    const dataLen = date.length;
    this.chartData.paceTrend.maxSpeed = oneRangeMaxSpeed;
    this.chartData.paceTrend.minSpeed = oneRangeMinSpeed;
    this.chartData.paceTrend.oneRangeBestPace = 
      this.utils.convertSpeed(oneRangeMaxSpeed, 1, this.userInfo.unit, 'minute') as string;
    this.chartData.paceTrend.avgPace = 
      this.utils.convertSpeed(((totalSpeed / dataLen) || 0), 1, this.userInfo.unit, 'minute') as string;
    this.chartData.hrCompareLine.avgHR = +((totalHr / dataLen) || 0).toFixed(0);
    this.chartData.hrCompareLine.oneRangeBestHR = oneRangeMaxHr;
    this.chartData.costTime.avgCostTime = +((totalCostTime / dataLen) || 0).toFixed(0);
    this.chartData.costTime.bestCostTime = oneRangeMinCostTime;
    this.chartData.costTime.date = date;
  }

  /**
   * 取得所需的使用者的運動數據
   * @param record {any}-api 2011的activityInfoLayer
   * @author kidin-1100309
   */
  getUserRecord(record: any) {
    const {
      avgHeartRateBpm,
      maxHeartRateBpm,
      avgSpeed,
      maxSpeed,
      calories,
      runAvgCadence,
      totalDistanceMeters: distance,
      totalHrZone0Second,
      totalHrZone1Second,
      totalHrZone2Second,
      totalHrZone3Second,
      totalHrZone4Second,
      totalHrZone5Second,
      totalSecond,
      totalStep,
      startTime
    } = record;
  const { name, icon } = this.userInfo;

    if (!this.reportConditionOpt.cloudRun.checkCompletion || this.checkRaceComplete(+distance, +totalStep)) {
      return {
        avgHeartRateBpm,
        maxHeartRateBpm,
        avgSpeed,
        maxSpeed,
        calories,
        runAvgCadence,
        totalHrZone0Second,
        totalHrZone1Second,
        totalHrZone2Second,
        totalHrZone3Second,
        totalHrZone4Second,
        totalHrZone5Second,
        totalSecond,
        startTime,
        name,
        icon
      };
    } else {
      return null;
    }

  }

  /**
   * 確認是否跑完全程及是否作弊
   * @param distance {number}-總距離
   * @param totalStep {number}-總步數
   * @author kidin-1100309
   */
  checkRaceComplete(distance: number, totalStep: number): boolean {
    const mapDistance = parseFloat((+this.mapInfo.distance * 1000).toFixed(0));
    if (distance >= mapDistance && distance / 2 < totalStep) {
      return true;
    } else {
      return false;
    }

  }

  /**
   * 根據語系回傳地圖對應語系的序列
   * @author kidin-1100309
   */
  checkLanguage() {
    const lan = this.utils.getLocalStorageObject('locale');
    switch (lan) {
      case 'zh-tw':
        return 0;
      case 'zh-cn':
        return 1;
      case 'es-es':
        return 3;
      default:
        return 2;
    }

  }

  /**
   * 監聽捲動事件，如在選單外側捲動則關閉選單
   * @author kidin-1100318
   */
  handleScrollEvent() {
    const mainSection = document.querySelector('.main-body'),
          scroll = fromEvent(mainSection, 'scroll');
    this.scrollEvent = scroll.pipe(
      takeUntil(this.ngUnsubscribe)
    ).subscribe(e => {
      this.scrollEvent.unsubscribe();
    });

  }

  /**
   * 取消訂閱點擊和捲動事件
   * @author kidin
   */
  unsubscribeEvent() {
    this.scrollEvent.unsubscribe();
    this.clickEvent.unsubscribe();
  }

  /**
   * 監聽點擊事件，如在選單外側點擊則關閉選單
   * @author kidin-1100318
   */
  handleClickEvent() {
    const click = fromEvent(document, 'click');
    this.clickEvent = click.pipe(
      takeUntil(this.ngUnsubscribe)
    ).subscribe(e => {
      this.clickEvent.unsubscribe();
    });

  }

  /**
   * 變更地圖來源
   * @param e {'google' | 'baidu'}
   * @author kidin-1100331
   */
  mapSourceChange(e: 'google' | 'baidu') {
    this.mapSource = e;
    this.updateUrl();
  }

  /**
   * 將比較之玩家從預覽列印網址序列加入或移除序列
   * @param e {number}-加入比較之玩家序列
   * @author kidin-1100331
   */
  comparePlayer(e: number) {
    const { clickList } = this.compare;
    if (e < 0) {
      this.compare.clickList = [];
    } else if (clickList.includes(e)) {
      this.compare.clickList = this.compare.clickList.filter(_list => _list !== e);
    } else {
      this.compare.clickList.push(e);
    }

    this.updateUrl();
  }

  /**
   * 列印
   * @author kidin-1100319
   */
  print() {
    window.print();
  }

  /**
   * 取消rxjs訂閱
   * @author kidin-1100309
   */
  ngOnDestroy() {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

}
