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
import { transform, WGS84, BD09 } from 'gcoord';
import { HashIdService } from '@shared/services/hash-id.service';

const Highcharts: any = _Highcharts; // 不檢查highchart型態
declare var google: any;
declare var BMap: any;

@Component({
  selector: 'app-activity-info',
  templateUrl: './activity-info.component.html',
  styleUrls: ['./activity-info.component.css'],
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
  isOriginalMode = false;
  isInitialChartDone = false;
  charts = [];
  finalDatas: any;
  mapKind = '1'; // 1 google map,  2 baidu
  gpxBmapPoints = [];
  playBMK: any;
  constructor(
    private utils: UtilsService,
    private renderer: Renderer2,
    private activityService: ActivityService,
    private route: ActivatedRoute,
    private ngProgress: NgProgress,
    private globalEventsManager: GlobalEventsManager,
    private router: Router,
    private userInfoService: UserInfoService,
    private hashIdService: HashIdService
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
  }

  ngOnInit() {
    Highcharts.charts.length = 0; // 初始化global highchart物件
    if (location.search.indexOf('?original') > -1) {
      this.isOriginalMode = true;
    }
    if (location.pathname.indexOf('/dashboard/activity/') > -1) {
      this.isPortal = false;
    } else {
      this.isPortal = true;
    }
    const fieldId = this.route.snapshot.paramMap.get('fileId');
    this.progressRef = this.ngProgress.ref();
    this.token = this.utils.getToken();
    this.getInfo(fieldId);
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
  }
  handleBMap() {
    this.bmap = new BMap.Map(this.bmapElement.nativeElement);
    let isNormalPoint = false;
    const originRealIdx = [];
    // let count = 0;
    // let lonTotal = 0;
    // let latTotal = 0;
    this.activityPoints.forEach((_point, idx) => {
      if (+_point.latitudeDegrees === 100 && +_point.longitudeDegrees === 100) {
        isNormalPoint = false;
        this.gpxBmapPoints.push(null);
      } else {
        if (!isNormalPoint) {
          isNormalPoint = true;
          originRealIdx.push(idx);
        }
        const transformPoint = transform(
          [
            parseFloat(_point.longitudeDegrees),
            parseFloat(_point.latitudeDegrees)
          ],
          WGS84,
          BD09
        );
        const p = new BMap.Point(transformPoint[0], transformPoint[1]);
        this.gpxBmapPoints.push(p);
        // lonTotal = lonTotal + +_point.longitudeDegrees;
        // latTotal = latTotal + +_point.latitudeDegrees;
        // count++;
      }
    });
    // const centerPoint = new BMap.Point(lonTotal / count, latTotal / count);
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
      13
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
  handleGoogleMap() {
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
        this.gpxPoints.push(null);
      } else {
        if (!isNormalPoint) {
          isNormalPoint = true;
          originRealIdx.push(idx);
        }
        const p = new google.maps.LatLng(
          parseFloat(_point.latitudeDegrees),
          parseFloat(_point.longitudeDegrees)
        );
        // bounds.extend(p);
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
    this.activityService.fetchSportListDetail(body).subscribe(res => {
      this.activityInfo = res.activityInfoLayer;
      if (res.resultCode === 402) {
        this.isShowNoRight = true;
        this.isLoading = false;
        this.progressRef.complete();
        return;
      }
      if (res.resultCode === 401 || res.resultCode === 400) {
        this.isFileIDNotExist = true;
        return this.router.navigateByUrl('/404');
      }
      this.isShowNoRight = false;
      this.handleLapColumns();
      this.activityPoints = res.activityPointLayer;
      this.isShowMap = this.activityPoints.some(
        _point =>
          _point.hasOwnProperty('latitudeDegrees') &&
          +_point.latitudeDegrees !== 100
      );
      if (this.isShowMap) {
        this.handleGoogleMap();
        this.handleBMap();
      }
      this.dataSource.data = res.activityLapLayer;
      this.fileInfo = res.fileInfo;
      if (this.fileInfo.author.indexOf('?') > -1) {
        // 防止後續author會帶更多參數，先不寫死
        this.userLink.userName = this.fileInfo.author.split('?')[0];
        this.userLink.userId = this.fileInfo.author.split('?')[1].split('=')[1].replace(')', '');
      }
      this.infoDate = this.handleDate(this.activityInfo.startTime);
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
      '年' +
      ' ' +
      dateArr[5] +
      dateArr[6] +
      '月' +
      dateArr[8] +
      dateArr[9] +
      '日' +
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
              this.playerMark.setPosition(this.gpxPoints[point.index]);
              this.playBMK.setPosition(this.gpxBmapPoints[point.index]);
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
      hrFormatData
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
    this.router.navigateByUrl(`/user-profile/${this.hashIdService.handleUserIdEncode(this.userLink.userId)}`);
  }
  goBack() {
    window.history.back();
  }
}
