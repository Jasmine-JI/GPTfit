import { Component, OnInit, OnChanges, OnDestroy, ViewChild, ElementRef, Input } from '@angular/core';
import { chart } from 'highcharts';
import * as _Highcharts from 'highcharts';
import moment from 'moment';
import { TranslateService } from '@ngx-translate/core';

const Highcharts: any = _Highcharts; // 不檢查highchart型態

/**
 * 建立圖表用
 */
class ChartOptions {
  constructor (dataset) {
    return {
      chart: {
        zoomType: 'x', // 縮放的基準軸
        height: 110
      },
      title: {
        text: ''
      },
      credits: {
        enabled: false // 是否顯示'Highchart'字樣
      },
      xAxis: {
        type: 'datetime',
      },
      yAxis: [{
        title: {
            text: ''
        },
        labels: {
          enabled: false  // 是否顯示軸線
        }
      }],
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
  selector: 'app-trinomial-chart',
  templateUrl: './trinomial-chart.component.html',
  styleUrls: ['./trinomial-chart.component.scss']
})
export class TrinomialChartComponent implements OnInit, OnChanges, OnDestroy {

  @Input('compareA') compareA: any;
  @Input('compareB') compareB: any;
  @Input('terrain') terrain: any;
  @ViewChild('container') container: ElementRef;

  constructor(
    private translate: TranslateService
  ) {}

  ngOnInit(): void {}

  ngOnChanges(): void {

  }

  ngOnDestroy(): void {}

}
