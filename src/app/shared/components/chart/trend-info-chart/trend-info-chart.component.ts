import { Component, OnInit, OnChanges, OnDestroy, ViewChild, ElementRef, Input } from '@angular/core';
import { chart } from 'highcharts';
import moment from 'moment';
import { TranslateService } from '@ngx-translate/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { HrZoneRange } from '../../../models/chart-data';
import { mi, ft,  } from '../../../models/bs-constant';
import { SportType } from '../../../models/report-condition';
import { TemperatureSibsPipe } from '../../../pipes/temperature-sibs.pipe';

type ChartType = 'hr' | 'pace' | 'altitude' | 'speed' | 'cadence' | 'power' | 'temperature';

// 建立圖表用-kidin-1081212
class ChartOptions {
  constructor (dataset, chartType, xAxisType) {
    return {
      chart: {
        type: chartType,
        height: 110,
        zoomType: 'x',
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
        startOnTick: false,
        minPadding: 0,
        maxPadding: 0,
        tickAmount: 1
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

  @Input('yAxisData') yAxisData: Array<number> | Array<Array<number>>;
  @Input('xAxisData') xAxisData: Array<number>;
  @Input('xAxisType') xAxisType: 'distanceMeters' | 'pointSecond';
  @Input('sportType') sportType: SportType;
  @Input('unit') unit: 0 | 1;
  @Input('chartType') chartType: ChartType;
  @Input('hrRange') hrRange: HrZoneRange;
  @Input('showInfo') showInfo: boolean;
  @Input('page') page: 'detail' | 'report';

  @ViewChild('container') container: ElementRef;

  /**
   * 顯示最高（佳）和平均數據用
   */
  infoData = {
    best: 0,
    avg: 0
  };

  constructor(
    private translate: TranslateService,
    private temperatureSibsPipe: TemperatureSibsPipe
  ) { }

  ngOnInit(): void {
  }

  ngOnChanges() {
      this.initChart();
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
      let processedData = [],
          type = 'line',
          total = 0,
          seriesSet: any,
          chartOptions: any;

      switch (this.chartType) {
        case 'hr':
          type = 'column';
          this.yAxisData.forEach((_yAxis, _index) => {
            const _xAxis = this.xAxisData[_index],
                  chartData = {
                    x: this.page === 'detail' && this.xAxisType === 'pointSecond' ? _xAxis * 1000 : _xAxis,
                    y: _yAxis,
                    color: this.getColor(_yAxis, 'hr')
                  };

            processedData.push(chartData);
            total += _yAxis;
            if (_yAxis > this.infoData.best) {
              this.infoData.best = _yAxis;
            }

          });

          // 補上time = 0s的點
          if (processedData[0].x !== 0) {
            processedData = [{x: 0, y: 0, color: '#6e9bff'}, ...processedData];
          }

          this.infoData.avg = +(total / (processedData.length - 1)).toFixed(1);
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
        case 'altitude':
          this.yAxisData.forEach((_yAxis, _index) => {
            const _xAxis = this.xAxisData[_index],
                  _yAxisConvert = this.unit === 0 ? _yAxis : +(_yAxis / ft).toFixed(1),
                  chartData = {
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
          if (processedData[0].x !== 0) {
            processedData = [{x: 0, y: 0}, ...processedData];
          }

          this.infoData.avg = +(total / (processedData.length - 1)).toFixed(1);
          seriesSet = [{
            name: this.translate.instant('universal_activityData_hr'),
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

          this.createChart(chartOptions);
          break;
        case 'speed':
          this.yAxisData.forEach((_yAxis, _index) => {
            const _xAxis = this.xAxisData[_index],
                  _yAxisConvert = this.unit === 0 ? _yAxis : +(_yAxis / mi).toFixed(1),
                  chartData = {
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
          if (processedData[0].x !== 0) {
            processedData = [{x: 0, y: 0}, ...processedData];
          }

          this.infoData.avg = +(total / (processedData.length - 1)).toFixed(1);
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
              valueSuffix: ` ${this.unit === 0 ? 'km/hr' : 'mi/hr'}`
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
            const _xAxis = this.xAxisData[_index],
                  chartData = {
                    x: this.page === 'detail' && this.xAxisType === 'pointSecond' ? _xAxis * 1000 : _xAxis,
                    y: _yAxis,
                    color: this.getColor(_yAxis, 'cadence')
                  };

            processedData.push(chartData);
            total += _yAxis;
            if (_yAxis > this.infoData.best) {
              this.infoData.best = _yAxis;
            }

          });

          // 補上time = 0s的點
          if (processedData[0].x !== 0) {
            processedData = [{x: 0, y: 0, color: '#6e9bff'}, ...processedData];
          }

          this.infoData.avg = +(total / (processedData.length - 1)).toFixed(1);

          seriesSet = [{
            name: this.translate.instant(this.getCadenceKey(this.sportType)),
            data: processedData,
            turboThreshold: 100000,
            showInLegend: false,
            tooltip: {
              pointFormat: `{point.x: %H:%M:%S}<br> {point.y} ${[1, 4].includes(this.sportType) ? 'spm' : 'rpm'}`
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
            const _xAxis = this.xAxisData[_index],
                  chartData = {
                    x: this.page === 'detail' && this.xAxisType === 'pointSecond' ? _xAxis * 1000 : _xAxis,
                    y: _yAxis
                  };

            processedData.push(chartData);
            total += _yAxis;
            if (_yAxis > this.infoData.best) {
              this.infoData.best = _yAxis;
            }

          });

          // 補上time = 0s的點
          if (processedData[0].x !== 0) {
            processedData = [{x: 0, y: 0}, ...processedData];
          }

          this.infoData.avg = +(total / (processedData.length - 1)).toFixed(1);
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
          this.yAxisData.forEach((_yAxis, _index) => {
            const _xAxis = this.xAxisData[_index],
                  _yAxisConvert = this.unit === 0 ? _yAxis : this.temperatureSibsPipe.transform(_yAxis, [this.unit, 1]),
                  chartData = {
                    x: this.page === 'detail' && this.xAxisType === 'pointSecond' ? _xAxis * 1000 : _xAxis,
                    y: _yAxisConvert,
                    color: this.getColor(_yAxis, 'temperature')
                  };

            processedData.push(chartData);
            total += _yAxisConvert;
            if (_yAxisConvert > this.infoData.best) {
              this.infoData.best = _yAxisConvert;
            }

          });

          // 補上time = 0s的點
          if (processedData[0].x !== 0) {
            processedData = [{x: 0, y: 0, color: '#6e9bff'}, ...processedData];
          }

          this.infoData.avg = +(total / (processedData.length - 1)).toFixed(1);
          seriesSet = [{
            name: this.translate.instant('universal_activityData_power'),
            data: processedData,
            turboThreshold: 100000,
            showInLegend: false,
            color: {
              linearGradient : { x1: 0, x2: 0, y1: 1, y2: 0 },
              stops : [
                [0, '#6e9bff'],
                [0.9, '#75f25f'],
                [1, '#ea5757']
              ]
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

          this.createChart(chartOptions);
          break;
      }

    });

  }

  /**
   * 初始化最高（佳）及平均數據
   */
  initInfo() {
    this.infoData = {
      best: 0,
      avg: 0
    };
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
          case 1:
          case 2:
            // 超過220一律紅色
            return 220 - data < 0 ? `hsla(0, 70%, 65%, 1)` : `hsla(${220 - data}, 70%, 65%, 1)`;
          case 4:
          case 6:
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
      case 1:
        return 'universal_activityData_stepCadence';
      case 2:
        return 'universal_activityData_CyclingCadence';
      case 4:
        return 'universal_activityData_swimCadence';
      case 6:
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

  ngOnDestroy () {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

}


/*
Highcharts.chart('container', {

    title: {
        text: 'Solar Employment Growth by Sector, 2010-2016'
    },

    subtitle: {
        text: 'Source: thesolarfoundation.com'
    },

    yAxis: {
        title: {
            text: 'Number of Employees'
        }
    },

    xAxis: {
        accessibility: {
            rangeDescription: 'Range: 2010 to 2017'
        }
    },

    legend: {
        layout: 'vertical',
        align: 'right',
        verticalAlign: 'middle'
    },

    plotOptions: {
        series: {
            label: {
                connectorAllowed: false
            },
            pointStart: 2010
        }
    },

    series: [{
        name: 'Installation',
        color: {
          linearGradient : { x1: 0, x2: 0, y1: 1, y2: 0 },
          stops : [
          	[0/225, '#6e9bff'],
            [94/225, '#6e9bff'],
            [113/225, '#6bebf9'],
            [132/225, '#75f25f'],
            [151/225, '#f9cc3d'],
            [169/225, '#ff9a22'],
            [170/225, '#ea5757'],
            [225/225, '#ea5757']
          ]
        },
        marker: {
          enabled: false
        },
        data: [
        0,
          125,
          135,
          145,
          155,
          165,
          175,
          185,
          195,
          205,
          210,
          225,
          190,
          170,
          150,
          130,
          110,
          90
        ]
    }],

    responsive: {
        rules: [{
            condition: {
                maxWidth: 500
            },
            chartOptions: {
                legend: {
                    layout: 'horizontal',
                    align: 'center',
                    verticalAlign: 'bottom'
                }
            }
        }]
    }

});
*/