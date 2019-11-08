import {
  Component,
  ViewChild,
  ElementRef,
  Input,
  OnChanges
} from '@angular/core';
import { chart } from 'highcharts';
import * as moment from 'moment';
import { TranslateService } from '@ngx-translate/core';

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
  @Input() currentLang: string;
  seriesX = [];
  series = [];
  xAxisText: string;
  constructor(private translate: TranslateService) {}

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
      this.xAxisText = this.translate.instant('Dashboard.SportReport.time');
      switch (_type) {
        case '1':
          name = this.translate.instant('Dashboard.SportReport.run');
          color = 'rgba(223, 83, 83, .5)';
          break;
        case '2':
          name = this.translate.instant('Dashboard.SportReport.cycle');
          color = 'rgba(119, 152, 191, .5)';
          break;
        case '3':
          name = this.translate.instant('Dashboard.SportReport.actionTraining');
          color = 'rgba(144, 237, 125, .5)';
          break;
        case '4':
          name = this.translate.instant('Dashboard.SportReport.swin');
          color = 'rgba(247, 163, 92, .5)';
          break;
        case '5':
          name = this.translate.instant('Dashboard.SportReport.aerobic');
          color = 'rgba(142, 9,	156, .5)';
          break;
        case '6':
          name = this.translate.instant('Dashboard.SportReport.boating');
          color = 'rgba(153,153,153, .5)';
          break;
        default:
          name = this.translate.instant('Dashboard.SportReport.other');
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
      yAxisText = `${this.translate.instant('Dashboard.SportReport.avgHr')} (bpm/min)`;
    } else if (
      this.chooseType === '1-8' ||
      this.chooseType === '2-7' ||
      this.chooseType === '3-7' ||
      this.chooseType === '5-6' ||
      this.chooseType === '6-4'
    ) {
      yAxisText = `${this.translate.instant('Dashboard.SportReport.maxHr')} (bpm/min)`;
    } else if (this.chooseType === '2-8') {
      yAxisText = `${this.translate.instant('Dashboard.SportReport.avgStepCadence')} (spm)`;
      toolTipUnit = ' spm';
    } else if (this.chooseType === '2-9') {
      yAxisText = `${this.translate.instant('Dashboard.SportReport.maxStepCadence')} (spm)`;
      toolTipUnit = ' spm';
    } else if (this.chooseType === '3-8') {
      yAxisText = `${this.translate.instant('Dashboard.SportReport.avgCyclingCadence')} (spm)`;
      toolTipUnit = ' spm';
    } else if (this.chooseType === '3-9') {
      yAxisText = `${this.translate.instant('Dashboard.SportReport.maxCyclingCadence')} (spm)`;
      toolTipUnit = ' spm';
    } else if (this.chooseType === '3-4') {
      yAxisText = `${this.translate.instant('Dashboard.SportReport.avgSpeed')} (km/hr)`;
      toolTipUnit = ' km/hr';
    } else if (this.chooseType === '3-5') {
      yAxisText = `${this.translate.instant('Dashboard.SportReport.maxSpeed')} (km/hr)`;
      toolTipUnit = ' km/hr';
    } else if (this.chooseType === '3-10') {
      yAxisText = `${this.translate.instant('Dashboard.SportReport.avgPower')} (w)`;
      toolTipUnit = ' w';
    } else if (this.chooseType === '3-11') {
      yAxisText = `${this.translate.instant('Dashboard.SportReport.maxPower')} (w)`;
      toolTipUnit = ' w';
    } else if (this.chooseType === '1-5' || this.chooseType === '3-4') {
      yAxisText = `${this.translate.instant('Dashboard.SportReport.avgSpeed')} (km/hr)`;
      toolTipUnit = ' km/hr';
    } else if (this.chooseType === '1-6' || this.chooseType === '3-5') {
      yAxisText = `${this.translate.instant('Dashboard.SportReport.maxSpeed')} (km/hr)`;
      toolTipUnit = ' km/hr';
    } else if (this.chooseType === '2-4') {
      yAxisText = `${this.translate.instant('Dashboard.SportReport.avgPace')} (min/km)`;
      toolTipUnit = ' min/km';
    } else if (this.chooseType === '2-5') {
      yAxisText = `${this.translate.instant('Dashboard.SportReport.liveBestPace')} (min/km)`;
      toolTipUnit = ' min/km';
    } else {
      yAxisText = `${this.translate.instant('Dashboard.SportReport.other')}`;
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
          text: this.xAxisText
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
            const startDay = moment(this.x - 86400 * 6 * 1000).format(
              'YYYY/MM/DD'
            );
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
