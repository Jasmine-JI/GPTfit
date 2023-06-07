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
  rightMoveColor,
  leftMoveColor,
  acclerateColor,
  hitColor,
  jumpColor,
  landingColor,
  forehandSwingColor,
  backHandSwingColor,
} from '../../../../core/models/represent-color';
import { RelativeTrendChart } from '../../../../core/models/compo/chart-data.model';
import { day, month, week } from '../../../../core/models/const';
import { DataTypeUnitPipe } from '../../../../core/pipes/data-type-unit.pipe';
import { DataTypeTranslatePipe } from '../../../../core/pipes/data-type-translate.pipe';
import { NgIf, DecimalPipe } from '@angular/common';

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
        startOnTick: true,
        minPadding: 0.01,
        maxPadding: 0.01,
        tickAmount: 3,
      },
      tooltip: {},
      plotOptions: {
        column: {
          stacking: 'normal',
          pointPlacement: 0.33,
        },
        series: {
          pointWidth: null,
          maxPointWidth: 30,
        },
      },
      series: dataset,
    };
  }
}

@Component({
  selector: 'app-relative-column-chart',
  templateUrl: './relative-column-chart.component.html',
  styleUrls: ['./relative-column-chart.component.scss', '../chart-share-style.scss'],
  standalone: true,
  imports: [NgIf, DecimalPipe, TranslateModule, DataTypeTranslatePipe, DataTypeUnitPipe],
})
export class RelativeColumnChartComponent implements OnInit, OnChanges, OnDestroy {
  dateList = [];
  chartType: string;
  title = {
    positive: '',
    negative: '',
  };

  @Input() data: RelativeTrendChart;
  @Input() dateRange: string;
  @Input() sportType: string;
  @Input() chartName: string;
  @Input() unit = 0;
  @Input() page = 'sportReport';
  @Input() isPreviewMode = false;
  @ViewChild('container', { static: false })
  container: ElementRef;

  constructor(private translate: TranslateService) {}

  ngOnInit(): void {}

  ngOnChanges(): void {
    this.initChart();
  }

  /**
   * 生成正負長條圖圖表
   */
  initChart() {
    let positiveColor: string, negativeColor: string;
    switch (this.chartName) {
      case 'TotalXGForce':
        this.chartType = 'xMoveGForce';
        positiveColor = rightMoveColor;
        negativeColor = leftMoveColor;
        this.title = {
          positive: this.translate.instant('universal_activityData_totalRight'),
          negative: this.translate.instant('universal_activityData_totalLeft'),
        };
        break;
      case 'TotalYGForce':
        this.chartType = 'yMoveGForce';
        positiveColor = acclerateColor;
        negativeColor = hitColor;
        this.title = {
          positive: this.translate.instant('universal_activityData_totalAcceleration'),
          negative: this.translate.instant('universal_activityData_totalImpact'),
        };
        break;
      case 'TotalZGForce':
        this.chartType = 'zMoveGForce';
        positiveColor = jumpColor;
        negativeColor = landingColor;
        this.title = {
          positive: this.translate.instant('universal_activityData_totalJump'),
          negative: this.translate.instant('universal_activityData_totalFloorImpact'),
        };
        break;
      case 'SwingRatio':
        this.chartType = 'swingRatio';
        positiveColor = forehandSwingColor;
        negativeColor = backHandSwingColor;
        this.title = {
          positive: this.translate.instant('universal_activityData_forehandCount'),
          negative: this.translate.instant('universal_activityData_backhandCcount'),
        };
        break;
    }

    const { positiveData, negativeData } = this.data,
      { positive, negative } = this.title,
      dataset = [
        {
          name: positive,
          data: positiveData,
          showInLegend: false,
          color: positiveColor,
        },
        {
          name: negative,
          data: negativeData,
          showInLegend: false,
          color: negativeColor,
        },
      ];

    const chartOptions = new ChartOptions(dataset);

    // 設定圖表x軸時間間距-kidin-1090204
    if (this.dateRange === 'day' && positiveData.length <= 7) {
      chartOptions['xAxis'].tickInterval = day;
    } else if (this.dateRange === 'day' && positiveData.length > 7) {
      chartOptions['xAxis'].tickInterval = week;
    } else {
      chartOptions['xAxis'].tickInterval = month;
    }

    // 設定浮動提示框顯示格式-kidin-1090204
    chartOptions['tooltip'] = {
      formatter: function () {
        const yVal = parseFloat(this.y.toFixed(1));
        if (this.series.xAxis.tickInterval === month) {
          return `${dayjs(this.x).format('YYYY-MM-DD')}~${dayjs(this.x + 6 * day).format(
            'YYYY-MM-DD'
          )}
            <br/>${this.series.name}: ${yVal}`;
        } else {
          return `${dayjs(this.x).format('YYYY-MM-DD')}
            <br/>${this.series.name}: ${yVal}`;
        }
      },
    };

    const top = this.data.maxGForce ?? this.data.maxForehandCount,
      bottom = this.data.minGForce ?? this.data.maxBackhandCount;
    // 設定圖表上下限軸線位置，以顯示數值為0的軸線
    const absPositive = Math.abs(parseFloat(top.toFixed(0))),
      absNegative = Math.abs(parseFloat(bottom.toFixed(0)));
    if (absPositive > absNegative) {
      chartOptions['yAxis']['tickPositions'] = [-absPositive, 0, absPositive];
    } else {
      chartOptions['yAxis']['tickPositions'] = [-absNegative, 0, absNegative];
    }

    this.createChart(chartOptions);
  }

  /**
   * 確認取得元素才建立圖表
   * @param option {ChartOptions}-highchart圖表設定
   * @author kidin-1100511
   */
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

  ngOnDestroy(): void {}
}
