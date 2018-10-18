import {
  Component,
  AfterViewInit,
  ViewChild,
  ElementRef,
  Input,
  OnChanges
} from '@angular/core';
import * as _Highcharts from 'highcharts';
import { chart } from 'highcharts';
// import * as Stock from 'highcharts/highstock';

var Highcharts: any = _Highcharts; // 不檢查highchart型態

@Component({
  selector: 'app-column-stacked-chart',
  templateUrl: './column-stacked-chart.component.html',
  styleUrls: ['./column-stacked-chart.component.css', '../../sport-report.component.css']
})
export class ColumnstackedChartComponent implements AfterViewInit, OnChanges {
  @ViewChild('totalDistanceChartTarget')
  totalDistanceChartTarget: ElementRef;
  chart: any; // Highcharts.ChartObject
  @Input() datas: any;
  @Input() chartName: string;
  @Input() chooseType: string;
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
    let targetName = '';
    if (this.chooseType === '1-2' ||
      this.chooseType === '2-1' || this.chooseType === '3-1' ||
      this.chooseType === '4-1' || this.chooseType === '5-1') {
      targetName = 'totalSecond';
    } else {
      targetName = 'totalDistanceMeters';
    }
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
    console.log('sportTypes: ', sportTypes);
    sportTypes.sort().map(_type => { // 加入sort 是為了按照type排序
      const data = [];
      this.seriesX.forEach(() => data.push(0));
      this.datas
        .filter(_data => _data.activities[0].type === _type)
        .forEach(_data => {
          const idx = this.seriesX.findIndex(
            _seriesX => _seriesX === _data.startTime.slice(0, 10)
          );
          data[idx] = +_data.activities[0][targetName];
        });
      console.log('d!ata: ', data);
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
    let yAxisText = '';
    if (this.chooseType === '1-2' ||
      this.chooseType === '2-1' || this.chooseType === '3-1' ||
      this.chooseType === '4-1' || this.chooseType === '5-1') {
      yAxisText = '總時間(s)';
    } else {
      yAxisText = '總距離';
    }
    const options: any = {
      chart: {
        type: 'column'
      },
      title: {
        text: this.chartName
      },
      xAxis: {
        categories: this.seriesX || []
      },
      yAxis: {
        min: 0,
        title: {
          text: yAxisText
        },
        stackLabels: {
          enabled: true,
          style: {
            fontWeight: 'bold',
            color: (Highcharts.theme && Highcharts.theme.textColor) || 'gray'
          }
        }
      },
      legend: {
        align: 'right',
        x: -30,
        verticalAlign: 'top',
        y: 25,
        floating: true,
        backgroundColor: (Highcharts.theme && Highcharts.theme.background2) || 'white',
        borderColor: '#CCC',
        borderWidth: 1,
        shadow: false,
        enabled: true
      },
      tooltip: {
        headerFormat: '<b>{point.x}</b><br/>',
        pointFormat: '{series.name}: {point.y}km<br/>Total: {point.stackTotal}km'
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
          stacking: 'normal',
          dataLabels: {
            enabled: true,
            color: (Highcharts.theme && Highcharts.theme.dataLabelsColor) || 'white'
          }
        }
      },
      series: this.series || []
    };
    this.chart = chart(
      this.totalDistanceChartTarget.nativeElement,
      options
    );
  }
}
