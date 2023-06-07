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
import isoWeek from 'dayjs/plugin/isoWeek';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { planeGColor, planeMaxGColor, fitTimeColor } from '../../../../core/models/represent-color';
import { mi, ft } from '../../../../core/models/const/bs-constant.model';
import { DataUnitType } from '../../../../core/enums/common';
import { day, month, week } from '../../../../core/models/const';
import { SportType } from '../../../../core/enums/sports';
import { DisplayPage } from '../../../../core/models/common';
import { DataTypeTranslatePipe } from '../../../../core/pipes/data-type-translate.pipe';
import { ThousandConversionPipe } from '../../../../core/pipes/thousand-conversion.pipe';
import { SportTimePipe } from '../../../../core/pipes/sport-time.pipe';
import { DistanceSibsPipe } from '../../../../core/pipes/distance-sibs.pipe';
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
        min: 0,
        title: {
          text: '',
        },
        startOnTick: false,
        minPadding: 0.01,
        maxPadding: 0.01,
        tickAmount: 1,
      },
      plotOptions: {
        column: {
          stacking: 'normal',
          pointPlacement: 0.33,
        },
        series: {
          pointWidth: null,
          maxPointWidth: 30,
          borderRadius: 5,
        },
      },
      tooltip: {},
      series: dataset,
    };
  }
}

@Component({
  selector: 'app-fillet-column-chart',
  templateUrl: './fillet-column-chart.component.html',
  styleUrls: ['./fillet-column-chart.component.scss', '../chart-share-style.scss'],
  standalone: true,
  imports: [
    NgIf,
    DecimalPipe,
    TranslateModule,
    DistanceSibsPipe,
    SportTimePipe,
    ThousandConversionPipe,
    DataTypeTranslatePipe,
  ],
})
export class FilletColumnChartComponent implements OnInit, OnChanges, OnDestroy {
  private ngUnsubscribe = new Subject();
  tooltipTitle = '';
  dateList = [];
  chartType: string;
  dataLen = 0;
  columnColor: string;
  readonly sportCode = SportType;

  @Input() data: any;
  @Input() dateRange: string;
  @Input() chartName: string;
  @Input() searchDate: Array<number>;
  @Input() page: DisplayPage;
  @Input() unit = <DataUnitType>DataUnitType.metric;
  @Input() sportType: SportType = SportType.all;
  @Input() isPreviewMode = false;
  @ViewChild('container', { static: false })
  container: ElementRef;

  constructor(private translate: TranslateService) {}

  ngOnInit() {}

  ngOnChanges() {
    this.initChart();
  }

