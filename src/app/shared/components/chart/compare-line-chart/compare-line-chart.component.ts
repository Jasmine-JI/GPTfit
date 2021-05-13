import { Component, OnInit, OnChanges, OnDestroy, ViewChild, ElementRef, Input } from '@angular/core';
import { chart } from 'highcharts';
import * as _Highcharts from 'highcharts';
import moment from 'moment';
import { TranslateService } from '@ngx-translate/core';
import {
  CompareLineTrendChart,
  DisplayPage,
  zoneColor,
  rightMoveColor,
  leftMoveColor,
  acclerateColor,
  hitColor,
  jumpColor,
  landingColor
} from '../../../models/chart-data';
import { unit, Unit } from '../../../models/bs-constant';
import { day, month, week } from '../../../models/utils-constant';

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
        },
        minPadding: 0.1,
        maxPadding: 0.03
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
  styleUrls: ['./compare-line-chart.component.scss', '../chart-share-style.scss']
})
export class CompareLineChartComponent implements OnInit, OnChanges, OnDestroy {
  noData = false;
  firstSunday: number;
  lastSunday: number;
  dataLength: number;
  chartType: string;

  @Input() data: any;
  @Input() dateRange: string;
  @Input() chartName: string;
  @Input() hrZoneRange: any;
  @Input() searchDate: Array<number>;
  @Input() chartHeight = <number>110;
  @Input() page: DisplayPage;
  @Input() unit = <Unit>unit.metric;
  @ViewChild('container', {static: false})
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
    if (
      this.searchDate
      && this.dateRange === 'week'
      && !this.noData
      && !['cloudrun', 'sportReport'].includes(this.page)
    ) {
      this.findDate();
    }

