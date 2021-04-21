import { Component, OnInit, OnChanges, OnDestroy, ViewChild, ElementRef, Input } from '@angular/core';
import { chart } from 'highcharts';
import * as _Highcharts from 'highcharts';
import moment from 'moment';
import { TranslateService } from '@ngx-translate/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { FilletTrendChart, DisplayPage } from '../../../models/chart-data';

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
        },
        startOnTick: false,
        minPadding: 0.01,
        maxPadding: 0.01,
        tickAmount: 1
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
        }
      },
      tooltip: {},
      series: dataset
    };
  }
}

@Component({
  selector: 'app-fillet-column-chart',
  templateUrl: './fillet-column-chart.component.html',
  styleUrls: ['./fillet-column-chart.component.scss', '../chart-share-style.scss']
})
export class FilletColumnChartComponent implements OnInit, OnChanges, OnDestroy {
  private ngUnsubscribe = new Subject;
  tooltipTitle = '';
  dateList = [];
  chartType: string;

  @Input() data: any;
  @Input() dateRange: string;
  @Input() chartName: string;
  @Input() searchDate: Array<number>;
  @Input() page: DisplayPage;
  @ViewChild('container', {static: false})
  container: ElementRef;

  constructor(
    private translate: TranslateService
  ) { }

  ngOnInit() {}

  ngOnChanges () {
    this.initChart();
  }

  initChart () {
    this.translate.get('hellow world').pipe(
      takeUntil(this.ngUnsubscribe)
    ).subscribe(() => {
      let trendDataset;
      let chartData = [];
      switch (this.chartName) {
        case 'Calories':
          for (let i = 0; i < this.data.date.length; i++) {
            if (this.data.calories[i] >= 0) {
              chartData.push({
                x: this.data.date[i],
                y: this.data.calories[i],
              });
            }
          }

          this.tooltipTitle = this.translate.instant('universal_userProfile_calories');
          break;
        case 'FitTime':
          this.createDateList();
          const newData = [];
          let idx = 0;
          for (let i = 0; i < this.dateList.length; i++) {
            if (this.dateList[i] === this.data.date[idx]) {
              newData.push(this.data.fitTimeList[idx]);
              idx++;
            } else {
              newData.push(0);
            }
          }

          chartData = newData.map((_item, index) => {
            return {
              x: this.dateList[index],
              y: _item / 60
            };
          });

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

      trendDataset = [
        {
          name: this.tooltipTitle,
          data: chartData,
          showInLegend: false,
          color: this.data.colorSet
        }
      ];

      const trendChartOptions = new ChartOptions(trendDataset);
      if (this.page !== 'cloudrun') {
        // 設定圖表x軸時間間距-kidin-1090204
        if (this.dateRange === 'day' && this.data.date.length <= 7) {
          trendChartOptions['xAxis'].tickInterval = 24 * 3600 * 1000;  // 間距一天
        } else if (this.dateRange === 'day' && this.data.date.length > 7) {
          trendChartOptions['xAxis'].tickInterval = 7 * 24 * 3600 * 1000;  // 間距一週
        } else {
          trendChartOptions['xAxis'].tickInterval = 30 * 24 * 4600 * 1000;  // 間距一個月
        }

      }

      // 設定浮動提示框顯示格式-kidin-1090204
      trendChartOptions['tooltip'] = {
        formatter: function () {
          if (this.series.xAxis.tickInterval === 30 * 24 * 4600 * 1000) {
            return `${moment(this.x).format('YYYY-MM-DD')}~${moment(this.x + 6 * 24 * 3600 * 1000).format('YYYY-MM-DD')}
              <br/>${this.series.name}: ${parseFloat(this.y).toFixed(1)}`;
          } else {
            return `${moment(this.x).format('YYYY-MM-DD')}
              <br/>${this.series.name}: ${parseFloat(this.y).toFixed(1)}`;
          }

        }

      };

      if (this.page === 'cloudrun') {
        trendChartOptions['plotOptions'].series.borderRadius = 0;

        // 設定圖表y軸單位格式
        trendChartOptions['yAxis'].labels = {
          formatter: function () {
            const yVal = this.value,
                  costhr = Math.floor(yVal / 3600),
                  costmin = Math.floor((yVal - costhr * 60 * 60) / 60),
                  costsecond = Math.round(yVal - costmin * 60),
                  timeMin = `${costmin}`.padStart(2, '0'),
                  timeSecond = `${costsecond}`.padStart(2, '0');

            if (costhr === 0 && timeMin === '00') {
              return `0:${timeSecond}`;
            } else if (costhr === 0) {
              return `${timeMin}:${timeSecond}`;
            } else {
              return `${costhr}:${timeMin}:${timeSecond}`;
            }

          }

        };

        // 設定tooltip顯示格式
        trendChartOptions['tooltip'] = {
          formatter: function () {
            const yVal = this.y,
                  costhr = Math.floor(yVal / 3600),
                  costmin = Math.floor((yVal - costhr * 60 * 60) / 60),
                  costsecond = Math.round(yVal - costmin * 60),
                  timeMin = `${costmin}`.padStart(2, '0'),
                  timeSecond = `${costsecond}`.padStart(2, '0');

            let zoneTime = '';
            if (costhr === 0 && timeMin === '00') {
              zoneTime = `0:${timeSecond}`;
            } else if (costhr === 0) {
              zoneTime = `${timeMin}:${timeSecond}`;
            } else {
              zoneTime = `${costhr}:${timeMin}:${timeSecond}`;
            }

            return `${moment(this.x).format('YYYY-MM-DD')}<br>${this.series.name}: ${zoneTime}`;

          }

        }

      }

      this.createChart(trendChartOptions);
    });

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
        weekStartDay = this.searchDate[0] - 86400 * 1000 * moment(this.searchDate[0]).isoWeekday();
      } else {
        weekStartDay = this.searchDate[0];
      }

      if (moment(this.searchDate[0]).isoWeekday() !== 7) {
        weekEndDay = this.searchDate[1] - 86400 * 1000 * moment(this.searchDate[1]).isoWeekday();
      } else {
        weekEndDay = this.searchDate[1];
      }

      diff = ((weekEndDay - weekStartDay) / (86400 * 1000 * 7)) + 1;

      for (let i = 0; i < diff + 1; i++) {
        this.dateList.push(weekStartDay + 86400 * 1000 * 7 * i);
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

  ngOnDestroy () {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

}
