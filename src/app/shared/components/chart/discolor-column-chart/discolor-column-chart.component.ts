import { Component, OnInit, OnChanges, OnDestroy, ViewChild, ElementRef, Input } from '@angular/core';
import { chart } from 'highcharts';
import * as _Highcharts from 'highcharts';
import moment from 'moment';
import { TranslateService } from '@ngx-translate/core';
import {
  DiscolorTrendData,
  DisplayPage,
  paceTrendColor,
  speedTrendColor,
  cadenceTrendColor,
  swolfTrendColor
} from '../../../models/chart-data';
import { Unit, unit } from '../../../models/bs-constant';
import { SportType, SportCode } from '../../../models/report-condition';
import { DataTypeTranslatePipe } from '../../../pipes/data-type-translate.pipe';
import { day, month, week } from '../../../models/utils-constant';
import { UtilsService } from '../../../services/utils.service';

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
          pointPlacement: 0.33
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
  styleUrls: ['./discolor-column-chart.component.scss', '../chart-share-style.scss']
})
export class DiscolorColumnChartComponent implements OnInit, OnChanges, OnDestroy {
  dateList = [];
  highestPoint = 0;
  lowestPoint = 3600;
  dataLength: number;
  chartType: string;
  chartTitle: Array<string>;

  @Input() data: any;
  @Input() dateRange: string;
  @Input() chartName: string;
  @Input() searchDate: Array<number>;
  @Input() userWeight: number;
  @Input() proficiencyCoefficient: number;
  @Input() page: DisplayPage;
  @Input() sportType = <SportType>SportCode.run;
  @Input() unit: Unit;


  @ViewChild('container', {static: true})
  container: ElementRef;

  constructor(
    private translate: TranslateService,
    private dataTypeTranslate: DataTypeTranslatePipe,
    private utils: UtilsService
  ) { }

  ngOnInit() {}

  ngOnChanges () {
    this.initChart();
  }

