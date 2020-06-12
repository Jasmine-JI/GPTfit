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
        title: {
            text: ''
        },
        startOnTick: false,
        minPadding: 0.01,
        maxPadding: 0.01,
        tickAmount: 1
      },
      plotOptions: {
        series: {
          lineWidth: 5
      }
      },
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
  @Input() dateList: Array<number>;
  @Input() sportType: string;
  @Input() chartName: string;
  @Input() hrZoneRange: any;
  @Input() searchDate: Array<number>;
  @Input() chartHeight: number;

  highestPoint = 0;
  lowestPoint = 100;

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

    let trendDataset,
        chartData = [],
        lineColor = '',
        chartName = '';
    switch (this.chartName) {
      case 'Weight':
        chartData = this.mergeData(this.data.weightList);
        chartName = this.translate.instant('Portal.bodyWeight');
        lineColor = this.data.colorSet;

        break;
      case 'FatRate':
        chartData = this.mergeData(this.data.fatRateList);
        chartName = this.translate.instant('other.fatRate');
        lineColor = this.data.fatRateColorSet;

        break;
      case 'MuscleRate':
        chartData = this.mergeData(this.data.muscleRateList);
        chartName = this.translate.instant('other.muscleRate');
        lineColor = this.data.muscleRateColorSet;

        break;
    }

    trendDataset = [
      {
        name: chartName,
        data: chartData,
        showInLegend: false,
        color: {
          linearGradient : [0, '50%', 0, 0],
          stops : lineColor
        },
        marker: {
          enabled: false
        }
      }
    ];

    const trendChartOptions = new ChartOptions(trendDataset),
          trendChartDiv = this.container.nativeElement;

    // 設定圖表x軸時間間距-kidin-1090204
    if (this.dateRange === 'day' && chartData.length <= 7) {
      trendChartOptions['xAxis'].tickInterval = 24 * 3600 * 1000;  // 間距一天
    } else if (this.dateRange === 'day' && chartData.length > 7) {
      trendChartOptions['xAxis'].tickInterval = 7 * 24 * 3600 * 1000;  // 間距一週
    } else {
      trendChartOptions['xAxis'].tickInterval = 30 * 24 * 4600 * 1000;  // 間距一個月
    }

    // 設定圖表y軸四捨五入取至整數-kidin-1090204
    trendChartOptions['yAxis'].labels = {
      formatter: function () {
        return this.value.toFixed(0);
      }
    };

    // 設定y軸最大最小值-kidin-1090326
    trendChartOptions['yAxis'].max = this.highestPoint + 1;
    trendChartOptions['yAxis'].min = this.lowestPoint - 1;

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
    chart(trendChartDiv, trendChartOptions);

  }

  // 將每個人的數據相加做平均-kidin-1090316
  mergeData (data) {
    const newData = [];
    for (let i = 0; i < this.dateList.length; i++) {

      let total = 0,
          hasDataNum = 0;
      for (let j = 0; j < data.length; j++) {
        if (data[j].length !== 0) {
          total += data[j][i][1];
          hasDataNum++;
        }

      }

      newData.push([this.dateList[i], total / hasDataNum]);

      if (total / hasDataNum > this.highestPoint) {
        this.highestPoint = total / hasDataNum;
      }

      if (total / hasDataNum < this.lowestPoint) {
        this.lowestPoint = total / hasDataNum;
      }


    }

    return newData;
  }

  ngOnDestroy () {}

}
