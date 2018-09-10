import {
  Component,
  OnInit,
  AfterViewInit,
  ViewChild,
  ElementRef
} from '@angular/core';
import * as _Highcharts from 'highcharts';
import * as Stock from 'highcharts/highstock';

var Highcharts: any = _Highcharts; // 不檢查highchart型態

@Component({
  selector: 'app-total-distance',
  templateUrl: './total-distance.component.html',
  styleUrls: ['./total-distance.component.css']
})
export class TotalDistanceComponent implements OnInit, AfterViewInit {
  @ViewChild('totalDistanceChartTarget')
  totalDistanceChartTarget: ElementRef;
  chart: any; // Highcharts.ChartObject
  constructor(elementRef: ElementRef) {}

  ngOnInit() {}
  ngAfterViewInit() {
    this.initHchart();
  }
  initHchart() {
    const options: any = {
      chart: {
        type: 'column'
      },
      title: {
        text: 'Stacked column chart'
      },
      xAxis: {
        categories: ['Apples', 'Oranges', 'Pears', 'Grapes', 'Bananas']
      },
      yAxis: {
        min: 0,
        title: {
          text: 'Total fruit consumption'
        },
        stackLabels: {
          enabled: true,
          style: {
            fontWeight: 'bold',
            color: (Highcharts.theme && Highcharts.theme.textColor) || 'gray'
          }
        }
      },
      legend: {
        align: 'right',
        x: -30,
        verticalAlign: 'top',
        y: 25,
        floating: true,
        backgroundColor:
          (Highcharts.theme && Highcharts.theme.background2) || 'white',
        borderColor: '#CCC',
        borderWidth: 1,
        shadow: false,
        enabled: true
      },
      tooltip: {
        headerFormat: '<b>{point.x}</b><br/>',
        pointFormat: '{series.name}: {point.y}<br/>Total: {point.stackTotal}'
      },
      navigator: {
        enabled: false
      },
      scrollbar: {
        enabled: false
      },
      rangeSelector: {
        enabled: false
      },
      plotOptions: {
        // series: {
        //   showInNavigator: false
        // },
        column: {
          stacking: 'normal',
          dataLabels: {
            enabled: true,
            color:
              (Highcharts.theme && Highcharts.theme.dataLabelsColor) || 'white'
          }
        }
      },
      series: [
        {
          name: 'John',
          data: [5, 3, 4, 7, 2]
        },
        {
          name: 'Jane',
          data: [2, 2, 3, 2, 1]
        },
        {
          name: 'Joe',
          data: [3, 4, 4, 2, 5]
        }
      ]
    };
    this.chart = new Stock.StockChart(
      this.totalDistanceChartTarget.nativeElement,
      options
    );
  }
}
