import {
  Component,
  AfterViewInit,
  ViewChild,
  ElementRef,
  Input,
  OnChanges
} from '@angular/core';
import * as _Highcharts from 'highcharts';
import { chart } from 'highcharts';
import { TranslateService } from '@ngx-translate/core';

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
  constructor(private translate: TranslateService) {}

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
        name = this.translate.instant('Dashboard.SportReport.run');
      } else {
        name = this.translate.instant('Dashboard.SportReport.cycle');
      }
      const serie = { name, data };
      this.series.push(serie);
    });
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
          text: this.translate.instant('Dashboard.SportReport.totalTime')
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
