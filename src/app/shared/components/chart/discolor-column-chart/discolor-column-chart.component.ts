import {
  Component,
  OnInit,
  OnChanges,
  OnDestroy,
  ViewChild,
  ElementRef,
  Input,
} from '@angular/core';
import { chart } from 'highcharts';
import dayjs from 'dayjs';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import {
  paceTrendColor,
  speedTrendColor,
  cadenceTrendColor,
  swolfTrendColor,
  swingSpeedTrendColor,
} from '../../../../core/models/represent-color';
import { DataUnitType } from '../../../../core/enums/common';
import { SportType } from '../../../../core/enums/sports';
import { DataTypeTranslatePipe } from '../../../../core/pipes/data-type-translate.pipe';
import { day, month, week } from '../../../../core/models/const';
import { speedToPaceSecond } from '../../../../core/utils/sports';
import isoWeek from 'dayjs/plugin/isoWeek';
import { DisplayPage } from '../../../../core/models/common';
import { DataTypeUnitPipe } from '../../../../core/pipes/data-type-unit.pipe';
import { SportPaceSibsPipe } from '../../../../core/pipes/sport-pace-sibs.pipe';
import { NgIf, DecimalPipe } from '@angular/common';

dayjs.extend(isoWeek);

// 建立圖表用-kidin-1081212
class ChartOptions {
  constructor(dataset) {
    return {
      chart: {
        type: 'column',
        height: 110,
        backgroundColor: 'transparent',
      },
      title: {
        text: '',
      },
      credits: {
        enabled: false,
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
          year: '%Y',
        },
      },
      yAxis: {
        title: {
          text: '',
        },
        startOnTick: false,
        endOntick: true,
        minPadding: 0.01,
        maxPadding: 0.01,
        tickAmount: 1,
      },
      plotOptions: {
        column: {
          pointPlacement: 0.33,
        },
        series: {
          pointWidth: 10,
          borderRadius: 5,
        },
      },
      tooltip: {},
      series: dataset,
    };
  }
}

@Component({
  selector: 'app-discolor-column-chart',
  templateUrl: './discolor-column-chart.component.html',
  styleUrls: ['./discolor-column-chart.component.scss', '../chart-share-style.scss'],
  standalone: true,
  imports: [
    NgIf,
    DecimalPipe,
    TranslateModule,
    SportPaceSibsPipe,
    DataTypeTranslatePipe,
    DataTypeUnitPipe,
  ],
})
export class DiscolorColumnChartComponent implements OnInit, OnChanges, OnDestroy {
  dateList: Array<any> = [];
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
  @Input() sportType = <SportType>SportType.run;
  @Input() unit: DataUnitType;
  @Input() isPreviewMode = false;
  @ViewChild('container', { static: true })
  container: ElementRef;

  constructor(
    private translate: TranslateService,
    private dataTypeTranslate: DataTypeTranslatePipe
  ) {}

  ngOnInit() {}

  ngOnChanges() {
    this.initChart();
  }

