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
  selector: 'app-average-hr',
  templateUrl: './average-hr.component.html',
  styleUrls: ['./average-hr.component.css']
})
export class AverageHRComponent implements AfterViewInit, OnChanges {
  @ViewChild('averageHRChartTarget')
  averageHRChartTarget: ElementRef;
  chart1: any; // Highcharts.ChartObject

  @Input() datas: any;
  @Input() chartName: string;
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
    sportTypes.sort().map(_type => {
      const data = [];
      this.seriesX.forEach(() => data.push(0));
      this.datas
        .filter(_data => _data.activities[0].type === _type)
        .forEach(_data => {
          const idx = this.seriesX.findIndex(
            _seriesX => _seriesX === _data.startTime.slice(0, 10)
          );
          data[idx] = [_data.startTime.slice(0, 10), +_data.activities[0].avgHeartRateBpm];
        });
      let name = '';
      let color = '';
      if (_type === '1') {
        name = '跑步';
        color = 'rgba(223, 83, 83, .5)';
      } else {
        name = '自行車';
        color = 'rgba(119, 152, 191, .5)';
      }
      const serie = { name, data, color };
      this.series.push(serie);
    });
    console.log('datas: ', this.datas);
    console.log('this.series: ', this.series);
    console.log('this.seriesX: ', this.seriesX);
  }
  initHchart() {
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
        formatter: function () {
          return '<b>' + this.series.name + '</b><br/>' +
            this.x + ', ' + this.y + ' bpm/m';
        }
      },

      yAxis: {
        title: {
          text: '平均心率 (bpm/m)'
        }
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
    this.chart1 = chart(this.averageHRChartTarget.nativeElement, options);
  }
}