  /**
   * 建立圖表
   * @author kidin
   */
  initChart() {
    this.translate
      .get('hellow world')
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe(() => {
        let chartData = [];
        switch (this.chartName) {
          case 'StrokeNum':
            chartData = this.data.strokeNum;
            this.tooltipTitle = `${this.translate.instant(
              'universal_vocabulary_activity'
            )} ${this.translate.instant('universal_activityData_numberOf')}`;
            this.chartType = 'stroke';
            break;
          case 'TotalTime':
            chartData = this.data.totalTime;
            if (this.sportType === SportType.weightTrain) {
              this.tooltipTitle = `${this.translate.instant(
                'universal_adjective_singleTotal'
              )} ${this.translate.instant('universal_activityData_activityTime')}
            `;
            } else {
              this.tooltipTitle = this.translate.instant('universal_activityData_totalTime');
            }

            this.chartType = 'totalTime';
            break;
          case 'Distance':
            chartData = this.data.distance;
            this.tooltipTitle = this.translate.instant('universal_activityData_distance');
            this.chartType = 'distance';
            break;
          case 'PlaneGForce':
            chartData = this.data.planeGForce;
            this.tooltipTitle = `${this.translate.instant(
              'universal_adjective_accumulation'
            )} ${this.translate.instant('universal_activityData_planarAcceleration')}`;
            this.chartType = 'planeGForce';
            this.columnColor = planeGColor;
            break;
          case 'PlaneMaxGForce':
            chartData = this.data.planeMaxGForce;
            this.tooltipTitle = `${this.translate.instant(
              'universal_adjective_maxBig'
            )} ${this.translate.instant('universal_activityData_planarAcceleration')}`;
            this.chartType = 'planeMaxGForce';
            this.columnColor = planeMaxGColor;
            break;
          case 'Calories':
            chartData = this.data.calories;
            this.tooltipTitle = this.translate.instant('universal_userProfile_calories');
            this.chartType = 'calories';
            break;
          case 'FitTime':
            this.chartType = 'fitTime';
            chartData = this.data.dataArr;
            this.columnColor = fitTimeColor;
            this.tooltipTitle = this.translate.instant('universal_userProfile_fitTime');
            break;
          case 'CostTime':
            this.chartType = 'time';
            for (let i = 0, len = this.data.date.length; i < len; i++) {
              chartData.push([this.data.date[i], this.data.costTime[i]]);
            }

            this.tooltipTitle = 'Total time';
            break;
        }

        const trendDataset = [
          {
            name: this.tooltipTitle,
            data: chartData,
            showInLegend: false,
            color: this.data.colorSet ?? this.columnColor,
          },
        ];

        const trendChartOptions = new ChartOptions(trendDataset);
        if (!['cloudrun'].includes(this.page)) {
          // 設定圖表x軸時間間距-kidin-1090204
          if (this.dateRange === 'day' && chartData.length <= 7) {
            trendChartOptions['xAxis'].tickInterval = day;
          } else if (this.dateRange === 'day' && chartData.length > 7) {
            trendChartOptions['xAxis'].tickInterval = week;
          } else {
            trendChartOptions['xAxis'].tickInterval = month;
          }
        }

        const isCloudrunPage = this.page === 'cloudrun',
          isTimeChart = this.chartType && this.chartType.toLowerCase().includes('time'),
          isFitTimeChart = this.chartType === 'fitTime';
        if (isCloudrunPage || (isTimeChart && !isFitTimeChart)) {
          if (this.page === 'cloudrun') trendChartOptions['plotOptions'].series.borderRadius = 0;

          // 設定圖表y軸單位格式
          trendChartOptions['yAxis'].labels = {
            formatter: function () {
              const yVal = this.value,
                costhr = Math.floor(yVal / 3600),
                costmin = Math.floor((yVal - costhr * 3600) / 60),
                costsecond = Math.round(yVal - costhr * 3600 - costmin * 60),
                timeMin = `${costmin}`.padStart(2, '0'),
                timeSecond = `${costsecond}`.padStart(2, '0');

              if (costhr === 0 && timeMin === '00') {
                return `0:${timeSecond}`;
              } else if (costhr === 0) {
                return `${timeMin}:${timeSecond}`;
              } else {
                return `${costhr}:${timeMin}:${timeSecond}`;
              }
            },
          };

          // 設定tooltip顯示格式
          trendChartOptions['tooltip'] = {
            formatter: function () {
              const yVal = this.y,
                costhr = Math.floor(yVal / 3600),
                costmin = Math.floor((yVal - costhr * 3600) / 60),
                costsecond = Math.round(yVal - costhr * 3600 - costmin * 60),
                timeMin = `${costmin}`.padStart(2, '0'),
                timeSecond = `${costsecond}`.padStart(2, '0'),
                startDate = dayjs(this.x).format('YYYY-MM-DD');

              let zoneTime = '';
              if (costhr === 0 && timeMin === '00') {
                zoneTime = `0:${timeSecond}`;
              } else if (costhr === 0) {
                zoneTime = `${timeMin}:${timeSecond}`;
              } else {
                zoneTime = `${costhr}:${timeMin}:${timeSecond}`;
              }

              if (this.series.xAxis.tickInterval === month) {
                const endDate = dayjs(this.x + 6 * day).format('YYYY-MM-DD');
                return `${startDate}~${endDate}<br>${this.series.name}: ${zoneTime}`;
              } else {
                return `${startDate}<br>${this.series.name}: ${zoneTime}`;
              }
            },
          };
        } else if (this.chartType === 'distance') {
          // 處理公英制及顯示單位
          if (this.unit === DataUnitType.imperial) {
            trendChartOptions['yAxis'].labels = {
              formatter: function () {
                if (this.value >= 1000) {
                  const yVal = parseFloat((this.value / mi).toFixed(1));
                  return `${yVal} mi`;
                } else {
                  const yVal = parseFloat((this.value / ft).toFixed(1));
                  return `${yVal} ft`;
                }
              },
            };

            trendChartOptions['tooltip'] = {
              formatter: function () {
                if (this.y >= 1000) {
                  const value = parseFloat((this.y / mi).toFixed(1)),
                    suffix = 'mi',
                    startDate = dayjs(this.x).format('YYYY-MM-DD');
                  if (this.series.xAxis.tickInterval === month) {
                    const endDate = dayjs(this.x + 6 * day).format('YYYY-MM-DD');
                    return `${startDate}~${endDate}<br>${this.series.name}: ${value} ${suffix}`;
                  } else {
                    return `${startDate}<br>${this.series.name}: ${value} ${suffix}`;
                  }
                } else {
                  const value = parseFloat((this.y / ft).toFixed(1)),
                    suffix = 'ft',
                    startDate = dayjs(this.x).format('YYYY-MM-DD');
                  if (this.series.xAxis.tickInterval === month) {
                    const endDate = dayjs(this.x + 6 * day).format('YYYY-MM-DD');
                    return `${startDate}~${endDate}<br>${this.series.name}: ${value} ${suffix}`;
                  } else {
                    return `${startDate}<br>${this.series.name}: ${value} ${suffix}`;
                  }
                }
              },
            };
          } else {
            trendChartOptions['yAxis'].labels = {
              formatter: function () {
                if (this.value >= 1000) {
                  const yVal = parseFloat((this.value / 1000).toFixed(1));
                  return `${yVal} km`;
                } else {
                  const yVal = parseFloat(this.value.toFixed(1));
                  return `${yVal} m`;
                }
              },
            };

            trendChartOptions['tooltip'] = {
              formatter: function () {
                if (this.y >= 1000) {
                  const value = parseFloat((this.y / 1000).toFixed(1)),
                    suffix = 'km',
                    startDate = dayjs(this.x).format('YYYY-MM-DD');
                  if (this.series.xAxis.tickInterval === month) {
                    const endDate = dayjs(this.x + 6 * day).format('YYYY-MM-DD');
                    return `${startDate}~${endDate}
                    <br>${this.series.name}: ${value} ${suffix}
                  `;
                  } else {
                    return `${startDate}
                    <br>${this.series.name}: ${value} ${suffix}
                  `;
                  }
                } else {
                  const value = parseFloat(this.y.toFixed(1)),
                    suffix = 'm',
                    startDate = dayjs(this.x).format('YYYY-MM-DD');
                  if (this.series.xAxis.tickInterval === month) {
                    const endDate = dayjs(this.x + 6 * day).format('YYYY-MM-DD');
                    return `${startDate}~${endDate}<br>${this.series.name}: ${value} ${suffix}`;
                  } else {
                    return `${startDate}<br>${this.series.name}: ${value} ${suffix}`;
                  }
                }
              },
            };
          }
        } else {
          trendChartOptions['tooltip'] = {
            formatter: function () {
              const value = parseFloat(this.y.toFixed(1)),
                startDate = dayjs(this.x).format('YYYY-MM-DD');
              if (this.series.xAxis.tickInterval === month) {
                const endDate = dayjs(this.x + 6 * day).format('YYYY-MM-DD');
                return `${startDate}~${endDate}<br>${this.series.name}: ${value}`;
              } else {
                return `${startDate}<br>${this.series.name}: ${value}`;
              }
            },
          };
        }

        this.createChart(trendChartOptions);
      });
  }

  /**
   * 根據搜尋期間，列出日期清單供圖表使用
   * @author kidin-1090220
   */
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

  ngOnDestroy() {
    this.ngUnsubscribe.next(null);
    this.ngUnsubscribe.complete();
  }
}
