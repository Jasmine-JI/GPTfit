import {
  Component,
  OnInit,
  AfterViewInit,
  ViewChild,
  ElementRef,
  Renderer2,
  OnDestroy,
  ViewEncapsulation
} from '@angular/core';
import { chart } from 'highcharts';
import * as _Highcharts from 'highcharts';
import { ActivityService } from '../../services/activity.service';
import { ActivatedRoute } from '@angular/router';
import { NgProgress, NgProgressRef } from '@ngx-progressbar/core';
import { GlobalEventsManager } from '@shared/global-events-manager';
import { UtilsService } from '@shared/services/utils.service';
import { Router } from '@angular/router';
import { MatTableDataSource } from '@angular/material';
import { UserInfoService } from '../../../containers/dashboard/services/userInfo.service';
import { transform, WGS84, BD09, GCJ02 } from 'gcoord';
import { HashIdService } from '@shared/services/hash-id.service';
import chinaBorderData from './border-data_china';
import taiwanBorderData from './border-data_taiwan';
import { ActivityOtherDetailsService } from '@shared/services/activity-other-details.service';
import { debounce } from '@shared/utils/';
import * as moment from 'moment';

const Highcharts: any = _Highcharts; // 不檢查highchart型態
declare var google: any;
declare var BMap: any;

@Component({
  selector: 'app-activity-info',
  templateUrl: './activity-info.component.html',
  styleUrls: [
    './activity-info.component.css',
    '../../../containers/dashboard/components/coach-dashboard/coach-dashboard.component.scss'
  ],
  encapsulation: ViewEncapsulation.None
})
export class ActivityInfoComponent implements OnInit, AfterViewInit, OnDestroy {
  dataSource = new MatTableDataSource<any>();
  displayedColumns: string[] = [
    'lapIndex',
    'status',
    'heartRate',
    'speed',
    'distance'
  ];
  isShowMap = true;
  isdisplayHcharts = true;
  chartLoading = false;
  basicLoading = false;
  rainLoading = false;
  @ViewChild('gmap') gmapElement: ElementRef;
  map: any;
  @ViewChild('bmap') bmapElement: ElementRef;
  bmap: any;
  startMark: any;
  endMark: any;
  playerMark: any;
  seriesIdx = 0;
  gpxPoints = [];
  isPlayingGpx = false;
  stopPointIdx = 0;
  playerTimer: any;
  @ViewChild('speedChartTarget')
  speedChartTarget: ElementRef;
  @ViewChild('elevationChartTarget')
  elevationChartTarget: ElementRef;
  @ViewChild('container')
  container: ElementRef;
  @ViewChild('hrChartTarget')
  hrChartTarget: ElementRef;
  @ViewChild('cadenceChartTarget')
  cadenceChartTarget: ElementRef;
  @ViewChild('paceChartTarget')
  paceChartTarget: ElementRef;
  @ViewChild('tempChartTarget')
  tempChartTarget: ElementRef;
  @ViewChild('zoneChartTarget')
  zoneChartTarget: ElementRef;
  @ViewChild('wattChartTarget')
  wattChartTarget: ElementRef;

  isspeedChartTargetDisplay = false;
  iselevationChartTargetDisplay = false;
  ishrChartTargetDisplay = false;
  iscadenceChartTargetDisplay = false;
  ispaceChartTargetDisplay = false;
  istempChartTargetDisplay = false;
  iszoneChartTargetDisplay = false;
  iswattChartTargetDisplay = false;

