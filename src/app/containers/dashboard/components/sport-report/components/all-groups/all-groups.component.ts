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
  selector: 'app-all-groups',
  templateUrl: './all-groups.component.html',
  styleUrls: ['./all-groups.component.css']
})
export class AllGroupsComponent implements OnInit, AfterViewInit {
  @ViewChild('allGroupsChartTarget') allGroupsChartTarget: ElementRef;
  chart1: any; // Highcharts.ChartObject
  constructor(elementRef: ElementRef) {}

  ngOnInit() {}
  ngAfterViewInit() {
    this.initHchart();
  }
  initHchart() {
    const options: any = {
      chart: {
        scrollablePlotArea: {
          minWidth: 700
        }
      },
      title: {
        text: 'Daily sessions at www.highcharts.com'
      },

      subtitle: {
        text: 'Source: Google Analytics'
      },

      xAxis: {
        tickInterval: 7 * 24 * 3600 * 1000, // one week
        tickWidth: 0,
        gridLineWidth: 1,
        labels: {
          align: 'left',
          x: 3,
          y: -3
        }
      },

      yAxis: [
        {
          // left y axis
          title: {
            text: null
          },
          labels: {
            align: 'left',
            x: 3,
            y: 16,
            format: '{value:.,0f}'
          },
          showFirstLabel: false
        },
        {
          // right y axis
          linkedTo: 0,
          gridLineWidth: 0,
          opposite: true,
          title: {
            text: null
          },
          labels: {
            align: 'right',
            x: -3,
            y: 16,
            format: '{value:.,0f}'
          },
          showFirstLabel: false
        }
      ],

      legend: {
        align: 'left',
        verticalAlign: 'top',
        borderWidth: 0
      },

      tooltip: {
        shared: true,
        crosshairs: true
      },

      plotOptions: {
        series: {
          cursor: 'pointer',
          marker: {
            lineWidth: 1
          }
        }
      },
      series: [
        {
          name: 'All sessions',
          lineWidth: 4,
          marker: {
            radius: 4
          },
          data: [null, null, 7988, 12169, 15112, 22452, 34400, 34227]
        },
        {
          name: 'New users',
          data: [null, null, 5988, 10169, 12112, 12452, 34400, 44227]
        }
      ]
    };
    this.chart1 = chart(this.allGroupsChartTarget.nativeElement, options);
  }
}
