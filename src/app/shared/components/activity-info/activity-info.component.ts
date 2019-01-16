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

const Highcharts: any = _Highcharts; // 不檢查highchart型態

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

  isdisplayHcharts = true;
  chartLoading = false;
  basicLoading = false;
  rainLoading = false;

  seriesIdx = 0;
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
  constructor(
    private utils: UtilsService,
    private renderer: Renderer2,
    private activityService: ActivityService,
    private route: ActivatedRoute,
    private ngProgress: NgProgress,
    private globalEventsManager: GlobalEventsManager,
    private router: Router,
    private userInfoService: UserInfoService
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
    this.globalEventsManager.setFooterRWD(2); // 為了讓footer長高85px
    const fieldId = this.route.snapshot.paramMap.get('fileId');
    this.progressRef = this.ngProgress.ref();
    this.token = this.utils.getToken();
    this.getInfo(fieldId);
  }
  ngAfterViewInit() {
    // this.initHchart();
  }
  ngOnDestroy() {
    if (!this.isShowNoRight && !this.isFileIDNotExist) {
      Highcharts.charts.forEach((_highChart, idx) => {
        if (_highChart !== undefined) {
          _highChart.destroy();
        }
      });
    }
    this.globalEventsManager.setFooterRWD(0); // 為了讓footer自己變回去預設值
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
        this.globalEventsManager.setFooterRWD(0); // 為了讓footer自己變回去預設值
        this.isLoading = false;
        this.progressRef.complete();
        return;
      }
      if (res.resultCode === 401) {
        this.isFileIDNotExist = true;
        return this.router.navigateByUrl('/404');
      }
      this.isShowNoRight = false;
      this.handleLapColumns();
      this.activityPoints = res.activityPointLayer;
      this.dataSource.data = res.activityLapLayer;
      this.fileInfo = res.fileInfo;
      if (this.fileInfo.author.indexOf('?') > -1) {
        // 防止後續author會帶更多參數，先不寫死
        this.userLink.userName = this.fileInfo.author.split('?')[0];
        this.userLink.userId = this.fileInfo.author.split('?')[1].split('=')[1];
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
    this.router.navigateByUrl(`/user-profile/${this.userLink.userId}`);
  }
  goBack() {
    window.history.back();
  }
}
