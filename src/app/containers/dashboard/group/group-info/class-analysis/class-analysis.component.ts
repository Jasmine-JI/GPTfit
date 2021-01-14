import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { MatSort, Sort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import moment from 'moment';
import { chart } from 'highcharts';
import * as _Highcharts from 'highcharts';

import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { HashIdService } from '@shared/services/hash-id.service';

import { GroupService } from '../../../services/group.service';
import { UtilsService } from '@shared/services/utils.service';
import { ActivityService } from '../../../../../shared/services/activity.service';
import { QrcodeService } from '../../../../portal/services/qrcode.service';
import { UserProfileService } from '../../../../../shared/services/user-profile.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

const Highcharts: any = _Highcharts; // 不檢查highchart型態

// 建立圖表用-kidin-1081212
class ChartOptions {
  constructor (dataset) {
    return {
      chart: {
        height: 300,
        spacingTop: 20,
        spacingBottom: 20,
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
  selector: 'app-class-analysis',
  templateUrl: './class-analysis.component.html',
  styleUrls: ['./class-analysis.component.scss']
})
export class ClassAnalysisComponent implements OnInit, OnDestroy {

  private ngUnsubscribe = new Subject();

  // UI操控相關變數-kidin-1081210
  reportCompleted = true;
  isPreviewMode = false;
  isLoading = false;
  hasResData: boolean;
  maxSelectDate = moment().format('YYYY-MM-DD');
  initialChartComplated = true;
  showMore = false;
  isDebug = false;
  hideCalendar = false;
  showAllLessonInfo = false;
  showAllCoachInfo = false;

  // 資料儲存用變數-kidin-1081210
  classLink: HTMLElement;
  tableData = new MatTableDataSource<any>();
  token: string;
  previewUrl: string;
  reportCreatedTime = moment().format('YYYY-MM-DD HH:mm');
  classTime: number;
  reportStartDate = '';
  reportCategory = '1';
  classRealDateTime: string;
  brandImg: string;
  brandName: string;
  branchName: string;
  groupImg: string;
  groupId: string;
  activityLength: number;
  showLength: number;
  activity: Array<any>;
  fileInfo: any;
  avgActivityTime: string;
  avgDistance: number;
  avgSpeed: number;
  avgHR: number;
  avgCalories: number;
  totalCalories: number;
  userHRZones = [0, 0, 0, 0, 0, 0];
  HRZoneThree = 0;
  deviceInfo: any;
  groupData: any;
  coachInfo = {
    nickname: '',
    avatarUrl: '',
    description: ''
  };
  deviceImgUrl: string;
  memberSection = null;
  focusMember: string;
  lessonTotalInfo: string;
  lessonPartInfo: string;
  coachTotalInfo: string;
  coachPartInfo: string;

  // HChart設定相關-kidin-1081211
  showclassHRZoneChartTarget = false;
  showclassCaloriesChartTarget = false;
  charts = [];
  chartDatas = [];
  chartTargetList = [];
  HRZoneChartDatas = [];
  HRZoneChartTargetList = [];
  caloriesSet = [];
  HRZoneColorSet = [
    { y: 0, z: '', color: '#70b1f3' },
    { y: 0, z: '', color: '#64e0ec' },
    { y: 0, z: '', color: '#abf784' },
    { y: 0, z: '', color: '#f7f25b' },
    { y: 0, z: '', color: '#f3b353' },
    { y: 0, z: '', color: '#f36953' }
  ];
  memberHRZoneList = [];
  memberHRZoneOptions = [];

  @ViewChild('container', {static: false})
  container: ElementRef;
  @ViewChild('classHRZoneChartTarget', {static: false})
  classHRZoneChartTarget: ElementRef;
  @ViewChild('classCaloriesChartTarget', {static: false})
  classCaloriesChartTarget: ElementRef;
  @ViewChild('sortTable', {static: false})
  sortTable: MatSort;

  constructor(
    private router: Router,
    private hashIdService: HashIdService,
    private translateService: TranslateService,
    private groupService: GroupService,
    private utils: UtilsService,
    private qrcodeService: QrcodeService,
    private userProfileService: UserProfileService,
    private activityService: ActivityService
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
      location.search.indexOf('classTime=') > -1
    ) {
      this.queryStringShowData();
    }

    Highcharts.charts.length = 0;  // 初始化global highchart物件，可避免HighCharts.Charts為 undefined -kidin-1081212

    this.tableData.sort = this.sortTable;
  }

  // 點選日曆某課程後隱藏日曆並產生報告-kidin-1090319
  switchToReport (info) {
    this.hideCalendar = true;
    this.reportCategory = info.type;
    this.classTime = info.time;
    this.reportStartDate = moment(info.time).format('YYYY-MM-DDTHH:mm:ss.SSSZ');
    this.handleSubmitSearch('click');
  }

  // 返回行事曆-kidin-1090319
  returnCalendar () {
    this.updateUrl(false);
    this.hideCalendar = false;
  }

  // 依query string顯示資料-kidin-20191226
  queryStringShowData () {
    this.hideCalendar = true;
    const queryString = location.search.replace('?', '').split('&');
    for (let i = 0; i < queryString.length; i++) {
      if (queryString[i].indexOf('sport=') > -1) {
        this.reportCategory = queryString[i].replace('sport=', '');
      } else if (queryString[i].indexOf('classTime=') > -1) {
        this.classTime = +queryString[i].replace('classTime=', '');
        this.reportStartDate = moment(this.classTime).format('YYYY-MM-DDTHH:mm:ss.SSSZ');
      }
    }

    this.handleSubmitSearch('url');
  }

  // 使用者送出表單後顯示相關資料-kidin-1081209
  handleSubmitSearch (act) {
    this.initialChartComplated = false;
    this.reportCompleted = false;
    this.initVariable();

    if (act === 'click') {
      this.updateUrl('false');
    }

    this.token = this.utils.getToken() || '';

    // 先從service取得群組資訊，若取不到再call api-kidin-1081210
    this.groupService.getGroupInfo().pipe(
      takeUntil(this.ngUnsubscribe)
    ).subscribe(res => {
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
    let targetUser;
    if (this.isDebug) {
      targetUser = '99';
    } else {
      targetUser = '2';
    }

    const body = {
      token: this.token,
      searchTime: {
        type: '2',
        fuzzyTime: [this.reportStartDate],
        filterStartTime: '',
        filterEndTime: '',
        filterSameTime: '1'
      },
      searchRule: {
        activity: this.reportCategory,
        targetUser: targetUser,
        fileInfo: {
          author: '',
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
        activityPointLayerDisplay: '3',
        activityPointLayerDataField: []
      },
      page: '0',
      pageCounts: '1000'
    };
    this.sendRequest(body);
  }

  initVariable () {
    if (this.sortTable && this.sortTable.hasOwnProperty('active')) {
      this.sortTable.sort({id: '', start: 'asc', disableClear: false});
      delete this.sortTable['active'];
    }

    this.showMore = false;
    this.initialChartComplated = false;
    this.showclassHRZoneChartTarget = false;
    this.showclassCaloriesChartTarget = false;
    this.caloriesSet = [];
    this.activity = [];
    this.HRZoneColorSet = [
      { y: 0, z: '', color: '#70b1f3' },
      { y: 0, z: '', color: '#64e0ec' },
      { y: 0, z: '', color: '#abf784' },
      { y: 0, z: '', color: '#f7f25b' },
      { y: 0, z: '', color: '#f3b353' },
      { y: 0, z: '', color: '#f36953' }
    ];
    this.memberSection = null;
    this.memberHRZoneList = [];
    this.memberHRZoneOptions = [];
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
    this.activityService.fetchMultiActivityData(body).subscribe(res => {
      this.activity = res.info.activities;
      if (res.resultCode !== 200) {
        this.hasResData = false;
        this.updateUrl('false');
        this.reportCompleted = true;
        this.initialChartComplated = true;
      } else {
        this.activityLength = this.activity.length;
        if (this.activityLength === 0) {
          this.hasResData = false;
          this.updateUrl('false');
          this.reportCompleted = true;
          this.initialChartComplated = true;
        } else {
          this.handleTableData('showPart');
          this.hasResData = true;
          const infoData = this.activity[0];
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
            const activityItem = this.activity[i].activityInfoLayer;
            timeCount += activityItem.totalSecond;
            HRCount += activityItem.avgHeartRateBpm;
            caloriesCount += activityItem.calories;
            let memberHRZoneZero = 0,
                memberHRZoneOne = 0,
                memberHRZoneTwo = 0,
                memberHRZoneThree = 0,
                memberHRZoneFour = 0,
                memberHRZoneFive = 0;

            // 取得心率區間-kidin-1081213
            if (activityItem.totalHrZone0Second !== null) {
              HRZoneZero += activityItem.totalHrZone0Second > 0 ? activityItem.totalHrZone0Second : 0;
              HRZoneOne += activityItem.totalHrZone1Second > 0 ? activityItem.totalHrZone1Second : 0;
              HRZoneTwo += activityItem.totalHrZone2Second > 0 ? activityItem.totalHrZone2Second : 0;
              HRZoneThree += activityItem.totalHrZone3Second > 0 ? activityItem.totalHrZone3Second : 0;
              HRZoneFour += activityItem.totalHrZone4Second > 0 ? activityItem.totalHrZone4Second : 0;
              HRZoneFive += activityItem.totalHrZone5Second > 0 ? activityItem.totalHrZone5Second : 0;

              memberHRZoneZero = activityItem.totalHrZone0Second > 0 ? activityItem.totalHrZone0Second : 0;
              memberHRZoneOne = activityItem.totalHrZone1Second > 0 ? activityItem.totalHrZone1Second : 0;
              memberHRZoneTwo = activityItem.totalHrZone2Second > 0 ? activityItem.totalHrZone2Second : 0;
              memberHRZoneThree = activityItem.totalHrZone3Second > 0 ? activityItem.totalHrZone3Second : 0;
              memberHRZoneFour = activityItem.totalHrZone4Second > 0 ? activityItem.totalHrZone4Second : 0;
              memberHRZoneFive = activityItem.totalHrZone5Second > 0 ? activityItem.totalHrZone5Second : 0;

              const memberTotalHRSecond =
              memberHRZoneZero +  memberHRZoneOne + memberHRZoneTwo + memberHRZoneThree + memberHRZoneFour + memberHRZoneFive;

              const memberHRZoneSet = [
                { y: 0, z: '', color: '#70b1f3' },
                { y: 0, z: '', color: '#64e0ec' },
                { y: 0, z: '', color: '#abf784' },
                { y: 0, z: '', color: '#f7f25b' },
                { y: 0, z: '', color: '#f3b353' },
                { y: 0, z: '', color: '#f36953' }
              ];

              memberHRZoneSet[0].y = Math.round((memberHRZoneZero / memberTotalHRSecond) * 100);
              memberHRZoneSet[1].y = Math.round((memberHRZoneOne / memberTotalHRSecond) * 100);
              memberHRZoneSet[2].y = Math.round((memberHRZoneTwo / memberTotalHRSecond) * 100);
              memberHRZoneSet[3].y = Math.round((memberHRZoneThree / memberTotalHRSecond) * 100);
              memberHRZoneSet[4].y = Math.round((memberHRZoneFour / memberTotalHRSecond) * 100);
              memberHRZoneSet[5].y = Math.round((memberHRZoneFive / memberTotalHRSecond) * 100);
              memberHRZoneSet[0].z = this.formatTime(memberHRZoneZero, '2');
              memberHRZoneSet[1].z = this.formatTime(memberHRZoneOne, '2');
              memberHRZoneSet[2].z = this.formatTime(memberHRZoneTwo, '2');
              memberHRZoneSet[3].z = this.formatTime(memberHRZoneThree, '2');
              memberHRZoneSet[4].z = this.formatTime(memberHRZoneFour, '2');
              memberHRZoneSet[5].z = this.formatTime(memberHRZoneFive, '2');

              this.memberHRZoneList.push(memberHRZoneSet);
            }

            // 計算卡路里區間-kidin-1081223
            const caloriesCategory = Math.floor(this.activity[i].activityInfoLayer.calories / 100);
            this.divideCaloriesInterval(caloriesCategory);

            // 計算距離和速度-kidin-1081223
            if (this.reportCategory !== '5') {
              distanceCount += this.activity[i].activityInfoLayer.totalDistanceMeters;
              avgSpeedCount += this.activity[i].activityInfoLayer.avgSpeed;
            }
          }
          if (this.reportCategory !== '5') {
            this.avgSpeed = avgSpeedCount / this.activityLength;
            this.avgDistance = distanceCount / this.activityLength;
          }

          const avgTime = Math.round(timeCount / this.activityLength);
          this.avgActivityTime = this.formatTime(avgTime, '1');
          this.avgHR = HRCount / this.activityLength;
          this.totalCalories = caloriesCount;
          this.avgCalories = this.totalCalories / this.activityLength;

          const totalHRSecond = HRZoneZero + HRZoneOne + HRZoneTwo + HRZoneThree + HRZoneFour + HRZoneFive;
          if (totalHRSecond !== 0) {
            this.HRZoneColorSet[0].y = this.handleMathRound((HRZoneZero / totalHRSecond) * 100);
            this.HRZoneColorSet[1].y = this.handleMathRound((HRZoneOne / totalHRSecond) * 100);
            this.HRZoneColorSet[2].y = this.handleMathRound((HRZoneTwo / totalHRSecond) * 100);
            this.HRZoneColorSet[3].y = this.handleMathRound((HRZoneThree / totalHRSecond) * 100);
            this.HRZoneColorSet[4].y = this.handleMathRound((HRZoneFour / totalHRSecond) * 100);
            this.HRZoneColorSet[5].y = this.handleMathRound((HRZoneFive / totalHRSecond) * 100);
            this.HRZoneColorSet[0].z = this.formatTime(Math.round(HRZoneZero / this.activityLength), '2');
            this.HRZoneColorSet[1].z = this.formatTime(Math.round(HRZoneOne / this.activityLength), '2');
            this.HRZoneColorSet[2].z = this.formatTime(Math.round(HRZoneTwo / this.activityLength), '2');
            this.HRZoneColorSet[3].z = this.formatTime(Math.round(HRZoneThree / this.activityLength), '2');
            this.HRZoneColorSet[4].z = this.formatTime(Math.round(HRZoneFour / this.activityLength), '2');
            this.HRZoneColorSet[5].z = this.formatTime(Math.round(HRZoneFive / this.activityLength), '2');

            this.HRZoneThree = this.HRZoneColorSet[3].y;
          }
          const coachId = this.fileInfo.teacher.split('?userId=')[1];
          this.initInfoHighChart();
          this.initMemberHRZoneChart();
          this.getClassDetails(this.fileInfo.equipmentSN, coachId);
          this.updateUrl('true');

          setTimeout(() => {
            this.getReportInfo();
          });

        }

      }

    });
    this.reportCompleted = true;
  }

  // 取得變數內容並將部分變數替換成html element-kidin-1090623
  getReportInfo () {
    const targetDiv = document.getElementById('reportInfo');
    this.translateService.get('hellow world').subscribe(() => {
      targetDiv.innerHTML = this.translateService.instant('universal_group_sportsRecordReportClass', {
        'class': `<span id="classLink" class="activity-Link">${this.fileInfo.dispName}</span>`,
        'dateTime': this.getClassRealDateTime(),
        'number': `<span class="fileAmount">${this.activityLength}</span>`
      });

    });

    this.classLink = document.getElementById('classLink');
    this.classLink.addEventListener('click', this.visitLink.bind(this));
  }

  // 將搜尋的類別和範圍處理過後加入query string並更新現在的url和預覽列印的url-kidin-1081226
  updateUrl (str) {
    let newUrl;

    if (str === 'true') {
      const searchString = `sport=${this.reportCategory}&classTime=${this.classTime}`;

      if (location.search.indexOf('?') > -1) {
        if (
          location.search.indexOf('sport=') > -1 &&
          location.search.indexOf('classTime=') > -1
        ) {
          // 將舊的sr query string換成新的-kidin-1081226
          const preUrl = location.pathname;
          const queryString = location.search.replace('?', '').split('&');
          let newSufUrl = '';
          for (let i = 0; i < queryString.length; i++) {
            if (
              queryString[i].indexOf('sport=') === -1 &&
              queryString[i].indexOf('classTime=') === -1
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

      if (history.pushState) {
        window.history.pushState({path: newUrl}, '', newUrl);
      }

      this.previewUrl = newUrl + '&ipm=s';
    } else {

      if (this.isDebug) {
        newUrl = `${location.pathname}?debug=`;
      } else {
        newUrl = location.pathname;
      }

      if (history.pushState) {
        window.history.pushState({path: newUrl}, '', newUrl);
      }

    }
  }

  // 處理個人分析列表的顯示多寡-kidin-1081226
  handleTableData (act) {
    this.tableData.data.length = 0;
    const middleData = [];

    if (act === 'showPart' && this.activityLength > 5) {
      this.showLength = 5;
    } else {
      this.showLength = this.activityLength;
      this.showMore = true;
    }

    for (let i = 0; i < this.showLength; i++) {
      const sourceObj = {
        id: i,
        name: this.activity[i].fileInfo.author.split('?userId=')[0],
        distance: this.activity[i].activityInfoLayer.totalDistanceMeters,
        avgSpeed: this.activity[i].activityInfoLayer.avgSpeed,
        avgHr: this.activity[i].activityInfoLayer.avgHeartRateBpm,
        maxHr: this.activity[i].activityInfoLayer.maxHeartRateBpm,
        calories: this.activity[i].activityInfoLayer.calories,
        avgWatt: this.activity[i].activityInfoLayer.cycleAvgWatt
      };

      middleData.push(sourceObj);
    }
    this.tableData.data = middleData;

    if (this.sortTable && this.sortTable.hasOwnProperty('active')) {
      this.sortData();
    }

    this.initMemberHRZoneChart();
  }

  // 取得真實的上課時間（取資料第一位的時間）-kidin-1081223
  getClassRealDateTime () {
    const date = (
      this.fileInfo.creationDate
        .split('T')[0]
        .replace(/-/g, '/')
    );

    const time = (
      this.fileInfo.creationDate
        .split('T')[1]
        .substr(0, 5)
    );

    return `${date} ${time}`;
  }

  // 使時間符合格式(format = 1:有時間符號，= 2:沒有時間符號，可再新增format)-kidin-1081211
  formatTime (time, format) {
    if (time < 60) {
      switch (format) {
        case '1':
          return `00:${this.fillTwoDigits(time)}`;
        case '2':
          return `00:${this.fillTwoDigits(time)}`;
      }
    } else if ( time < 3600) {
      const minute = Math.floor((time) / 60);
      const second = time % 60;

      switch (format) {
        case '1':
          return `${this.fillTwoDigits(minute)}:${this.fillTwoDigits(second)}`;
        case '2':
          return `${this.fillTwoDigits(minute)}:${this.fillTwoDigits(second)}`;
      }
    } else {
      const hour = Math.floor((time) / 3600);
      const minute = Math.floor((time % 3600) / 60);
      const second = time - (hour * 3600) - (minute * 60);

      switch (format) {
        case '1':
          return `${this.fillTwoDigits(hour)}:${this.fillTwoDigits(minute)}:${this.fillTwoDigits(second)}`;
        case '2':
          return `${hour}:${this.fillTwoDigits(minute)}:${this.fillTwoDigits(second)}`;
      }
    }
  }

  // 時間補零-kidin-1081211
  fillTwoDigits (num) {
    const timeStr = '0' + Math.floor(num);
    return timeStr.substr(-2);
  }

  // 使檔案創建日期符合格式-kidin-1081211
  formatDate (date) {
    const month = date.slice(5, 7);
    const day = date.slice(8, 10);
    return `${month}/${day}`;
  }

  // 將每個使用者的卡路里消耗，每100cal做分類-kidin-1081223
  divideCaloriesInterval (key) {
    if (this.caloriesSet.length === 0) {
      if (key > 0) {
        this.caloriesSet.push([`${key}00~${key}99cal`, 1]);
      } else {
        this.caloriesSet.push([`${key}~99cal`, 1]);
      }
    } else {
      let index;
      if (key > 0) {
        for (let i = 0; i < this.caloriesSet.length; i++) {
          if (this.caloriesSet[i].indexOf(`${key}00~${key}99cal`) > -1) {
            index = i;
            break;
          }
          index = null;
        }

        if (index !== null) {
          this.caloriesSet[index][1]++;
        } else {
          this.caloriesSet.push([`${key}00~${key}99cal`, 1]);
        }

      } else {
        for (let i = 0; i < this.caloriesSet.length; i++) {
          if (this.caloriesSet[i].indexOf(`${key}~99cal`) > -1) {
            index = i;
            break;
          }
          index = null;
        }

        if (index !== null) {
          this.caloriesSet[index][1]++;
        } else {
          this.caloriesSet.push([`${key}~99cal`, 1]);
        }

      }
    }
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
  initInfoHighChart () {
    Highcharts.charts.length = 0;  // 初始化global highchart物件，可避免HighCharts.Charts為 undefined -kidin-1081212
    this.chartDatas.length = 0;
    this.chartTargetList.length = 0;
    this.HRZoneChartDatas.length = 0;
    this.HRZoneChartTargetList.length = 0;

    // 全體心率區間落點圖表-kidin-1081212
      // 顯示聚焦成員的心率區間時，全體區間顏色變淺-kidin-1090102
    if (this.memberSection !== null && this.memberHRZoneList[this.focusMember] !== undefined) {
      this.HRZoneColorSet[0].color = '#a6cef7';
      this.HRZoneColorSet[1].color = '#9af1f9';
      this.HRZoneColorSet[2].color = '#c4f3ad';
      this.HRZoneColorSet[3].color = '#f9f6a1';
      this.HRZoneColorSet[4].color = '#f1d3a6';
      this.HRZoneColorSet[5].color = '#f9aca0';
    } else {
      this.HRZoneColorSet[0].color = '#70b1f3';
      this.HRZoneColorSet[1].color = '#64e0ec';
      this.HRZoneColorSet[2].color = '#abf784';
      this.HRZoneColorSet[3].color = '#f7f25b';
      this.HRZoneColorSet[4].color = '#f3b353';
      this.HRZoneColorSet[5].color = '#f36953';
    }

    const HRZoneDataset = {
      name: 'Heart Rate Zone',
      data: this.HRZoneColorSet,
      unit: '%',
      type: 'column',
      valueDecimals: 1
    };
    const classHRZoneChartOptions = new ChartOptions(HRZoneDataset);
    classHRZoneChartOptions['plotOptions'].column['pointPlacement'] = 0;
    classHRZoneChartOptions['chart'].zoomType = '';
    classHRZoneChartOptions['xAxis'].categories = [
      this.translateService.instant('universal_activityData_limit_generalZone'),
      this.translateService.instant('universal_activityData_warmUpZone'),
      this.translateService.instant('universal_activityData_aerobicZone'),
      this.translateService.instant('universal_activityData_enduranceZone'),
      this.translateService.instant('universal_activityData_marathonZone'),
      this.translateService.instant('universal_activityData_anaerobicZone')
    ];
    classHRZoneChartOptions['yAxis'].labels = {
      formatter: function () {
        return this.value + '%';
      }
    };
    classHRZoneChartOptions['series'][0].name = 'Avg';
    classHRZoneChartOptions['series'][0].dataLabels = {
      enabled: true,
      formatter: function () {
        return this.point.z;
      }
    };
    classHRZoneChartOptions['series'][0].showInLegend = false;

    // 顯示聚焦成員的心率區間-kidin-1090102
    if (this.memberSection !== null && this.memberHRZoneList[this.focusMember] !== undefined) {
      const memberNickName = this.activity[this.focusMember].fileInfo.author.split('?')[0],
            focusMemberData = this.memberHRZoneList[this.focusMember],
            compareMemberHRZone = [
              { y: focusMemberData[0].y, z: focusMemberData[0].z, color: '#278bf1' },
              { y: focusMemberData[1].y, z: focusMemberData[1].z, color: '#2de9fb' },
              { y: focusMemberData[2].y, z: focusMemberData[2].z, color: '#6ff32b' },
              { y: focusMemberData[3].y, z: focusMemberData[3].z, color: '#e0da1c' },
              { y: focusMemberData[4].y, z: focusMemberData[4].z, color: '#f9a426' },
              { y: focusMemberData[5].y, z: focusMemberData[5].z, color: '#fd492d' }
            ],
            compareMemberSet = {
              data: compareMemberHRZone,
              name: memberNickName,
              type: 'column',
              innerSize: '',
              fillOpacity: 0.3,
              tooltip: {
                valueSuffix: ' ' + '%'
              },
              dataLabels: {
                enabled: true,
                formatter: function () {
                  return this.point.z;
                }
              }
            };
      classHRZoneChartOptions['tooltip'].pointFormat = `{series.name}：{point.y}`;
      classHRZoneChartOptions['plotOptions'].series['groupPadding'] = 0.1;

      classHRZoneChartOptions['series'].push(compareMemberSet);
    }

    this.chartDatas.push({ classHRZoneChartTarget: classHRZoneChartOptions, isSyncExtremes: false });
    this.chartTargetList.push('classHRZoneChartTarget');


    // 卡路里圓餅圖表-kidin-1081213
    const finalCaloriesSet = [...this.caloriesSet];

      // 突顯聚焦成員的卡路里區間-kidin-1090102
    let categoryPosition,
        caloriesRange;

    if (this.memberSection !== null) {
      const caloriesCategory = Math.floor(this.activity[this.focusMember].activityInfoLayer.calories / 100);
      if (caloriesCategory > 0) {
        caloriesRange = `${caloriesCategory}00~${caloriesCategory}99cal`;
      } else {
        caloriesRange = `${caloriesCategory}~99cal`;
      }

      finalCaloriesSet.map((item, index) => {
        if (item[0] === caloriesRange) {
          categoryPosition = index;
          return index;
        }
      });

      finalCaloriesSet[categoryPosition] = {
        name: `${caloriesCategory}00~${caloriesCategory}99cal`,
        y: finalCaloriesSet[categoryPosition][1],
        sliced: true,
        selected: true,
        borderColor: '#f5bfbf',
        borderWidth: 3
      };
    }

    const classCaloriesDataset = {
      name: `課程學員共${this.activityLength}人`,
      data: finalCaloriesSet,
      unit: '',
      type: 'pie',
      valueDecimals: 1
    };
    const classCaloriesOptions = new ChartOptions(classCaloriesDataset);
    classCaloriesOptions['tooltip'] = {
      pointFormat: `${this.translateService.instant('universal_adjective_total')}{point.y}人`
    };
    classCaloriesOptions['title'].align = 'center';
    classCaloriesOptions['title'].x = 0;
    classCaloriesOptions['title'].y = 320;
    classCaloriesOptions['title'].style = {
      color: 'gray',
      fontSize: 12
    };
    classCaloriesOptions['plotOptions'] = {
      pie: {
        center: ['50%', '30%'],
        size: '60%'
      }
    };
    classCaloriesOptions['series'][0].dataLabels = {
      enabled: true,
      color: 'gray'
    };
    classCaloriesOptions['plotOptions'].series = {
      dataLabels: {
        formatter: function () {
          let percent = ((this.point.y / this.point.total) * 100).toFixed(1);
          if (percent.substr(-1) === '0') {
            percent = '' + (this.point.y / this.point.total) * 100;
          }
          return `${this.key}<br> ${percent}%`;
        }
      }
    };

    this.chartDatas.push({ classCaloriesChartTarget: classCaloriesOptions, isSyncExtremes: false });
    this.chartTargetList.push('classCaloriesChartTarget');

    // 根據圖表清單依序將圖表顯示出來-kidin-1081217
    const chartTargetList = this.chartTargetList;
    setTimeout(() => {
      this.chartDatas.forEach((_option, idx) => {
        this[`show${chartTargetList[idx]}`] = true;
        this.charts[idx] = chart(
          this[chartTargetList[idx]].nativeElement,
          _option[chartTargetList[idx]]
        );
      });

      this.initialChartComplated = true;
    }, 0);
  }

  // 顯示各個學員心率區間圖表-kidin-1090106
  initMemberHRZoneChart () {
    for (let i = 0; i < this.memberHRZoneList.length; i++) {
      const memberHRZoneDataset = {
        name: '',
        data: this.memberHRZoneList[i],
        unit: '',
        type: 'column',
        valueDecimals: 1
      };
      this.memberHRZoneOptions[i] = new ChartOptions(memberHRZoneDataset);
      this.memberHRZoneOptions[i]['chart'] = {
        margin: [2, 0, 2, 0],
        height: 40,
        style: {
            overflow: 'visible'
        },
        backgroundColor: 'transparent'
      };
      this.memberHRZoneOptions[i]['xAxis'] = {
        labels: {
            enabled: false
        },
        title: {
            text: null
        },
        startOnTick: false,
        endOnTick: false,
        tickPositions: []
      };
      this.memberHRZoneOptions[i]['yAxis'] = {
        endOnTick: false,
        startOnTick: false,
        labels: {
            enabled: false
        },
        title: {
            text: null
        },
        tickPositions: [0]
      };
      this.memberHRZoneOptions[i]['tooltip'] = {
        hideDelay: 0,
        outside: true,
        headerFormat: null,
        pointFormat: '{point.y}%'
      };
      this.memberHRZoneOptions[i]['plotOptions'].column['pointPlacement'] = 0;
      this.memberHRZoneOptions[i]['legend'] = {
        enabled: false
      };
      this.memberHRZoneOptions[i]['chart'].zoomType = '';

      this.HRZoneChartDatas.push({ memberHRZoneChartTarget: this.memberHRZoneOptions[i], isSyncExtremes: false });
      this.HRZoneChartTargetList.push('memberHRZoneChartTarget');
    }

    setTimeout(() => {
      if (this.HRZoneChartDatas[0]) {
        this.showMemberHRZone(this.HRZoneChartDatas, this.HRZoneChartTargetList);
      }
    }, 0);
  }

  // 將成員心率圖表依序顯示出來-kidin-1090106
  showMemberHRZone (datas, list) {
    const HRZoneChartTargetList = list,
          nextIdx = this.chartTargetList.length,
          memberDiv = document.querySelectorAll('.memberHRZoneChart') as NodeListOf<HTMLElement>;

    datas.forEach((_option, idx) => {
      this.charts[idx + nextIdx] = chart(
        memberDiv[idx],
        _option[HRZoneChartTargetList[idx]]
      );
    });
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
      targetUserId: coachId
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

  // 根據使用者點選的連結導引至該頁面-kidin-1081223
  visitLink() {
    this.router.navigateByUrl(
      `/dashboard/group-info/${this.hashIdService.handleGroupIdEncode(this.fileInfo.class)}`
    );

  }

  // 依據點選的項目進行排序-kidin-1090102
  sortData () {
    const sortCategory = this.sortTable.active,
          sortDirection = this.sortTable.direction,
          sortResult = [...this.tableData.data];

    let swapped = true;
    for (let i = 0; i < this.showLength && swapped; i++) {
      swapped = false;
      for (let j = 0; j < this.showLength - 1 - i; j++) {
        if (sortResult[j][sortCategory] > sortResult[j + 1][sortCategory]) {
          swapped = true;
          [sortResult[j], sortResult[j + 1]] = [sortResult[j + 1], sortResult[j]];
        }
      }
    }

    if (sortDirection === 'desc') {
      sortResult.reverse();
    }

    this.tableData.data = sortResult;
    this.sortHRZoneChart();
  }

  // 將圖表依據該成員列表位置進行對應-kidin-1090106
  sortHRZoneChart () {
    const sortDatas = this.tableData.data;
    if (this.HRZoneChartDatas[0]) {
      const sortHRZoneChartDatas = [],
            sortHRZoneChartList = [];
      for (let i = 0; i < this.showLength; i++) {
        sortHRZoneChartDatas.push(this.HRZoneChartDatas[sortDatas[i]['id']]);
        sortHRZoneChartList.push(this.HRZoneChartTargetList[sortDatas[i]['id']]);
      }

      setTimeout(() => {
        this.showMemberHRZone(sortHRZoneChartDatas, sortHRZoneChartList);
      }, 0);
    }
  }

  // 依據點選的成員顯示資料-kidin-1090102
  handleClickMember (e) {
    if (e.currentTarget !== this.memberSection) {
      if (this.memberSection !== null) {
        this.memberSection.style = 'font-weight: none;';
        for (let i = 0; i < this.memberSection.children.length; i++) {
          this.memberSection.children[i].style = 'color: black';
        }
      }
      e.currentTarget.style = 'font-weight: bold;';
      for (let i = 0; i < e.currentTarget.children.length; i++) {
        e.currentTarget.children[i].style = 'color: #ffa509';
      }
      this.memberSection = e.currentTarget;
      this.focusMember = e.currentTarget.id;
    } else {
      if (this.memberSection !== null) {
        this.memberSection.style = 'font-weight: none;';
        for (let i = 0; i < this.memberSection.children.length; i++) {
          this.memberSection.children[i].style = 'color: black';
        }
      }
      this.memberSection = null;
      this.focusMember = null;
    }
    this.initInfoHighChart();
    if (this.sortTable && this.sortTable.hasOwnProperty('active')) {
      this.initMemberHRZoneChart();
      this.sortHRZoneChart();
    } else {
      this.initMemberHRZoneChart();
    }
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

  ngOnDestroy () {
    // 將之前生成的highchart卸除避免新生成的highchart無法顯示-kidin-1081219
    Highcharts.charts.forEach((_highChart, idx) => {
      if (_highChart !== undefined) {
        _highChart.destroy();
      }
    });

    if (this.classLink) {
      this.classLink.removeEventListener('click', this.visitLink.bind(this));
    }

    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();

  }

}