  initChart () {
    let trendDataset: any,
        chartData = [],
        colorSet: Array<string>;
console.log('pace', this.data);
    switch (this.chartName) {
      case 'Pace':
        this.chartType = 'pace';
        colorSet = paceTrendColor;
        this.chartTitle = [
          `${this.translate.instant('universal_adjective_maxBest')} ${this.translate.instant(
            this.dataTypeTranslate.transform('pace', [this.sportType, this.unit])
          )}`,
          this.translate.instant(
            this.dataTypeTranslate.transform('pace', [this.sportType, this.unit])
          ),
        ];
        if (this.page !== 'sportReport') {  // 待個人運動報告重構後刪除
          this.dataLength = this.data.date.length;
          for (let i = 0; i < this.dataLength; i++) {

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

        } else {
          const { dataArr, minSpeed, maxSpeed } = this.data;
          this.dataLength = dataArr.length;
          chartData = dataArr;
          this.highestPoint = 
            this.utils.convertSpeed(minSpeed || 0, this.sportType, this.unit, 'second') as number;
          this.lowestPoint = 
            this.utils.convertSpeed(maxSpeed, this.sportType, this.unit, 'second') as number;
        }

        break;
      case 'Cadence':
        colorSet = cadenceTrendColor;
        this.chartType = 'cadence';
        if (this.page !== 'sportReport') {
          this.dataLength = this.data.date.length;
          for (let i = 0; i < this.dataLength; i++) {

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
        } else {
          const { dataArr, maxCadence, minCadence } = this.data;
          chartData = dataArr;
          this.dataLength = dataArr.length;
          this.highestPoint = maxCadence;
          this.lowestPoint = minCadence;
        }

        break;
      case 'Swolf':
        this.chartType = 'swolf';
        colorSet = swolfTrendColor
        if (this.page !== 'sportReport') {
          this.dataLength = this.data.date.length;
          for (let i = 0; i < this.dataLength; i++) {

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
        } else {
          const { dataArr, maxSwolf, minSwolf } = this.data;
          chartData = dataArr;
          this.dataLength = dataArr.length;
          this.highestPoint = maxSwolf;
          this.lowestPoint = minSwolf;
        }
        break;
      case 'Speed':
        colorSet = speedTrendColor;
        this.chartType = 'speed';
        this.chartTitle = [
          `${this.translate.instant('universal_adjective_maxBest')} ${this.translate.instant(
            this.dataTypeTranslate.transform('speed', [this.sportType, this.unit])
          )}`,
          this.translate.instant(
            this.dataTypeTranslate.transform('speed', [this.sportType, this.unit])
          ),
        ];
        if (this.page !== 'sportReport') {  // 待個人運動報告重構後刪除
          this.dataLength = this.data.date.length;
          for (let i = 0; i < this.dataLength; i++) {

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
        } else {
          const { dataArr, maxSpeed, minSpeed } = this.data;
          this.dataLength = dataArr.length;
          chartData = dataArr;
          this.highestPoint = maxSpeed;
          this.lowestPoint = minSpeed;
        }
        break;
      case 'Step': // 生活追蹤步數資料-kidin-1090218
        this.createDateList();
        const newData = [],
              newTargetData = [];
        let index = 0;
        this.dataLength = this.dateList.length;

        for (let i = 0; i < this.dataLength; i++) {
          if (this.dateList[i] === this.data.date[index]) {
            newData.push(this.data.stepList[index]);
            newTargetData.push(this.data.targetStepList[index]);
            index++;
          } else {
            newData.push(0);
            newTargetData.push(0);
          }
        }

        for (let i = 0; i < this.dataLength; i++) {
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
      case 'Muscle':
        const saturation = '100%',  // 主訓練部位色彩飽和度
              Brightness = '70%',  // 主訓練部位色彩明亮度
              transparency = 1;  // 主訓練部位色彩透明度

        this.dataLength = this.data[0].length;

        for (let i = 0; i < this.dataLength; i++) {

          if (this.data[1][i] > this.highestPoint) {
            this.highestPoint = this.data[1][i];
          }

          if (this.data[2][i] !== null && this.data[2][i] < this.lowestPoint) {
            this.lowestPoint = this.data[2][i];
          }

          // 計算當天該部位訓練程度-kidin-1090406
          let trainingLevel = 200 - ((this.data[1][i]) / this.userWeight) * 100 * this.proficiencyCoefficient;
          if (trainingLevel < 0) {
            trainingLevel = 0;
          }

          chartData.push(
            {
              x: this.data[0][i],
              y: this.data[1][i],
              low: this.data[2][i],
              color: `hsla(${trainingLevel}, ${saturation}, ${Brightness}, ${transparency})`
            }
          );

        }

        break;
    }

    switch (this.chartName) {
      case 'Step':
        trendDataset = [
          {
            name: [
              this.translate.instant('universal_userProfile_StepCount'),
              this.translate.instant('universal_lifeTracking_targetStep')
            ],
            data: chartData,
            showInLegend: false
          }
        ];

        break;
      case 'Muscle':
        trendDataset = [
          {
            name: this.chartName,
            data: chartData,
            showInLegend: false
          }
        ];

        break;
      default:
        trendDataset = [
          {
            name: this.chartTitle ?? this.chartName,
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
                [0, colorSet ? colorSet[2] : this.data.colorSet[2]],
                [0.5, colorSet ? colorSet[1] : this.data.colorSet[1]],
                [1, colorSet ? colorSet[0] : this.data.colorSet[0]]
              ]
            }
          }
        ];

        break;
    }

    const trendChartOptions = new ChartOptions(trendDataset),
          labelPadding = 2;
    switch (this.chartName) {
      case 'Pace':
        trendChartOptions['yAxis'].max = this.highestPoint + labelPadding;
        trendChartOptions['yAxis'].min = this.lowestPoint - labelPadding;
        trendChartOptions['yAxis'].reversed = true; // 將y軸反轉-kidin-1090206

        // 設定圖表y軸單位格式-kidin-1090204
        trendChartOptions['yAxis'].labels = {
          formatter: function () {
            if (this.value > 3600) {
              this.value = 3600;
            }
            const yVal = this.value,
                  paceMin = Math.floor(yVal / 60),
                  paceSec = Math.round(yVal - paceMin * 60),
                  timeMin = `${paceMin}`.padStart(2, '0'),
                  timeSecond = `${paceSec}`.padStart(2, '0');

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
                  timeMin = `${paceMin}`.padStart(2, '0'),
                  timeSecond = `${pacesecond}`.padStart(2, '0');

            let bottomPace = '';
            if (timeMin === '00') {
              bottomPace = `0'${timeSecond}`;
            } else {
              bottomPace = `${timeMin}'${timeSecond}`;
            }

            const yBest = this.point.y,
                  bestMin = Math.floor(yBest / 60),
                  bestSecond = Math.round(yBest - bestMin * 60),
                  timeBestMin = `${bestMin}`.padStart(2, '0'),
                  timeBestSecond = `${bestSecond}`.padStart(2, '0');

            let paceBestTime = '';
            if (timeBestMin === '00') {
              paceBestTime = `0'${timeBestSecond}`;
            } else {
              paceBestTime = `${timeBestMin}'${timeBestSecond}`;
            }

            const startDate = moment(this.x).format('YYYY-MM-DD');
            if (this.series.xAxis.tickInterval === month) {
              const endDate = moment(this.x + 6 * day).format('YYYY-MM-DD');
              return `${startDate}~${endDate}
                <br/>${this.series.name[0]}: ${paceBestTime}
                <br/>${this.series.name[1]}: ${bottomPace}`;
            } else {
              return `${startDate}
                <br/>${this.series.name[0]}: ${paceBestTime}
                <br/>${this.series.name[1]}: ${bottomPace}`;
            }

          }

        };

        break;
      case 'Cadence':
        trendChartOptions['yAxis'].max = this.highestPoint + labelPadding;
        trendChartOptions['yAxis'].min = this.lowestPoint - labelPadding;

        // 設定浮動提示框顯示格式-kidin-1090204
        trendChartOptions['tooltip'] = {
          formatter: function () {
            const startDate = moment(this.x).format('YYYY-MM-DD');
            if (this.series.xAxis.tickInterval === month) {
              const endDate = moment(this.x + 6 * day).format('YYYY-MM-DD');
              return `${startDate}~${endDate}
                <br/>Best cadence: ${this.point.y}
                <br/>${this.series.name}: ${this.point.low}`;
            } else {
              return `${startDate}
                <br/>Best cadence: ${this.point.y}
                <br/>${this.series.name}: ${this.point.low}`;
            }

          }

        };
        break;
      case 'Swolf':
        trendChartOptions['yAxis'].reversed = true; // 將y軸反轉-kidin-1090206
        trendChartOptions['yAxis'].max = this.highestPoint + labelPadding;
        trendChartOptions['yAxis'].min = this.lowestPoint - labelPadding;

        // 設定浮動提示框顯示格式-kidin-1090204
        trendChartOptions['tooltip'] = {
          formatter: function () {
            const startDate = moment(this.x).format('YYYY-MM-DD');
            if (this.series.xAxis.tickInterval === month) {
              const endDate = moment(this.x + 6 * day).format('YYYY-MM-DD');
              return `${startDate}~${endDate}
                <br/>Best Swolf: ${this.point.low}
                <br/>${this.series.name}: ${this.point.y}`;
            } else {
              return `${startDate}
                <br/>Best Swolf: ${this.point.low}
                <br/>${this.series.name}: ${this.point.y}`;
            }

          }

        };
        break;
      case 'Speed':
        trendChartOptions['yAxis'].max = this.highestPoint + labelPadding;
        trendChartOptions['yAxis'].min = this.lowestPoint - labelPadding;

        // 設定浮動提示框顯示格式-kidin-1090204
        trendChartOptions['tooltip'] = {
          formatter: function () {
            const startDate = moment(this.x).format('YYYY-MM-DD'),
                  roundVal = parseFloat(this.point.low.toFixed(1));
            if (this.series.xAxis.tickInterval === month) {
              const endDate = moment(this.x + 6 * day).format('YYYY-MM-DD');
              return `${startDate}~${endDate}
                <br/>${this.series.name[0]}: ${this.point.y}
                <br/>${this.series.name[1]}: ${roundVal}`;
            } else {
              return `${startDate}
                <br/>${this.series.name[0]}: ${this.point.y}
                <br/>${this.series.name[1]}: ${roundVal}`;
            }

          }

        };
        break;
      case 'Step':
        // 設定浮動提示框顯示格式-kidin-1090204
        trendChartOptions['tooltip'] = {
          formatter: function () {
            const startDate = moment(this.x).format('YYYY-MM-DD');
            if (this.series.xAxis.tickInterval === month) {
              const endDate = moment(this.x + 6 * day).format('YYYY-MM-DD');
              return `${startDate}~${endDate}
                <br/>${this.series.name[1]}: ${this.point.t.toFixed(1)}
                <br/>${this.series.name[0]}: ${this.point.z.toFixed(1)}`;

            } else {
              return `${startDate}
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
      case 'Muscle':
        trendChartOptions['yAxis'].max = this.highestPoint + labelPadding;
        trendChartOptions['yAxis'].min = this.lowestPoint - labelPadding;

        // 設定浮動提示框顯示格式-kidin-1090204
        trendChartOptions['tooltip'] = {
          formatter: function () {
            const startDate = moment(this.x).format('YYYY-MM-DD');
            if (this.series.xAxis.tickInterval === month) {
              const endDate = moment(this.x + 6 * day).format('YYYY-MM-DD');
              return `${startDate}~${endDate}
                <br/>1RM: ${this.point.y.toFixed(1)}K
                <br/>Avg Weight: ${this.point.low.toFixed(1)}`;
            } else {
              return `${startDate}
                <br/>1RM: ${this.point.y.toFixed(1)}
                <br/>Avg Weight: ${this.point.low.toFixed(1)}`;
            }

          }

        };
        break;
    }

    if (this.page !== 'cloudrun') {
      // 設定圖表x軸時間間距-kidin-1090204
      if (this.dateRange === 'day' && this.dataLength <= 7) {
        trendChartOptions['xAxis'].tickInterval = day;
      } else if (this.dateRange === 'day' && this.dataLength > 7) {
        trendChartOptions['xAxis'].tickInterval = week;
      } else {
        trendChartOptions['xAxis'].tickInterval = month;
      }

    }

    this.createChart(trendChartOptions);
  }

  // 根據搜尋期間，列出日期清單供圖表使用-kidin-1090220
  createDateList () {
    let diff,
        weekStartDay,
        weekEndDay;
    if (this.dateRange === 'day') {
      diff = (this.searchDate[1] - this.searchDate[0]) / day;

      for (let i = 0; i < diff + 1; i++) {
        this.dateList.push(this.searchDate[0] + day * i);
      }

    } else if (this.dateRange === 'week') {

      // 周報告開頭是星期日-kidin-1090220
      if (moment(this.searchDate[0]).isoWeekday() !== 7) {
        weekStartDay = this.searchDate[0] - day * moment(this.searchDate[0]).isoWeekday();
      } else {
        weekStartDay = this.searchDate[0];
      }

      if (moment(this.searchDate[0]).isoWeekday() !== 7) {
        weekEndDay = this.searchDate[1] - day * moment(this.searchDate[1]).isoWeekday();
      } else {
        weekEndDay = this.searchDate[1];
      }

      diff = ((weekEndDay - weekStartDay) / week) + 1;

      for (let i = 0; i < diff + 1; i++) {
        this.dateList.push(weekStartDay + week * i);
      }
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
