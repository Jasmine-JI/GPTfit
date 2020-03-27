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
        title: {
            text: ''
        },
        minPadding: 0.01,
        maxPadding: 0.01,
        tickAmount: 1
      },
      plotOptions: {
        series: {
          connectNulls: true
        },
        spline: {
          pointPlacement: 'on'
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

  noData = false;

  firstSunday: number;
  lastSunday: number;
  dataLength: number;

  @Input() data: any;
  @Input() dateRange: string;
  @Input() sportType: string;
  @Input() chartName: string;
  @Input() hrZoneRange: any;
  @Input() searchDate: Array<number>;
  @Input() chartHeight: number;

  @ViewChild('container')
  container: ElementRef;

  constructor(
    private translate: TranslateService
  ) { }

  ngOnInit() {}

  ngOnChanges () {

    if (this.data.fatRateList && this.data.fatRateList.length === 0) {
      this.noData = true;
    }

    // 若為週報告，則先求得報告頭尾的日期-kidin-1090220
    if (this.searchDate && this.dateRange === 'week' && !this.noData) {
      this.findDate();
    }

    this.initChart();
  }

  initChart () {
    Highcharts.charts.length = 0;  // 初始化global highchart物件，可避免HighCharts.Charts為 undefined -kidin-1081212

    let trendDataset;
    const chartData = [],
          chartBestData = [];

    switch (this.chartName) {
      case 'HR':
        this.dataLength = this.data.date.length;

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
              symbol: 'circle'
            }
          },
          {
            name: this.chartName,
            data: chartData,
            showInLegend: false,
            color: '#75f25f',
            marker: {
              symbol: 'circle'
            }
          }
        ];

        break;
      case 'Power':
        this.dataLength = this.data.date.length;

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
              symbol: 'circle'
            }
          },
          {
            name: this.chartName,
            data: chartData,
            showInLegend: false,
            color: '#72e8b0',
            marker: {
              symbol: 'circle'
            }
          }
        ];

        break;
      case 'LifeHR':

        // 若搜尋的第一天（週）或最後一天（週）沒有數據，則用前後數據遞補-kidin-1090220
        if (this.dateRange === 'week') {

          if (this.data.date[0] !== this.firstSunday) {
            this.data.date.unshift(this.firstSunday);
            this.data.restHRList.unshift(this.data.restHRList[0]);
            this.data.maxHRList.unshift(this.data.maxHRList[0]);
          }

          if (this.data.date[this.data.date.length - 1] !== this.lastSunday) {
            this.data.date.push(this.lastSunday);
            this.data.restHRList.push(this.data.restHRList[this.data.date.length - 1]);
            this.data.maxHRList.push(this.data.maxHRList[this.data.date.length - 1]);
          }

        } else {

          if (this.data.date[0] !== this.searchDate[0]) {
            this.data.date.unshift(this.searchDate[0]);
            this.data.restHRList.unshift(this.data.restHRList[0]);
            this.data.maxHRList.unshift(this.data.maxHRList[0]);
          }

          if (this.data.date[this.data.date.length - 1] !== this.searchDate[1]) {
            this.data.date.push(this.searchDate[1]);
            this.data.restHRList.push(this.data.restHRList[this.data.date.length - 1]);
            this.data.maxHRList.push(this.data.maxHRList[this.data.date.length - 1]);
          }
        }

        this.dataLength = this.data.date.length;

        for (let i = 0; i < this.data.date.length; i++) {
          chartData.push(
            {
              x: this.data.date[i],
              y: this.data.restHRList[i],
              marker: {
                enabled: true,
                fillColor: '#31df93'
              }
            }
          );

          chartBestData.push(
            {
              x: this.data.date[i],
              y: this.data.maxHRList[i],
              marker: {
                enabled: true,
                fillColor: '#e23333'
              }
            }
          );
        }

        trendDataset = [
          {
            name: this.translate.instant('SH.maxHr'),
            data: chartBestData,
            showInLegend: false,
            color: '#ababab',
            marker: {
              symbol: 'circle',
              height: 20
            }
          },
          {
            name: this.translate.instant('Dashboard.Settings.restHr'),
            data: chartData,
            showInLegend: false,
            color: '#ababab',
            marker: {
              symbol: 'circle',
              height: 20
            }
          }
        ];

        break;
      case 'Weight':

        trendDataset = [];
        this.dataLength = this.data.weightList.length;

        for (let i = 0; i < this.data.weightList.length; i++) {

          // 若搜尋的第一天（週）或最後一天（週）沒有數據，則用前後數據遞補-kidin-1090220
          const weightData = this.data.weightList[i];
          if (this.dateRange === 'week') {

            if (weightData[0][0] !== this.firstSunday) {
              weightData.unshift([this.firstSunday, weightData[0][1]]);
            }

            if (weightData[weightData.length - 1][0] !== this.lastSunday) {
              weightData.push([this.lastSunday, weightData[weightData.length - 1][1]]);
            }

          } else {

            if (weightData[0][0] !== this.searchDate[0]) {
              weightData.unshift([this.searchDate[0], weightData[0][1]]);
            }

            if (weightData[weightData.length - 1][0] !== this.searchDate[1]) {
              weightData.push([this.searchDate[1], weightData[weightData.length - 1][1]]);
            }
          }

          trendDataset.push({
            name: this.translate.instant('Portal.bodyWeight'),
            data: weightData,
            showInLegend: false,
            color: this.data.colorSet,
            marker: {
              enabled: false
            }
          });
        }

        break;
      case 'FatRate':

        trendDataset = [];
        this.dataLength = this.data.fatRateList.length;

        for (let i = 0; i < this.data.fatRateList.length; i++) {

          // 若搜尋的第一天（週）或最後一天（週）沒有數據，則用前後數據遞補-kidin-1090220
          const fatRateData = this.data.fatRateList[i];
          if (this.dateRange === 'week') {

            if (fatRateData[0][0] !== this.firstSunday) {
              fatRateData.unshift([this.firstSunday, fatRateData[0][1]]);
            }

            if (fatRateData[fatRateData.length - 1][0] !== this.lastSunday) {
              fatRateData.push([this.lastSunday, fatRateData[fatRateData.length - 1][1]]);
            }

          } else {

            if (fatRateData[0][0] !== this.searchDate[0]) {
              fatRateData.unshift([this.searchDate[0], fatRateData[0][1]]);
            }

            if (fatRateData[fatRateData.length - 1][0] !== this.searchDate[1]) {
              fatRateData.push([this.searchDate[1], fatRateData[fatRateData.length - 1][1]]);
            }
          }

          trendDataset.push({
            name: this.translate.instant('other.fatRate'),
            data: fatRateData,
            showInLegend: false,
            color: this.data.fatRateColorSet,
            marker: {
              enabled: false
            }
          });
        }

        break;
      case 'MuscleRate':

        trendDataset = [];
        this.dataLength = this.data.muscleRateList.length;

        for (let i = 0; i < this.data.muscleRateList.length; i++) {

          // 若搜尋的第一天（週）或最後一天（週）沒有數據，則用前後數據遞補-kidin-1090220
          const muscleRateData = this.data.muscleRateList[i];
          if (this.dateRange === 'week') {

            if (muscleRateData[0][0] !== this.firstSunday) {
              muscleRateData.unshift([this.firstSunday, muscleRateData[0][1]]);
            }

            if (muscleRateData[muscleRateData.length - 1][0] !== this.lastSunday) {
              muscleRateData.push([this.lastSunday, muscleRateData[muscleRateData.length - 1][1]]);
            }

          } else {

            if (muscleRateData[0][0] !== this.searchDate[0]) {
              muscleRateData.unshift([this.searchDate[0], muscleRateData[0][1]]);
            }

            if (muscleRateData[muscleRateData.length - 1][0] !== this.searchDate[1]) {
              muscleRateData.push([this.searchDate[1], muscleRateData[muscleRateData.length - 1][1]]);
            }
          }

          trendDataset.push({
            name: this.translate.instant('other.muscleRate'),
            data: muscleRateData,
            showInLegend: false,
            color: this.data.muscleRateColorSet,
            marker: {
              enabled: false
            }
          });
        }

        break;
    }

    const trendChartOptions = new ChartOptions(trendDataset),
          trendChartDiv = this.container.nativeElement;

    // 以後可能會個別設定，故不寫死-kidin-1090221
    switch (this.chartName) {
      case 'HR':
      case 'Power':
      case 'Weight':
      case 'FatRate':
      case 'MuscleRate':
      case 'LifeHR':
        // 設定浮動提示框顯示格式-kidin-1090204
        trendChartOptions['tooltip'] = {
          formatter: function () {
            if (this.series.xAxis.tickInterval === 30 * 24 * 4600 * 1000) {
              return `${moment(this.x).format('YYYY/MM/DD')}~${moment(this.x + 6 * 24 * 3600 * 1000).format('YYYY/MM/DD')}
                <br/>${this.series.name}: ${this.point.y.toFixed(1)}`;
            } else {
              return `${moment(this.x).format('YYYY/MM/DD')}
                <br/>${this.series.name}: ${this.point.y.toFixed(1)}`;
            }
          }

        };

        // 設定圖表高度-kidin-1090221
        trendChartOptions['chart'].height = this.chartHeight;

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

  // 根據搜索時間取得周報告第一周的開始日期和最後一週的開始日期-kidin-1090220
  findDate () {

    // 周報告開頭是星期日-kidin-1090220
    if (moment(this.searchDate[0]).isoWeekday() !== 7) {
      this.firstSunday = this.searchDate[0] + 86400 * 1000 * (7 - moment(this.searchDate[0]).isoWeekday());
    } else {
      this.firstSunday = this.searchDate[0];
    }

    if (moment(this.searchDate[0]).isoWeekday() !== 7) {
      this.lastSunday = this.searchDate[1] - 86400 * 1000 * moment(this.searchDate[1]).isoWeekday();
    } else {
      this.lastSunday = this.searchDate[1];
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
