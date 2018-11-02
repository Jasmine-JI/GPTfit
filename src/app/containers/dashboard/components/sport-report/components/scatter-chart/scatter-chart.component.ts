import {
  Component,
  ViewChild,
  ElementRef,
  Input,
  OnChanges
} from '@angular/core';
import { chart } from 'highcharts';
import * as Highcharts from 'highcharts';
import * as moment from 'moment';

@Component({
  selector: 'app-scatter-chart',
  templateUrl: './scatter-chart.component.html',
  styleUrls: [
    './scatter-chart.component.css',
    '../../sport-report.component.css'
  ]
})
export class ScatterChartComponent implements OnChanges {
  @ViewChild('averageHRChartTarget')
  averageHRChartTarget: ElementRef;
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
  @Input() timeType: number;
  seriesX = [];
  series = [];
  constructor() {}

  ngOnChanges() {
    this.handleSportSummaryArray();
    this.initHchart();
  }
  handleSportSummaryArray() {
    let targetName = '';
    if (
      this.chooseType === '1-5' ||
      this.chooseType === '3-4' ||
      this.chooseType === '2-4'
    ) {
      targetName = 'avgSpeed';
    } else if (
      this.chooseType === '1-6' ||
      this.chooseType === '3-5' ||
      this.chooseType === '2-5'
    ) {
      targetName = 'avgMaxSpeed';
    } else if (
      this.chooseType === '1-7' ||
      this.chooseType === '2-6' ||
      this.chooseType === '3-6' ||
      this.chooseType === '5-5' ||
      this.chooseType === '6-3'
    ) {
      targetName = 'avgHeartRateBpm';
    } else if (
      this.chooseType === '1-8' ||
      this.chooseType === '2-7' ||
      this.chooseType === '3-7' ||
      this.chooseType === '5-6' ||
      this.chooseType === '6-4'
    ) {
      targetName = 'avgMaxHeartRateBpm';
    } else if (this.chooseType === '2-8') {
      targetName = 'runAvgCadence';
    } else if (this.chooseType === '2-9') {
      targetName = 'avgRunMaxCadence';
    } else if (this.chooseType === '3-8') {
      targetName = 'cycleAvgCadence';
    } else if (this.chooseType === '3-9') {
      targetName = 'avgCycleMaxCadence';
    } else if (this.chooseType === '3-4') {
      targetName = 'avgSpeed';
    } else if (this.chooseType === '3-5') {
      targetName = 'avgMaxSpeed';
    } else if (this.chooseType === '3-10') {
      targetName = 'cycleAvgWatt';
    } else if (this.chooseType === '3-11') {
      targetName = 'avgCycleMaxWatt';
    } else {
      targetName = 'noDefine';
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
      const data = [];
      if (this.chooseType === '2-4' || this.chooseType === '2-5') {
        this.seriesX.forEach(x => data.push([x, 3600]));
      } else {
        this.seriesX.forEach(x => data.push([x, 0]));
      }
      this.datas
        .filter(_data => _data.activities[0].type === _type)
        .forEach(_data => {
          const idx = this.seriesX.findIndex(
            _seriesX =>
              _seriesX === moment(_data.endTime.slice(0, 10)).unix() * 1000
          );
          if (idx > -1) {
            if (this.chooseType === '2-4' || this.chooseType === '2-5') {
              data[idx][1] = (60 / +_data.activities[0][targetName]) * 60;
            } else {
              data[idx][1] = +_data.activities[0][targetName];
            }
          }
        });
      let name = '';
      let color = '';
      if (_type === '1') {
        name = '跑步';
        color = 'rgba(223, 83, 83, .5)';
      } else if (_type === '2') {
        name = '自行車';
        color = 'rgba(119, 152, 191, .5)';
      } else if (_type === '3') {
        name = '重量訓練';
        color = 'rgba(144, 237, 125, .5)';
      } else if (_type === '4') {
        name = '游泳';
        color = 'rgba(247, 163, 92, .5)';
      } else if (_type === '5') {
        name = '有氧運動';
        color = 'rgba(142, 9,	156, .5)';
      } else {
        name = '尚未定義';
      }
      const serie = { name, data, color };
      this.series.push(serie);
    });
  }

  initHchart() {
    let yAxisText = '';
    let toolTipUnit = ' bpm/min';

    if (
      this.chooseType === '1-7' ||
      this.chooseType === '2-6' ||
      this.chooseType === '3-6' ||
      this.chooseType === '5-5' ||
      this.chooseType === '6-3'
    ) {
      yAxisText = '平均心率 (bpm/min)';
    } else if (
      this.chooseType === '1-8' ||
      this.chooseType === '2-7' ||
      this.chooseType === '3-7' ||
      this.chooseType === '5-6' ||
      this.chooseType === '6-4'
    ) {
      yAxisText = '最大心率 (bpm/min)';
    } else if (this.chooseType === '2-8') {
      yAxisText = '平均步頻(spm)';
      toolTipUnit = ' spm';
    } else if (this.chooseType === '2-9') {
      yAxisText = '最大步頻(spm)';
      toolTipUnit = ' spm';
    } else if (this.chooseType === '3-8') {
      yAxisText = '平均踏頻(spm)';
      toolTipUnit = ' spm';
    } else if (this.chooseType === '3-9') {
      yAxisText = '最大踏頻(spm)';
      toolTipUnit = ' spm';
    } else if (this.chooseType === '3-4') {
      yAxisText = '平均速度(km/hr)';
      toolTipUnit = ' km/hr';
    } else if (this.chooseType === '3-5') {
      yAxisText = '最大速度(km/hr)';
      toolTipUnit = ' km/hr';
    } else if (this.chooseType === '3-10') {
      yAxisText = '平均功率(w)';
      toolTipUnit = ' w';
    } else if (this.chooseType === '3-11') {
      yAxisText = '最大功率(w)';
      toolTipUnit = ' w';
    } else if (this.chooseType === '1-5' || this.chooseType === '3-4') {
      yAxisText = '平均速度(km/hr)';
      toolTipUnit = ' km/hr';
    } else if (this.chooseType === '1-6' || this.chooseType === '3-5') {
      yAxisText = '最大速度(km/hr)';
      toolTipUnit = ' km/hr';
    } else if (this.chooseType === '2-4') {
      yAxisText = '平均配速(min/km)';
      toolTipUnit = ' min/km';
    } else if (this.chooseType === '2-5') {
      yAxisText = '最大配速(min/km)';
      toolTipUnit = ' min/km';
    } else {
      yAxisText = 'noDefine';
      toolTipUnit = ' ';
    }
    const chooseType = this.chooseType;
    const timeType = this.timeType;

    const options: any = {
      chart: {
        type: 'scatter',
        zoomType: 'xy'
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
        title: {
          enabled: true,
          text: '時間'
        },
        startOnTick: true,
        endOnTick: true,
        showLastLabel: true
      },
      tooltip: {
        formatter: function() {
          let yVal = this.y;
          if (chooseType === '2-4' || chooseType === '2-5') {
            const costminperkm = Math.floor(yVal / 60);
            const costsecondperkm = Math.round(yVal - costminperkm * 60);
            const timeMin = ('0' + costminperkm).slice(-2);
            const timeSecond = ('0' + costsecondperkm).slice(-2);

            yVal = `${timeMin}'${timeSecond}"`;
          }
          if (timeType === 2 || timeType === 3) {
            const startDay = moment(this.x - (86400 * 6 * 1000)).format('YYYY/MM/DD');
            const endDay = moment(this.x).format('YYYY/MM/DD');
            return `${startDay}~${endDay}<br>
      <span style="color:${this.point.color}">●</span> ${
              this.series.name
              }: ${yVal}${toolTipUnit}<br/>`;
          }
          return (
            '<b>' +
            this.series.name +
            '</b><br/>' +
            moment(this.x).format('YYYY/MM/DD') +
            '<br> ' +
            yVal +
            toolTipUnit
          );
        }
      },

      yAxis: {
        title: {
          text: yAxisText
        }
      },
      legend: {
        layout: 'vertical',
        align: 'right',
        verticalAlign: 'top',
        x: 0,
        y: 0,
        floating: true,
        backgroundColor: '#FFFFFF',
        borderWidth: 1
      },
      plotOptions: {
        scatter: {
          marker: {
            radius: 5,
            states: {
              hover: {
                enabled: true,
                lineColor: 'rgb(100,100,100)'
              }
            }
          },
          states: {
            hover: {
              marker: {
                enabled: false
              }
            }
          }
        }
      },
      series: this.series
    };
    if (this.chooseType === '2-4' || this.chooseType === '2-5') {
      options.yAxis.min = 0;
      options.yAxis.max = 3600;
      options.yAxis.tickInterval = 600;
      options.yAxis.labels = {
        formatter: function() {
          const costminperkm = Math.floor(this.value / 60);
          const costsecondperkm = Math.round(this.value - costminperkm * 60);
          const timeMin = ('0' + costminperkm).slice(-2);
          const timeSecond = ('0' + costsecondperkm).slice(-2);

          const paceVal = `${timeMin}'${timeSecond}"`;
          return paceVal;
        }
      };
      options.yAxis.reversed = true;
    }
    this.chart1 = chart(this.averageHRChartTarget.nativeElement, options);
  }
}
