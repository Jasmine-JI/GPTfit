import { Component, OnInit, OnChanges, OnDestroy, ViewChild, ElementRef, Input } from '@angular/core';

import { chart } from 'highcharts';
import * as _Highcharts from 'highcharts';
import * as moment from 'moment';

const Highcharts: any = _Highcharts; // 不檢查highchart型態

// 建立圖表用-kidin-1081212
class ChartOptions {
  constructor (dataset) {
    return {
      chart: {
        type: 'spline',
        height: 110
      },
      title: {
        text: ''
      },
      credits: {
        enabled: false
      },
      xAxis: {
        type: 'datetime',
        dateTimeLabelFormats: {
          millisecond: '%m/%d',
          second: '%m/%d',
          minute: '%m/%d',
          hour: '%m/%d',
          day: '%m/%d',
          week: '%m/%d',
          month: '%Y/%m',
          year: '%Y'
        }
      },
      yAxis: {
        min: 0,
        title: {
            text: ''
        }
      },
      plotOptions: {
        series: {
          pointWidth: 10,
          borderRadius: 5
        }
      },
      tooltip: {},
      series: dataset
    };
  }
}

@Component({
  selector: 'app-compare-line-chart',
  templateUrl: './compare-line-chart.component.html',
  styleUrls: ['./compare-line-chart.component.scss']
})
export class CompareLineChartComponent implements OnInit, OnChanges, OnDestroy {
  @Input() data: any;
  @Input() dateRange: string;
  @Input() sportType: string;
  @Input() chartName: string;
  @Input() HRSetting: any;

  @ViewChild('container')
  container: ElementRef;

  hrZoneRange = {
    z0: null,
    z1: null,
    z2: null,
    z3: null,
    z4: null,
    z5: null,
  };

  constructor() { }

  ngOnInit() {}

  ngOnChanges () {
    this.initChart();
  }

  initChart () {
    // 將之前生成的highchart卸除避免新生成的highchart無法顯示-kidin-1081219
    Highcharts.charts.forEach((_highChart, idx) => {
      if (_highChart !== undefined) {
        _highChart.destroy();
      }
    });
    Highcharts.charts.length = 0;  // 初始化global highchart物件，可避免HighCharts.Charts為 undefined -kidin-1081212

    let trendDataset;
    const chartData = [],
          chartBestData = [];

    switch (this.chartName) {
      case 'HR':
        this.countHRRange();
        for (let i = 0; i < this.data.date.length; i++) {
          chartData.push(
            this.assignColor(this.data.date[i], this.data.HR[i], 'normal')
          );

          chartBestData.push(
            this.assignColor(this.data.date[i], this.data.bestHR[i], 'best')
          );
        }

        trendDataset = [
          {
            name: this.chartName,
            data: chartBestData,
            showInLegend: false,
            color: '#ff9a22',
            marker: {
              symbol: 'triangle-down'
            }
          },
          {
            name: this.chartName,
            data: chartData,
            showInLegend: false,
            color: '#75f25f',
            marker: {
              symbol: 'triangle'
            }
          }
        ];

        break;
      case 'Power':
        for (let i = 0; i < this.data.date.length; i++) {
          chartData.push(
            {
              x: this.data.date[i],
              y: this.data.power[i],
              marker: {
                enabled: true,
                fillColor: '#75f25f'
              }
            }
          );

          chartBestData.push(
            {
              x: this.data.date[i],
              y: this.data.bestPower[i],
              marker: {
                enabled: true,
                fillColor: '#ea5757'
              }
            }
          );
        }

        trendDataset = [
          {
            name: this.chartName,
            data: chartBestData,
            showInLegend: false,
            color: '#ff9a22',
            marker: {
              symbol: 'diamond'
            }
          },
          {
            name: this.chartName,
            data: chartData,
            showInLegend: false,
            color: '#72e8b0',
            marker: {
              symbol: 'square'
            }
          }
        ];
    }

    const trendChartOptions = new ChartOptions(trendDataset),
          trendChartDiv = this.container.nativeElement;

    switch (this.chartName) {
      case 'HR':
        // 設定浮動提示框顯示格式-kidin-1090204
        trendChartOptions['tooltip'] = {
          formatter: function () {
            if (this.series.xAxis.tickInterval === 30 * 24 * 4600 * 1000) {
              return `${moment(this.x).format('YYYY/MM/DD')}~${moment(this.x + 6 * 24 * 3600 * 1000).format('YYYY/MM/DD')}
                <br/>${this.series.name}: ${this.point.y}`;
            } else {
              return `${moment(this.x).format('YYYY/MM/DD')}
                <br/>${this.series.name}: ${this.point.y}`;
            }
          }

        };

        break;
      case 'Power':
        // 設定浮動提示框顯示格式-kidin-1090204
        trendChartOptions['tooltip'] = {
          formatter: function () {
            if (this.series.xAxis.tickInterval === 30 * 24 * 4600 * 1000) {
              return `${moment(this.x).format('YYYY/MM/DD')}~${moment(this.x + 6 * 24 * 3600 * 1000).format('YYYY/MM/DD')}
                <br/>${this.series.name}: ${this.point.y}`;
            } else {
              return `${moment(this.x).format('YYYY/MM/DD')}
                <br/>${this.series.name}: ${this.point.y}`;
            }
          }

        };
        break;
    }

    // 設定圖表x軸時間間距-kidin-1090204
    if (this.dateRange === 'day') {
      trendChartOptions['xAxis'].tickInterval = 7 * 24 * 3600 * 1000;  // 間距一週
    } else {
      trendChartOptions['xAxis'].tickInterval = 30 * 24 * 4600 * 1000;  // 間距一個月
    }

    // 根據圖表清單依序將圖表顯示出來-kidin-1081217
    setTimeout(() => {
      chart(trendChartDiv, trendChartOptions);
    }, 0);

  }

