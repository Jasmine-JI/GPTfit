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
import * as moment from 'moment';

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
  @Input() chartName: string;
  @Input() periodTimes: any;
  @Input() isLoading: boolean;
  @Input() timeType: boolean;

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
    this.seriesX = this.periodTimes;
    const sportTypes = [];
    this.datas.forEach((value, idx, self) => {
      const sameIdx = self.findIndex(
          _self => {
            return _self.activities[0].type === value.activities[0].type;
          });
      if (sameIdx === idx) {
        sportTypes.push(value.activities[0].type);
      }
    });
    sportTypes.sort().map(_type => {
      const data = [];
      this.seriesX.forEach(() => data.push(0));
      this.datas
        .filter(_data => _data.activities[0].type === _type)
        .forEach(_data => {
          const idx = this.seriesX.findIndex(
            _seriesX => _seriesX.slice(0, 10) === _data.startTime.slice(0, 10)
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
    const timeType = this.timeType;
    const options: any = {
      title: {
        text: this.chartName
      },
      xAxis: {
        labels: {
          formatter: function () {
            const _day = moment(this.value).format('d');
            if (timeType === 1) {
              if (_day === '0') {
                return this.value;
              } else {
                return '';
              }
            }
            return this.value;

          }
        },
        categories: this.seriesX || []
      },
      yAxis: {
        min: 0,
        tickInterval: 1,
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
