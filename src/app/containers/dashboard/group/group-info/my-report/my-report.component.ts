import { Component, OnInit, OnDestroy, Renderer2, ViewChild, ElementRef } from '@angular/core';
import * as moment from 'moment';
import { chart } from 'highcharts';
import * as _Highcharts from 'highcharts';
import { HttpParams } from '@angular/common/http';

import { Router } from '@angular/router';

import { TranslateService } from '@ngx-translate/core';
import { HashIdService } from '@shared/services/hash-id.service';

import { GroupService } from '../../../services/group.service';
import { UtilsService } from '@shared/services/utils.service';
import { UserInfoService } from '../../../services/userInfo.service';
import { ActivityService } from '../../../../../shared/services/activity.service';
import { ActivityOtherDetailsService } from '../../../../../shared/services/activity-other-details.service';
import { QrcodeService } from '../../../../portal/services/qrcode.service';
import { UserProfileService } from '../../../../../shared/services/user-profile.service';

const Highcharts: any = _Highcharts; // 不檢查highchart型態

// 建立圖表用-kidin-1081212
class ChartOptions {
  constructor (dataset, colorIdx) {
    return {
      chart: {
        height: 300,
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
        }
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
          color: Highcharts.getOptions().colors[colorIdx],
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

@Component({
  selector: 'app-my-report',
  templateUrl: './my-report.component.html',
  styleUrls: ['./my-report.component.scss']
})
export class MyReportComponent implements OnInit, OnDestroy {

  // UI操控相關變數-kidin-1081210
  reportCompleted = true;
  isPreviewMode = false;
  isLoading = false;
  isSelected = 'rangeDate';
  isSelectDateRange = false;
  hasResData: boolean;
  maxStartDate = moment().format('YYYY-MM-DD');
  minEndDate = moment().add(-13, 'days').format('YYYY-MM-DD');
  maxSelectDate = moment().format('YYYY-MM-DD');
  initialChartComplated = true;
  isDebug = false;

  // 資料儲存用變數-kidin-1081210
  token: string;
  previewUrl: string;
  startDate = '';
  endDate = moment().format('YYYY-MM-DD');
  selectedStartDate = moment().add(-13, 'days').format('YYYY-MM-DD');
  selectedEndDate = moment().format('YYYY-MM-DD');
  reportStartDate = '';
  reportEndDate = '';
  selectCategory = '1';
  reportCategory = '1';
  userId: string;
  reportCreatedTime = moment().format('YYYY/MM/DD HH:mm');
  brandImg: string;
  brandName: string;
  branchName: string;
  groupImg: string;
  groupId: string;
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
  userHRZones = [0, 0, 0, 0, 0, 0];
  HRZoneThree = 0;
  deviceInfo: any;
  groupData: any;
  coachInfo: any;
  deviceImgUrl: string;

  // HChart設定相關-kidin-1081211
  showHRZoneChartTarget = false;
  showcaloriesBurnedChartTarget = false;
  showavgSpeedChartTarget = false;
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

  @ViewChild('container')
  container: ElementRef;
  @ViewChild('HRZoneChartTarget')
  HRZoneChartTarget: ElementRef;
  @ViewChild('caloriesBurnedChartTarget')
  caloriesBurnedChartTarget: ElementRef;
  @ViewChild('avgSpeedChartTarget')
  avgSpeedChartTarget: ElementRef;
  @ViewChild('avgHRChartTarget')
  avgHRChartTarget: ElementRef;
  @ViewChild('caloriesChartTarget')
  caloriesChartTarget: ElementRef;

  constructor(
    private renderer: Renderer2,
    private router: Router,
    private hashIdService: HashIdService,
    private translateService: TranslateService,
    private groupService: GroupService,
    private utils: UtilsService,
    private userInfoService: UserInfoService,
    private qrcodeService: QrcodeService,
    private userProfileService: UserProfileService,
    private activityService: ActivityService,
    private activityOtherDetailsService: ActivityOtherDetailsService
    ) {
      // 改寫內部設定
      // 將提示框即十字準星的隱藏函數關閉
      Highcharts.Pointer.prototype.reset = function() {
        return undefined;
      };
      /**
       * 聚焦當前的數據點，並設置滑鼠滑動狀態及繪製十字準星線
       */
      Highcharts.Point.prototype.highlight = function(event) {
        this.onMouseOver(); // 顯示滑鼠啟動標示
        this.series.chart.xAxis[0].drawCrosshair(event, this); // 顯示十字準星线
      };
    }

  ngOnInit() {
    if (location.search.indexOf('ipm=s') > -1) {
      this.isPreviewMode = true;
    }

    if (location.search.indexOf('debug=') > -1) {
      this.isDebug = true;
    }

    if (
      location.search.indexOf('sport=') > -1 &&
      location.search.indexOf('startdate=') > -1 &&
      location.search.indexOf('enddate=') > -1 &&
      location.search.indexOf('id=')
    ) {
      this.queryStringShowData();
    }

    Highcharts.charts.length = 0;  // 初始化global highchart物件，可避免HighCharts.Charts為 undefined -kidin-1081212
  }

  // 依query string顯示資料-kidin-20191226
  queryStringShowData () {
    const queryString = location.search.replace('?', '').split('&');
    for (let i = 0; i < queryString.length; i++) {
      if (queryString[i].indexOf('sport=') > -1) {
        this.selectCategory = queryString[i].replace('sport=', '');
      } else if (queryString[i].indexOf('startdate=') > -1) {
        this.selectedStartDate = queryString[i].replace('startdate=', '');
      } else if (queryString[i].indexOf('enddate=') > -1) {
        this.selectedEndDate = queryString[i].replace('enddate=', '');
      } else if (queryString[i].indexOf('id=') > -1) {
        this.userId = this.hashIdService.handleGroupIdDecode(queryString[i].replace('id=', ''));
      }
    }

    this.handleSubmitSearch('url');
  }

  // 按下日期按鈕後記錄其選擇並更改該按鈕樣式-kidin-1081210
  handleActivityBtn (e) {
    if (e.target.name === 'aWeek') {
      this.startDate = moment().add(-6, 'days').format('YYYY-MM-DD');
    } else if (e.target.name === 'aMonth') {
      this.startDate = moment().add(-29, 'days').format('YYYY-MM-DD');
    }
    this.isSelected = e.target.name;
    this.isSelectDateRange = false;
  }

  // 點擊選擇日期區間按鈕後，選擇日期顯示與否-kidin-1081209
  handleClickSelectDate (e) {
    this.isSelected = e.target.name;
    this.startDate = '';
    if (this.isSelectDateRange === false) {
      this.isSelectDateRange = true;
    } else {
      this.isSelectDateRange = false;
    }
  }

  // 使用者選擇日期區間後紀錄其開始日期-kidin-1081209
  handleStartDate (e) {
    this.selectedStartDate = e.target.value.format('YYYY-MM-DD');
    this.minEndDate = e.target.value;
  }

  // 使用者選擇日期區間後紀錄其結束日期-kidin-1081209
  handleEndDate (e) {
    this.selectedEndDate = e.target.value.format('YYYY-MM-DD');
    this.maxStartDate = e.target.value;
  }

  // 使用者送出表單後顯示相關資料-kidin-1081209
  handleSubmitSearch (act) {
    this.reportCompleted = false;
    this.initVariable();
    if (act === 'click') {
      this.updateUrl('false');
    }
    this.reportCategory = this.selectCategory;
    this.token = this.utils.getToken() || '';
    this.getFilterTime();

    // 先從service取得群組資訊，若取不到再call api-kidin-1081210
    this.groupService.getGroupInfo().subscribe(res => {
      this.groupData = res;
      if (this.groupData.hasOwnProperty('groupId')) {
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
    const body = {
      token: this.token,
      searchTime: {
        type: '1',
        fuzzyTime: [],
        filterStartTime: this.reportStartDate,
        filterEndTime: this.reportEndDate
      },
      searchRule: {
        activity: this.reportCategory,
        targetUser: targetUser,
        fileInfo: {
          author: author,
          dispName: '',
          equipmentSN: '',
          class: this.groupId,
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

  // 初始化變數-kidin-1081211
  initVariable () {
    this.initialChartComplated = false;
    this.showHRZoneChartTarget = false;
    this.showcaloriesBurnedChartTarget = false;
    this.showavgSpeedChartTarget = false;
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

  // 取得當地時區並加以處理-kidin-1081210
  getFilterTime () {
    const timeZoneMinite = new Date();
    const timeZone = -(timeZoneMinite.getTimezoneOffset() / 60);
    let timeZoneStr = '';
    if (timeZone < 10 && timeZone >= 0) {
      timeZoneStr = `+0${timeZone}`;
    } else if (timeZone > 10) {
      timeZoneStr = `+${timeZone}`;
    } else if (timeZone > -10 && timeZone < 0) {
      timeZoneStr = `-0${timeZone}`;
    } else {
      timeZoneStr = `-${timeZone}`;
    }

    if (this.startDate === '') {
      this.reportStartDate = `${this.selectedStartDate}T00:00:00.000${timeZoneStr}:00`;
      this.reportEndDate = `${this.selectedEndDate}T23:59:59.000${timeZoneStr}:00`;
    } else {
      this.reportStartDate = `${this.startDate}T00:00:00.000${timeZoneStr}:00`;
      this.reportEndDate = `${this.endDate}T23:59:59.000${timeZoneStr}:00`;
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
  }

  // 取得多筆活動資料並處理-kidin-1081211
  sendRequest (body) {
    this.activityService.fetchMultiActivityData(body).subscribe(res => {
      const activity = res.info.activities;
      if (res.resultCode !== 200) {
        this.hasResData = false;
        this.updateUrl('false');
        this.reportCompleted = true;
        this.initialChartComplated = true;
      } else {
        this.activityLength = activity.length;
        if (this.activityLength === 0) {
          this.hasResData = false;
          this.updateUrl('false');
          this.reportCompleted = true;
          this.initialChartComplated = true;
        } else {
          this.isSelectDateRange = false;
          this.getUserBodyInfo();
          this.hasResData = true;
          const infoData = activity[0];
          this.fileInfo = infoData.fileInfo;

          let timeCount = 0,
              HRCount = 0,
              caloriesCount = 0,
              distanceCount = 0,
              avgSpeedCount = 0,
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
                  if (hrBpm[j].heartRateBpm.heartRateBpm >= this.userHRZones[0] && hrBpm[j].heartRateBpm < this.userHRZones[1]) {
                    HRZoneOne += resolutionSeconds;
                  } else if (hrBpm[j].heartRateBpm >= this.userHRZones[1] + 1 && hrBpm[j].heartRateBpm < this.userHRZones[2]) {
                    HRZoneTwo += resolutionSeconds;
                  } else if (hrBpm[j].heartRateBpm >= this.userHRZones[2] + 1 && hrBpm[j].heartRateBpm < this.userHRZones[3]) {
                    HRZoneThree += resolutionSeconds;
                  } else if (hrBpm[j].heartRateBpm >= this.userHRZones[3] + 1 && hrBpm[j].heartRateBpm < this.userHRZones[4]) {
                    HRZoneFour += resolutionSeconds;
                  } else if (hrBpm[j].heartRateBpm >= this.userHRZones[4] + 1) {
                    HRZoneFive += resolutionSeconds;
                  } else {
                    HRZoneZero += resolutionSeconds;
                  }
                }
              }
            }

            if (this.reportCategory !== '5') {
              distanceCount += activityItem.totalDistanceMeters;
              avgSpeedCount += activityItem.avgSpeed;
              this.avgSpeedList.unshift(activityItem.avgSpeed);
            }
            this.dateList.unshift(this.formatDate(activity[i].fileInfo.creationDate));
            this.avgHRList.unshift(activityItem.avgHeartRateBpm);
            this.caloriesList.unshift(activityItem.calories);
          }
          if (this.reportCategory !== '5') {
            this.totalDistance = distanceCount;
            this.avgSpeed = avgSpeedCount / this.activityLength;
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

            this.HRZoneThree = this.HRZoneColorSet[3].y;
          }
          const coachId = this.fileInfo.teacher.split('?userId=')[1];
          this.initHighChart();
          this.getClassDetails(this.fileInfo.equipmentSN, coachId);
          this.updateUrl('true');
        }
      }
    });
    this.reportCompleted = true;
  }

  // 將搜尋的類別和範圍處理過後加入query string並更新現在的url和預覽列印的url-kidin-1081226
  updateUrl (str) {
    let newUrl;
    if (str === 'true') {
      let startDateString,
          endDateString,
          searchString;
      if (this.startDate === '') {
        startDateString = this.selectedStartDate;
        endDateString = this.selectedEndDate;
      } else {
        startDateString = this.startDate;
        endDateString = this.endDate;
      }

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

      searchString = `sport=${this.reportCategory}&startdate=${startDateString}&enddate=${endDateString}&id=${userId}`;

      if (location.search.indexOf('?') > -1) {
        if (
          location.search.indexOf('sport=') > -1 &&
          location.search.indexOf('startdate=') > -1 &&
          location.search.indexOf('enddate=') > -1 &&
          location.search.indexOf('id=') > -1
        ) {
          // 將舊的sr query string換成新的-kidin-1081226
          const preUrl = location.pathname;
          const queryString = location.search.replace('?', '').split('&');
          let newSufUrl = '';
          for (let i = 0; i < queryString.length; i++) {
            if (
              queryString[i].indexOf('sport=') === -1 &&
              queryString[i].indexOf('startdate=') === -1 &&
              queryString[i].indexOf('enddate=') === -1 &&
              queryString[i].indexOf('id=') === -1
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

  // 取得使用者資訊並計算心率區間範圍(待2020/4月拿掉)-kidin-1081213
  getUserBodyInfo () {
    [this.userData] = this.userInfoService.getBodyDatas();

    const userAge =  moment().diff(this.userData.birthday, 'years'),
          userHRBase = this.userData.heartRateBase,
          userMaxHR = this.userData.heartRateMax,
          userRestHR = this.userData.heartRateResting;

    if (userMaxHR && userRestHR) {
      if (userHRBase === 0) {
        // 區間數值採無條件捨去法
        this.userHRZones[0] = Math.floor((220 - userAge) * 0.5);
        this.userHRZones[1] = Math.floor((220 - userAge) * 0.6 - 1);
        this.userHRZones[2] = Math.floor((220 - userAge) * 0.7 - 1);
        this.userHRZones[3] = Math.floor((220 - userAge) * 0.8 - 1);
        this.userHRZones[4] = Math.floor((220 - userAge) * 0.9 - 1);
        this.userHRZones[5] = Math.floor((220 - userAge) * 1);
      } else {
        this.userHRZones[0] = (userMaxHR - userRestHR) * (0.55) + userRestHR;
        this.userHRZones[1] = (userMaxHR - userRestHR) * (0.6) + userRestHR;
        this.userHRZones[2] = (userMaxHR - userRestHR) * (0.65) + userRestHR;
        this.userHRZones[3] = (userMaxHR - userRestHR) * (0.75) + userRestHR;
        this.userHRZones[4] = (userMaxHR - userRestHR) * (0.85) + userRestHR;
        this.userHRZones[5] = (userMaxHR - userRestHR) * (1) + userRestHR;
      }
    } else {
      if (userHRBase === 0) {
        // 區間數值採無條件捨去法
        this.userHRZones[0] = Math.floor((220 - userAge) * 0.5);
        this.userHRZones[1] = Math.floor((220 - userAge) * 0.6 - 1);
        this.userHRZones[2] = Math.floor((220 - userAge) * 0.7 - 1);
        this.userHRZones[3] = Math.floor((220 - userAge) * 0.8 - 1);
        this.userHRZones[4] = Math.floor((220 - userAge) * 0.9 - 1);
        this.userHRZones[5] = Math.floor((220 - userAge) * 1);
      } else {
        this.userHRZones[0] = ((220 - userAge) - userRestHR) * (0.55) + userRestHR;
        this.userHRZones[1] = ((220 - userAge) - userRestHR) * (0.6) + userRestHR;
        this.userHRZones[2] = ((220 - userAge) - userRestHR) * (0.65) + userRestHR;
        this.userHRZones[3] = ((220 - userAge) - userRestHR) * (0.75) + userRestHR;
        this.userHRZones[4] = ((220 - userAge) - userRestHR) * (0.85) + userRestHR;
        this.userHRZones[5] = ((220 - userAge) - userRestHR) * (1) + userRestHR;
      }
    }
  }

  // 計算多筆資料合計的總運動時間-kidin-1081211
  calculateTotalTime (timeCount) {
    if (timeCount < 60) {
      this.totalTime = `00:${this.fillTwoDigits(timeCount)}"`;
    } else if ( timeCount < 3600) {
      const minute = Math.floor((timeCount) / 60);
      const second = timeCount % 60;
      this.totalTime = `${this.fillTwoDigits(minute)}:${this.fillTwoDigits(second)}"`;
    } else {
      const hour = Math.floor((timeCount) / 3600);
      const minute = Math.floor((timeCount % 3600) / 60);
      const second = timeCount - (hour * 3600) - (minute * 60);
      this.totalTime = `${hour}:${this.fillTwoDigits(minute)}:${this.fillTwoDigits(second)}"`;
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
    Highcharts.charts.forEach((_highChart, idx) => {
      if (_highChart !== undefined) {
        _highChart.destroy();
      }
    });
    Highcharts.charts.length = 0;  // 初始化global highchart物件，可避免HighCharts.Charts為 undefined -kidin-1081212
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
      this.translateService.instant('Dashboard.GroupClass.limit_generalZone'),
      this.translateService.instant('Dashboard.GroupClass.warmUpZone'),
      this.translateService.instant('Dashboard.GroupClass.aerobicZone'),
      this.translateService.instant('Dashboard.GroupClass.enduranceZone'),
      this.translateService.instant('Dashboard.GroupClass.marathonZone'),
      this.translateService.instant('Dashboard.GroupClass.anaerobicZone')
    ];
    HRZoneChartOptions['yAxis'].labels = {
      formatter: function () {
        return this.value + '%';
      }
    };

    this.chartDatas.push({ HRZoneChartTarget: HRZoneChartOptions, isSyncExtremes: false });
    this.chartTargetList.push('HRZoneChartTarget');

    // 卡路里圖表（待身體素質實裝後改成身體素質圖表）-kidin-1081213
    const userHeight = this.userData.height,
          userWeight = this.userData.weight;

    const caloriesBurnedDataset = {
      name: `近期身體素質：身高${userHeight}cm,體重${userWeight}kg`,
      data: [
        {
          name: this.translateService.instant('Portal.bodyWeight'),
          y: (userWeight * 7700 - this.totalCalories),
          color: '#ff9292'
        },
        {
          name: this.translateService.instant('Dashboard.SportReport.totalCalorie'),
          y: this.totalCalories,
          color: '#fd0000'
        }
      ],
      unit: '',
      type: 'pie',
      valueDecimals: 1
    };
    const caloriesBurnedOptions = new ChartOptions(caloriesBurnedDataset, this.colorIdx);
    caloriesBurnedOptions['chart'].zoomType = '';
    caloriesBurnedOptions['tooltip'] = {
      pointFormat: '{point.percentage:.1f}%'
    };
    caloriesBurnedOptions['title'].align = 'center';
    caloriesBurnedOptions['title'].x = 0;
    caloriesBurnedOptions['title'].y = 200;
    caloriesBurnedOptions['title'].style = {
      color: 'gray',
      fontSize: 12
    };
    caloriesBurnedOptions['series'][0].innerSize = '80%';
    caloriesBurnedOptions['plotOptions'] = {
      pie: {
        dataLabels: {
          enabled: true,
          distance: -50,
          style: {
            fontWeight: 'bold',
            color: 'white'
          }
        },
        startAngle: -90,
        endAngle: 90,
        center: ['50%', '60%'],
        size: '100%'
      }
    };

    this.chartDatas.push({ caloriesBurnedChartTarget: caloriesBurnedOptions, isSyncExtremes: false });
    this.chartTargetList.push('caloriesBurnedChartTarget');

    // 折線圖高度設定-kidin-1081227
    let chartHeight = 220;
    if (this.reportCategory !== '5') {
      chartHeight = 180;
    }

    if (this.reportCategory !== '5') {
      // 平均速度圖表-kidin-1081216
      const avgSpeedDataset = {
        name: 'Average Speed',
        data: this.avgSpeedList,
        unit: 'km/h',
        type: 'area',
        valueDecimals: 1
      };
      this.colorIdx = 0;
      const avgSpeedChartOptions = new ChartOptions(avgSpeedDataset, this.colorIdx);
      avgSpeedChartOptions['chart'].height = chartHeight;
      avgSpeedChartOptions['xAxis'].categories = this.dateList;
      avgSpeedChartOptions['plotOptions'] = {
        area: {
          fillColor: {
              linearGradient: {
                  x1: 0,
                  y1: 0,
                  x2: 0,
                  y2: 1
              },
              stops: [
                  [0, Highcharts.getOptions().colors[this.colorIdx]],
                  [1, Highcharts.Color(Highcharts.getOptions().colors[this.colorIdx]).setOpacity(0).get('rgba')]
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

      this.chartDatas.push({ avgSpeedChartTarget: avgSpeedChartOptions, isSyncExtremes: true });
      this.chartTargetList.push('avgSpeedChartTarget');
    }

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
                [0, Highcharts.getOptions().colors[this.colorIdx]],
                [1, Highcharts.Color(Highcharts.getOptions().colors[this.colorIdx]).setOpacity(0).get('rgba')]
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
                [0, Highcharts.getOptions().colors[this.colorIdx]],
                [1, Highcharts.Color(Highcharts.getOptions().colors[this.colorIdx]).setOpacity(0).get('rgba')]
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
    }, 0);
  }

  // 調整縮放會同步-kidin-1081212
  syncExtremes(num, finalDatas, e) {
    const thisChart = this.charts[num];
    if (e.trigger !== 'syncExtremes') {
      Highcharts.each(Highcharts.charts, function(_chart, idx) {
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
    for (let i = 0; i < Highcharts.charts.length; i = i + 1) {
      const _chart: any = Highcharts.charts[i];
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
      'queryArray': [SN]
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
      if (res) {
        this.coachInfo = res.info;
      }
    });

  }

  // 根據使用者點選的連結導引至該頁面-kidin-1081223
  visitLink(queryStr) {
    if (queryStr === 'author') {
      this.router.navigateByUrl(
        `/user-profile/${this.hashIdService.handleUserIdEncode(
          this.fileInfo.author
            .split('?')[1]
            .split('=')[1]
            .replace(')', '')
        )}`
      );
    } else if (queryStr === 'class') {
      this.router.navigateByUrl(
        `/dashboard/group-info/${this.hashIdService.handleGroupIdEncode(
          this.fileInfo.class
          .split('?')[1]
          .split('=')[1]
          .replace(')', '')
        )}`
      );
    }
  }

  print() {
    window.print();
  }

  ngOnDestroy () {
    // 將之前生成的highchart卸除避免新生成的highchart無法顯示-kidin-1081219
    Highcharts.charts.forEach((_highChart, idx) => {
      if (_highChart !== undefined) {
        _highChart.destroy();
      }
    });
  }
}
