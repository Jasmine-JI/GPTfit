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

const Highcharts: any = _Highcharts; // 不檢查highchart型態

@Component({
  selector: 'app-activity-info',
  templateUrl: './activity-info.component.html',
  styleUrls: ['./activity-info.component.css', '../../group/group-style.css'],
  encapsulation: ViewEncapsulation.None
})

export class ActivityInfoComponent implements OnInit, AfterViewInit, OnDestroy {
  isdisplayHcharts = true;
  chartLoading = false;
  basicLoading = false;
  rainLoading = false;

  options: Object;
  seriesIdx = 0;
  @ViewChild('speedChartTarget')
  speedChartTarget: ElementRef;
  @ViewChild('elevationChartTarget')
  elevationChartTarget: ElementRef;
  @ViewChild('container')
  container: ElementRef;
  @ViewChild('hrChartTarget')
  hrChartTarget: ElementRef;

  chart1: any; // Highcharts.ChartObject
  chart2: any; // Highcharts.ChartObject
  chart3: any; // Highcharts.ChartObject

  listenFunc: Function;
  dataset1: any;
  dataset2: any;
  dataset3: any;
  activityInfo: any;
  fileInfo: any;
  infoDate: string;
  activityPoints: any;
  isLoading = false;
  token: string;
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
  userLink = {
    userName: '',
    userId: null
  };
  progressRef: NgProgressRef;
  constructor(
    private utils: UtilsService,
    private renderer: Renderer2,
    private activityService: ActivityService,
    private route: ActivatedRoute,
    private ngProgress: NgProgress,
    private globalEventsManager: GlobalEventsManager,
    private router: Router,
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
      this.series.chart.tooltip.refresh(this); // 显示提示框
      this.series.chart.xAxis[0].drawCrosshair(event, this); // 显示十字准星线
    };
    this.options = {
      chart: { type: 'spline' },
      title: { text: 'dynamic data example' },
      series: [{ data: [1, 2, 3] }]
    };
  }

  ngOnInit() {
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
    this.listenFunc();
    this.globalEventsManager.setFooterRWD(0); // 為了讓footer自己變回去預設值
    this.chart1.destroy();
    this.chart2.destroy();
    this.chart3.destroy();
  }
  getInfo(id) {
    this.isLoading = true;

    this.progressRef.start();
    const body = {
      token: this.token,
      fileId: id
    };
    this.activityService.fetchSportListDetail(body).subscribe(res => {
      // console.log('res: ', res);
      this.activityInfo = res.activityInfoLayer;
      this.activityPoints = res.activityPointLayer;
      this.fileInfo = res.fileInfo;
      this.userLink.userName = this.fileInfo.author.split('?')[0];
      this.userLink.userId = this.fileInfo.author.split('?')[1].split('=')[1];

      this.infoDate = this.handleDate(this.activityInfo.startTime);
      this.initHchart();
      this.progressRef.complete();
      this.isLoading = false;
    });
  }
  handleDate(dateStr) {
    const dateArr = dateStr.split('');
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
      dateArr[11] +
      dateArr[12] +
      ':' +
      dateArr[14] +
      dateArr[15] +
      dateArr[16] +
      dateArr[17] +
      dateArr[18] +
      dateArr[19] +
      dateArr[20] +
      dateArr[21] +
      dateArr[22] +
      dateArr[23] +
      dateArr[24];
    return date;
  }
  initHchart() {
    const distances = [],
          speeds = [],
          elevations = [],
          heartRates = [];
    this.activityPoints.forEach(_point => {
      distances.push(+_point.distanceMeters);
      speeds.push(+_point.speed);
      elevations.push(+_point.altitudeMeters);
      heartRates.push(+_point.heartRateBpm);
    });
    this.dataset1 = {
      name: 'Speed',
      data: speeds,
      unit: 'km/h',
      type: 'line',
      valueDecimals: 1
    };
    this.dataset2 = {
      name: 'Elevation',
      data: elevations,
      unit: 'm',
      type: 'area',
      valueDecimals: 0
    };
    this.dataset3 = {
      name: 'Heart rate',
      data: heartRates,
      unit: 'bpm',
      type: 'area',
      valueDecimals: 0
    };
    this.dataset1.data = this.dataset1.data.map((val, j) => [
      distances[j],
      val
    ]);
    this.dataset2.data = this.dataset2.data.map((val, j) => [
      distances[j],
      val
    ]);
    this.dataset3.data = this.dataset3.data.map((val, j) => [
      distances[j],
      val
    ]);
    const speedOptions: any = {
      chart: {
        marginLeft: 40, // Keep all charts left aligned
        spacingTop: 20,
        spacingBottom: 20,
        zoomType: 'x'
      },
      title: {
        text: this.dataset1.name,
        align: 'left',
        margin: 0,
        x: 30
      },
      xAxis: {
        crosshair: true,
        events: {
          setExtremes: this.syncExtremes.bind(this, 1)
        },
        labels: {
          format: '{value} km'
        }
      },
      yAxis: {
        title: {
          text: null
        }
      },
      tooltip: {
        positioner: function() {
          return {
            x: this.chart.chartWidth - this.label.width, // right aligned
            y: -1 // align to title
          };
        },
        borderWidth: 0,
        backgroundColor: 'none',
        pointFormat: '{point.y}',
        headerFormat: '',
        shadow: false,
        style: {
          fontSize: '18px'
        },
        valueDecimals: this.dataset1.valueDecimals
      },
      series: [
        {
          data: this.dataset1.data,
          name: this.dataset1.name,
          type: this.dataset1.type,
          color: Highcharts.getOptions().colors[0],
          fillOpacity: 0.3,
          tooltip: {
            valueSuffix: ' ' + this.dataset1.unit
          }
        }
      ]
    };
    const elevationOptions: any = {
      chart: {
        marginLeft: 40, // Keep all charts left aligned
        spacingTop: 20,
        spacingBottom: 20,
        zoomType: 'x'
      },
      title: {
        text: this.dataset2.name,
        align: 'left',
        margin: 0,
        x: 30
      },
      xAxis: {
        crosshair: true,
        events: {
          setExtremes: this.syncExtremes.bind(this, 2)
        },
        labels: {
          format: '{value} km'
        }
      },
      yAxis: {
        title: {
          text: null
        }
      },
      tooltip: {
        positioner: function() {
          return {
            x: this.chart.chartWidth - this.label.width, // right aligned
            y: -1 // align to title
          };
        },
        borderWidth: 0,
        backgroundColor: 'none',
        pointFormat: '{point.y}',
        headerFormat: '',
        shadow: false,
        style: {
          fontSize: '18px'
        },
        valueDecimals: this.dataset2.valueDecimals
      },
      series: [
        {
          data: this.dataset2.data,
          name: this.dataset2.name,
          type: this.dataset2.type,
          color: Highcharts.getOptions().colors[2],
          fillOpacity: 0.3,
          tooltip: {
            valueSuffix: ' ' + this.dataset2.unit
          }
        }
      ]
    };
    const hrOptions: any = {
      chart: {
        marginLeft: 40, // Keep all charts left aligned
        spacingTop: 20,
        spacingBottom: 20,
        zoomType: 'x'
      },
      title: {
        text: this.dataset3.name,
        align: 'left',
        margin: 0,
        x: 30
      },
      xAxis: {
        crosshair: true,
        events: {
          setExtremes: this.syncExtremes.bind(this, 3)
        },
        labels: {
          format: '{value} km'
        }
      },
      yAxis: {
        title: {
          text: null
        }
      },
      tooltip: {
        positioner: function() {
          return {
            x: this.chart.chartWidth - this.label.width, // right aligned
            y: -1 // align to title
          };
        },
        borderWidth: 0,
        backgroundColor: 'none',
        pointFormat: '{point.y}',
        headerFormat: '',
        shadow: false,
        style: {
          fontSize: '18px'
        },
        valueDecimals: this.dataset3.valueDecimals
      },
      series: [
        {
          data: this.dataset3.data,
          name: this.dataset3.name,
          type: this.dataset3.type,
          color: '#f45b5b',
          fillOpacity: 0.3,
          tooltip: {
            valueSuffix: ' ' + this.dataset3.unit
          }
        }
      ]
    };
    this.chart1 = chart(this.speedChartTarget.nativeElement, speedOptions);
    this.chart2 = chart(
      this.elevationChartTarget.nativeElement,
      elevationOptions
    );
    this.chart3 = chart(this.hrChartTarget.nativeElement, hrOptions);
    this.listenFunc = this.renderer.listen(
      this.container.nativeElement,
      'mousemove',
      e => {
        // Do something with 'event'
        for (let i = Highcharts.charts.length - 3; i < Highcharts.charts.length; i = i + 1) {
          const _chart: any = Highcharts.charts[i];
          const event = _chart.pointer.normalize(e); // Find coordinates within the chart
          const point = _chart.series[0].searchPoint(event, true); // Get the hovered point
          if (point) {
            point.highlight(e);
          }
        }
      }
    );
  }
  syncExtremes(num, e) {
    const thisChart = this[`chart${num}`];
    if (e.trigger !== 'syncExtremes') {
      Highcharts.each(Highcharts.charts, function(_chart) {
        if (_chart !== thisChart && _chart) {
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
}
