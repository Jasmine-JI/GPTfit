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
import { TranslateService } from '@ngx-translate/core';
import { BMIColor, fatRateColor, muscleRateColor } from '../../../models/chart-data';

// 建立圖表用-kidin-1081212
class ChartOptions {
  constructor(dataset) {
    return {
      chart: {
        type: 'line',
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
        minPadding: 0.01,
        maxPadding: 0.01,
        tickAmount: 1,
      },
      plotOptions: {
        series: {
          lineWidth: 5,
        },
      },
      tooltip: {},
      series: dataset,
    };
  }
}

@Component({
  selector: 'app-line-chart',
  templateUrl: './line-chart.component.html',
  styleUrls: ['./line-chart.component.scss'],
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

  @ViewChild('container', { static: false })
  container: ElementRef;

  constructor(private translate: TranslateService) {}

  ngOnInit() {}

  ngOnChanges() {
    this.initChart();
  }

  initChart() {
    let trendDataset,
      chartData = [],
      lineColor: Array<any> = [],
      chartName = '';
    chartData = this.data.arr;
    this.highestPoint = this.data.top + 1;
    this.lowestPoint = this.data.bottom - 1;
    switch (this.chartName) {
      case 'BMI':
        chartName = 'BMI';
        lineColor = [
          [0, BMIColor.low],
          [0.5, BMIColor.middle],
          [1, BMIColor.high],
        ];
        break;
      case 'FatRate':
        chartName = this.translate.instant('universal_lifeTracking_fatRate');
        lineColor = [
          [0, fatRateColor.low],
          [1, fatRateColor.high],
        ];
        break;
      case 'MuscleRate':
        chartName = this.translate.instant('universal_userProfile_muscleRate');
        lineColor = [
          [0, muscleRateColor.low],
          [1, muscleRateColor.high],
        ];
        break;
    }

    trendDataset = [
      {
        name: chartName,
        data: chartData,
        showInLegend: false,
        color: {
          linearGradient: [0, '50%', 0, 0],
          stops: lineColor,
        },
        marker: {
          enabled: false,
        },
      },
    ];

    const trendChartOptions = new ChartOptions(trendDataset);

    // 設定圖表x軸時間間距-kidin-1090204
    if (this.dateRange === 'day' && chartData.length <= 7) {
      trendChartOptions['xAxis'].tickInterval = 24 * 3600 * 1000; // 間距一天
    } else if (this.dateRange === 'day' && chartData.length > 7) {
      trendChartOptions['xAxis'].tickInterval = 7 * 24 * 3600 * 1000; // 間距一週
    } else {
      trendChartOptions['xAxis'].tickInterval = 30 * 24 * 3600 * 1000; // 間距一個月
    }

    // 設定圖表y軸四捨五入取至整數-kidin-1090204
    trendChartOptions['yAxis'].labels = {
      formatter: function () {
        return parseFloat(this.value.toFixed(0));
      },
    };

    // 設定y軸最大最小值-kidin-1090326
    trendChartOptions['yAxis'].max = this.highestPoint + 1;
    trendChartOptions['yAxis'].min = this.lowestPoint - 1;

    // 設定浮動提示框顯示格式-kidin-1090204
    trendChartOptions['tooltip'] = {
      formatter: function () {
        if (this.series.xAxis.tickInterval === 30 * 24 * 3600 * 1000) {
          return `${dayjs(this.x).format('YYYY-MM-DD')}~${dayjs(
            this.x + 6 * 24 * 3600 * 1000
          ).format('YYYY-MM-DD')}
            <br/>${this.series.name}: ${parseFloat(this.y.toFixed(1))}`;
        } else {
          return `${dayjs(this.x).format('YYYY-MM-DD')}
            <br/>${this.series.name}: ${parseFloat(this.y.toFixed(1))}`;
        }
      },
    };

    this.createChart(trendChartOptions);
  }

  // 將每個人的數據相加做平均-kidin-1090316
  mergeData(data) {
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
