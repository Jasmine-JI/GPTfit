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
  selector: 'app-burn-calories',
  templateUrl: './burn-calories.component.html',
  styleUrls: ['./burn-calories.component.css']
})
export class BurnCaloriesComponent implements AfterViewInit, OnChanges {
  @ViewChild('burnCaloriesChartTarget')
  burnCaloriesChartTarget: ElementRef;
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
          data[idx] = +_data.activities[0].calories;
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
    console.log('datas: ', this.datas);
    console.log('this.series: ', this.series);
    console.log('this.seriesX: ', this.seriesX);
  }
  initHchart() {
    const options: any = {
      chart: {
        type: 'area'
      },
      title: {
        text: this.chartName
      },
      xAxis: {
        categories: this.seriesX || [],
        tickmarkPlacement: 'on',
        title: {
          enabled: false
        }
      },
      yAxis: {
        title: {
          text: '消耗卡路里'
        },
        labels: {
          formatter: function() {
            return this.value / 1000;
          }
        }
      },
      tooltip: {
        split: true,
        valueSuffix: ' millions'
      },
      plotOptions: {
        area: {
          stacking: 'normal',
          lineColor: '#666666',
          lineWidth: 1,
          marker: {
            lineWidth: 1,
            lineColor: '#666666'
          }
        }
      },
      series: this.series || []
    };
    this.chart1 = chart(this.burnCaloriesChartTarget.nativeElement, options);
  }
}
