import { Component, OnInit, OnChanges, OnDestroy, ViewChild, ElementRef, Input } from '@angular/core';
import { chart } from 'highcharts';
import { TranslateService } from '@ngx-translate/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { HrZoneRange } from '../../../models/chart-data';
import { mi, ft,  } from '../../../models/bs-constant';
import { SportType } from '../../../enum/sports';
import { TemperatureSibsPipe } from '../../../pipes/temperature-sibs.pipe';

type ChartType = 'hr' | 'pace' | 'altitude' | 'speed' | 'cadence' | 'power' | 'temperature' | 'gforce';

// 建立圖表用-kidin-1081212
class ChartOptions {
  constructor (dataset, chartType, xAxisType) {
    return {
      chart: {
        type: chartType,
        height: 110,  // 圖表高度
        zoomType: 'x',  // 縮放基準
        backgroundColor: 'transparent'
      },
      title: {
        text: ''
      },
      credits: {
        enabled: false  // 是否顯示highchart浮水印
      },
      xAxis: {
        type: xAxisType,
        dateTimeLabelFormats: {
          millisecond: '%H:%M:%S',
          second: '%H:%M:%S',
          minute: '%H:%M:%S',
          hour: '%H:%M:%S',
          day: '%H:%M:%S',
          month: '%H:%M:%S',
          year: '%H:%M:%S'
        },
        title: {
          enabled: false
        },
        minPadding: 0,
        maxPadding: 0
      },
      yAxis: {
        min: 0,
        title: {
          text: '',
          enabled: false
        },
        gridLineColor: 'transparent',  // 格線顏色
        startOnTick: false,  // Whether to force the axis to start on a tick.
        minPadding: 0,
        maxPadding: 0,
        tickAmount: 1  // y軸隔線數目
      },
      plotOptions: {
        column: {
          stacking: 'normal',
          pointPlacement: 0,
        },
        series: {
          pointWidth: null,
          marker: {
            enabled: false
          }
        }
      },
      tooltip: {
        dateTimeLabelFormats: {
          millisecond: '%H:%M:%S',
          second: '%H:%M:%S',
          minute: '%H:%M:%S',
          hour: '%H:%M:%S',
          day: '%H:%M:%S',
          month: '%H:%M:%S',
          year: '%H:%M:%S'
        },
        valueDecimals: 1
      },
      series: dataset
    };
  }
}

@Component({
  selector: 'app-trend-info-chart',
  templateUrl: './trend-info-chart.component.html',
  styleUrls: ['./trend-info-chart.component.scss']
})
export class TrendInfoChartComponent implements OnInit, OnChanges, OnDestroy {
  private ngUnsubscribe = new Subject;

  @Input() yAxisData: Array<number> | Array<Array<number>>;
  @Input() xAxisData: Array<number>;
  @Input() xAxisType: 'distanceMeters' | 'pointSecond';
  @Input() sportType: SportType;
  @Input() unit: 0 | 1;
  @Input() chartType: ChartType;
  @Input() hrRange: HrZoneRange;
  @Input() showInfo: boolean;
  @Input() page: 'detail' | 'report';

  @ViewChild('container') container: ElementRef;

  /**
   * 跑步類別讓使用者可切換顯示配速或速度
   */
  typeRunShowPace = true;

  /**
   * 顯示最高（佳）和平均數據用
   */
  infoData = {
    best: 0,
    avg: 0
  };

  /**
   * 顯示最高和最小G力用
   */
  gForceInfoData = {
    x: {
      max: 0,
      min: null
    },
    y: {
      max: 0,
      min: null
    },
    z: {
      max: 0,
      min: null
    }
  }

  /**
   * 因應跑步類別可自由切換配速與速度
   */
  finalChartType: ChartType;


  readonly SportType = SportType;

  constructor(
    private translate: TranslateService,
    private temperatureSibsPipe: TemperatureSibsPipe
  ) { }

  ngOnInit(): void {
  }