  activityInfo: any;
  fileInfo: any;
  infoDate: string;
  activityPoints: any;
  isLoading = false;
  token: string;
  isPortal = false;
  isShowNoRight = false;
  isFileIDNotExist = false;
  _options = {
    min: 8,
    max: 100,
    ease: 'linear',
    speed: 200,
    trickleSpeed: 400,
    meteor: true,
    spinner: true,
    spinnerPosition: 'right',
    direction: 'ltr+',
    color: '#108bcd',
    thick: false
  };
  chartOptions: any;
  userLink = {
    userName: '',
    userId: null
  };
  progressRef: NgProgressRef;
  totalSecond: number;
  resolutionSeconds: number;
  isInitialChartDone = false;
  charts = [];
  finalDatas: any;
  mapKind: string; // 1 google map,  2 baidu
  gpxBmapPoints = [];
  playBMK: any;
  isHideMapRadioBtn = false;
  isInChinaArea: boolean;
  isDebug = false;
  isOtherDetailLoading = false;
  isLoadedOtherDetail = false;
  deviceInfo: any;
  classInfo: any;
  lessonInfo: string;
  totalLessonInfo: string;
  isCoachMoreDisplay = false;
  isLessonMoreDisplay = false;
  coachInfo: any;
  coachDesc: string;
  totalCoachDesc: string;
  previewUrl = location.pathname + '?ipm=s';
  isPrevieMode = false;
  brandIcon = '';
  brandName = '';
  printFileDate = '';
  constructor(
    private utils: UtilsService,
    private renderer: Renderer2,
    private activityService: ActivityService,
    private route: ActivatedRoute,
    private ngProgress: NgProgress,
    private globalEventsManager: GlobalEventsManager,
    private router: Router,
    private userInfoService: UserInfoService,
    private hashIdService: HashIdService,
    private activityOtherDetailsService: ActivityOtherDetailsService
  ) {
    /**
     * 重写内部的方法， 这里是将提示框即十字准星的隐藏函数关闭
     */
    Highcharts.Pointer.prototype.reset = function() {
      return undefined;
    };
    /**
     * 高亮当前的数据点，并设置鼠标滑动状态及绘制十字准星线
     */
    Highcharts.Point.prototype.highlight = function(event) {
      this.onMouseOver(); // 显示鼠标激活标识
      // this.series.chart.tooltip.refresh(this); // 显示提示框
      this.series.chart.xAxis[0].drawCrosshair(event, this); // 显示十字准星线
    };
    this.resetMkPoint = this.resetMkPoint.bind(this);
    this.scroll = debounce(this.scroll.bind(this), 1000);
  }

