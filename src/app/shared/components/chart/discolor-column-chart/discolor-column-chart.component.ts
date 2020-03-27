import { Component, OnInit, OnChanges, OnDestroy, ViewChild, ElementRef, Input } from '@angular/core';

import { chart } from 'highcharts';
import * as _Highcharts from 'highcharts';
import * as moment from 'moment';
import { TranslateService } from '@ngx-translate/core';

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
        title: {
            text: ''
        },
        startOnTick: false,
        endOntick: true,
        minPadding: 0.001,
        maxPadding: 0.001,
        tickAmount: 1
      },
      plotOptions: {
        column: {
          pointPlacement: 0.3
        },
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

  dateList = [];
  highestPoint = 0;
  lowestPoint = 3600;
  dataLength: number;

  @Input() data: any;
  @Input() dateRange: string;
  @Input() sportType: string;
  @Input() chartName: string;
  @Input() searchDate: Array<number>;

  @ViewChild('container')
  container: ElementRef;

  constructor(
    private translate: TranslateService
  ) { }

  ngOnInit() {}

  ngOnChanges () {
    this.initChart();
  }

  initChart () {
    Highcharts.charts.length = 0;  // 初始化global highchart物件，可避免HighCharts.Charts為 undefined -kidin-1081212

    let trendDataset;
    const chartData = [];

    switch (this.chartName) {
      case 'Pace':
        this.dataLength = this.data.date.length;

        for (let i = 0; i < this.data.date.length; i++) {

          if (this.data.pace[i] > this.highestPoint) {
            this.highestPoint = this.data.pace[i];
          }

          if (this.data.bestPace[i] !== null && this.data.bestPace[i] < this.lowestPoint) {
            this.lowestPoint = this.data.bestPace[i];
          }

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
        this.dataLength = this.data.date.length;

        for (let i = 0; i < this.data.date.length; i++) {

          if (this.data.bestCadence[i] > this.highestPoint) {
            this.highestPoint = this.data.bestCadence[i];
          }

          if (this.data.cadence[i] !== null && this.data.cadence[i] < this.lowestPoint) {
            this.lowestPoint = this.data.cadence[i];
          }

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
        this.dataLength = this.data.date.length;

        for (let i = 0; i < this.data.date.length; i++) {

          if (this.data.swolf[i] > this.highestPoint) {
            this.highestPoint = this.data.swolf[i];
          }

          if (this.data.bestSwolf[i] !== null && this.data.bestSwolf[i] < this.lowestPoint) {
            this.lowestPoint = this.data.bestSwolf[i];
          }

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
        this.dataLength = this.data.date.length;

        for (let i = 0; i < this.data.date.length; i++) {

          if (this.data.bestSpeed[i] > this.highestPoint) {
            this.highestPoint = this.data.bestSpeed[i];
          }

          if (this.data.speed[i] !== null && this.data.speed[i] < this.lowestPoint) {
            this.lowestPoint = this.data.speed[i];
          }

          chartData.push(
            {
              x: this.data.date[i],
              y: this.data.bestSpeed[i],
              low: this.data.speed[i]
            }
          );
        }
        break;
      case 'Step': // 生活追蹤步數資料-kidin-1090218
        this.createDateList();
        const newData = [],
              newTargetData = [];
        let index = 0;
        this.dataLength = this.dateList.length;

        for (let i = 0; i < this.dateList.length; i++) {
          if (this.dateList[i] === this.data.date[index]) {
            newData.push(this.data.stepList[index]);
            newTargetData.push(this.data.targetStepList[index]);
            index++;
          } else {
            newData.push(0);
            newTargetData.push(0);
          }
        }

        for (let i = 0; i < this.dateList.length; i++) {
          if (newData[i] - newTargetData[i] >= 0) {
            chartData.push(
              {
                x: this.dateList[i],
                y: newData[i],
                z: newData[i],  // tooltip數據用-kidin-1090218
                t: newTargetData[i],  // tooltip數據用-kidin-1090218
                color: this.data.colorSet[2]
              }
            );
          } else {
            const discolorPoint = newData[i] / newTargetData[i];
            chartData.push(
              {
                x: this.dateList[i],
                y: newTargetData[i],
                z: newData[i],  // tooltip數據用-kidin-1090218
                t: newTargetData[i],  // tooltip數據用-kidin-1090218
                color: {
                  linearGradient: {
                    x1: 0,
                    x2: 0,
                    y1: 1,
                    y2: 0
                  },
                  stops: [
                    [0, this.data.colorSet[0]],
                    [discolorPoint, this.data.colorSet[0]],
                    [discolorPoint + 0.01, this.data.colorSet[1]],
                    [1, this.data.colorSet[1]]
                  ]
                }
              }
            );
          }
        }
        break;
    }

    if (this.chartName === 'Step') {
      trendDataset = [
        {
          name: [this.translate.instant('other.StepCount'), this.translate.instant('other.targetStep')],
          data: chartData,
          showInLegend: false
        }
      ];
    } else {
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
    }


    const trendChartOptions = new ChartOptions(trendDataset),
          trendChartDiv = this.container.nativeElement;

    switch (this.chartName) {
      case 'Pace':
        trendChartOptions['yAxis'].reversed = true; // 將y軸反轉-kidin-1090206
        trendChartOptions['yAxis'].max = this.highestPoint + 1;
        trendChartOptions['yAxis'].min = this.lowestPoint - 1;

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
        trendChartOptions['yAxis'].max = this.highestPoint + 1;
        trendChartOptions['yAxis'].min = this.lowestPoint - 1;

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
        trendChartOptions['yAxis'].max = this.highestPoint + 1;
        trendChartOptions['yAxis'].min = this.lowestPoint - 1;

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
        trendChartOptions['yAxis'].max = this.highestPoint + 1;
        trendChartOptions['yAxis'].min = this.lowestPoint - 1;

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
      case 'Step':
        // 設定浮動提示框顯示格式-kidin-1090204
        trendChartOptions['tooltip'] = {
          formatter: function () {
            if (this.series.xAxis.tickInterval === 30 * 24 * 4600 * 1000) {
              return `${moment(this.x).format('YYYY/MM/DD')}~${moment(this.x + 6 * 24 * 3600 * 1000).format('YYYY/MM/DD')}
                <br/>${this.series.name[1]}: ${this.point.t.toFixed(1)}
                <br/>${this.series.name[0]}: ${this.point.z.toFixed(1)}`;

            } else {
              return `${moment(this.x).format('YYYY/MM/DD')}
                <br/>${this.series.name[1]}: ${this.point.t.toFixed(1)}
                <br/>${this.series.name[0]}: ${this.point.z.toFixed(1)}`;
            }
          }
        };

        // 設定圖表高度-kidin-1090221
        trendChartOptions['chart'].height = 170;

        // 設定柱子寬度-kidin-1090324
        trendChartOptions['plotOptions'].series['pointWidth'] = null;

        break;
    }

    // 設定圖表x軸時間間距-kidin-1090204
    if (this.dateRange === 'day' && this.dataLength <= 7) {
      trendChartOptions['xAxis'].tickInterval = 24 * 3600 * 1000;  // 間距一天
    } else if (this.dateRange === 'day' && this.dataLength > 7) {
      trendChartOptions['xAxis'].tickInterval = 7 * 24 * 3600 * 1000;  // 間距一週
    } else {
      trendChartOptions['xAxis'].tickInterval = 30 * 24 * 4600 * 1000;  // 間距一個月
    }

    // 根據圖表清單依序將圖表顯示出來-kidin-1081217
    setTimeout(() => {
      chart(trendChartDiv, trendChartOptions);
    }, 0);

  }

  // 根據搜尋期間，列出日期清單供圖表使用-kidin-1090220
  createDateList () {
    let diff,
        weekStartDay,
        weekEndDay;
    if (this.dateRange === 'day') {
      diff = (this.searchDate[1] - this.searchDate[0]) / (86400 * 1000);

      for (let i = 0; i < diff + 1; i++) {
        this.dateList.push(this.searchDate[0] + 86400 * 1000 * i);
      }

    } else if (this.dateRange === 'week') {

      // 周報告開頭是星期日-kidin-1090220
      if (moment(this.searchDate[0]).isoWeekday() !== 7) {
        weekStartDay = this.searchDate[0] + 86400 * 1000 * (7 - moment(this.searchDate[0]).isoWeekday());
      } else {
        weekStartDay = this.searchDate[0];
      }

      if (moment(this.searchDate[0]).isoWeekday() !== 7) {
        weekEndDay = this.searchDate[1] - 86400 * 1000 * moment(this.searchDate[1]).isoWeekday();
      } else {
        weekEndDay = this.searchDate[1];
      }

      diff = (weekEndDay - weekStartDay) / (86400 * 1000 * 7);

      for (let i = 0; i < diff + 1; i++) {
        this.dateList.push(weekStartDay + 86400 * 1000 * 7 * i);
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