  ngOnChanges() {
    // 避免previewMode頁面父組件過早變更input變數
    setTimeout(() => {
      this.initChart();
    })

  }

  /**
   * 根據數據類別建立highchart圖表，並同時取得最高（佳）及平均數據
   * @author kidin-1100208
   */
  initChart() {
    // 待多國語系套件載入後再產生圖表
    this.translate.get('hellow world').pipe(
      takeUntil(this.ngUnsubscribe)
    ).subscribe(() => {
      this.initInfo();
      let processedData = [];
      let type = 'line';
      let total = 0;
      let Denominator: number;
      let seriesSet: any;
      let chartOptions: any;

      const { sportType, chartType, typeRunShowPace } = this;
      this.finalChartType = !typeRunShowPace && sportType === SportType.run && chartType === 'pace' ? 'speed' : chartType;
      switch (this.finalChartType) {
        case 'hr':
          type = 'column';
          Denominator = 0;
          this.yAxisData.forEach((_yAxis, _index) => {
            const _xAxis = this.xAxisData[_index];
            const _yAxisAfterCheck = _xAxis === 0 ? 0 : _yAxis;
            const chartData = {
              x: this.page === 'detail' && this.xAxisType === 'pointSecond' ? _xAxis * 1000 : _xAxis,
              y: _yAxisAfterCheck,
              color: this.getColor(_yAxisAfterCheck, 'hr')
            };

            processedData.push(chartData);
            // 平均心率僅計算心率不為0的數據
            if (_yAxisAfterCheck > 0) {
              total += _yAxisAfterCheck;
              Denominator += 1;
            }
            
            if (_yAxisAfterCheck > this.infoData.best) {
              this.infoData.best = _yAxisAfterCheck;
            }

          });

          if (processedData[0].x !== 0) {
            processedData = [{x: 0, y: 0, color: '#6e9bff'}, ...processedData];
          }

          this.infoData.avg = +(total / Denominator).toFixed(1) || 0;
          seriesSet = [{
            name: this.translate.instant('universal_activityData_hr'),
            groupPadding: 0,
            data: processedData,
            turboThreshold: 100000,
            showInLegend: false,
            tooltip: {
              valueSuffix: ' ' + 'bpm'
            }
          }];

          chartOptions = new ChartOptions(
            seriesSet,
            type,
            this.xAxisType === 'pointSecond' ? 'datetime' : 'linear'
          );

          this.createChart(chartOptions);
          break;
        case 'pace':
          this.yAxisData.forEach((_yAxis, _index) => {
            const _xAxis = this.xAxisData[_index];
            const _yAxisAfterCheck = _xAxis === 0 ? 0 : _yAxis;
            
            let _yAxisConvert: number;
            switch (sportType) {
              case SportType.run:  // 公里或英里配速
                _yAxisConvert = this.unit === 0 ? _yAxisAfterCheck : _yAxisAfterCheck / mi;
                break;
              case SportType.swim:  // 百米配速
                _yAxisConvert = _yAxisAfterCheck * 10;
                break;
              case SportType.row:  // 500米配速
                _yAxisConvert = _yAxisAfterCheck * 2;
                break;
            }
                  
            const chartData = {
              x: this.page === 'detail' && this.xAxisType === 'pointSecond' ? _xAxis * 1000 : _xAxis,
              y: +(3600 / (_yAxisConvert >= 1 ? _yAxisConvert : 1)).toFixed(0)
            };

            processedData.push(chartData);
            total += _yAxisAfterCheck;
            if (_yAxisAfterCheck > this.infoData.best) {
              this.infoData.best = _yAxisAfterCheck;
            }

          });

          // 補上time = 0s的點
          Denominator = processedData[0].x === 0 ? processedData.length - 1 : processedData.length;
          Denominator = Denominator > 0 ? Denominator : 1;
          if (processedData[0].x !== 0) {
            processedData = [{x: 0, y: 3600}, ...processedData];
          }

          this.infoData.avg = +(total / Denominator).toFixed(1) || 0;
          seriesSet = [{
            name: this.translate.instant('universal_activityData_pace'),
            data: processedData,
            turboThreshold: 100000,
            showInLegend: false,
            color: {
              linearGradient : { x1: 0, x2: 0, y1: 1, y2: 0 },
              stops : [
                [0, 'rgba(255, 0, 255, 1)'],
                [1, 'rgba(255, 255, 0, 1)']
              ]
            }
          }];

          chartOptions = new ChartOptions(
            seriesSet,
            type,
            this.xAxisType === 'pointSecond' ? 'datetime' : 'linear'
          );

          chartOptions['yAxis'].reversed = true;  // y軸反轉

          // 將y軸修改為符合配速的格式
          chartOptions['yAxis'].labels = {
            formatter: function() {
              const val = +this.value;
              const costminperkm = Math.floor(val / 60);
              const costsecondperkm = Math.round(val - costminperkm * 60);
              const timeMin = ('0' + costminperkm).slice(-2);
              const timeSecond = ('0' + costsecondperkm).slice(-2);
              return `${timeMin}'${timeSecond}"`;
            }
          };

          // 將tooltip內的資料修改為符合配速的格式
          chartOptions['tooltip'] = {
            pointFormatter: function() {
              const val = this.y;
              const costminperkm = Math.floor(val / 60);
              const costsecondperkm = Math.round(val - costminperkm * 60);
              const timeMin = ('0' + costminperkm).slice(-2);
              const timeSecond = ('0' + costsecondperkm).slice(-2);
              const paceVal = `${timeMin}'${timeSecond}"`;
              return `<br><span style="color: ${this.series.color};">●</span> ${this.series.name}: <b>${paceVal}</b><br>`;
            },
            xDateFormat: '%H:%M:%S'
          }

          chartOptions['yAxis'].min = 0;
          chartOptions['yAxis'].max = 3600;

          this.createChart(chartOptions);
          break;
        case 'altitude':
          this.yAxisData.forEach((_yAxis, _index) => {
            const _xAxis = this.xAxisData[_index];
            const _yAxisAfterCheck = _xAxis === 0 ? 0 : _yAxis;
            const _yAxisConvert = this.unit === 0 ? _yAxisAfterCheck : +(_yAxisAfterCheck / ft).toFixed(1);
            const chartData = {
              x: this.page === 'detail' && this.xAxisType === 'pointSecond' ? _xAxis * 1000 : _xAxis,
              y: _yAxisConvert
            };

            processedData.push(chartData);
            total += _yAxisConvert;
            if (_yAxisConvert > this.infoData.best) {
              this.infoData.best = _yAxisConvert;
            }

          });

          // 補上time = 0s的點
          Denominator = processedData[0].x === 0 ? processedData.length - 1 : processedData.length;
          Denominator = Denominator > 0 ? Denominator : 1;
          if (processedData[0].x !== 0) {
            processedData = [{x: 0, y: 0}, ...processedData];
          }

          this.infoData.avg = +(total / Denominator).toFixed(1) || 0;
          seriesSet = [{
            name: this.translate.instant('universal_activityData_altitude'),
            data: processedData,
            turboThreshold: 100000,
            showInLegend: false,
            color: '#75f25f',
            tooltip: {
              valueSuffix: ` ${this.unit === 0 ? 'm' : 'ft'}`
            }
          }];

          chartOptions = new ChartOptions(
            seriesSet,
            type,
            this.xAxisType === 'pointSecond' ? 'datetime' : 'linear'
          );

          chartOptions.yAxis.min = null;
          this.createChart(chartOptions);
          break;
        case 'speed':
          this.yAxisData.forEach((_yAxis, _index) => {
            const _xAxis = this.xAxisData[_index];
            const _yAxisAfterCheck = _xAxis === 0 ? 0 : _yAxis;
            const _yAxisConvert = this.unit === 0 ? _yAxisAfterCheck : +(_yAxisAfterCheck / mi).toFixed(1);
            const chartData = {
              x: this.page === 'detail' && this.xAxisType === 'pointSecond' ? _xAxis * 1000 : _xAxis,
              y: _yAxisConvert
            };

            processedData.push(chartData);
            total += _yAxisConvert;
            if (_yAxisConvert > this.infoData.best) {
              this.infoData.best = _yAxisConvert;
            }

          });

          // 補上time = 0s的點
          Denominator = processedData[0].x === 0 ? processedData.length - 1 : processedData.length;
          Denominator = Denominator > 0 ? Denominator : 1;
          if (processedData[0].x !== 0) {
            processedData = [{x: 0, y: 0}, ...processedData];
          }

          this.infoData.avg = +(total / Denominator).toFixed(1) || 0;
          seriesSet = [{
            name: this.translate.instant('universal_activityData_speed'),
            data: processedData,
            turboThreshold: 100000,
            showInLegend: false,
            color: {
              linearGradient : { x1: 0, x2: 0, y1: 1, y2: 0 },
              stops : [
                [0, 'rgba(255, 0, 255, 1)'],
                [1, 'rgba(255, 255, 0, 1)']
              ]
            },
            tooltip: {
              valueSuffix: ` ${this.unit === 0 ? 'km/h' : 'mi/h'}`
            }
          }];

          chartOptions = new ChartOptions(
            seriesSet,
            type,
            this.xAxisType === 'pointSecond' ? 'datetime' : 'linear'
          );

          this.createChart(chartOptions);
          break;
        case 'cadence':
          type = 'scatter';
          this.yAxisData.forEach((_yAxis, _index) => {
            const _xAxis = this.xAxisData[_index];
            const _yAxisAfterCheck = _xAxis === 0 ? 0 : _yAxis;
            const chartData = {
              x: this.page === 'detail' && this.xAxisType === 'pointSecond' ? _xAxis * 1000 : _xAxis,
              y: _yAxisAfterCheck,
              color: this.getColor(_yAxisAfterCheck, 'cadence')
            };

            processedData.push(chartData);
            total += _yAxisAfterCheck;
            if (_yAxisAfterCheck > this.infoData.best) {
              this.infoData.best = _yAxisAfterCheck;
            }

          });

          // 補上time = 0s的點
          Denominator = processedData[0].x === 0 ? processedData.length - 1 : processedData.length;
          Denominator = Denominator > 0 ? Denominator : 1;
          if (processedData[0].x !== 0) {
            processedData = [{x: 0, y: 0, color: '#6e9bff'}, ...processedData];
          }

          this.infoData.avg = +(total / Denominator).toFixed(1) || 0;
          const pointFormat = this.xAxisType === 'pointSecond' ? 
            `{point.x: %H:%M:%S}<br> {point.y} ${[1, 3, 4].includes(sportType) ? 'spm' : 'rpm'}` 
            : 
            `{point.x}<br> {point.y} ${[1, 4].includes(sportType) ? 'spm' : 'rpm'}`;

          seriesSet = [{
            name: this.translate.instant(this.getCadenceKey(sportType)),
            data: processedData,
            turboThreshold: 100000,
            showInLegend: false,
            tooltip: {
              pointFormat: pointFormat
            }
          }];

          chartOptions = new ChartOptions(
            seriesSet,
            type,
            this.xAxisType === 'pointSecond' ? 'datetime' : 'linear'
          );

          chartOptions.plotOptions.series.marker.enabled = true;
          Object.assign(chartOptions, {plotOptions: {scatter: {marker: {radius: 2}}}});
          this.createChart(chartOptions);
          break;
        case 'power':
          this.yAxisData.forEach((_yAxis, _index) => {
            const _xAxis = this.xAxisData[_index];
            const _yAxisAfterCheck = _xAxis === 0 ? 0 : _yAxis;
            const chartData = {
              x: this.page === 'detail' && this.xAxisType === 'pointSecond' ? _xAxis * 1000 : _xAxis,
              y: _yAxisAfterCheck || 0
            };

            processedData.push(chartData);
            total += _yAxisAfterCheck;
            if (_yAxisAfterCheck > this.infoData.best) {
              this.infoData.best = _yAxisAfterCheck;
            }

          });

          // 補上time = 0s的點
          Denominator = processedData[0].x === 0 ? processedData.length - 1 : processedData.length;
          Denominator = Denominator > 0 ? Denominator : 1;
          if (processedData[0].x !== 0) {
            processedData = [{x: 0, y: 0}, ...processedData];
          }

          this.infoData.avg = +(total / Denominator).toFixed(1) || 0;
          seriesSet = [{
            name: this.translate.instant('universal_activityData_power'),
            data: processedData,
            turboThreshold: 100000,
            showInLegend: false,
            color: {
              linearGradient : { x1: 0, x2: 0, y1: 1, y2: 0 },
              stops : [
                [0, 'rgba(249, 204, 61, 1)'],
                [1, 'rgba(255, 154, 34, 1)']
              ]
            },
            tooltip: {
              valueSuffix: ` w`
            }
          }];

          chartOptions = new ChartOptions(
            seriesSet,
            type,
            this.xAxisType === 'pointSecond' ? 'datetime' : 'linear'
          );

          this.createChart(chartOptions);
          break;
        case 'temperature':
          let maxTemp = 0;
          this.yAxisData.forEach((_yAxis, _index) => {
            const _xAxis = this.xAxisData[_index];
            const _yAxisAfterCheck = _xAxis === 0 ? 0 : _yAxis;
            const _yAxisConvert = this.unit === 0 ? (_yAxisAfterCheck || 0) : this.temperatureSibsPipe.transform((_yAxisAfterCheck || 0), [this.unit, 1]);
            const chartData = {
              x: this.page === 'detail' && this.xAxisType === 'pointSecond' ? _xAxis * 1000 : _xAxis,
              y: _yAxisConvert,
              color: this.getColor(_yAxisAfterCheck, 'temperature')
            };

            processedData.push(chartData);
            total += _yAxisConvert;
            if (_yAxisConvert > this.infoData.best) this.infoData.best = _yAxisConvert;
            if (_yAxisAfterCheck > maxTemp) maxTemp = _yAxisAfterCheck;

          });

          // 補上time = 0s的點
          Denominator = processedData[0].x === 0 ? processedData.length - 1 : processedData.length;
          Denominator = Denominator > 0 ? Denominator : 1;
          if (processedData[0].x !== 0) processedData = [{x: 0, y: 0, color: '#6e9bff'}, ...processedData];


          // 取得圖表線型顏色
          let stops = [
            [0, '#6e9bff'],
            [1, '#6e9bff']
          ];
          if (this.getColor(maxTemp, 'temperature') === '#ea5757') {
            stops = [
              [0, '#6e9bff'],
              [10 / maxTemp, '#75f25f'],
              [31 / maxTemp, '#75f25f'],
              [32 / maxTemp, '#ea5757'],
              [1, '#ea5757']
            ]
          } else if (this.getColor(maxTemp, 'temperature') === '#75f25f') {
            stops = [
              [0, '#6e9bff'],
              [10 / maxTemp, '#75f25f'],
              [1, '#75f25f']
            ]
          }

          this.infoData.avg = +(total / Denominator).toFixed(1) || 0;
          seriesSet = [{
            name: this.translate.instant('universal_activityData_temperature'),
            data: processedData,
            turboThreshold: 100000,
            showInLegend: false,
            color: {
              linearGradient: { x1: 0, x2: 0, y1: 1, y2: 0 },
              stops
            },
            tooltip: {
              valueSuffix: ` ${this.unit === 0 ? '°C' : '°F'}`
            }
          }];

          chartOptions = new ChartOptions(
            seriesSet,
            type,
            this.xAxisType === 'pointSecond' ? 'datetime' : 'linear'
          );

          chartOptions.yAxis.min = null;
          this.createChart(chartOptions);
          break;
        case 'gforce':
          this.initGForceData();
          const xGForce = {
            ref: this.yAxisData[0],
            final: []
          };
          const yGForce = {
            ref: this.yAxisData[1],
            final: []
          };
          const zGForce = {
            ref: this.yAxisData[2],
            final: []
          };

          // let chartMax = null; // 預埋此變數避免圖表y軸線需對稱
                
          // 整理成圖表可用的數據並取得各方向G力最大及平均值      
          this.xAxisData.forEach((_xAxis, _index) => {
            const _xGForce = _xAxis === 0 ? 0 : xGForce.ref[_index];
            const _yGForce = _xAxis === 0 ? 0 : yGForce.ref[_index];
            const _zGForce = _xAxis === 0 ? 0 : zGForce.ref[_index];

            xGForce.final.push({
              x: this.page === 'detail' && this.xAxisType === 'pointSecond' ? _xAxis * 1000 : _xAxis,
              y: _xGForce
            }),
            yGForce.final.push({
              x: this.page === 'detail' && this.xAxisType === 'pointSecond' ? _xAxis * 1000 : _xAxis,
              y: _yGForce
            }),
            zGForce.final.push({
              x: this.page === 'detail' && this.xAxisType === 'pointSecond' ? _xAxis * 1000 : _xAxis,
              y: _zGForce
            });

            // 取得最大與最小g力
            if (_xGForce > this.gForceInfoData.x.max) this.gForceInfoData.x.max = _xGForce;
            if (_yGForce > this.gForceInfoData.y.max) this.gForceInfoData.y.max = _yGForce;
            if (_zGForce > this.gForceInfoData.z.max) this.gForceInfoData.z.max = _zGForce;
            if (this.gForceInfoData.x.min === null || _xGForce < this.gForceInfoData.x.min) this.gForceInfoData.x.min = _xGForce;
            if (this.gForceInfoData.y.min === null || _yGForce < this.gForceInfoData.y.min) this.gForceInfoData.y.min = _yGForce;
            if (this.gForceInfoData.z.min === null || _zGForce < this.gForceInfoData.z.min) this.gForceInfoData.z.min = _zGForce;

            /* 取得圖表最高或最低點(預埋此段避免圖表y軸線需對稱)
            const _xGForceAbs = Math.abs(_xGForce),
                  _yGForceAbs = Math.abs(_yGForce),
                  _zGForceAbs = Math.abs(_zGForce);
            if (chartMax === null || _xGForceAbs > chartMax) chartMax = _xGForceAbs;
            if (chartMax === null || _yGForceAbs > chartMax) chartMax = _yGForceAbs;
            if (chartMax === null || _zGForceAbs > chartMax) chartMax = _zGForceAbs;
            */
          });

          // 補上time = 0s的點
          if (xGForce.final[0].x !== 0) xGForce.final = [{x: 0, y: 0}, ...xGForce.final];
          if (yGForce.final[0].x !== 0) yGForce.final = [{x: 0, y: 0}, ...yGForce.final];
          if (zGForce.final[0].x !== 0) zGForce.final = [{x: 0, y: 0}, ...zGForce.final];

          seriesSet = [
            {
              name: `${this.translate.instant('universal_unit_gforce')}-X`,
              data: xGForce.final,
              turboThreshold: 100000,
              showInLegend: false,
              color: '#6e9bff',
              tooltip: {
                valueSuffix: ` g`
              }
            },
            {
              name: `${this.translate.instant('universal_unit_gforce')}-Y`,
              data: yGForce.final,
              turboThreshold: 100000,
              showInLegend: false,
              color: '#75f25f',
              tooltip: {
                valueSuffix: ` g`
              }
            },
            {
              name: `${this.translate.instant('universal_unit_gforce')}-Z`,
              data: zGForce.final,
              turboThreshold: 100000,
              showInLegend: false,
              color: '#ea5757',
              tooltip: {
                valueSuffix: ` g`
              }
            }
          ];

          chartOptions = new ChartOptions(
            seriesSet,
            type,
            this.xAxisType === 'pointSecond' ? 'datetime' : 'linear'
          );

          /* 預埋此段避免圖表y軸線需對稱
          const chartBorder = chartMax * 1.2;
          chartOptions['yAxis'].min = -chartBorder;  
          chartOptions['yAxis'].max = chartBorder;
          */
          chartOptions['yAxis'].min = null;
          chartOptions['chart'].height = 175;
          chartOptions['yAxis'].tickAmount = 3;
          this.createChart(chartOptions);
          break;
      }

    });

  }

