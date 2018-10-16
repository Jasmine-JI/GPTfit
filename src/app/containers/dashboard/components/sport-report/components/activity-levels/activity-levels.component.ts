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
  @Input() datas: any;
  seriesX = [];
  series = [];

  constructor(private reportService: ReportService) {}

  ngOnChanges(changes: SimpleChanges) {
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
    this.datas.forEach((value, idx, self) => {
      if (
        self.findIndex(
          _self => _self.activities[0].type === value.activities[0].type
        ) === idx
      ) {
        sportTypes.push(value.activities[0].type);
      }
    });
    sportTypes.map(_type => {
      const data = [];
      this.seriesX.forEach(() => data.push(0));
      this.datas
        .filter(_data => _data.activities[0].type === _type)
        .forEach(_data => {
          const idx = this.seriesX.findIndex(
            _seriesX => _seriesX === _data.startTime.slice(0, 10)
          );
          data[idx] = +_data.activities[0].totalActivities;
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
