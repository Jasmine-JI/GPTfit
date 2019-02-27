import {
  Component,
  ViewChild,
  ElementRef,
  Input,
  OnChanges
} from '@angular/core';
import { chart } from 'highcharts';
import * as moment from 'moment';

@Component({
  selector: 'app-other-burn-calories',
  templateUrl: './other-burn-calories.component.html',
  styleUrls: [
    './other-burn-calories.component.css',
    '../../sport-report.component.css'
  ]
})
export class OtherBurnCaloriesComponent implements OnChanges {
  @ViewChild('otherBurnChartTarget')
  otherBurnChartTarget: ElementRef;
  chart1: any; // Highcharts.ChartObject
  @Input()
  datas: any;
  @Input()
  chartName: string;
  @Input()
  chooseType: string;
  @Input()
  periodTimes: any;
  @Input()
  isLoading: boolean;
  @Input()
  timeType: number;
  @Input() currentLang: string;
  yAxistext: string;
  seriesX = [];
  series = [];
  constructor() {}

  ngOnChanges() {
    this.handleSportSummaryArray();
    this.initHchart();
  }
  handleSportSummaryArray() {
    this.series = [];
    this.seriesX = [];
    this.seriesX = this.periodTimes;
    const sportTypes = [];
    if (this.chooseType.slice(0, 2) === '2-') {
      sportTypes.push('1'); // 只選run type
    } else if (this.chooseType.slice(0, 2) === '3-') {
      sportTypes.push('2'); // 只選cycle type
    } else if (this.chooseType.slice(0, 2) === '4-') {
      sportTypes.push('4'); // 只選swim type
    } else if (this.chooseType.slice(0, 2) === '5-') {
      sportTypes.push('3'); // 只選weightTraining type
    } else if (this.chooseType.slice(0, 2) === '6-') {
      sportTypes.push('5'); // 只選有氧 type
    } else {
      // all type
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
      // 加入sort 是為了按照type排序
      const data = [];
      this.seriesX.forEach(x => data.push([x, 0]));
      this.datas
        .filter(_data => _data.activities[0].type === _type)
        .forEach(_data => {
          const idx = this.seriesX.findIndex(
            _seriesX =>
              _seriesX === moment(_data.endTime.slice(0, 10)).unix() * 1000
          );
          if (idx > -1) {
            data[idx][1] = +_data.activities[0].calories;
          }
        });
      let name = '';
      if (this.currentLang === 'zh-tw') {
        this.yAxistext = '消耗卡路里(Cal)';
        switch (_type) {
          case '1':
            name = '跑步';
            break;
          case '2':
            name = '騎乘';
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
      } else if (this.currentLang === 'zh-cn') {
        this.yAxistext = '消耗卡路里(Cal)';
        switch (_type) {
          case '1':
            name = '跑步';
            break;
          case '2':
            name = '骑乘';
            break;
          case '3':
            name = '重量训练';
            break;
          case '4':
            name = '游泳';
            break;
          case '5':
            name = '有氧运动';
            break;
          case '6':
            name = '划船';
            break;
          default:
            name = '尚未定义';
        }
      } else {
        this.yAxistext = 'burn calories(Cal)';
        switch (_type) {
          case '1':
            name = 'Running';
            break;
          case '2':
            name = 'Cycling';
            break;
          case '3':
            name = 'Weight training';
            break;
          case '4':
            name = 'Swimming';
            break;
          case '5':
            name = 'Aerobic';
            break;
          case '6':
            name = 'Rower';
            break;
          default:
            name = 'not yet defined';
        }
      }
      const serie = { name, data };
      this.series.push(serie);
    });
  }
  initHchart() {
    const timeType = this.timeType;
    const options: any = {
      chart: {
        type: 'column',
        zoomType: 'x'
      },
      title: {
        text: this.chartName
      },
      xAxis: {
        type: 'datetime',
        dateTimeLabelFormats: {
          day: '%m/%d',
          week: '%m/%d',
          month: '%Y/%m',
          year: '%Y'
        },
        crosshair: true
      },
      yAxis: {
        min: 0,
        title: {
          text: this.yAxistext
        }
      },
      tooltip: {
        formatter: function() {
          const yVal = this.y;
          if (timeType === 2 || timeType === 3) {
            const startDay = moment(this.x - 86400 * 6 * 1000).format(
              'YYYY/MM/DD'
            );
            const endDay = moment(this.x).format('YYYY/MM/DD');
            return `${startDay}~${endDay}<br>
      <span style="color:${this.points[0].series.color}">●</span> ${
              this.points[0].series.name
            }: </span>${yVal.toFixed(1)} cal<br/>`;
          }
          return (
            moment(this.x).format('YYYY/MM/DD') +
            '<br> ' +
            `<span style="color:${
              this.points[0].series.color
            };padding:0">●</span>` +
            this.points[0].series.name +
            yVal.toFixed(1) +
            ' cal'
          );
        },
        shared: true,
        useHTML: true
      },
      plotOptions: {
        column: {
          pointPadding: 0.2,
          borderWidth: 0
        }
      },
      series: this.series
    };
    this.chart1 = chart(this.otherBurnChartTarget.nativeElement, options);
  }
}