  /**
   * 初始化最高（佳）及平均數據
   * @author kidin-1100218
   */
  initInfo() {
    this.infoData = {
      best: 0,
      avg: 0
    };
  }

  /**
   * 初始化g值最高與最低數據
   * @author kidin-1100219
   */
  initGForceData() {
    this.gForceInfoData = {
      x: {
        max: 0,
        min: null
      },
      y: {
        max: 0,
        min: null
      },
      z: {
        max: 0,
        min: null
      }
    }

  }

  /**
   * 取得該數據對應的顏色
   * @param data {number}-y軸數據
   * @param type {ChartType}-數據類型
   * @param sportType {SportType}-運動類型
   * @author kidin-1100208
   */
  getColor(data: number, type: ChartType, sportType = this.sportType): string {
    switch (type) {
      case 'hr':
        if (data <= this.hrRange.z0) {
          return '#6e9bff';
        } else if (data <= this.hrRange.z1) {
          return '#6bebf9';
        } else if (data <= this.hrRange.z2) {
          return '#75f25f';
        } else if (data <= this.hrRange.z3) {
          return '#f9cc3d';
        } else if (data <= this.hrRange.z4) {
          return '#ff9a22';
        } else {
          return '#ea5757';
        }

      case 'cadence':
        // hsla 220 -> 0 (藍 ～ 紅)
        switch (sportType) {
          case SportType.run:
          case SportType.cycle:
            // 超過220一律紅色
            return 220 - data < 0 ? `hsla(0, 70%, 65%, 1)` : `hsla(${220 - data}, 70%, 65%, 1)`;
          case SportType.weightTrain:
            // 超過30一律橙色
            return 30 - data < 0 ? `hsla(33, 70%, 65%, 1)` : `hsla(${220 - data}, 70%, 65%, 1)`;
          case SportType.swim:
          case SportType.row:
            // 超過60一律紅色
            const maxVal = 60;
            return maxVal - data < 0 ? `hsla(0, 70%, 65%, 1)` : `hsla(${(maxVal - data) * (220 / maxVal)}, 70%, 65%, 1)`;
        }

      case 'temperature':
        if (data <= 10) {
          return '#6e9bff';
        } else if (data <= 31) {
          return '#75f25f';
        } else {
          return '#ea5757';
        }

    }

  }

  /**
   * 取得對應的頻率多國語系
   * @param type {SportType}-運動類別
   * @returns string - i18n key
   * @author kidin-1100209
   */
  getCadenceKey(type: SportType): string {
    switch (type) {
      case SportType.run:
        return 'universal_activityData_stepCadence';
      case SportType.cycle:
        return 'universal_activityData_CyclingCadence';
      case SportType.weightTrain:
        return 'universal_activityData_repeatTempo';
      case SportType.swim:
        return 'universal_activityData_swimCadence';
      case SportType.row:
        return 'universal_activityData_rowCadence';
    }
  }


  /**
   * 確認取得元素才建立圖表
   * @param option {ChartOptions}
   * @author kidin-1090706
   */
  createChart (option: ChartOptions) {

    setTimeout (() => {
      if (!this.container) {
        this.createChart(option);
      } else {
        const chartDiv = this.container.nativeElement;
        chart(chartDiv, option);
      }
    }, 200);

  }

  /**
   * 配速與速度顯示切換
   */
  conversePaceSpeed() {
    this.typeRunShowPace = !this.typeRunShowPace;
    this.initChart();
  }

  ngOnDestroy () {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

}