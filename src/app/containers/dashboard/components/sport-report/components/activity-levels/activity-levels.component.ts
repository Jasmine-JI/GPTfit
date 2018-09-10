import {
  Component,
  OnInit,
  AfterViewInit,
  ViewChild,
  ElementRef
} from '@angular/core';
import { chart } from 'highcharts';
import * as _Highcharts from 'highcharts';

var Highcharts: any = _Highcharts; // 不檢查highchart型態

@Component({
  selector: 'app-activity-levels',
  templateUrl: './activity-levels.component.html',
  styleUrls: ['./activity-levels.component.css']
})
export class ActivityLevelsComponent implements OnInit, AfterViewInit {
  @ViewChild('activityLevelsChartTarget')
  activityLevelsChartTarget: ElementRef;
  chart1: any; // Highcharts.ChartObject
  constructor(elementRef: ElementRef) {}

  ngOnInit() {}
  ngAfterViewInit() {
    this.initHchart();
  }
  initHchart() {
    const options: any = {
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

      series: [
        {
          name: 'Installation',
          data: [43934, 52503, 57177, 69658, 97031, 119931, 137133, 154175]
        },
        {
          name: 'Manufacturing',
          data: [24916, 24064, 29742, 29851, 32490, 30282, 38121, 40434]
        },
        {
          name: 'Sales & Distribution',
          data: [11744, 17722, 16005, 19771, 20185, 24377, 32147, 39387]
        },
        {
          name: 'Project Development',
          data: [null, null, 7988, 12169, 15112, 22452, 34400, 34227]
        },
        {
          name: 'Other',
          data: [12908, 5948, 8105, 11248, 8989, 11816, 18274, 18111]
        }
      ],

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
