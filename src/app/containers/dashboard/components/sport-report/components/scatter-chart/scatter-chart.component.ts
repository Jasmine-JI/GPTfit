import {
  Component,
  AfterViewInit,
  ViewChild,
  ElementRef,
  Input,
  OnChanges
} from '@angular/core';
import { chart } from 'highcharts';
import * as _Highcharts from 'highcharts';

var Highcharts: any = _Highcharts; // 不檢查highchart型態

@Component({
  selector: 'app-scatter-chart',
  templateUrl: './scatter-chart.component.html',
  styleUrls: ['./scatter-chart.component.css', '../../sport-report.component.css']
})
export class ScatterChartComponent implements AfterViewInit, OnChanges {
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
  @Input() isLoading: boolean;
  seriesX = [];
  series = [];
  constructor() {
  }

  ngOnChanges() {
    this.handleSportSummaryArray();
    this.initHchart();
  }
  ngAfterViewInit() {
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
      this.chooseType === '5-5'
    ) {
      targetName = 'avgHeartRateBpm';
    } else if (
      this.chooseType === '1-8' ||
      this.chooseType === '2-7' ||
      this.chooseType === '3-7' ||
      this.chooseType === '5-6'
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
    // this.seriesX = this.datas
    //   .filter((value, idx, self) => {
    //     return (
    //       self.findIndex(
    //         _self =>
    //           _self.startTime.slice(0, 10) === value.startTime.slice(0, 10)
    //       ) === idx
    //     );
    //   })
    //   .map(_serie => _serie.startTime.slice(0, 10))
    //   .sort();
    const sportTypes = [];
    if (this.chooseType.slice(0, 2) === '2-') {
      sportTypes.push('1'); // 只選run type
    } else if (this.chooseType.slice(0, 2) === '3-') {
      sportTypes.push('2'); // 只選cycle type
    } else if (this.chooseType.slice(0, 2) === '4-') {
      sportTypes.push('4'); // 只選swim type
    } else if (this.chooseType.slice(0, 2) === '5-') {
      sportTypes.push('3'); // 只選weightTraining type
    } else { // all type
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
        this.seriesX.forEach(() => data.push(3600));
      } else {
        this.seriesX.forEach(() => data.push(0));
      }
      this.datas
        .filter(_data => _data.activities[0].type === _type)
        .forEach(_data => {
          const idx = this.seriesX.findIndex(
            _seriesX => _seriesX.slice(0, 10) === _data.startTime.slice(0, 10)
          );
          if (this.chooseType === '2-4' || this.chooseType === '2-5') {
            data[idx] = (60 / +_data.activities[0][targetName]) * 60;
          } else {
            data[idx] = [_data.startTime.slice(0, 10), +_data.activities[0][targetName]];
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
      } else {
        name = '尚未定義';
      }
      const serie = { name, data, color };
      this.series.push(serie);
    });
    console.log('datas: ', this.datas);
    console.log('this.series: ', this.series);
    console.log('this.seriesX: ', this.seriesX);
  }

  initHchart() {
    let yAxisText = '';
    let toolTipUnit = ' bpm/min';

    if (
      this.chooseType === '1-7' ||
      this.chooseType === '2-6' ||
      this.chooseType === '3-6' ||
      this.chooseType === '5-5'
    ) {
      yAxisText = '平均心率 (bpm/min)';
    } else if (
      this.chooseType === '1-8' ||
      this.chooseType === '2-7' ||
      this.chooseType === '3-7' ||
      this.chooseType === '5-6'
    ) {
      yAxisText = '最大心率 (bpm/min)';
    } else if (this.chooseType === '2-8') {
      yAxisText = '平均步頻';
      toolTipUnit = ' ';
    } else if (this.chooseType === '2-9') {
      yAxisText = '最大步頻';
      toolTipUnit = ' ';
    } else if (this.chooseType === '3-8') {
      yAxisText = '平均踏頻';
      toolTipUnit = ' ';
    } else if (this.chooseType === '3-9') {
      yAxisText = '最大踏頻';
      toolTipUnit = ' ';
    } else if (this.chooseType === '3-4') {
      yAxisText = '平均速度';
      toolTipUnit = ' km/hr';
    } else if (this.chooseType === '3-5') {
      yAxisText = '最大速度';
      toolTipUnit = ' km/hr';
    } else if (this.chooseType === '3-10') {
      yAxisText = '平均功率';
      toolTipUnit = ' ';
    } else if (this.chooseType === '3-11') {
      yAxisText = '最大功率';
      toolTipUnit = ' ';
    } else if (this.chooseType === '1-5' || this.chooseType === '3-4') {
      yAxisText = '平均速度';
      toolTipUnit = ' km/hr';
    } else if (this.chooseType === '1-6' || this.chooseType === '3-5') {
      yAxisText = '最大速度';
      toolTipUnit = ' km/hr';
    } else if (this.chooseType === '2-4') {
      yAxisText = '平均配速';
      toolTipUnit = ' min/km';
    } else if (this.chooseType === '2-5') {
      yAxisText = '最大配速';
      toolTipUnit = ' min/km';
    } else {
      yAxisText = 'noDefine';
      toolTipUnit = ' ';
    }
    const chooseType = this.chooseType;
    const options: any = {
      chart: {
        type: 'scatter',
        zoomType: 'xy'
      },
      title: {
        text: this.chartName
      },
      xAxis: {
        categories: this.seriesX || [],
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

          return (
            '<b>' +
            this.series.name +
            '</b><br/>' +
            this.x +
            ', ' +
            yVal + toolTipUnit
          );
        }
      },

      yAxis: {
        title: {
          text: yAxisText
        },
      },
      legend: {
        layout: 'vertical',
        align: 'right',
        verticalAlign: 'top',
        x: 0,
        y: 0,
        floating: true,
        backgroundColor:
          (Highcharts.theme && Highcharts.theme.legendBackgroundColor) ||
          '#FFFFFF',
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
      options.yAxis.max = 3000;
      options.yAxis.max = 3600;
      options.yAxis.tickInterval = 600;
      options.yAxis.labels = {
        formatter: function () {
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
