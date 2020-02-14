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
        type: 'column',
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
  selector: 'app-discolor-column-chart',
  templateUrl: './discolor-column-chart.component.html',
  styleUrls: ['./discolor-column-chart.component.scss']
})
export class DiscolorColumnChartComponent implements OnInit, OnChanges, OnDestroy {

  @Input() data: any;
  @Input() dateRange: string;
  @Input() sportType: string;
  @Input() chartName: string;

  @ViewChild('container')
  container: ElementRef;

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
    const chartData = [];

    switch (this.chartName) {
      case 'Pace':
        for (let i = 0; i < this.data.date.length; i++) {
          chartData.push(
            {
              x: this.data.date[i],
              y: this.data.bestPace[i],
              low: this.data.pace[i]
            }
          );
        }

        break;
      case 'Cadence':
        for (let i = 0; i < this.data.date.length; i++) {
          chartData.push(
            {
              x: this.data.date[i],
              y: this.data.bestCadence[i],
              low: this.data.cadence[i]
            }
          );
        }
        break;
      case 'Swolf':
        for (let i = 0; i < this.data.date.length; i++) {
          chartData.push(
            {
              x: this.data.date[i],
              y: this.data.swolf[i],
              low: this.data.bestSwolf[i]
            }
          );
        }
        break;
      case 'Speed':
        for (let i = 0; i < this.data.date.length; i++) {
          chartData.push(
            {
              x: this.data.date[i],
              y: this.data.bestSpeed[i],
              low: this.data.speed[i]
            }
          );
        }
        break;
    }

    trendDataset = [
      {
        name: this.chartName,
        data: chartData,
        showInLegend: false,
        color: {
          linearGradient: {
            x1: 0,
            x2: 0,
            y1: 0,
            y2: 1
          },
          stops: [
            [0, this.data.colorSet[2]],
            [0.5, this.data.colorSet[1]],
            [1, this.data.colorSet[0]]
          ]
        }
      }
    ];

    const trendChartOptions = new ChartOptions(trendDataset),
          trendChartDiv = this.container.nativeElement;

    switch (this.chartName) {
      case 'Pace':
        trendChartOptions['yAxis'].reversed = true; // 將y軸反轉-kidin-1090206
        trendChartOptions['yAxis'].max = 3600;

        // 設定圖表y軸單位格式-kidin-1090204
        trendChartOptions['yAxis'].labels = {
          formatter: function () {
            if (this.value > 3600) {
              this.value = 3600;
            }
            const yVal = this.value,
                  paceMin = Math.floor(yVal / 60),
                  paceSec = Math.round(yVal - paceMin * 60),
                  timeMin = ('0' + paceMin).slice(-2),
                  timeSecond = ('0' + paceSec).slice(-2);

            if (timeMin === '00') {
              return `0'${timeSecond}`;
            } else {
              return `${timeMin}'${timeSecond}`;
            }
          }
        };

        // 設定浮動提示框顯示格式-kidin-1090204
        trendChartOptions['tooltip'] = {
          formatter: function () {
            const y = this.point.low,
                  paceMin = Math.floor(y / 60),
                  pacesecond = Math.round(y - paceMin * 60),
                  timeMin = ('0' + paceMin).slice(-2),
                  timeSecond = ('0' + pacesecond).slice(-2);

            let bottomPace = '';

            if (timeMin === '00') {
              bottomPace = `0'${timeSecond}`;
            } else {
              bottomPace = `${timeMin}'${timeSecond}`;
            }

            const yBest = this.point.y,
                  bestMin = Math.floor(yBest / 60),
                  bestSecond = Math.round(yBest - bestMin * 60),
                  timeBestMin = ('0' + bestMin).slice(-2),
                  timeBestSecond = ('0' + bestSecond).slice(-2);

            let paceBestTime = '';

            if (timeBestMin === '00') {
              paceBestTime = `0'${timeBestSecond}`;
            } else {
              paceBestTime = `${timeBestMin}'${timeBestSecond}`;
            }

            if (this.series.xAxis.tickInterval === 30 * 24 * 4600 * 1000) {
              return `${moment(this.x).format('YYYY/MM/DD')}~${moment(this.x + 6 * 24 * 3600 * 1000).format('YYYY/MM/DD')}
                <br/>Best Pace: ${paceBestTime}
                <br/>${this.series.name}: ${bottomPace}`;
            } else {
              return `${moment(this.x).format('YYYY/MM/DD')}
                <br/>Best Pace: ${paceBestTime}
                <br/>${this.series.name}: ${bottomPace}`;
            }

          }

        };

        break;
      case 'Cadence':
        // 設定浮動提示框顯示格式-kidin-1090204
        trendChartOptions['tooltip'] = {
          formatter: function () {
            if (this.series.xAxis.tickInterval === 30 * 24 * 4600 * 1000) {
              return `${moment(this.x).format('YYYY/MM/DD')}~${moment(this.x + 6 * 24 * 3600 * 1000).format('YYYY/MM/DD')}
                <br/>Best Candence: ${this.point.y}
                <br/>${this.series.name}: ${this.point.low}`;
            } else {
              return `${moment(this.x).format('YYYY/MM/DD')}
                <br/>Best Candence: ${this.point.y}
                <br/>${this.series.name}: ${this.point.low}`;
            }

          }

        };
        break;
      case 'Swolf':
        trendChartOptions['yAxis'].reversed = true; // 將y軸反轉-kidin-1090206

        // 設定浮動提示框顯示格式-kidin-1090204
        trendChartOptions['tooltip'] = {
          formatter: function () {
            if (this.series.xAxis.tickInterval === 30 * 24 * 4600 * 1000) {
              return `${moment(this.x).format('YYYY/MM/DD')}~${moment(this.x + 6 * 24 * 3600 * 1000).format('YYYY/MM/DD')}
                <br/>Best Swolf: ${this.point.low}
                <br/>${this.series.name}: ${this.point.y}`;
            } else {
              return `${moment(this.x).format('YYYY/MM/DD')}
                <br/>Best Swolf: ${this.point.low}
                <br/>${this.series.name}: ${this.point.y}`;
            }

          }

        };
        break;
      case 'Speed':
        // 設定浮動提示框顯示格式-kidin-1090204
        trendChartOptions['tooltip'] = {
          formatter: function () {
            if (this.series.xAxis.tickInterval === 30 * 24 * 4600 * 1000) {
              return `${moment(this.x).format('YYYY/MM/DD')}~${moment(this.x + 6 * 24 * 3600 * 1000).format('YYYY/MM/DD')}
                <br/>Best Speed: ${this.point.y}
                <br/>${this.series.name}: ${this.point.low}`;
            } else {
              return `${moment(this.x).format('YYYY/MM/DD')}
                <br/>Best Speed: ${this.point.y}
                <br/>${this.series.name}: ${this.point.low}`;
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

  ngOnDestroy () {
    // 將之前生成的highchart卸除避免新生成的highchart無法顯示-kidin-1081219
    Highcharts.charts.forEach((_highChart, idx) => {
      if (_highChart !== undefined) {
        _highChart.destroy();
      }
    });
  }

}
