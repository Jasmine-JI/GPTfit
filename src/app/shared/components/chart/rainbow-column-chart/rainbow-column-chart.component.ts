import { Component, OnInit, OnChanges, OnDestroy, ViewChild, ElementRef, Input } from '@angular/core';
import { chart } from 'highcharts';
import * as _Highcharts from 'highcharts';
import moment from 'moment';
import { TranslateService } from '@ngx-translate/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { HrZoneRange } from '../../../models/chart-data';

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
          pointPlacement: 0.3,
        },
        series: {
          pointWidth: null,
          borderRadius: 5,
        }
      },
      tooltip: {},
      series: dataset
    };
  }
}

@Component({
  selector: 'app-rainbow-column-chart',
  templateUrl: './rainbow-column-chart.component.html',
  styleUrls: ['./rainbow-column-chart.component.scss']
})
export class RainbowColumnChartComponent implements OnInit, OnChanges, OnDestroy {
  private ngUnsubscribe = new Subject;

  @Input('yAxisData') yAxisData: Array<number>;
  @Input('xAxisData') xAxisData: Array<number>;
  @Input('sportType') sportType: Array<number>;
  @Input('chartType') chartType: Array<number>;
  @Input('hrRange') hrRange: HrZoneRange;
  @Input('showInfo') showInfo: boolean;

  constructor(
    private translate: TranslateService
  ) { }

  ngOnInit(): void {
  }

  ngOnChanges() {

  }

  ngOnDestroy () {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

}


/*
Highcharts.chart('container', {

    title: {
        text: 'Solar Employment Growth by Sector, 2010-2016'
    },

    subtitle: {
        text: 'Source: thesolarfoundation.com'
    },

    yAxis: {
        title: {
            text: 'Number of Employees'
        }
    },

    xAxis: {
        accessibility: {
            rangeDescription: 'Range: 2010 to 2017'
        }
    },

    legend: {
        layout: 'vertical',
        align: 'right',
        verticalAlign: 'middle'
    },

    plotOptions: {
        series: {
            label: {
                connectorAllowed: false
            },
            pointStart: 2010
        }
    },

    series: [{
        name: 'Installation',
        color: {
          linearGradient : { x1: 0, x2: 0, y1: 1, y2: 0 },
          stops : [
          	[0/225, '#6e9bff'],
            [94/225, '#6e9bff'],
            [113/225, '#6bebf9'],
            [132/225, '#75f25f'],
            [151/225, '#f9cc3d'],
            [169/225, '#ff9a22'],
            [170/225, '#ea5757'],
            [225/225, '#ea5757']
          ]
        },
        marker: {
          enabled: false
        },
        data: [
        0,
          125,
          135,
          145,
          155,
          165,
          175,
          185,
          195,
          205,
          210,
          225,
          190,
          170,
          150,
          130,
          110,
          90
        ]
    }],

    responsive: {
        rules: [{
            condition: {
                maxWidth: 500
            },
            chartOptions: {
                legend: {
                    layout: 'horizontal',
                    align: 'center',
                    verticalAlign: 'bottom'
                }
            }
        }]
    }

});
*/