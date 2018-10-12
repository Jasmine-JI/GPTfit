import {
  Component,
  OnInit,
  AfterViewInit,
  ViewChild,
  ElementRef,
  Input,
  OnChanges,
  SimpleChanges
} from '@angular/core';
import { chart } from 'highcharts';
import * as _Highcharts from 'highcharts';
import { ReportService } from '../../../../services/report.service';
import { UtilsService} from '@shared/services/utils.service';
import * as moment from 'moment';

var Highcharts: any = _Highcharts; // 不檢查highchart型態

@Component({
  selector: 'app-activity-levels',
  templateUrl: './activity-levels.component.html',
  styleUrls: ['./activity-levels.component.css']
})
export class ActivityLevelsComponent
  implements OnInit, AfterViewInit, OnChanges {
  @ViewChild('activityLevelsChartTarget')
  activityLevelsChartTarget: ElementRef;
  chart1: any; // Highcharts.ChartObject

  series = [];
  seriesX: any;
  @Input()timeType: number;
  constructor(
    private reportService: ReportService,
    private utils: UtilsService
  ) {}

  ngOnInit() {}
  ngOnChanges(changes: SimpleChanges) {
    this.series = [];
    let filterEndTime = moment().format('YYYY-MM-DDTHH:mm:ss+08:00');
    const day = moment().format('d');

    let body = {};
    let filterStartTime = '';
    if (changes.timeType.currentValue === 0) {
      filterStartTime = moment().subtract(7, 'days').format('YYYY-MM-DDTHH:mm:ss+08:00');
    } else if (changes.timeType.currentValue === 1) {
      filterStartTime = moment().subtract(30, 'days').format('YYYY-MM-DDTHH:mm:ss+08:00');
    } else if (changes.timeType.currentValue === 2) {
      filterStartTime = moment()
        .subtract(day, 'days')
        .subtract(26, 'weeks')
        .format('YYYY-MM-DDT00:00:00+08:00');
      filterEndTime = moment()
        .add(6 - +day, 'days')
        .format('YYYY-MM-DDT23:59:59+08:00');
    } else {
      filterStartTime = moment()
        .subtract(day, 'days')
        .subtract(52, 'weeks')
        .format('YYYY-MM-DDT00:00:00+08:00');
      filterEndTime = moment()
        .add(6 - +day, 'days')
        .format('YYYY-MM-DDT23:59:59+08:00');
    }
    if (changes.timeType.currentValue <= 1 )  {
      body = {
        token: this.utils.getToken(),
        type: 1,
        filterStartTime,
        filterEndTime
      };
    } else {
      body = {
        token: this.utils.getToken(),
        type: 2,
        filterStartTime,
        filterEndTime
      };
    }
    this.handleSportSummaryArray(body);

  }
  ngAfterViewInit() {
    const filterEndTime = moment().format('YYYY-MM-DDTHH:mm:ss+08:00');
    const filterStartTime = moment().subtract(7, 'days').format('YYYY-MM-DDTHH:mm:ss+08:00');

    const body = {
      token: this.utils.getToken(),
      type: 1,
      filterStartTime,
      filterEndTime
    };
    this.handleSportSummaryArray(body);

  }
  handleSportSummaryArray(body) {
    this.reportService.fetchSportSummaryArray(body).subscribe(res => {
      const { reportActivityDays, reportActivityWeeks } = res;
      let datas = [];
      if (body.type === 1) {
        datas = reportActivityDays;
      } else {
        datas = reportActivityWeeks;
      }
      this.seriesX = datas
        .filter((value, idx, self) => {
          return self.findIndex(_self => _self.startTime.slice(0, 10) === value.startTime.slice(0, 10)) === idx;
        })
        .map(_serie => _serie.startTime.slice(0, 10))
        .sort();
      const sportTypes = [];
      datas.forEach((value, idx, self) => {
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
        datas
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
      this.initHchart();
    });
  }
  initHchart() {
    const options: any = {
      // title: {
      //   text: 'Solar Employment Growth by Sector, 2010-2016'
      // },

      // subtitle: {
      //   text: 'Source: thesolarfoundation.com'
      // },
      xAxis: {
        categories: this.seriesX
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
      series: this.series,
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