  initChart() {
    const { sportType, unit } = this;
    const pipeArgs = { sportsType: sportType, unitType: unit };
    let trendDataset: any;
    let chartData: any = [];
    let colorSet: Array<string> | null = null;
    switch (this.chartName) {
      case 'Pace': {
        this.chartType = 'pace';
        colorSet = paceTrendColor;
        this.chartTitle = [
          `${this.translate.instant('universal_adjective_maxBest')} ${this.translate.instant(
            this.dataTypeTranslate.transform('pace', pipeArgs)
          )}`,
          this.translate.instant(this.dataTypeTranslate.transform('pace', pipeArgs)),
        ];

        const { dataArr: paceDataArr, minSpeed: paceminSpeed, maxSpeed: paceSpeed } = this.data;
        this.dataLength = paceDataArr.length;
        chartData = paceDataArr;
        this.highestPoint = speedToPaceSecond(paceminSpeed || 0, sportType, unit);
        this.lowestPoint = speedToPaceSecond(paceSpeed, sportType, unit);
        break;
      }
      case 'Cadence': {
        colorSet = cadenceTrendColor;
        this.chartType = 'cadence';
        const { dataArr: cadenceDataArr, maxCadence, minCadence } = this.data;
        chartData = cadenceDataArr;
        this.dataLength = cadenceDataArr.length;
        this.highestPoint = maxCadence;
        this.lowestPoint = minCadence;
        break;
      }
      case 'Swolf': {
        this.chartType = 'swolf';
        colorSet = swolfTrendColor;
        const { dataArr: swolfDataArr, maxSwolf, minSwolf } = this.data;
        chartData = swolfDataArr;
        this.dataLength = swolfDataArr.length;
        this.highestPoint = maxSwolf;
        this.lowestPoint = minSwolf;
        break;
      }
      case 'Speed': {
        colorSet = speedTrendColor;
        this.chartType = 'speed';
        this.chartTitle = [
          `${this.translate.instant('universal_adjective_maxBest')} ${this.translate.instant(
            this.dataTypeTranslate.transform('speed', pipeArgs)
          )}`,
          this.translate.instant(this.dataTypeTranslate.transform('speed', pipeArgs)),
        ];

        const { dataArr: speedDataArr, maxSpeed, minSpeed } = this.data;
        this.dataLength = speedDataArr.length;
        chartData = speedDataArr;
        this.highestPoint = maxSpeed;
        this.lowestPoint = minSpeed;
        break;
      }
      case 'SwingSpeed': {
        colorSet = swingSpeedTrendColor;
        this.chartType = 'swingSpeed';
        this.chartTitle = [
          this.translate.instant('universal_activityData_maxSwing'),
          this.translate.instant('universal_activityData_swingSpeed'),
        ];

        const { dataArr, maxSpeed: swingMaxSpeed, minSpeed: swingminSpeed } = this.data;
        this.dataLength = dataArr.length;
        chartData = dataArr;
        this.highestPoint = swingMaxSpeed;
        this.lowestPoint = swingminSpeed;
        break;
      }
      case 'Step': // 生活追蹤步數資料-kidin-1090218
        chartData = this.data;
        this.dataLength = this.data.length;
        break;
      case 'Muscle': {
        const saturation = '100%', // 主訓練部位色彩飽和度
          Brightness = '70%', // 主訓練部位色彩明亮度
          transparency = 1; // 主訓練部位色彩透明度
        this.dataLength = this.data[0].length;
        for (let i = 0; i < this.dataLength; i++) {
          if (this.data[1][i] > this.highestPoint) {
            this.highestPoint = this.data[1][i];
          }

          if (this.data[2][i] !== null && this.data[2][i] < this.lowestPoint) {
            this.lowestPoint = this.data[2][i];
          }

          // 計算當天該部位訓練程度-kidin-1090406
          let trainingLevel =
            200 - (this.data[1][i] / this.userWeight) * 100 * this.proficiencyCoefficient;
          if (trainingLevel < 0) {
            trainingLevel = 0;
          }

          chartData.push({
            x: this.data[0][i],
            y: this.data[1][i],
            low: this.data[2][i],
            color: `hsla(${trainingLevel}, ${saturation}, ${Brightness}, ${transparency})`,
          });
        }

        break;
      }
    }

    switch (this.chartName) {
      case 'Step':
        trendDataset = [
          {
            name: [
              this.translate.instant('universal_userProfile_StepCount'),
              this.translate.instant('universal_lifeTracking_targetStep'),
            ],
            data: chartData,
            showInLegend: false,
          },
        ];

        break;
      case 'Muscle':
        trendDataset = [
          {
            name: this.chartName,
            data: chartData,
            showInLegend: false,
          },
        ];

        break;
      default: {
        const [startColor, middleColor, endColor] = colorSet ?? this.data.colorSet;
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
                y2: 1,
              },
              stops: [
                [0, startColor],
                [0.5, middleColor],
                [1, endColor],
              ],
            },
          },
        ];

        break;
      }
    }

    const trendChartOptions = new ChartOptions(trendDataset);
    const labelPadding = 2;
    switch (this.chartName) {
      case 'Pace':
        trendChartOptions['yAxis'].max = this.highestPoint + labelPadding || null;
        trendChartOptions['yAxis'].min = this.lowestPoint - labelPadding || null;
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
          },
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

            const startDate = dayjs(this.x).format('YYYY-MM-DD');
            if (this.series.xAxis.tickInterval === month) {
              const endDate = dayjs(this.x + 6 * day).format('YYYY-MM-DD');
              return `${startDate}~${endDate}
                <br/>${this.series.name[0]}: ${paceBestTime}
                <br/>${this.series.name[1]}: ${bottomPace}`;
            } else {
              return `${startDate}
                <br/>${this.series.name[0]}: ${paceBestTime}
                <br/>${this.series.name[1]}: ${bottomPace}`;
            }
          },
        };

        break;
      case 'Cadence':
        trendChartOptions['yAxis'].max = this.highestPoint + labelPadding;
        trendChartOptions['yAxis'].min = this.lowestPoint - labelPadding;

        // 設定浮動提示框顯示格式-kidin-1090204
        trendChartOptions['tooltip'] = {
          formatter: function () {
            const startDate = dayjs(this.x).format('YYYY-MM-DD'),
              yVal = parseFloat(this.point.y.toFixed(1)),
              lowVal = parseFloat(this.point.low.toFixed(1));
            if (this.series.xAxis.tickInterval === month) {
              const endDate = dayjs(this.x + 6 * day).format('YYYY-MM-DD');
              return `${startDate}~${endDate}
                <br/>Best cadence: ${yVal}
                <br/>${this.series.name}: ${lowVal}`;
            } else {
              return `${startDate}
                <br/>Best cadence: ${yVal}
                <br/>${this.series.name}: ${lowVal}`;
            }
          },
        };
        break;
      case 'Swolf':
        trendChartOptions['yAxis'].reversed = true; // 將y軸反轉-kidin-1090206
        trendChartOptions['yAxis'].max = this.highestPoint + labelPadding;
        trendChartOptions['yAxis'].min = this.lowestPoint - labelPadding;

        // 設定浮動提示框顯示格式-kidin-1090204
        trendChartOptions['tooltip'] = {
          formatter: function () {
            const startDate = dayjs(this.x).format('YYYY-MM-DD'),
              yVal = parseFloat(this.point.y.toFixed(1)),
              lowVal = parseFloat(this.point.low.toFixed(1));
            if (this.series.xAxis.tickInterval === month) {
              const endDate = dayjs(this.x + 6 * day).format('YYYY-MM-DD');
              return `${startDate}~${endDate}
                <br/>Best Swolf: ${lowVal}
                <br/>${this.series.name}: ${yVal}`;
            } else {
              return `${startDate}
                <br/>Best Swolf: ${lowVal}
                <br/>${this.series.name}: ${yVal}`;
            }
          },
        };
        break;
      case 'Speed':
      case 'SwingSpeed':
        trendChartOptions['yAxis'].max = this.highestPoint + labelPadding;
        trendChartOptions['yAxis'].min = this.lowestPoint - labelPadding;

        // 設定浮動提示框顯示格式-kidin-1090204
        trendChartOptions['tooltip'] = {
          formatter: function () {
            const startDate = dayjs(this.x).format('YYYY-MM-DD'),
              yVal = parseFloat(this.point.y.toFixed(1)),
              lowVal = parseFloat(this.point.low.toFixed(1));
            if (this.series.xAxis.tickInterval === month) {
              const endDate = dayjs(this.x + 6 * day).format('YYYY-MM-DD');
              return `${startDate}~${endDate}
                <br/>${this.series.name[0]}: ${yVal}
                <br/>${this.series.name[1]}: ${lowVal}`;
            } else {
              return `${startDate}
                <br/>${this.series.name[0]}: ${yVal}
                <br/>${this.series.name[1]}: ${lowVal}`;
            }
          },
        };
        break;
      case 'Step':
        // 設定浮動提示框顯示格式-kidin-1090204
        trendChartOptions['tooltip'] = {
          formatter: function () {
            const startDate = dayjs(this.x).format('YYYY-MM-DD'),
              tVal = parseFloat(this.point.t.toFixed(1)),
              zVal = parseFloat(this.point.z.toFixed(1));
            if (this.series.xAxis.tickInterval === month) {
              const endDate = dayjs(this.x + 6 * day).format('YYYY-MM-DD');
              return `${startDate}~${endDate}
                <br/>${this.series.name[1]}: ${tVal}
                <br/>${this.series.name[0]}: ${zVal}`;
            } else {
              return `${startDate}
                <br/>${this.series.name[1]}: ${tVal}
                <br/>${this.series.name[0]}: ${zVal}`;
            }
          },
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
            const startDate = dayjs(this.x).format('YYYY-MM-DD'),
              yVal = parseFloat(this.point.y.toFixed(1)),
              lowVal = parseFloat(this.point.low.toFixed(1));
            if (this.series.xAxis.tickInterval === month) {
              const endDate = dayjs(this.x + 6 * day).format('YYYY-MM-DD');
              return `${startDate}~${endDate}
                <br/>1RM: ${yVal}K
                <br/>Avg Weight: ${lowVal}`;
            } else {
              return `${startDate}
                <br/>1RM: ${yVal}
                <br/>Avg Weight: ${lowVal}`;
            }
          },
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
  createDateList() {
    let diff, weekStartDay, weekEndDay;
    if (this.dateRange === 'day') {
      diff = (this.searchDate[1] - this.searchDate[0]) / day;

      for (let i = 0; i < diff + 1; i++) {
        this.dateList.push(this.searchDate[0] + day * i);
      }
    } else if (this.dateRange === 'week') {
      // 周報告開頭是星期日-kidin-1090220
      if (dayjs(this.searchDate[0]).isoWeekday() !== 7) {
        weekStartDay = this.searchDate[0] - day * dayjs(this.searchDate[0]).isoWeekday();
      } else {
        weekStartDay = this.searchDate[0];
      }

      if (dayjs(this.searchDate[0]).isoWeekday() !== 7) {
        weekEndDay = this.searchDate[1] - day * dayjs(this.searchDate[1]).isoWeekday();
      } else {
        weekEndDay = this.searchDate[1];
      }

      diff = (weekEndDay - weekStartDay) / week + 1;

      for (let i = 0; i < diff + 1; i++) {
        this.dateList.push(weekStartDay + week * i);
      }
    }
  }

  // 確認取得元素才建立圖表-kidin-1090706
  createChart(option: ChartOptions) {
    setTimeout(() => {
      if (!this.container) {
        this.createChart(option);
      } else {
        const chartDiv = this.container.nativeElement;
        chart(chartDiv, option);
      }
    }, 200);
  }

  ngOnDestroy() {}
}
