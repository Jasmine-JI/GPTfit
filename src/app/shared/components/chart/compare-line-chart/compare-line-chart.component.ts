import { Component, OnInit, OnChanges, OnDestroy, ViewChild, ElementRef, Input } from '@angular/core';
import { chart } from 'highcharts';
import moment from 'moment';
import { TranslateService } from '@ngx-translate/core';
import {
  CompareLineTrendChart,
  DisplayPage,
  zoneColor,
  rightMoveColor,
  leftMoveColor,
  acclerateColor,
  hitColor,
  jumpColor,
  landingColor,
  restHrColor
} from '../../../models/chart-data';
import { unit, Unit } from '../../../models/bs-constant';
import { day, month, week } from '../../../models/utils-constant';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';


// 建立圖表用-kidin-1081212
class ChartOptions {
  constructor (dataset) {
    return {
      chart: {
        type: 'spline',
        height: 110,
        backgroundColor: 'transparent'
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
        },
        minPadding: 0.1,
        maxPadding: 0.03
      },
      yAxis: {
        title: {
            text: ''
        },
        minPadding: 0.01,
        maxPadding: 0.01,
        tickAmount: 1
      },
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
  selector: 'app-compare-line-chart',
  templateUrl: './compare-line-chart.component.html',
  styleUrls: ['./compare-line-chart.component.scss', '../chart-share-style.scss']
})
export class CompareLineChartComponent implements OnInit, OnChanges, OnDestroy {
  private ngUnsubscribe = new Subject;
  noData = false;
  firstSunday: number;
  lastSunday: number;
  dataLength: number;
  chartType: string;

  @Input() data: any;
  @Input() dateRange: string;
  @Input() chartName: string;
  @Input() hrZoneRange: any;
  @Input() searchDate: Array<number>;
  @Input() chartHeight = <number>110;
  @Input() page: DisplayPage;
  @Input() unit = <Unit>unit.metric;
  @Input() isPreviewMode: boolean = false;
  @ViewChild('container', {static: false})
  container: ElementRef;

  constructor(
    private translate: TranslateService
  ) { }

  ngOnInit() {}

  ngOnChanges () {
    this.translate.get('hellow world').pipe(
      takeUntil(this.ngUnsubscribe)
    ).subscribe(() => {
      this.initChart();
    });
    
  }

