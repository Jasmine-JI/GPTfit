import {
  Component,
  AfterViewInit,
  ViewChild,
  ElementRef,
  Input,
  OnChanges,
  SimpleChanges
} from '@angular/core';
import { chart } from 'highcharts';
import * as _Highcharts from 'highcharts';
import * as HighchartsNoData from 'highcharts-no-data-to-display';
import { ReportService } from '../../../../services/report.service';

var Highcharts: any = _Highcharts; // 不檢查highchart型態
HighchartsNoData(Highcharts);

@Component({
  selector: 'app-activity-levels',
  templateUrl: './activity-levels.component.html',
  styleUrls: ['./activity-levels.component.css']
})
export class ActivityLevelsComponent implements AfterViewInit, OnChanges {
  @ViewChild('activityLevelsChartTarget')
  activityLevelsChartTarget: ElementRef;
  chart1: any; // Highcharts.ChartObject

  @Input() series: any;
  @Input() seriesX: any;
  constructor(private reportService: ReportService) {}

  ngOnChanges(changes: SimpleChanges) {
    this.initHchart();
  }
  ngAfterViewInit() {
      this.initHchart();
  }

  initHchart() {
    const options: any = {
      title: {
        text: '活動數量'
      },
      xAxis: {
        categories: this.seriesX || []
      },
      yAxis: {
        title: {
          text: '活動數量'
        }
      },
      legend: {
        layout: 'vertical',
        align: 'right',
        verticalAlign: 'middle'
      },
      series: this.series || [],
      lang: {
        noData: '期間尚無相關資料'
      },
      noData: {
        style: {
          fontWeight: 'bold',
          fontSize: '15px',
          color: '#303030'
        }
      },
      responsive: {
        rules: [
          {
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
          }
        ]
      }
    };
    this.chart1 = chart(this.activityLevelsChartTarget.nativeElement, options);

  }
}
