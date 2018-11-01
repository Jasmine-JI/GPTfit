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
  selector: 'app-burn-calories',
  templateUrl: './burn-calories.component.html',
  styleUrls: ['./burn-calories.component.css']
})
export class BurnCaloriesComponent implements OnChanges {
  @ViewChild('burnCaloriesChartTarget')
  burnCaloriesChartTarget: ElementRef;
  chart1: any; // Highcharts.ChartObject

  @Input() datas: any;
  @Input() chartName: string;
  @Input() chooseType: string;
  @Input() periodTimes: any;
  @Input() isLoading: boolean;
  @Input() timeType: number;
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
    this.series = [];
    this.seriesX = [];
    this.seriesX = this.periodTimes;
    const sportTypes = [];
    if (this.chooseType.slice(0, 2) !== '1-') {
      sportTypes.push('1');
    } else {
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
      this.seriesX.forEach((x) => data.push([x, 0]));
      this.datas
        .filter(_data => _data.activities[0].type === _type)
        .forEach(_data => {
          const idx = this.seriesX.findIndex(
            _seriesX => _seriesX === moment(_data.endTime.slice(0, 10)).unix() * 1000
          );
          if (idx > -1) {
            data[idx][1] = +_data.activities[0].calories;
          }
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
  }
  initHchart() {
    const options: any = {
      chart: {
        type: 'area',
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
        title: {
          text: '消耗卡路里(Cal)'
        },
        labels: {
          formatter: function() {
            return this.value;
          }
        }
      },
      tooltip: {
        xDateFormat: '%Y-%m-%d',
        split: true,
        valueSuffix: ' Cal',
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
