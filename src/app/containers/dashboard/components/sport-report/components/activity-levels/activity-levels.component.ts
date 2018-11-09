import {
  Component,
  ViewChild,
  ElementRef,
  Input,
  OnChanges,
  SimpleChanges,
  OnDestroy
} from '@angular/core';
import * as Highcharts from 'highcharts';
import * as HighchartsNoData from 'highcharts-no-data-to-display';
import * as moment from 'moment';

@Component({
  selector: 'app-activity-levels',
  templateUrl: './activity-levels.component.html',
  styleUrls: ['./activity-levels.component.css']
})
export class ActivityLevelsComponent implements OnChanges, OnDestroy {
  @ViewChild('activityLevelsChartTarget')
  activityLevelsChartTarget: ElementRef;
  chart1: any; // Highcharts.ChartObject
  @Input() datas: any;
  @Input() chartName: string;
  @Input() periodTimes: any;
  @Input() isLoading: boolean;
  @Input() timeType: number;

  seriesX = [];
  series = [];

  constructor() {
    HighchartsNoData(Highcharts);
    Highcharts.setOptions({
      global: {
        useUTC: false
      }
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    this.handleSportSummaryArray();
    this.initHchart();
  }

  ngOnDestroy () {
    this.chart1.destroy();
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
      this.seriesX.forEach((x) => data.push([x, 0]));
      this.datas
        .filter(_data => _data.activities[0].type === _type)
        .forEach(_data => {
          const idx = this.seriesX.findIndex(
            _seriesX => {
              return _seriesX === moment(_data.endTime.slice(0, 10)).unix() * 1000;
            });
          if (idx > -1) {
            data[idx][1] = +_data.activities[0].totalActivities;
          }
        });
      let name = '';
      switch (_type) {
        case '1':
          name = '跑步';
          break;
        case '2':
          name = '自行車';
          break;
        case '3':
          name = '重量訓練';
          break;
        case '4':
          name = '游泳';
          break;
        case '5':
          name = '有氧運動';
          break;
        case '6':
          name = '划船';
          break;
        default:
          name = '尚未定義';
      }
      const serie = { name, data };
      this.series.push(serie);
    });
  }
  initHchart() {
    const options: any = {
      title: {
        text: this.chartName
      },
      chart: {
        zoomType: 'x'
      },
      xAxis: {
        type: 'datetime',
        dateTimeLabelFormats: {
          day: '%m/%d',
          week: '%m/%d',
          month: '%Y/%m',
          year: '%Y'
        }
      },
      tooltip: {
        type: 'datetime',
        dateTimeLabelFormats: {
          day: '%Y-%m-%d',
          month: '%Y-%M',
          year: '%Y'
        }
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
    if (this.timeType === 2 || this.timeType === 3) {
        options.tooltip.formatter =  function() {
        const startDay = moment(this.x - (86400 * 6 * 1000)).format('YYYY/MM/DD');
        const endDay = moment(this.x).format('YYYY/MM/DD');
        return `${startDay}~${endDay}<br>
        <span style="color:${this.point.color}">●</span> ${this.series.name}: <b>${this.point.y}</b><br/>`;
      };
    }
    this.chart1 = Highcharts.chart(this.activityLevelsChartTarget.nativeElement, options);

  }
}