  ngOnInit() {
    if (location.search.indexOf('?') > -1) {
      this.previewUrl = location.pathname + '&ipm=s';
    } else {
      this.previewUrl = location.pathname + '?ipm=s';
    }
    Highcharts.charts.length = 0; // 初始化global highchart物件
    if (location.search.indexOf('?debug') > -1) {
      this.isDebug = true;
    }
    if (location.search.indexOf('ipm=s') > -1) {
      this.isPrevieMode = true;
      this.brandIcon = '/assets/demo_logo.png';
    }
    if (location.pathname.indexOf('/dashboard/activity/') > -1) {
      this.isPortal = false;
    } else {
      this.isPortal = true;
    }
    const fieldId = this.route.snapshot.paramMap.get('fileId');
    this.progressRef = this.ngProgress.ref();

    // 從hid得到token後，讓使用者不用登入即可觀看個人運動詳細資料（待實做hid encode/decode）-Kidin-1081024
    if (this.route.snapshot.queryParamMap.get('hid') === null) {
      this.token = this.utils.getToken();
    } else {
      this.token = this.route.snapshot.queryParamMap.get('hid');
    }

    this.getInfo(fieldId);
    this.activityOtherDetailsService.getOtherInfo().subscribe(res => {
      if (res) {
        this.isOtherDetailLoading = false;
        this.isLoadedOtherDetail = true;
        this.deviceInfo = res['deviceInfo'];
        if (res['groupInfo']) {
          this.classInfo = res['groupInfo'].info;
          this.classInfo.groupIcon =
            this.classInfo.groupIcon && this.classInfo.groupIcon.length > 0
              ? this.utils.buildBase64ImgString(this.classInfo.groupIcon)
              : '/assets/images/group-default.svg';
          const groupIcon = new Image();
          groupIcon.src = this.classInfo.groupIcon;
          this.classInfo.groupIconClassName =
            groupIcon.width > groupIcon.height
              ? 'user-photo--landscape'
              : 'user-photo--portrait';
          this.handleLessonInfo(this.classInfo.groupDesc);
          // this.brandIcon = this.utils.buildBase64ImgString(
          //   this.classInfo.groupRootInfo[2].brandIcon
          // );
          this.brandName = this.classInfo.groupRootInfo[2].brandName;
        }
        if (res['coachInfo']) {
          this.coachInfo = res['coachInfo'].info;
          this.coachInfo.coachAvatar =
            this.coachInfo.nameIcon && this.coachInfo.nameIcon.length > 0
              ? this.utils.buildBase64ImgString(this.coachInfo.nameIcon)
              : '/assets/images/user.png';
          this.handleCoachInfo(this.coachInfo.description);
        }

        window.removeEventListener('scroll', this.scroll, true);
      }
    });
    window.addEventListener('scroll', this.scroll, true);
  }
  scroll(e) {
    let coachId, groupId;
    let scrollTop = null, clientHeight = null, scrollHeight = null;
    if (e.target.scrollingElement) {
      scrollTop = e.target.scrollingElement.scrollTop;
      clientHeight = e.target.scrollingElement.clientHeight;
      scrollHeight = e.target.scrollingElement.scrollHeight;
    } else {
      scrollTop = e.target.scrollTop;
      clientHeight = e.target.clientHeight;
      scrollHeight = e.target.scrollHeight;
    }
    if (
      scrollTop + clientHeight >=
      scrollHeight - 100
    ) {
      if (this.fileInfo.teacher) {
        coachId = this.fileInfo.teacher.split('?userId=')[1];
      }
      if (this.fileInfo.class) {
        groupId = this.fileInfo.class.split('?groupId=')[1];
      }
      if (
        !this.isLoadedOtherDetail &&
        ((this.fileInfo.equipmentSN && this.fileInfo.equipmentSN.length > 0)
        || coachId || groupId)
      ) {
        this.activityOtherDetailsService.fetchOtherDetail(
          this.fileInfo.equipmentSN,
          coachId,
          groupId
        );
        this.isOtherDetailLoading = true;
      }
    }
  }
  ngAfterViewInit() {}
  ngOnDestroy() {
    if (!this.isShowNoRight && !this.isFileIDNotExist) {
      Highcharts.charts.forEach((_highChart, idx) => {
        if (_highChart !== undefined) {
          _highChart.destroy();
        }
      });
    }
    this.activityOtherDetailsService.resetOtherInfo();
  }
  handleLessonInfo(str) {
    this.totalLessonInfo = str.replace(/\r\n|\n/g, '').trim();
    if (this.totalLessonInfo.length > 118) {
      this.lessonInfo = this.totalLessonInfo.substring(0, 118);
      this.isLessonMoreDisplay = true;
    } else {
      this.lessonInfo = this.totalLessonInfo;
      this.isLessonMoreDisplay = false;
    }
  }
  handleCoachInfo(str) {
    this.totalCoachDesc = str.replace(/\r\n|\n/g, '').trim();
    if (this.totalCoachDesc.length > 118) {
      this.coachDesc = this.totalCoachDesc.substring(0, 118);
      this.isCoachMoreDisplay = true;
    } else {
      this.coachDesc = this.totalCoachDesc;
      this.isCoachMoreDisplay = false;
    }
  }
  handleExtendCoachInfo(type) {
    if (type === 1) {
      this.coachDesc = this.totalCoachDesc;
      this.isCoachMoreDisplay = false;
    } else {
      this.lessonInfo = this.totalLessonInfo;
      this.isLessonMoreDisplay = false;
    }
  }
  handleBMap() {
    this.bmap = new BMap.Map(this.bmapElement.nativeElement);
    let isNormalPoint = false;
    const originRealIdx = [];
    this.activityPoints.forEach((_point, idx) => {
      if (+_point.latitudeDegrees === 100 && +_point.longitudeDegrees === 100) {
        isNormalPoint = false;
        //this.gpxBmapPoints.push(null);
      } else {
        if (!isNormalPoint) {
          isNormalPoint = true;
          originRealIdx.push(idx);
        }
        let p;
        if (this.isInChinaArea) {
          const transformPoint = transform(
            [
              parseFloat(_point.longitudeDegrees),
              parseFloat(_point.latitudeDegrees)
            ],
            WGS84,
            BD09
          );
          p = new BMap.Point(transformPoint[0], transformPoint[1]);
        } else {
          p = new BMap.Point(
            parseFloat(_point.longitudeDegrees),
            parseFloat(_point.latitudeDegrees)
          );
        }
        this.gpxBmapPoints.push(p);
      }
    });
    this.gpxBmapPoints = this.gpxBmapPoints.map((_gpxPoint, idx) => {
      if (!_gpxPoint) {
        const index = originRealIdx.findIndex(_tip => _tip > idx);
        if (index === -1) {
          return this.gpxBmapPoints[originRealIdx[originRealIdx.length - 1]];
        }
        return this.gpxBmapPoints[originRealIdx[index]];
      }
      return _gpxPoint;
    });
    const polyline = new BMap.Polyline(this.gpxBmapPoints); // 创建折线
    this.bmap.centerAndZoom(
      this.gpxBmapPoints[this.gpxBmapPoints.length - 1],
      16
    );

    this.bmap.enableScrollWheelZoom(true);
    const startIcon = new BMap.Icon(
      '/assets/map_marker_start.svg',
      new BMap.Size(33, 50),
      {
        anchor: new BMap.Size(16, 50)
      }
    );
    const startBMK = new BMap.Marker(this.gpxBmapPoints[0], {
      icon: startIcon
    });
    const endIcon = new BMap.Icon(
      '/assets/map_marker_end.svg',
      new BMap.Size(33, 50),
      {
        anchor: new BMap.Size(16, 50)
      }
    );
    const endBMK = new BMap.Marker(
      this.gpxBmapPoints[this.gpxBmapPoints.length - 1],
      {
        icon: endIcon
      }
    );
    const playIcon = new BMap.Icon(
      '/assets/map_marker_player.svg',
      new BMap.Size(12, 12),
      {
        anchor: new BMap.Size(6, 12)
      }
    );
    this.playBMK = new BMap.Marker(this.gpxBmapPoints[0], {
      icon: playIcon
    });
    this.bmap.addOverlay(startBMK);
    this.bmap.addOverlay(endBMK);
    this.bmap.addOverlay(this.playBMK);

    this.bmap.addOverlay(polyline); // 将折线覆盖到地图上
  }
  handleBorderData(point, vs) {
    const x = point[0],
      y = point[1];
    let inside = false;

    for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
      const xi = vs[i][0],
        yi = vs[i][1];
      const xj = vs[j][0],
        yj = vs[j][1];
      const intersect =
        yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;

      if (intersect) {
        inside = !inside;
      }
    }
    return inside;
  }
  handleGoogleMap(isInTaiwan) {
    const mapProp = {
      center: new google.maps.LatLng(24.123499, 120.66014),
      zoom: 18,
      mapTypeId: google.maps.MapTypeId.ROADMAP
    };
    this.map = new google.maps.Map(this.gmapElement.nativeElement, mapProp);
    const bounds = new google.maps.LatLngBounds();
    let isNormalPoint = false;
    const originRealIdx = [];
    this.activityPoints.forEach((_point, idx) => {
      if (+_point.latitudeDegrees === 100 && +_point.longitudeDegrees === 100) {
        isNormalPoint = false;
        //this.gpxPoints.push(null);
      } else {
        if (!isNormalPoint) {
          isNormalPoint = true;
          originRealIdx.push(idx);
        }
        let p;
        if (this.isInChinaArea && !isInTaiwan) {
          const _transformPoint = transform(
            [
              parseFloat(_point.longitudeDegrees),
              parseFloat(_point.latitudeDegrees)
            ],
            WGS84,
            GCJ02
          );
          p = new google.maps.LatLng(_transformPoint[1], _transformPoint[0]);
        } else {
          p = new google.maps.LatLng(
            parseFloat(_point.latitudeDegrees),
            parseFloat(_point.longitudeDegrees)
          );
        }
        this.gpxPoints.push(p);
      }
    });
    this.gpxPoints = this.gpxPoints.map((_gpxPoint, idx) => {
      if (!_gpxPoint) {
        const index = originRealIdx.findIndex(_tip => _tip > idx);
        if (index === -1) {
          bounds.extend(
            this.gpxPoints[originRealIdx[originRealIdx.length - 1]]
          );
          return this.gpxPoints[originRealIdx[originRealIdx.length - 1]];
        }
        bounds.extend(this.gpxPoints[originRealIdx[index]]);
        return this.gpxPoints[originRealIdx[index]];
      }
      bounds.extend(_gpxPoint);
      return _gpxPoint;
    });
    this.startMark = new google.maps.Marker({
      position: this.gpxPoints[0],
      title: 'start point',
      icon: '/assets/map_marker_start.svg'
    });
    this.startMark.setMap(this.map);
    this.endMark = new google.maps.Marker({
      position: this.gpxPoints[this.gpxPoints.length - 1],
      title: 'end point',
      icon: '/assets/map_marker_end.svg'
    });
    this.endMark.setMap(this.map);
    this.playerMark = new google.maps.Marker({
      position: this.gpxPoints[0],
      icon: '/assets/map_marker_player.svg'
    });
    this.playerMark.setMap(this.map);
    const poly = new google.maps.Polyline({
      path: this.gpxPoints,
      strokeColor: '#FF00AA',
      strokeOpacity: 0.7,
      strokeWeight: 4
    });
    poly.setMap(this.map);
    this.map.fitBounds(bounds);
  }
  resetMkPoint(points, i) {
    this.playerMark.setPosition(points[i]);
    if (i < points.length) {
      this.isPlayingGpx = true;
      this.playerTimer = setTimeout(() => {
        i++;
        this.stopPointIdx++;
        this.resetMkPoint(points, i);
      }, 50);
    } else {
      this.stopPointIdx = 0;
      this.isPlayingGpx = false;
      this.playerMark.setPosition(points[0]);
    }
  }
  playGpx() {
    if (this.stopPointIdx > 0) {
      this.resetMkPoint(this.gpxPoints, this.stopPointIdx);
    } else {
      this.resetMkPoint(this.gpxPoints, 0);
    }
  }
  stopPlayGpx() {
    this.isPlayingGpx = false;
    clearTimeout(this.playerTimer);
  }
  handleMapKind(e) {
    this.mapKind = e.value;
  }
  getInfo(id) {
    this.isLoading = true;

    this.progressRef.start();
    const body = {
      token: this.token,
      fileId: id
    };
    if (this.isDebug) {
      body['debug'] = this.isDebug.toString();
    }
    this.activityService.fetchSportListDetail(body).subscribe(res => {
      //取得regionCode判斷操作是否位於大陸地區，為大陸地區一律使用百度地圖開啓 ex.zh-tw, zh-cn, en-us..
      const regionCode = this.utils.getLocalStorageObject('locale');
      this.activityInfo = res.activityInfoLayer;
      if (res.resultCode === 401 && res.resultCode === 402) {
        this.isShowNoRight = true;
        this.isLoading = false;
        this.progressRef.complete();
        return;
      }
      if (res.resultCode === 400) {
        this.isFileIDNotExist = true;
        return this.router.navigateByUrl('/404');
      }
      this.isShowNoRight = false;
      this.handleLapColumns();
      this.activityPoints = res.activityPointLayer;
      this.isInChinaArea = false;
      let isInTaiwan = false;
      let isSomeGpsPoint = false;
      this.activityPoints.forEach(_point => {
        if (
          this.handleBorderData(
            [+_point.longitudeDegrees, +_point.latitudeDegrees],
            taiwanBorderData
          )
        ) {
          isInTaiwan = true;
        }
        if (
          this.handleBorderData(
            [+_point.longitudeDegrees, +_point.latitudeDegrees],
            chinaBorderData
          )
        ) {
          this.isInChinaArea = true;
        }
        if (
          _point.hasOwnProperty('latitudeDegrees') &&
          +_point.latitudeDegrees !== 100 &&
          _point.latitudeDegrees &&
          !isSomeGpsPoint
        ) {
          isSomeGpsPoint = true;
        }
      });
      if (isSomeGpsPoint) {
        this.isShowMap = true;
      } else {
        this.isShowMap = false;
      }
      if (this.isShowMap) {
        if (regionCode === "zh-cn") {
          this.mapKind = '2';
          this.isHideMapRadioBtn = true;
          this.handleBMap();
        } else {
          if (!this.isInChinaArea || isInTaiwan) {
            this.mapKind = '1';
            // this.handleGoogleMap();
          } else {
            this.mapKind = '2';
            //this.isHideMapRadioBtn = true;
          }
          this.handleGoogleMap(isInTaiwan);
          this.handleBMap();
        }
      }
      this.dataSource.data = res.activityLapLayer;
      this.fileInfo = res.fileInfo;
      if (location.search.indexOf('ipm=s') > -1) {
        // this.isPrevieMode = true;
        this.isLoadedOtherDetail = true;
        let coachId, groupId;
        if (this.fileInfo.teacher) {
          coachId = this.fileInfo.teacher.split('?userId=')[1];
        }
        if (this.fileInfo.class) {
          groupId = this.fileInfo.class.split('?groupId=')[1];
        }
        this.activityOtherDetailsService.fetchOtherDetail(
          this.fileInfo.equipmentSN,
          coachId,
          groupId
        );
        this.isOtherDetailLoading = true;
      }
      if (this.fileInfo.author.indexOf('?') > -1) {
        // 防止後續author會帶更多參數，先不寫死
        this.userLink.userName = this.fileInfo.author.split('?')[0];
        this.userLink.userId = this.fileInfo.author
          .split('?')[1]
          .split('=')[1]
          .replace(')', '');
      }
      this.infoDate = this.handleDate(this.activityInfo.startTime);
      this.printFileDate = moment(this.activityInfo.startTime).format(
        'YYYY/MM/DD HH:mm'
      );
      this.totalSecond = this.activityInfo.totalSecond;
      this.resolutionSeconds = +this.totalSecond / this.activityPoints.length;
      this.initHchart();
      this.progressRef.complete();
      this.isLoading = false;
    });
  }
  handleLapColumns() {
    const sportType = this.activityInfo.type;
    switch (sportType) {
      case '1':
        this.displayedColumns = [
          'lapIndex',
          'status',
          'heartRate',
          'speed',
          'distance'
        ];
        break;
      case '2':
        this.displayedColumns = [
          'lapIndex',
          'status',
          'heartRate',
          'speed',
          'distance'
        ];
        break;
      case '3':
        this.displayedColumns = [
          'lapIndex',
          'status',
          'dispName',
          'totalRepo',
          'totalWeight',
          'cadence'
        ];
        break;
      case '4':
        this.displayedColumns = [
          'lapIndex',
          'status',
          'dispName',
          'cadence',
          'totalRepo',
          'speed'
        ];
        break;
      case '5':
        this.displayedColumns = ['lapIndex', 'status', 'heartRate'];
        break;
      case '6':
        this.displayedColumns = [
          'lapIndex',
          'status',
          'cadence',
          'totalRepo',
          'speed'
        ];
        break;
    }
  }
  handleDate(dateStr) {
    const arr = dateStr.split('T');
    const dateArr = arr[0].split('');
    let time = '';
    if (arr[1].indexOf('.') > -1) {
      time = arr[1].split('.')[0];
    } else {
      time = arr[1].split('+')[0];
    }
    const date =
      dateArr[0] +
      dateArr[1] +
      dateArr[2] +
      dateArr[3] +
      '/' +
      dateArr[5] +
      dateArr[6] +
      '/' +
      dateArr[8] +
      dateArr[9] +
      ' @ ' +
      time;
    return date;
  }
  handleSynchronizedPoint(e, finalDatas) {
    // Do something with 'event'
    for (let i = 0; i < Highcharts.charts.length; i = i + 1) {
      const _chart: any = Highcharts.charts[i];
      if (_chart !== undefined) {
        if (finalDatas[i].isSyncExtremes) {
          const event = _chart.pointer.normalize(e); // Find coordinates within the chart
          const point = _chart.series[0].searchPoint(event, true); // Get the hovered point
          if (point && point.index) {
            if (this.isShowMap && !this.isPlayingGpx) {
              if (this.mapKind === '1') {
                this.playerMark.setPosition(this.gpxPoints[point.index]);
              }
              if (this.mapKind === '2') {
                this.playBMK.setPosition(this.gpxBmapPoints[point.index]);
              }
              this.stopPointIdx = point.index;
            }
            point.highlight(e);
          }
        }
      }
    }
  }
  initHchart() {
    const hrFormatData = {
      userAge: null,
      userMaxHR: null,
      userRestHR: null,
      userHRBase: null
    };
    if (this.activityInfo.type !== '4') {
      this.userInfoService.getUserAge().subscribe(res => {
        hrFormatData.userAge = res;
      });
      this.userInfoService.getUserMaxHR().subscribe(res => {
        hrFormatData.userMaxHR = res;
      });
      this.userInfoService.getUserRestHR().subscribe(res => {
        hrFormatData.userRestHR = res;
      });
      this.userInfoService.getUserHRBase().subscribe(res => {
        hrFormatData.userHRBase = res;
      });
    }
    const { finalDatas, chartTargets } = this.activityService.handlePoints(
      this.activityPoints,
      this.activityInfo.type,
      this.resolutionSeconds,
      hrFormatData,
      this.isDebug
    );
    this.finalDatas = finalDatas;

    this.finalDatas.forEach((_option, idx) => {
      this[`is${chartTargets[idx]}Display`] = true;
      _option[
        chartTargets[idx]
      ].xAxis.events.setExtremes = this.syncExtremes.bind(
        this,
        idx,
        finalDatas
      );
      this.charts[idx] = chart(
        this[chartTargets[idx]].nativeElement,
        _option[chartTargets[idx]]
      );
    });
    this.isInitialChartDone = true;

    this.renderer.listen(this.container.nativeElement, 'mousemove', e =>
      this.handleSynchronizedPoint(e, finalDatas)
    );
    this.renderer.listen(this.container.nativeElement, 'touchmove', e =>
      this.handleSynchronizedPoint(e, finalDatas)
    );
    this.renderer.listen(this.container.nativeElement, 'touchstart', e =>
      this.handleSynchronizedPoint(e, finalDatas)
    );
  }
  syncExtremes(num, finalDatas, e) {
    // 調整縮放會同步
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
  goToProfile() {
    this.router.navigateByUrl(
      `/user-profile/${this.hashIdService.handleUserIdEncode(
        this.userLink.userId
      )}`
    );
  }
  goBack() {
    window.history.back();
  }
  print() {
    window.print();
  }
}
