import {
  Component,
  ViewChild,
  ElementRef,
  Input,
  OnChanges
} from '@angular/core';
import * as Highcharts from 'highcharts';
import { chart } from 'highcharts';
import * as moment from 'moment';

@Component({
  selector: 'app-column-stacked-chart',
  templateUrl: './column-stacked-chart.component.html',
  styleUrls: [
    './column-stacked-chart.component.css',
    '../../sport-report.component.css'
  ]
})
export class ColumnstackedChartComponent implements OnChanges {
  @ViewChild('totalDistanceChartTarget')
  totalDistanceChartTarget: ElementRef;
  chart: any; // Highcharts.ChartObject
  @Input() datas: any;
  @Input() chartName: string;
  @Input() chooseType: string;
  @Input() periodTimes: any;
  @Input() isLoading: boolean;
  @Input() timeType: number;
  @Input() currentLang: string;
  seriesX = [];
  series = [];

  constructor() {
    Highcharts.setOptions({
      global: {
        useUTC: false
      }
    });
  }

  ngOnChanges() {
    this.handleSportSummaryArray();
    this.initHchart();
  }
  handleSportSummaryArray() {
    let targetName = '';
    if (
      this.chooseType === '1-2' ||
      this.chooseType === '2-1' ||
      this.chooseType === '3-1' ||
      this.chooseType === '4-1' ||
      this.chooseType === '5-1' ||
      this.chooseType === '6-1'
    ) {
      targetName = 'totalSecond';
    } else {
      targetName = 'totalDistanceMeters';
    }
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
            data[idx][1] = +_data.activities[0][targetName];
          }
        });
      let name = '';
      if (this.currentLang === 'zh-tw') {
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
        switch (_type) {
          case '1':
            name = 'Running';
            break;
          case '2':
            name = 'Ride';
            break;
          case '3':
            name = 'Weight training';
            break;
          case '4':
            name = 'Swimming';
            break;
          case '5':
            name = 'Aerobic exercise';
            break;
          case '6':
            name = 'Boating';
            break;
          default:
            name = 'not yet defined';
        }
      }
      const serie = { name, data };
      this.series.push(serie);
    });
  }
  convertUnit(y) {
    let yVal = y;
    if (
      this.chooseType === '1-2' ||
      this.chooseType === '2-1' ||
      this.chooseType === '3-1' ||
      this.chooseType === '4-1' ||
      this.chooseType === '5-1' ||
      this.chooseType === '6-1'
    ) {
      const costhr = Math.floor(yVal / 3600);
      const costmin = Math.floor(Math.round(yVal - costhr * 60 * 60) / 60);
      const costsecond = Math.round(yVal - costmin * 60);
      const timeHr = ('0' + costhr).slice(-2);
      const timeMin = ('0' + costmin).slice(-2);
      const timeSecond = ('0' + costsecond).slice(-2);

      yVal = `${timeHr}:${timeMin}:${timeSecond}`;
    } else {
      yVal = yVal / 1000;
    }
    return yVal;
  }
  initHchart() {
    let yAxisText = '';
    let toolTipUnit = '';
    // const chooseType = this.chooseType;
    const convertUnit = this.convertUnit.bind(this);
    if (
      this.chooseType === '1-2' ||
      this.chooseType === '2-1' ||
      this.chooseType === '3-1' ||
      this.chooseType === '4-1' ||
      this.chooseType === '5-1' ||
      this.chooseType === '6-1'
    ) {
      if (this.currentLang === 'zh-tw') {
        yAxisText = '總時間(min)';
      } else if (this.currentLang === 'zh-cn') {
        yAxisText = '总时间(min)';
      } else {
        yAxisText = 'Total time(min)';
      }
      toolTipUnit = ' ';
    } else {
      if (this.currentLang === 'zh-tw') {
        yAxisText = '總距離(km)';
      } else if (this.currentLang === 'zh-cn') {
        yAxisText = '总距离(km)';
      } else {
        yAxisText = 'Total Distance(km)';
      }
      toolTipUnit = ' km';
    }
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
        }
      },
      yAxis: {
        min: 0,
        title: {
          text: yAxisText
        }
      },
      legend: {
        align: 'right',
        x: -30,
        verticalAlign: 'top',
        y: 25,
        floating: true,
        backgroundColor: 'white',
        borderColor: '#CCC',
        borderWidth: 1,
        shadow: false,
        enabled: true
      },
      tooltip: {
        formatter: function() {
          return (
            '<b>' +
            moment(this.x).format('YYYY/MM/DD') +
            '</b><br/>' +
            this.series.name +
            ': ' +
            convertUnit(this.y) +
            toolTipUnit
          );
        }
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
          stacking: 'normal'
        }
      },
      series: this.series || []
    };
    if (
      this.chooseType === '1-2' ||
      this.chooseType === '2-1' ||
      this.chooseType === '3-1' ||
      this.chooseType === '4-1' ||
      this.chooseType === '5-1' ||
      this.chooseType === '6-1'
    ) {
      options.yAxis.labels = {
        formatter: function() {
          const distance = Math.round(this.value / 60);
          return distance + ' min';
        }
      };
    } else {
      options.yAxis.min = 0;
      options.yAxis.tickInterval = 1000; // 因為1km = 1000m
      options.yAxis.labels = {
        formatter: function() {
          const distance = this.value / 1000;
          return distance + ' km';
        }
      };
    }
    if (this.timeType === 2 || this.timeType === 3) {
      options.tooltip.formatter = function() {
        const startDay = moment(this.x - 86400 * 6 * 1000).format('YYYY/MM/DD');
        const endDay = moment(this.x).format('YYYY/MM/DD');
        return `${startDay}~${endDay}<br>
        <span style="color:${this.point.color}">●</span> ${
          this.series.name
        }: ${convertUnit(this.point.y)}${toolTipUnit}<br/>`;
      };
    }
    this.chart = chart(this.totalDistanceChartTarget.nativeElement, options);
  }
}
