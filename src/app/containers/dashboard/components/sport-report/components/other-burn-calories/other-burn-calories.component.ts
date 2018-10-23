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
  selector: 'app-other-burn-calories',
  templateUrl: './other-burn-calories.component.html',
  styleUrls: ['./other-burn-calories.component.css', '../../sport-report.component.css']
})
export class OtherBurnCaloriesComponent implements AfterViewInit, OnChanges {
  @ViewChild('otherBurnChartTarget')
  otherBurnChartTarget: ElementRef;
  chart1: any; // Highcharts.ChartObject
  @Input() datas: any;
  @Input() chartName: string;
  @Input() chooseType: string;
  @Input() periodTimes: any;
  seriesX = [];
  series = [];
  constructor() {}

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
    sportTypes.sort().map(_type => { // 加入sort 是為了按照type排序
      const data = [];
      this.seriesX.forEach(() => data.push(0));
      this.datas
        .filter(_data => _data.activities[0].type === _type)
        .forEach(_data => {
          const idx = this.seriesX.findIndex(
            _seriesX => _seriesX.slice(0, 10) === _data.startTime.slice(0, 10)
          );
          data[idx] = +_data.activities[0].calories;
        });
      let name = '';
      if (_type === '1') {
        name = '跑步';
      } else if (_type === '2') {
        name = '自行車';
      } else if (_type === '3') {
        name = '重量訓練';
      } else if (_type === '4') {
        name = '游泳';
      } else {
        name = '尚未定義';
      }
      const serie = { name, data };
      this.series.push(serie);
    });
    console.log('datas: ', this.datas);
    console.log('this.series: ', this.series);
    console.log('this.seriesX: ', this.seriesX);
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
          categories: this.seriesX || [],
          crosshair: true
      },
      yAxis: {
          min: 0,
          title: {
              text: '消耗卡路里 (bpm/min)'
          }
      },
      tooltip: {
          headerFormat: '<span style="font-size:10px">{point.key}</span><table>',
          pointFormat: '<tr><td style="color:{series.color};padding:0">{series.name}: </td>' +
              '<td style="padding:0"><b>{point.y:.1f} bpm/min</b></td></tr>',
          footerFormat: '</table>',
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
