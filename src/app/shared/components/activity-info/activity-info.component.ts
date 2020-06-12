import {
  Component,
  OnInit,
  AfterViewInit,
  ViewChild,
  ElementRef,
  Renderer2,
  OnDestroy,
  ViewEncapsulation,
  ChangeDetectorRef,
  Output
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
import { MuscleMapComponent } from './muscleMap/muscle-map.component';
import { MessageBoxComponent } from '@shared/components/message-box/message-box.component';
import { MuscleTrainListComponent } from './muscle-train-list/muscle-train-list.component';
import { transform, WGS84, BD09, GCJ02 } from 'gcoord';
import { HashIdService } from '@shared/services/hash-id.service';
import { TranslateService } from '@ngx-translate/core';
import chinaBorderData from './border-data_china';
import taiwanBorderData from './border-data_taiwan';
import { ActivityOtherDetailsService } from '@shared/services/activity-other-details.service';
import { debounce } from '@shared/utils/';
import * as moment from 'moment';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material';

const Highcharts: any = _Highcharts; // 不檢查highchart型態
declare var google: any;
declare var BMap: any;

@Component({
  selector: 'app-activity-info',
  templateUrl: './activity-info.component.html',
  styleUrls: [
    './activity-info.component.scss',
    '../../../containers/dashboard/components/coach-dashboard/coach-dashboard.component.scss'
  ],
  encapsulation: ViewEncapsulation.None
})
export class ActivityInfoComponent implements OnInit, AfterViewInit, OnDestroy {
  dataSource = new MatTableDataSource<any>();
  displayedColumns: string[] = [
    'status-lapIndex',
    'heartRate',
    'speed',
    'distance'
  ];
  editNameMode = false;
  activityName = '';
  activityNameBeforeState = '';
  fileId = '';
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
  @ViewChild('muscleMap')
  muscleMap: MuscleMapComponent;
  @ViewChild('muscleTrainList')
  muscleTrainList: MuscleTrainListComponent;

  isspeedChartTargetDisplay = false;
  iselevationChartTargetDisplay = false;
  ishrChartTargetDisplay = false;
  iscadenceChartTargetDisplay = false;
  ispaceChartTargetDisplay = false;
  istempChartTargetDisplay = false;
  iszoneChartTargetDisplay = false;
  iswattChartTargetDisplay = false;

  proficiency = 'metacarpus';  // 使用者重訓熟練度設定(預設進階者)-kidin-1081122
  activityInfo: any;
  fileInfo: any;
  infoDate: string;
  activityPoints: any;
  activityLaps: any;
  isLoading = false;
  token = '';
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
  chartKind = 'lineChart';
  chartKindBeforeState = 'lineChart';  // 此參數用來記錄chartKind之前狀態-kidin-1081112
  xaxisUnit = 'time';
  xaxisUnitBeforeState = 'time';  // 此參數用來記錄xaxisUnit之前狀態-kidin-1081112
  segUnit = '60';
  segRange: any;
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
  dataLoading = true;
  passLogin = false;  // 儲存是否為免登狀態-kidin-1081121
  hideButton = false; // 隱藏預覽列印和返回兩個按鈕-kidin-1081024
  deviceImgUrl: string;
  loginId: number;

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
    private activityOtherDetailsService: ActivityOtherDetailsService,
    private translate: TranslateService,
    private dialog: MatDialog,
    private snackbar: MatSnackBar,
    private _changeDetectionRef: ChangeDetectorRef
  ) {
    /**
     * 重寫內部的方法， 這裡是將提示框即十字準星的隱藏函數關閉
     */
    Highcharts.Pointer.prototype.reset = function() {
      return undefined;
    };
    /**
     * 聚焦當前的數據點，並設置滑鼠滑動狀態及繪製十字準星線
     */
    Highcharts.Point.prototype.highlight = function(event) {
      this.onMouseOver(); // 顯示滑鼠啟動標示
      // this.series.chart.tooltip.refresh(this); // 顯示提示框
      this.series.chart.xAxis[0].drawCrosshair(event, this); // 顯示十字準星线
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
    this.fileId = fieldId;
    this.progressRef = this.ngProgress.ref();

    // 從hid得到token後，讓使用者不用登入即可觀看個人運動詳細資料，並隱藏預覽列印和返回按鈕（待實做hid encode/decode）-Kidin-1081024
    if (this.route.snapshot.queryParamMap.get('hid') === null) {
      this.token = this.utils.getToken() || '';
    } else {
      this.token = this.route.snapshot.queryParamMap.get('hid');
      this.passLogin = true;
      if (this.route.snapshot.queryParamMap.get('navbar') === '0') {
        this.hideButton = true;
      }
    }

    this.getInfo(fieldId);
    this.activityOtherDetailsService.getOtherInfo().subscribe(res => {
      if (res) {
        this.isOtherDetailLoading = false;
        this.isLoadedOtherDetail = true;
        this.deviceInfo = res['deviceInfo'].info.productInfo[0];

        if (this.deviceInfo && location.hostname === '192.168.1.235') {
          this.deviceImgUrl = `http://app.alatech.com.tw/app/public_html/products${this.deviceInfo.modelImg}`;
        } else if (this.deviceInfo) {
          this.deviceImgUrl = `http://${location.hostname}/app/public_html/products${this.deviceInfo.modelImg}`;
        }

        if (this.classInfo) {
          this.classInfo = res['groupInfo'].info;
          this.classInfo.groupIcon =
            this.classInfo.groupIcon && this.classInfo.groupIcon.length > 0
              ? this.classInfo.groupIcon
              : '/assets/images/group-default.svg';
          const groupIcon = new Image();
          groupIcon.src = this.classInfo.groupIcon;
          this.classInfo.groupIconClassName =
            groupIcon.width > groupIcon.height
              ? 'user-photo--landscape'
              : 'user-photo--portrait';
          this.handleLessonInfo(this.classInfo.groupDesc);
          // this.brandIcon = this.classInfo.groupRootInfo[2].brandIcon
          this.brandName = this.classInfo.groupRootInfo[2].brandName;
        }
        if (res['coachInfo']) {
          this.coachInfo = res['coachInfo'].info;
          this.coachInfo.coachAvatar =
            this.coachInfo.nameIcon && this.coachInfo.nameIcon.length > 0
              ? this.coachInfo.nameIcon
              : '/assets/images/user.png';
          this.handleCoachInfo(this.coachInfo.description);
        }

        window.removeEventListener('scroll', this.scroll, true);
      }
    });
    window.addEventListener('scroll', this.scroll, true);
  }
  // 觸發變更偵測來使選單狀態同步，解決此頁面在免登模式出現的angular錯誤訊息-kidin-1081118
  ngAfterContentChecked() {
    this._changeDetectionRef.detectChanges();
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
        ((this.fileInfo.equipmentSN && this.fileInfo.equipmentSN.length > 0 && this.fileInfo.equipmentSN[0] !== '')
        || coachId || groupId)
      ) {
        const [sn] = this.fileInfo.equipmentSN;
        this.activityOtherDetailsService.fetchOtherDetail(
          sn,
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
    if (this.totalLessonInfo.length > 40) {
      this.lessonInfo = this.totalLessonInfo.substring(0, 40);
      this.isLessonMoreDisplay = true;
    } else {
      this.lessonInfo = this.totalLessonInfo;
      this.isLessonMoreDisplay = false;
    }
  }

  handleCoachInfo(str) {
    this.totalCoachDesc = str.replace(/\r\n|\n/g, '').trim();
    if (this.totalCoachDesc.length > 40) {
      this.coachDesc = this.totalCoachDesc.substring(0, 40);
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
    let isNormalPoint = false,
        fillData = null;
    const originRealIdx = [];
    this.activityPoints.forEach((_point, idx) => {
      if (fillData === null
        && (+_point.latitudeDegrees === 100 && +_point.longitudeDegrees === 100)
        || (_point.latitudeDegrees === null && _point.longitudeDegrees === null)
      ) {
        isNormalPoint = false;
        this.gpxBmapPoints.push(null);  // 若使用者沒有移動，則在該點補上null值-kidin-1081203(Bug 337)
      } else if ((+_point.latitudeDegrees === 100 && +_point.longitudeDegrees === 100)
      || (_point.latitudeDegrees === null && _point.longitudeDegrees === null)) {
        isNormalPoint = false;
        this.gpxPoints.push(fillData);
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
        fillData = p;
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
      gestureHandling: 'cooperative', // 可以讓使用者在手機環境下使用單止滑頁面，雙指滑地圖-kidin-1081025
      mapTypeId: google.maps.MapTypeId.ROADMAP
    };
    this.map = new google.maps.Map(this.gmapElement.nativeElement, mapProp);
    const bounds = new google.maps.LatLngBounds();
    let isNormalPoint = false,
        fillData = null;
    const originRealIdx = [];

    // 若使用者沒有移動，則在該點補上null值或填補值-kidin-1081203(Bug 337)(Bug 1141)
    this.activityPoints.forEach((_point, idx) => {
      if (fillData === null
        && ((+_point.latitudeDegrees === 100 && +_point.longitudeDegrees === 100)
        || (_point.latitudeDegrees === null && _point.longitudeDegrees === null))
      ) {
        isNormalPoint = false;
        this.gpxPoints.push(null);
      } else if ((+_point.latitudeDegrees === 100 && +_point.longitudeDegrees === 100)
      || (_point.latitudeDegrees === null && _point.longitudeDegrees === null)) {
        isNormalPoint = false;
        this.gpxPoints.push(fillData);
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
        fillData = p;
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
    // 起始點mark
    this.startMark = new google.maps.Marker({
      position: this.gpxPoints[0],
      title: 'start point',
      icon: '/assets/map_marker_start.svg'
    });
    this.startMark.setMap(this.map);
    // 結束點mark
    this.endMark = new google.maps.Marker({
      position: this.gpxPoints[this.gpxPoints.length - 1],
      title: 'end point',
      icon: '/assets/map_marker_end.svg'
    });
    this.endMark.setMap(this.map);
    // 行進點mark
    this.playerMark = new google.maps.Marker({
      position: this.gpxPoints[0],
      icon: '/assets/map_marker_player.svg'
    });
    this.playerMark.setMap(this.map);
    // 路徑
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

  // 根據重訓熟練度重繪肌肉地圖-kidin-1081114
  handleproficiency(e) {
    this.proficiency = e.value;
    this.activityService.saveproficiency(this.proficiency);
    this.muscleMap.initMuscleMap();
    this.muscleTrainList.initMuscleList();
  }

  // 使用者點擊後重繪肌肉地圖--kidin-1081129
  reRenderMuscleMap() {
    this.muscleMap.initMuscleMap();
    this.muscleTrainList.initMuscleList();
  }

  // 判斷圖表類型、x軸參考單位、分段範圍後重繪圖表-kidin-1081114
  handleChartKind(e) {
    // 一旦切換圖表類型或X軸參考單位，就將分段單位切回預設-kidin-1081114
    if (this.chartKind !== this.chartKindBeforeState) {
      if (this.chartKind === 'lineChart') {
        this.segUnit = 'normal';
      } else {
        if (this.xaxisUnit === 'time') {
          this.segUnit = '60s';
        } else {
          this.segUnit = '100m';
        }
      }
      this.chartKindBeforeState = this.chartKind;
    }
    if (this.xaxisUnit !== this.xaxisUnitBeforeState) {
      if (this.chartKind === 'lineChart') {
        this.segUnit = 'normal';
      } else {
        if (this.xaxisUnit === 'time') {
          this.segUnit = '60s';
        } else {
          this.segUnit = '100m';
        }
      }
      this.xaxisUnitBeforeState = this.xaxisUnit;
    }
    switch (this.segUnit) {
      case '60s' :
        this.segRange = 60000;
        break;
      case '300s' :
        this.segRange = 300000;
        break;
      case '600s' :
        this.segRange = 600000;
        break;
      case '1800s' :
        this.segRange = 1800000;
        break;
      case '100m' :
        this.segRange = 100;
        break;
      case '500m' :
        this.segRange = 500;
        break;
      case '1km' :
        this.segRange = 1000;
        break;
      case '10km' :
        this.segRange = 10000;
        break;
      case 'deviceLap' :
        this.segRange = 'deviceLap';  // 先預埋裝置分段顯示-kidin-1081113
        break;
      default :
        this.segRange = 'normal'; // 先預埋常態分佈顯示-kidin-1081113
        break;
    }
    Highcharts.charts.length = 0;  // 初始化global highchart物件，可避免HighCharts.Charts為 undefined -kidin-1081112
    this.initHchart();
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
    this.activityService.fetchSportListDetail(body).toPromise()
      .then(res => {
        // 針對無該運動紀錄會無權限閱覽給予不同回應-kidin-1081203(Bug 940)
        if (res.resultCode === 400) {
          this.isFileIDNotExist = true;
          return this.router.navigateByUrl('/404');
        } else if (res.resultCode === 403) {
          return this.router.navigateByUrl('/403');
        }
        this.activityInfo = res.activityInfoLayer;
        this.activityName = res.fileInfo.dispName;
        this.activityNameBeforeState = res.fileInfo.dispName;
        if (this.activityInfo.type === '3') {
          this.saveWeightTrainingData(res.activityInfoLayer);
        }
        if (res.resultCode === 401 || res.resultCode === 402) {
          this.isShowNoRight = true;
          this.isLoading = false;
          this.progressRef.complete();
          return;
        }
        this.isShowNoRight = false;
        this.handleLapColumns();
        this.activityPoints = res.activityPointLayer;
        this.activityLaps = res.activityLapLayer;
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
          // 判斷google map是否可以載入，如不行就使用百度地圖並隱藏切換鈕-kidin-1081203
          if ('google' in window && typeof google === 'object' && typeof google.maps === 'object') {
            if (!this.isInChinaArea || isInTaiwan) {
              this.mapKind = '1';
              this.handleGoogleMap(isInTaiwan);
            } else {
              this.mapKind = '2';
            }
          } else {
            this.mapKind = '2';
            this.isHideMapRadioBtn = true;
          }
          this.handleBMap();
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
          const [sn] = this.fileInfo.equipmentSN;
          this.activityOtherDetailsService.fetchOtherDetail(
            sn,
            coachId,
            groupId
          );
          this.isOtherDetailLoading = true;
        }
        if (this.fileInfo.author && this.fileInfo.author.indexOf('?') > -1) {
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
        this.resolutionSeconds = this.activityInfo.resolutionSeconds;  // 修正心率區間秒數與APP有落差-kidin-1081212(Bug 985)
        this.initHchart();
        this.progressRef.complete();
        this.isLoading = false;
      });
  }

  // 將user體重另外存取以提供給肌肉地圖使用-kidin-1081121
  saveWeightTrainingData(data) {
      const body = {
        token: this.token,
        avatarType: 2,
        iconType: '2',
      };
      this.userInfoService.getLogonData(body).toPromise()
        .then(res => {
          if (res.resultCode !== 400) {
            const weight = res.info.weight;
            this.activityService.saveUserWeight(weight);
          }
          this.activityService.saveLapsData(data);
          this.activityService.saveproficiency(this.proficiency);
          this.dataLoading = false;
        });
  }

  handleLapColumns() {  // case1:跑步 case2:腳踏車 case3:重訓 case4:游泳 case5:有氧 case6:划船
    const sportType = this.activityInfo.type;
    switch (sportType) {
      case '1':
        this.displayedColumns = [
          'status-lapIndex',
          'heartRate',
          'speed',
          'distance'
        ];
        break;
      case '2':
        this.displayedColumns = [
          'status-lapIndex',
          'heartRate',
          'speed',
          'distance'
        ];
        break;
      case '3':
        this.displayedColumns = [
          'status-lapIndex',
          'dispName',
          'totalRepo',
          'totalWeight',
          'cadence'
        ];
        break;
      case '4':
        this.displayedColumns = [
          'status-lapIndex',
          'dispName',
          'cadence',
          'totalRepo',
          'speed'
        ];
        break;
      case '5':
        this.displayedColumns = ['status-lapIndex', 'heartRate'];
        break;
      case '6':
        this.displayedColumns = [
          'status-lapIndex',
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

  // 滑動Hchart時，使地圖的點跟著移動
  handleSynchronizedPoint(e, finalDatas) {
    // 地圖移動以speed chart為基準-kidin-1081203(Bug 856)
    for (let i = 0; i < Highcharts.charts.length; i++) {
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
      userAge: 30,
      userMaxHR: 190,
      userRestHR: 60,
      userHRBase: 0
    };
    if (this.passLogin === true) {
      const body = {
        token: this.token,
        avatarType: 2,
        iconType: '2',
      };
      this.userInfoService.getLogonData(body).subscribe(res => {
        if (res.resultCode !== 400) {
          const birthday = res.info.birthday;
          hrFormatData.userAge = moment().diff(birthday, 'years');
          hrFormatData.userMaxHR = res.info.heartRateMax;
          hrFormatData.userRestHR = res.info.heartRateResting;
          hrFormatData.userHRBase = res.info.heartRateBase;
          this.createChart(hrFormatData);

          this.loginId = +res.info.nameId;  // 取得登入者id來確認是否為該運動檔案持有人-kidin-1090225
        }
      });
    } else {
      this.userInfoService.getUserAge().subscribe(res => {
        if (res !== null) {
          hrFormatData.userAge = res;
        }
      });
      this.userInfoService.getUserMaxHR().subscribe(res => {
        if (res !== null) {
          hrFormatData.userMaxHR = res;
        }
      });
      this.userInfoService.getUserRestHR().subscribe(res => {
        if (res !== null) {
          hrFormatData.userRestHR = res;
        }
      });
      this.userInfoService.getUserHRBase().subscribe(res => {
        if (res !== null) {
          hrFormatData.userHRBase = res;
        }
      });

      // 取得登入者id來確認是否為該運動檔案持有人-kidin-1090225
      this.userInfoService.getUserId().subscribe(res => {
        if (res !== null) {
          this.loginId = +res;
        }
      });

      this.createChart(hrFormatData);
    }
    this.passLogin = false;
  }

  // 從initHChart()分離出來的function-kidin-1081122
  createChart(hrFormatData) {
    const { finalDatas, chartTargets } = this.activityService.handleChartDatas(
      this.activityPoints,
      this.activityLaps,
      this.activityInfo,
      this.resolutionSeconds,
      hrFormatData,
      this.isDebug,
      this.chartKind,
      this.xaxisUnit,
      this.segRange
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

  // 開啟編輯活動檔案名稱模式-kidin-1081115
  editActivityName() {
    this.editNameMode = true;
  }

  // 關閉編輯活動檔案名稱模式-kidin-1090514
  cancelEdit () {
    this.editNameMode = false;
    this.activityName = this.activityNameBeforeState;
  }

  // 上傳新名稱-kidin-1081115
  handleNewProfileName(e, act) {
    if (((act === 'keypress' && e.key === 'Enter') || act === 'click') && this.activityName === this.activityNameBeforeState) {
      this.editNameMode = false;
    } else if (((act === 'keypress' && e.key === 'Enter') || act === 'click') && this.activityName === '') {
      this.activityName = this.activityNameBeforeState;
      this.editNameMode = false;
    } else if (((act === 'keypress' && e.key === 'Enter') || act === 'click') && this.activityName !== this.activityNameBeforeState) {
      const timeZoneMinite = new Date(),
            timeZone = -(timeZoneMinite.getTimezoneOffset() / 60),
            editDate = moment().format('YYYY-MM-DD'),
            editTime = moment().format('hh:mm:ss');

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

      // 補上傳編輯時間-kidin-1090131
      const body = {
        token: this.token,
        fileId: this.fileId,
        fileInfo: {
          dispName: this.activityName,
          editDate: `${editDate}T${editTime}${timeZoneStr}:00`
        }
      };
      this.activityService.fetchEditActivityProfile(body).subscribe(res => {
        if (res) {
          this.editNameMode = false;
        }
      });
    }
  }

  // 確認是否刪除運動檔案-kidin-1090428
  checkDeleteSportFile () {

    return this.dialog.open(MessageBoxComponent, {
      hasBackdrop: true,
      data: {
        title: 'Message',
        body: `${this.translate.instant(
          'Dashboard.privacySettings.file'
        )}${this.translate.instant(
          'Dashboard.Group.confirmDelete'
        )}`,
        confirmText: this.translate.instant(
          'other.confirm'
        ),
        cancelText: this.translate.instant(
          'SH.cancel'
        ),
        onCancel: () => {
          return false;
        },
        onConfirm: this.deleteSportFile.bind(this)
      }
    });

  }

  // 刪除運動檔案後導回運動列表-kidin-1090428
  deleteSportFile () {
    const body = {
      token: this.token,
      fileId: [this.fileId]
    };

    this.activityService.deleteActivityData(body).subscribe(res => {
      if (+res.resultCode === 200) {
        this.snackbar.open(
          `${this.translate.instant(
            'Dashboard.Group.delete'
          )}
          ${this.translate.instant(
            'Dashboard.MyDevice.success'
          )}`,
          'OK',
          { duration: 2000 }
        );

        setTimeout(() => {
          this.router.navigateByUrl('/dashboard/activity-list');
        }, 2000);
      } else {
        this.snackbar.open(
          `${this.translate.instant(
            'Dashboard.Group.delete'
          )}
          ${this.translate.instant(
            'Dashboard.MyDevice.failure'
          )}`,
          'OK',
          { duration: 2000 }
        );
      }
    });

  }

}