    this.initChart();
  }

  initChart () {
    let trendDataset;
    const chartData = [],
          chartBestData = [];
    switch (this.chartName) {
      case 'HR':
        this.chartType = 'hr';
        const hrTitle = this.translate.instant('universal_activityData_hr');
        if (this.page !== 'sportReport') {
          this.dataLength = this.data.date.length;
          for (let i = 0; i < this.dataLength; i++) {
            // 使用 Date.UTC(year, month - 1, day) 才能使highchart折線圖的點落在x軸軸線上
            const dateArr = moment(this.data.date[i]).format('YYYY-MM-DD').split('-'),
                  [year, month, day] = [...dateArr];
            chartData.push(
              this.assignColor(Date.UTC(+year, +month - 1, +day), this.data.HR[i], 'normal')
            );

            chartBestData.push(
              this.assignColor(Date.UTC(+year, +month - 1, +day), this.data.bestHR[i], 'best')
            );
          }

          
          trendDataset = [
            {
              name: hrTitle,
              data: chartBestData,
              showInLegend: false,
              color: '#ff9a22',
              marker: {
                symbol: 'circle'
              }
            },
            {
              name: hrTitle,
              data: chartData,
              showInLegend: false,
              color: '#75f25f',
              marker: {
                symbol: 'circle'
              }
            }
          ];

        } else {
          const { maxHrArr, hrArr } = this.data;
          this.dataLength = hrArr.length;
          trendDataset = [
            {
              name: hrTitle,
              data: maxHrArr,
              showInLegend: false,
              color: '#ff9a22',
              marker: {
                symbol: 'circle'
              }
            },
            {
              name: hrTitle,
              data: hrArr,
              showInLegend: false,
              color: '#75f25f',
              marker: {
                symbol: 'circle'
              }
            }
          ];

        }

        break;
      case 'Power':
        const powerTitle = this.translate.instant('universal_activityData_power');
        this.chartType = 'power';
        if (this.page !== 'sportReport') {
          this.dataLength = this.data.date.length;
          for (let i = 0; i < this.dataLength; i++) {
            // 使用 Date.UTC(year, month - 1, day) 才能使highchart折線圖的點落在x軸軸線上
            const dateArr = moment(this.data.date[i]).format('YYYY-MM-DD').split('-'),
                  [year, month, day] = [...dateArr];

            chartData.push(
              {
                x: Date.UTC(+year, +month - 1, +day),
                y: this.data.power[i],
                marker: {
                  enabled: true,
                  fillColor: '#75f25f'
                }
              }
            );

            chartBestData.push(
              {
                x: Date.UTC(+year, +month - 1, +day),
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
              name: powerTitle,
              data: chartBestData,
              showInLegend: false,
              color: '#ff9a22',
              marker: {
                symbol: 'circle'
              }
            },
            {
              name: powerTitle,
              data: chartData,
              showInLegend: false,
              color: '#72e8b0',
              marker: {
                symbol: 'circle'
              }
            }
          ];

        } else {
          this.dataLength = this.data.powerArr.length;
          trendDataset = [
            {
              name: powerTitle,
              data: this.data.maxPowerArr,
              showInLegend: false,
              color: '#ff9a22',
              marker: {
                fillColor: '#ea5757',
                symbol: 'circle'
              }
            },
            {
              name: powerTitle,
              data: this.data.powerArr,
              showInLegend: false,
              color: '#72e8b0',
              marker: {
                fillColor: '#75f25f',
                symbol: 'circle'
              }
            }
          ];

        }

        break;
      case 'ExtremeXGForce':
        const extremeRightMoveTitle = this.translate.instant('universal_activityData_maxRight'),
              extremeLeftMoveTitle = this.translate.instant('universal_activityData_maxLeft');
        this.chartType = 'xMoveGForce';
        this.dataLength = this.data.maxXArr.length;
          trendDataset = [
            {
              name: extremeRightMoveTitle,
              data: this.data.maxXArr,
              showInLegend: false,
              color: rightMoveColor,
              marker: {
                symbol: 'circle'
              }
            },
            {
              name: extremeLeftMoveTitle,
              data: this.data.minXArr,
              showInLegend: false,
              color: leftMoveColor,
              marker: {
                symbol: 'circle'
              }
            }
          ];
        break;
      case 'ExtremeYGForce':
        const extremeAccelateTitle = this.translate.instant('universal_activityData_maxAcceleration'),
              extremeHitTitle = this.translate.instant('universal_activityData_maxImpact');
        this.chartType = 'yMoveGForce';
        this.dataLength = this.data.maxYArr.length;
          trendDataset = [
            {
              name: extremeAccelateTitle,
              data: this.data.maxYArr,
              showInLegend: false,
              color: acclerateColor,
              marker: {
                symbol: 'circle'
              }
            },
            {
              name: extremeHitTitle,
              data: this.data.minYArr,
              showInLegend: false,
              color: hitColor,
              marker: {
                symbol: 'circle'
              }
            }
          ];
        break;
      case 'ExtremeZGForce':
        const extremeJumpTitle = this.translate.instant('universal_activityData_maxJump'),
              extremeLandingTitle = this.translate.instant('universal_activityData_maxFloorImpact');
        this.chartType = 'zMoveGForce';
        this.dataLength = this.data.maxZArr.length;
          trendDataset = [
            {
              name: extremeJumpTitle,
              data: this.data.maxZArr,
              showInLegend: false,
              color: jumpColor,
              marker: {
                symbol: 'circle'
              }
            },
            {
              name: extremeLandingTitle,
              data: this.data.minZArr,
              showInLegend: false,
              color: landingColor,
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
        for (let i = 0; i < this.dataLength; i++) {
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
            name: this.translate.instant('universal_userProfile_maxHr'),
            data: chartBestData,
            showInLegend: false,
            color: '#ababab',
            marker: {
              symbol: 'circle',
              height: 20
            }
          },
          {
            name: this.translate.instant('universal_userProfile_restHr'),
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
        for (let i = 0; i < this.dataLength; i++) {

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
            name: this.translate.instant('universal_userProfile_bodyWeight'),
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
        for (let i = 0; i < this.dataLength; i++) {

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
            name: this.translate.instant('universal_lifeTracking_fatRate'),
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
        for (let i = 0; i < this.dataLength; i++) {

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
            name: this.translate.instant('universal_userProfile_muscleRate'),
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

    const trendChartOptions = new ChartOptions(trendDataset);
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
            const startDate = moment(this.x).format('YYYY-MM-DD'),
                  value = parseFloat(this.point.y.toFixed(1));
            if (this.series.xAxis.tickInterval === month) {
              const endDate = moment(this.x + 6 * day).format('YYYY-MM-DD');
              return `${startDate}~${endDate}<br/>${this.series.name}: ${value}`;
            } else {
              return `${startDate}<br/>${this.series.name}: ${value}`;
            }

          }

        };

        // 設定圖表高度-kidin-1090221
        trendChartOptions['chart'].height = this.chartHeight;
        break;
      case 'ExtremeXGForce':
      case 'ExtremeYGForce':
      case 'ExtremeZGForce':
        // 設定浮動提示框顯示格式(小數點後3位)-kidin-1090204
        trendChartOptions['tooltip'] = {
          formatter: function () {
            const startDate = moment(this.x).format('YYYY-MM-DD'),
                  value = parseFloat(this.point.y.toFixed(3));
            if (this.series.xAxis.tickInterval === month) {
              const endDate = moment(this.x + 6 * day).format('YYYY-MM-DD');
              return `${startDate}~${endDate}<br/>${this.series.name}: ${value}`;
            } else {
              return `${startDate}<br/>${this.series.name}: ${value}`;
            }

          }

        };
        break;
    }

    if (this.page !== 'cloudrun') {
      // 設定圖表x軸時間間距-kidin-1090204
      if (this.dateRange === 'day' && this.dataLength <= 7) {
        trendChartOptions['xAxis'].tickInterval = day;  // 間距一天
      } else if (this.dateRange === 'day' && this.dataLength > 7) {
        trendChartOptions['xAxis'].tickInterval = week;  // 間距一週
      } else {
        trendChartOptions['xAxis'].tickInterval = month;  // 間距一個月
      }

    }

    this.createChart(trendChartOptions);
  }

  // 根據心率區間的值決定該點顏色-kidin-1090210
  assignColor (valueX: number | string, valueY: number, type: string) {
    if (this.hrZoneRange['z0'] !== null) {
      if (valueY < this.hrZoneRange['z0']) {
        return {
          x: valueX,
          y: valueY,
          marker: {
            enabled: true,
            fillColor: zoneColor[0]
          }
        };
      } else if (valueY >= this.hrZoneRange['z0'] && valueY < this.hrZoneRange['z1']) {
        return {
          x: valueX,
          y: valueY,
          marker: {
            enabled: true,
            fillColor: zoneColor[1]
          }
        };
      } else if (valueY >= this.hrZoneRange['z1'] && valueY < this.hrZoneRange['z2']) {
        return {
          x: valueX,
          y: valueY,
          marker: {
            enabled: true,
            fillColor: zoneColor[2]
          }
        };
      } else if (valueY >= this.hrZoneRange['z2'] && valueY < this.hrZoneRange['z3']) {
        return {
          x: valueX,
          y: valueY,
          marker: {
            enabled: true,
            fillColor: zoneColor[3]
          }
        };
      } else if (valueY >= this.hrZoneRange['z3'] && valueY < this.hrZoneRange['z4']) {
        return {
          x: valueX,
          y: valueY,
          marker: {
            enabled: true,
            fillColor: zoneColor[4]
          }
        };
      } else {
        return {
          x: valueX,
          y: valueY,
          marker: {
            enabled: true,
            fillColor: zoneColor[5]
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
      this.firstSunday = this.searchDate[0] - day * moment(this.searchDate[0]).isoWeekday();
    } else {
      this.firstSunday = this.searchDate[0];
    }

    if (moment(this.searchDate[0]).isoWeekday() !== 7) {
      this.lastSunday = this.searchDate[1] - day * moment(this.searchDate[1]).isoWeekday();
    } else {
      this.lastSunday = this.searchDate[1];
    }

  }

  // 確認取得元素才建立圖表-kidin-1090706
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

  ngOnDestroy () {}

}
