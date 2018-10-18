import {
  Component,
  AfterViewInit,
  ViewChild,
  ElementRef,
  Input,
  OnChanges,
  SimpleChanges
} from '@angular/core';
import * as _Highcharts from 'highcharts';
import { chart } from 'highcharts';
// import * as Stock from 'highcharts/highstock';
// import { ReportService } from '../../../../services/report.service';
// import { UtilsService } from '@shared/services/utils.service';
// import * as moment from 'moment';

var Highcharts: any = _Highcharts; // 不檢查highchart型態

@Component({
  selector: 'app-all-duration',
  templateUrl: './all-duration.component.html',
  styleUrls: ['./all-duration.component.css']
})
export class AllDurationComponent implements OnChanges, AfterViewInit {
  @ViewChild('allDurationChartTarget')
  allDurationChartTarget: ElementRef;
  chart: any; // Highcharts.ChartObject

  @Input() datas: any;
  @Input() chartName: string;
  @Input() chooseType: string;

  seriesX = [];
  series = [];
  constructor() {}

  ngOnChanges() {
    this.handleSportSummaryArray();
    this.initHchart();
  }
  ngAfterViewInit() {
    this.handleSportSummaryArray();
    this.initHchart();
  }
  handleSportSummaryArray() {
    this.series = [];
    this.seriesX = [];
    this.seriesX = this.datas
      .filter((value, idx, self) => {
        return (
          self.findIndex(
            _self =>
              _self.startTime.slice(0, 10) === value.startTime.slice(0, 10)
          ) === idx
        );
      })
      .map(_serie => _serie.startTime.slice(0, 10))
      .sort();
    const sportTypes = [];
    if (this.chooseType.slice(0, 2) !== '1-') {
      sportTypes.push('1');
    } else {
      this.datas.forEach((value, idx, self) => {
        if (
          self.findIndex(
            _self => _self.activities[0].type === value.activities[0].type
          ) === idx
        ) {
          sportTypes.push(value.activities[0].type);
        }
      });
    }

    console.log('sportTypes: ', sportTypes);
    sportTypes.sort().map(_type => {
      const data = [];
      this.seriesX.forEach(() => data.push(0));
      this.datas
        .filter(_data => _data.activities[0].type === _type)
        .forEach(_data => {
          const idx = this.seriesX.findIndex(
            _seriesX => _seriesX === _data.startTime.slice(0, 10)
          );
          data[idx] = +_data.activities[0].totalSecond;
        });
      let name = '';
      if (_type === '1') {
        name = '跑步';
      } else {
        name = '自行車';
      }
      const serie = { name, data };
      this.series.push(serie);
    });
    console.log('datas: ', this.datas);
    console.log('this.series: ', this.series);
    console.log('this.seriesX: ', this.seriesX);
  }
  initHchart() {
    const options: any = {
      chart: {
        type: 'column'
      },
      title: {
        text: this.chartName
      },
      xAxis: {
        categories: this.seriesX || []
      },
      yAxis: {
        min: 0,
        title: {
          text: '總時間'
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
        backgroundColor: (Highcharts.theme && Highcharts.theme.background2) || 'white',
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
        series: {
          showInNavigator: false
        },
        column: {
          stacking: 'normal',
          dataLabels: {
            enabled: true,
            color: (Highcharts.theme && Highcharts.theme.dataLabelsColor) || 'white'
          }
        }
      },
      series: this.series || []
    };
    this.chart = chart(this.allDurationChartTarget.nativeElement, options);
  }
}