  /**
   * 建立圖表
   * @author kidin-1100625
   */
  initChart () {
    let trendDataset;
    switch (this.chartName) {
      case 'HR':
        this.chartType = 'hr';
        const { maxHrArr, hrArr } = this.data;
        this.dataLength = hrArr.length;
        trendDataset = [
          {
            name: this.translate.instant('universal_userProfile_maxHr'),
            data: maxHrArr,
            showInLegend: false,
            color: '#ff9a22',
            marker: {
              symbol: 'circle'
            }
          },
          {
            name: this.translate.instant('universal_activityData_hr'),
            data: hrArr,
            showInLegend: false,
            color: '#75f25f',
            marker: {
              symbol: 'circle'
            }
          }
        ];

        break;
      case 'Power':
        const powerTitle = this.translate.instant('universal_activityData_power');
        this.chartType = 'power';
        this.dataLength = this.data.powerArr.length;
        trendDataset = [
          {
            name: powerTitle,
            data: this.data.maxPowerArr,
            showInLegend: false,
            color: '#ff9a22',
            marker: {
              fillColor: '#ea5757',
              symbol: 'circle'
            }
          },
          {
            name: powerTitle,
            data: this.data.powerArr,
            showInLegend: false,
            color: '#72e8b0',
            marker: {
              fillColor: '#75f25f',
              symbol: 'circle'
            }
          }
        ];

        break;
      case 'ExtremeXGForce':
        const extremeRightMoveTitle = this.translate.instant('universal_activityData_maxRight'),
              extremeLeftMoveTitle = this.translate.instant('universal_activityData_maxLeft');
        this.chartType = 'xMoveGForce';
        this.dataLength = this.data.maxXArr.length;
          trendDataset = [
            {
              name: extremeRightMoveTitle,
              data: this.data.maxXArr,
              showInLegend: false,
              color: rightMoveColor,
              marker: {
                symbol: 'circle'
              }
            },
            {
              name: extremeLeftMoveTitle,
              data: this.data.minXArr,
              showInLegend: false,
              color: leftMoveColor,
              marker: {
                symbol: 'circle'
              }
            }
          ];
        break;
      case 'ExtremeYGForce':
        const extremeAccelateTitle = this.translate.instant('universal_activityData_maxAcceleration'),
              extremeHitTitle = this.translate.instant('universal_activityData_maxImpact');
        this.chartType = 'yMoveGForce';
        this.dataLength = this.data.maxYArr.length;
          trendDataset = [
            {
              name: extremeAccelateTitle,
              data: this.data.maxYArr,
              showInLegend: false,
              color: acclerateColor,
              marker: {
                symbol: 'circle'
              }
            },
            {
              name: extremeHitTitle,
              data: this.data.minYArr,
              showInLegend: false,
              color: hitColor,
              marker: {
                symbol: 'circle'
              }
            }
          ];
        break;
      case 'ExtremeZGForce':
        const extremeJumpTitle = this.translate.instant('universal_activityData_maxJump'),
              extremeLandingTitle = this.translate.instant('universal_activityData_maxFloorImpact');
        this.chartType = 'zMoveGForce';
        this.dataLength = this.data.maxZArr.length;
          trendDataset = [
            {
              name: extremeJumpTitle,
              data: this.data.maxZArr,
              showInLegend: false,
              color: jumpColor,
              marker: {
                symbol: 'circle'
              }
            },
            {
              name: extremeLandingTitle,
              data: this.data.minZArr,
              showInLegend: false,
              color: landingColor,
              marker: {
                symbol: 'circle'
              }
            }
          ];
        break;
      case 'LifeHR':
        this.dataLength = this.data.restHr.length;
        trendDataset = [
          {
            name: this.translate.instant('universal_userProfile_maxHr'),
            data: this.data.maxHr,
            showInLegend: false,
            color: restHrColor.line,
            marker: {
              enabled: true,
              fillColor: restHrColor.max,
              symbol: 'circle',
              height: 20
            }
          },
          {
            name: this.translate.instant('universal_userProfile_restHr'),
            data: this.data.restHr,
            showInLegend: false,
            color: restHrColor.line,
            marker: {
              enabled: true,
              fillColor: restHrColor.rest,
              symbol: 'circle',
              height: 20
            }
          }
        ];

        break;
    }

    const trendChartOptions = new ChartOptions(trendDataset);
    // 以後可能會個別設定，故不寫死-kidin-1090221
    switch (this.chartName) {
      case 'HR':
      case 'Power':
      case 'LifeHR':
        // 設定浮動提示框顯示格式-kidin-1090204
        trendChartOptions['tooltip'] = {
          formatter: function () {
            const startDate = moment(this.x).format('YYYY-MM-DD'),
                  value = parseFloat(this.point.y.toFixed(1));
            if (this.series.xAxis.tickInterval === month) {
              const endDate = moment(this.x + 6 * day).format('YYYY-MM-DD');
              return `${startDate}~${endDate}<br/>${this.series.name}: ${value}`;
            } else {
              return `${startDate}<br/>${this.series.name}: ${value}`;
            }

          }

        };

        // 設定圖表高度-kidin-1090221
        trendChartOptions['chart'].height = this.chartHeight;
        break;
      case 'ExtremeXGForce':
      case 'ExtremeYGForce':
      case 'ExtremeZGForce':
        // 設定浮動提示框顯示格式(小數點後3位)-kidin-1090204
        trendChartOptions['tooltip'] = {
          formatter: function () {
            const startDate = moment(this.x).format('YYYY-MM-DD'),
                  value = parseFloat(this.point.y.toFixed(3));
            if (this.series.xAxis.tickInterval === month) {
              const endDate = moment(this.x + 6 * day).format('YYYY-MM-DD');
              return `${startDate}~${endDate}<br/>${this.series.name}: ${value}`;
            } else {
              return `${startDate}<br/>${this.series.name}: ${value}`;
            }

          }

        };
        break;
    }

    if (this.page !== 'cloudrun') {
      // 設定圖表x軸時間間距-kidin-1090204
      if (this.dateRange === 'day' && this.dataLength <= 7) {
        trendChartOptions['xAxis'].tickInterval = day;  // 間距一天
      } else if (this.dateRange === 'day' && this.dataLength > 7) {
        trendChartOptions['xAxis'].tickInterval = week;  // 間距一週
      } else {
        trendChartOptions['xAxis'].tickInterval = month;  // 間距一個月
      }

    }

    this.createChart(trendChartOptions);
  }

  // 根據心率區間的值決定該點顏色-kidin-1090210
  assignColor (valueX: number | string, valueY: number, type: string) {
    if (this.hrZoneRange['z0'] !== null) {
      if (valueY < this.hrZoneRange['z0']) {
        return {
          x: valueX,
          y: valueY,
          marker: {
            enabled: true,
            fillColor: zoneColor[0]
          }
        };
      } else if (valueY >= this.hrZoneRange['z0'] && valueY < this.hrZoneRange['z1']) {
        return {
          x: valueX,
          y: valueY,
          marker: {
            enabled: true,
            fillColor: zoneColor[1]
          }
        };
      } else if (valueY >= this.hrZoneRange['z1'] && valueY < this.hrZoneRange['z2']) {
        return {
          x: valueX,
          y: valueY,
          marker: {
            enabled: true,
            fillColor: zoneColor[2]
          }
        };
      } else if (valueY >= this.hrZoneRange['z2'] && valueY < this.hrZoneRange['z3']) {
        return {
          x: valueX,
          y: valueY,
          marker: {
            enabled: true,
            fillColor: zoneColor[3]
          }
        };
      } else if (valueY >= this.hrZoneRange['z3'] && valueY < this.hrZoneRange['z4']) {
        return {
          x: valueX,
          y: valueY,
          marker: {
            enabled: true,
            fillColor: zoneColor[4]
          }
        };
      } else {
        return {
          x: valueX,
          y: valueY,
          marker: {
            enabled: true,
            fillColor: zoneColor[5]
          }
        };
      }

    } else {
      if (type === 'normal') {
        return {
          x: valueX,
          y: valueY,
          marker: {
            enabled: true,
            fillColor: '#9b70e0'
          }
        };
      } else {
        return {
          x: valueX,
          y: valueY,
          marker: {
            enabled: true,
            fillColor: '#6e9bff'
          }
        };
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

  /**
   * 解除rxjs訂閱
   * @author kidin-1100615
   */
  ngOnDestroy () {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

}
