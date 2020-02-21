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
        type: 'line',
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
        minPadding: 0.1,
        maxPadding: 0.01
      },
      plotOptions: {},
      tooltip: {},
      series: dataset
    };
  }
}

@Component({
  selector: 'app-line-chart',
  templateUrl: './line-chart.component.html',
  styleUrls: ['./line-chart.component.scss']
})
export class LineChartComponent implements OnInit, OnChanges, OnDestroy {

  @Input() data: any;
  @Input() dateRange: string;
  @Input() chartName: string;

  @ViewChild('container')
  container: ElementRef;

  constructor() { }

  ngOnInit() {}

  ngOnChanges () {
    console.log('line', this.data, this.dateRange);
    this.initChart();
  }

  initChart () {
    Highcharts.charts.length = 0;  // 初始化global highchart物件，可避免HighCharts.Charts為 undefined -kidin-1081212

    let trendDataset,
        chartData = [],
        lineColor = '';
    switch (this.chartName) {
      case 'Weight':
        chartData = this.data.weightList.map((_item, index) => {
          return {
            x: this.data.date[index],
            y: _item,
            marker: {
              enabled: false
            }
          };
        });

        lineColor = this.data.colorSet;

        break;
      case 'FatRate':
        chartData = this.data.fatRateList.map((_item, index) => {
          return {
            x: this.data.date[index],
            y: _item,
            marker: {
              enabled: false
            }
          };
        });

        lineColor = this.data.fatRateColorSet;

        break;
      case 'MuscleRate':
        chartData = this.data.muscleRateList.map((_item, index) => {
          return {
            x: this.data.date[index],
            y: _item,
            marker: {
              enabled: false
            }
          };
        });

        lineColor = this.data.muscleRateColorSet;

        break;
    }

    trendDataset = [
      {
        name: this.chartName,
        data: chartData,
        showInLegend: false,
        color: lineColor
      }
    ];

    const trendChartOptions = new ChartOptions(trendDataset),
          trendChartDiv = this.container.nativeElement;

    // 設定圖表x軸時間間距-kidin-1090204
    if (this.dateRange === 'day') {
      trendChartOptions['xAxis'].tickInterval = 7 * 24 * 3600 * 1000;  // 間距一週
    } else {
      trendChartOptions['xAxis'].tickInterval = 30 * 24 * 4600 * 1000;  // 間距一個月
    }

    // 設定浮動提示框顯示格式-kidin-1090204
    trendChartOptions['tooltip'] = {
      formatter: function () {
        if (this.series.xAxis.tickInterval === 30 * 24 * 4600 * 1000) {
          return `${moment(this.x).format('YYYY/MM/DD')}~${moment(this.x + 6 * 24 * 3600 * 1000).format('YYYY/MM/DD')}
            <br/>${this.series.name}: ${parseFloat(this.y).toFixed(1)}`;
        } else {
          return `${moment(this.x).format('YYYY/MM/DD')}
            <br/>${this.series.name}: ${parseFloat(this.y).toFixed(1)}`;
        }

      }

    };

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
