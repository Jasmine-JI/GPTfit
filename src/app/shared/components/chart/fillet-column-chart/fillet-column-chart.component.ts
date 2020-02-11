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
  selector: 'app-fillet-column-chart',
  templateUrl: './fillet-column-chart.component.html',
  styleUrls: ['./fillet-column-chart.component.scss']
})
export class FilletColumnChartComponent implements OnInit, OnChanges, OnDestroy {

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
      case 'Calories':
        for (let i = 0; i < this.data.date.length; i++) {
          if (this.data.calories[i] > 0) {
            chartData.push({
              x: this.data.date[i],
              y: this.data.calories[i],
            });
          }
        }

        break;
    }

    trendDataset = [
      {
        name: this.chartName,
        data: chartData,
        showInLegend: false,
        color: this.data.colorSet
      }
    ];

    const caloriesTrendChartOptions = new ChartOptions(trendDataset),
          caloriesTrendChartDiv = this.container.nativeElement;

    // 設定圖表x軸時間間距-kidin-1090204
    if (this.dateRange === 'day') {
      caloriesTrendChartOptions['xAxis'].tickInterval = 7 * 24 * 3600 * 1000;  // 間距一週
    } else {
      caloriesTrendChartOptions['xAxis'].tickInterval = 30 * 24 * 4600 * 1000;  // 間距一個月
    }

    // 設定浮動提示框顯示格式-kidin-1090204
    caloriesTrendChartOptions['tooltip'] = {
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
      chart(caloriesTrendChartDiv, caloriesTrendChartOptions);
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