  // 先計算出心率區間-kidin-1090210
  countHRRange () {
    const { userHRBase, userAge, userMaxHR, userRestHR } = this.HRSetting;

    if (userAge !== null) {
      if (userMaxHR && userRestHR) {
        if (userHRBase === 0) {
          // 區間數值採無條件捨去法
          this.hrZoneRange['z0'] = Math.floor((220 - userAge) * 0.5);
          this.hrZoneRange['z1'] = Math.floor((220 - userAge) * 0.6 - 1);
          this.hrZoneRange['z2'] = Math.floor((220 - userAge) * 0.7 - 1);
          this.hrZoneRange['z3'] = Math.floor((220 - userAge) * 0.8 - 1);
          this.hrZoneRange['z4'] = Math.floor((220 - userAge) * 0.9 - 1);
          this.hrZoneRange['z5'] = Math.floor((220 - userAge) * 1);
        } else {
          this.hrZoneRange['z0'] = (userMaxHR - userRestHR) * (0.55) + userRestHR;
          this.hrZoneRange['z1'] = (userMaxHR - userRestHR) * (0.6) + userRestHR;
          this.hrZoneRange['z2'] = (userMaxHR - userRestHR) * (0.65) + userRestHR;
          this.hrZoneRange['z3'] = (userMaxHR - userRestHR) * (0.75) + userRestHR;
          this.hrZoneRange['z4'] = (userMaxHR - userRestHR) * (0.85) + userRestHR;
          this.hrZoneRange['z5'] = (userMaxHR - userRestHR) * (1) + userRestHR;
        }
      } else {
        if (userHRBase === 0) {
          // 區間數值採無條件捨去法
          this.hrZoneRange['z0'] = Math.floor((220 - userAge) * 0.5);
          this.hrZoneRange['z1'] = Math.floor((220 - userAge) * 0.6 - 1);
          this.hrZoneRange['z2'] = Math.floor((220 - userAge) * 0.7 - 1);
          this.hrZoneRange['z3'] = Math.floor((220 - userAge) * 0.8 - 1);
          this.hrZoneRange['z4'] = Math.floor((220 - userAge) * 0.9 - 1);
          this.hrZoneRange['z5'] = Math.floor((220 - userAge) * 1);
        } else {
          this.hrZoneRange['z0'] = ((220 - userAge) - userRestHR) * (0.55) + userRestHR;
          this.hrZoneRange['z1'] = ((220 - userAge) - userRestHR) * (0.6) + userRestHR;
          this.hrZoneRange['z2'] = ((220 - userAge) - userRestHR) * (0.65) + userRestHR;
          this.hrZoneRange['z3'] = ((220 - userAge) - userRestHR) * (0.75) + userRestHR;
          this.hrZoneRange['z4'] = ((220 - userAge) - userRestHR) * (0.85) + userRestHR;
          this.hrZoneRange['z5'] = ((220 - userAge) - userRestHR) * (1) + userRestHR;
        }
      }
    }
  }

  // 根據心率區間的值決定該點顏色-kidin-1090210
  assignColor (valueX: string, valueY: number, type: string) {
    if (this.hrZoneRange['z0'] !== null) {
      if (valueY < this.hrZoneRange['z0']) {
        return {
          x: valueX,
          y: valueY,
          marker: {
            enabled: true,
            fillColor: '#70b1f3'
          }
        };
      } else if (valueY >= this.hrZoneRange['z0'] && valueY < this.hrZoneRange['z1']) {
        return {
          x: valueX,
          y: valueY,
          marker: {
            enabled: true,
            fillColor: '#64e0ec'
          }
        };
      } else if (valueY >= this.hrZoneRange['z1'] && valueY < this.hrZoneRange['z2']) {
        return {
          x: valueX,
          y: valueY,
          marker: {
            enabled: true,
            fillColor: '#abf784'
          }
        };
      } else if (valueY >= this.hrZoneRange['z2'] && valueY < this.hrZoneRange['z3']) {
        return {
          x: valueX,
          y: valueY,
          marker: {
            enabled: true,
            fillColor: '#f7f25b'
          }
        };
      } else if (valueY >= this.hrZoneRange['z3'] && valueY < this.hrZoneRange['z4']) {
        return {
          x: valueX,
          y: valueY,
          marker: {
            enabled: true,
            fillColor: '#f3b353'
          }
        };
      } else {
        return {
          x: valueX,
          y: valueY,
          marker: {
            enabled: true,
            fillColor: '#f36953'
          }
        };
      }

    } else {
      if (type === 'normal') {
        return {
          x: valueX,
          y: valueY,
          marker: {
            enabled: true,
            fillColor: '#9b70e0'
          }
        };
      } else {
        return {
          x: valueX,
          y: valueY,
          marker: {
            enabled: true,
            fillColor: '#6e9bff'
          }
        };
      }

    }
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
