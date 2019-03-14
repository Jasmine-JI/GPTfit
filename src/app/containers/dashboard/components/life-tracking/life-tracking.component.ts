import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  Renderer2,
  OnDestroy,
  ViewEncapsulation,
  Input,
  SimpleChanges,
  SimpleChange,
  OnChanges,
  AfterViewInit
} from '@angular/core';
import { LifeTrackingService } from '../../services/life-tracking.service';
import { UtilsService } from '@shared/services/utils.service';
import { NgProgress, NgProgressRef } from '@ngx-progressbar/core';
import { Router } from '@angular/router';
import { MatDatepickerInputEvent } from '@angular/material';
import { HashIdService } from '@shared/services/hash-id.service';
import * as moment from 'moment';
import { chart } from 'highcharts';
import * as _Highcharts from 'highcharts';
import * as _ from 'lodash';

// const highcharts: any = _.cloneDeep(_Highcharts); // 不檢查highchart型態
let Highcharts: any = _Highcharts; // 不檢查highchart型態

@Component({
  selector: 'app-life-tracking',
  templateUrl: './life-tracking.component.html',
  styleUrls: [
    './life-tracking.component.scss',
    '../../../../shared/components/activity-info/activity-info.component.css'
  ],
  encapsulation: ViewEncapsulation.None
})
export class LifeTrackingComponent
  implements OnInit, OnDestroy, OnChanges, AfterViewInit {
  @Input() lifeTrackingData: any;
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
  isShowNoRight = false;
  isLoading = false;
  progressRef: NgProgressRef;
  isFileIDNotExist = false;
  fileInfo: any;
  userLink = {
    userName: '',
    userId: null
  };
  infoDate: string;
  syncDate: string;
  editDate: string;
  lifeTrackingDayLayer: any;
  lifeTrackingPoints: any;
  finalDatas: any;
  charts = [];
  isInitialChartDone = false;
  @ViewChild('container')
  container: ElementRef;
  @ViewChild('activityChartTarget')
  activityChartTarget: ElementRef;
  @ViewChild('airPressureChartTarget')
  airPressureChartTarget: ElementRef;
  @ViewChild('elevChartTarget')
  elevChartTarget: ElementRef;
  @ViewChild('heartRateChartTarget')
  heartRateChartTarget: ElementRef;
  @ViewChild('stressChartTarget')
  stressChartTarget: ElementRef;
  @ViewChild('tempChartTarget')
  tempChartTarget: ElementRef;
  @ViewChild('totalActivityCaloriesChartTarget')
  totalActivityCaloriesChartTarget: ElementRef;
  @ViewChild('totalDistanceMetersChartTarget')
  totalDistanceMetersChartTarget: ElementRef;
  @ViewChild('totalElevGainChartTarget')
  totalElevGainChartTarget: ElementRef;
  @ViewChild('totalElevLossChartTarget')
  totalElevLossChartTarget: ElementRef;
  @ViewChild('totalLifeCaloriesChartTarget')
  totalLifeCaloriesChartTarget: ElementRef;
  @ViewChild('totalStepChartTarget')
  totalStepChartTarget: ElementRef;
  @ViewChild('wearingStatusChartTarget')
  wearingStatusChartTarget: ElementRef;
  isactivityChartTargetDisplay = false;
  isairPressureChartTargetDisplay = false;
  iselevChartTargetDisplay = false;
  isheartRateChartTargetDisplay = false;
  isstressChartTargetDisplay = false;
  istempChartTargetDisplay = false;
  istotalActivityCaloriesChartTargetDisplay = false;
  istotalDistanceMetersChartTargetDisplay = false;
  istotalElevGainChartTargetDisplay = false;
  istotalElevLossChartTargetDisplay = false;
  istotalLifeCaloriesChartTargetDisplay = false;
  istotalStepChartTargetDisplay = false;
  iswearingStatusChartTargetDisplay = false;

  filterStartTime = moment().format('YYYY-MM-DDT00:00:00.000+08:00');
  filterEndTime = moment().format('YYYY-MM-DDT23:59:59.000+08:00');

  isShowChart = true;
  chartTargets: any;
  isFirstTime = true;
  constructor(
    private lifeTrackingService: LifeTrackingService,
    private utils: UtilsService,
    private ngProgress: NgProgress,
    private hashIdService: HashIdService,
    private router: Router,
    private renderer: Renderer2
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
    Highcharts.Chart.prototype.updateFromData = function () {
      const _chart = this;
      if (_chart.options.data) {
        Highcharts.data({
          afterComplete: function (dataOptions) {
            Highcharts.each(dataOptions.series, function (series, i) {
              _chart.series[i].setData(series.data, false);
            });
            _chart.redraw();
          }
        },
          this.options);
      }
    };

  }

  ngOnInit() {
    this.progressRef = this.ngProgress.ref();
    // this.fetchTrackingDayDetail();
  }
  ngAfterViewInit() {
    this.fetchTrackingDayDetail();

  }
  // ngOnChanges(changes: SimpleChanges) {
  //   const currentItem: SimpleChange = changes.lifeTrackingData;
  //   if (
  //     !currentItem.firstChange &&
  //     currentItem.currentValue !== +currentItem.previousValue
  //   ) {
  //     this.fetchTrackingDayDetail();
  //   }
  // }
  search() {
    // this.unMountHChart();
    this.fetchTrackingDayDetail();
  }
  fetchTrackingDayDetail() {
    const body = {
      // token: this.utils.getToken(),
      token: '0d0ddafc410621067477c3cd3f2a7cbf',
      filterStartTime: this.filterStartTime,
      filterEndTime: this.filterEndTime
    };
    this.progressRef.start();
    this.lifeTrackingService.getTrackingDayDetail(body).subscribe(res => {
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
    this.fileInfo = res['trackingData'][0]['fileInfo'];
    this.lifeTrackingDayLayer = res['trackingData'][0][
      'lifeTrackingDayLayer'
    ];
    if (!this.utils.isObjectEmpty(this.fileInfo)) {
      if (this.fileInfo.author.indexOf('?') > -1) {
        // 防止後續author會帶更多參數，先不寫死
        this.userLink.userName = this.fileInfo.author.split('?')[0];
        this.userLink.userId = this.fileInfo.author
          .split('?')[1]
          .split('=')[1]
          .replace(')', '');
      }
      this.syncDate = moment(this.fileInfo.syncDate).format(
        'YYYY/MM/DD HH:mm:SS'
      );
      this.editDate = moment(this.fileInfo.syncDate).format(
        'YYYY/MM/DD HH:mm:SS'
      );
      this.infoDate = this.handleDate(this.fileInfo.creationDate);
    }

    this.lifeTrackingPoints = res['trackingData'][0][
      'lifeTrackingPointLayer'
    ];
    console.log('this.lifeTrackingPoints: ', this.lifeTrackingPoints);
    if (this.lifeTrackingPoints && this.lifeTrackingPoints.length > 0) {
      this.isShowChart = true;
      if (this.isFirstTime) {
        this.initHchart();
      } else {
        for (let i = 0; i < Highcharts.charts.length; i = i + 1) {
          const _chart: any = Highcharts.charts[i];
          if (_chart !== undefined) {
            _chart.updateFromData();
          }
        }
      }

    } else {
      this.isShowChart = false;
    }
    this.progressRef.complete();
    this.isLoading = false;
    });
  }
  goToProfile() {
    this.router.navigateByUrl(
      `/user-profile/${this.hashIdService.handleUserIdEncode(
        this.userLink.userId
      )}`
    );
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
    console.log('Highcharts.charts: ', Highcharts.charts);
    for (let i = 0; i < Highcharts.charts.length; i = i + 1) {
      const _chart: any = Highcharts.charts[i];
      if (_chart !== undefined) {
        console.log('finalDatas: ', finalDatas);
        console.log('i: ', i);
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
  unMountHChart() {
    // Highcharts = _.cloneDeep(highcharts); // 超暴力不動原本全域變數的highchartXD，強制重置
    this.fetchTrackingDayDetail();
    console.log('!!!!!!!!!!!!!!!Highcharts.charts: ', Highcharts.charts);
  }
  ngOnDestroy() {
    if (!this.isShowNoRight && !this.isFileIDNotExist) {
      Highcharts.charts.forEach((_highChart, idx) => {
        if (_highChart !== undefined) {
          _highChart.destroy();
          // Highcharts.charts.shift();
        }
      });
    }
    // Highcharts.charts.redraw();

  }
  initHchart() {
    const { finalDatas, chartTargets } = this.lifeTrackingService.handlePoints(
      this.lifeTrackingPoints,
      86400 / +this.lifeTrackingDayLayer.totalPoint
    );
    this.chartTargets = chartTargets;
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
    this.isFirstTime = false;
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
  handleDateChange($event: MatDatepickerInputEvent<moment.Moment>) {
    this.filterStartTime = moment($event.value).format(
      'YYYY-MM-DDTHH:mm:00.000+08:00'
    );
    this.filterEndTime = moment($event.value).format(
      'YYYY-MM-DDT23:59:00.000+08:00'
    );
  }
}
