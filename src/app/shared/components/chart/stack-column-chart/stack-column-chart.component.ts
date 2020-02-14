import { Component, OnInit, OnChanges, OnDestroy, ViewChild, ElementRef, Input } from '@angular/core';

import { chart } from 'highcharts';
import * as _Highcharts from 'highcharts';
import * as moment from 'moment';

const Highcharts: any = _Highcharts; // 不檢查highchart型態

// 建立圖表用-kidin-1081212
class ChartOptions {
  constructor (dataset) {
    return {
      chart: {
        type: 'column',
        height: 150
      },
      title: {
        text: ''
      },
      credits: {
        enabled: false
      },
      xAxis: {
        type: 'datetime',
        dateTimeLabelFormats: {
          millisecond: '%m/%d',
          second: '%m/%d',
          minute: '%m/%d',
          hour: '%m/%d',
          day: '%m/%d',
          week: '%m/%d',
          month: '%Y/%m',
          year: '%Y'
        }
      },
      yAxis: {
        min: 0,
        title: {
            text: ''
        }
      },
      tooltip: {},
      plotOptions: {
        column: {
            stacking: 'normal'
        },
        series: {
          pointWidth: 10
        }
      },
      series: dataset
    };
  }
}

@Component({
  selector: 'app-stack-column-chart',
  templateUrl: './stack-column-chart.component.html',
  styleUrls: ['./stack-column-chart.component.scss']
})
export class StackColumnChartComponent implements OnInit, OnChanges, OnDestroy {

  noPerHRZoneData = true;

  @Input() perHrZoneData: Array<any>;
  @Input() dateRange: string;

  @ViewChild('container')
  container: ElementRef;

  constructor() { }

  ngOnInit () { }

  ngOnChanges () {
    if (this.perHrZoneData.length === 0) {
      this.noPerHRZoneData = true;
    } else {
      this.noPerHRZoneData = false;
    }
    this.initChart();
  }

  initChart () {
    // 將之前生成的highchart卸除避免新生成的highchart無法顯示-kidin-1081219
    Highcharts.charts.forEach((_highChart, idx) => {
      if (_highChart !== undefined) {
        _highChart.destroy();
      }
    });
    Highcharts.charts.length = 0;  // 初始化global highchart物件，可避免HighCharts.Charts為 undefined -kidin-1081212

    const zoneZero = [],
          zoneOne = [],
          zoneTwo = [],
          zoneThree = [],
          zoneFour = [],
          zoneFive = [];
    let sameDayZoneZero = 0,
        sameDayZoneOne = 0,
        sameDayZoneTwo = 0,
        sameDayZoneThree = 0,
        sameDayZoneFour = 0,
        sameDayZoneFive = 0;
    for (let i = 0; i < this.perHrZoneData.length; i++) {
      // 將日期重複的心率區間相加-kidin-1090203
      if (i === 0 || this.perHrZoneData[i][7] === this.perHrZoneData[i - 1][7]) {
        sameDayZoneZero += this.perHrZoneData[i][1],
        sameDayZoneOne += this.perHrZoneData[i][2],
        sameDayZoneTwo += this.perHrZoneData[i][3],
        sameDayZoneThree += this.perHrZoneData[i][4],
        sameDayZoneFour += this.perHrZoneData[i][5],
        sameDayZoneFive += this.perHrZoneData[i][6];

        if (i === this.perHrZoneData.length - 1) {
          const timeStamp = moment(this.perHrZoneData[i][7], 'YYYY-MM-DD').valueOf();
          zoneZero.push([timeStamp, sameDayZoneZero]);
          zoneOne.push([timeStamp, sameDayZoneOne]);
          zoneTwo.push([timeStamp, sameDayZoneTwo]);
          zoneThree.push([timeStamp, sameDayZoneThree]);
          zoneFour.push([timeStamp, sameDayZoneFour]);
          zoneFive.push([timeStamp, sameDayZoneFive]);
        }
      } else {
        let timeStamp = moment(this.perHrZoneData[i - 1][7], 'YYYY-MM-DD').valueOf();
        zoneZero.push([timeStamp, sameDayZoneZero]);
        zoneOne.push([timeStamp, sameDayZoneOne]);
        zoneTwo.push([timeStamp, sameDayZoneTwo]);
        zoneThree.push([timeStamp, sameDayZoneThree]);
        zoneFour.push([timeStamp, sameDayZoneFour]);
        zoneFive.push([timeStamp, sameDayZoneFive]);

        if (i !== this.perHrZoneData.length - 1 ) {
          sameDayZoneZero = this.perHrZoneData[i][1],
          sameDayZoneOne = this.perHrZoneData[i][2],
          sameDayZoneTwo = this.perHrZoneData[i][3],
          sameDayZoneThree = this.perHrZoneData[i][4],
          sameDayZoneFour = this.perHrZoneData[i][5],
          sameDayZoneFive = this.perHrZoneData[i][6];
        } else {
          timeStamp = moment(this.perHrZoneData[i][7], 'YYYY-MM-DD').valueOf();
          zoneZero.push([timeStamp, this.perHrZoneData[i][1]]);
          zoneOne.push([timeStamp, this.perHrZoneData[i][2]]);
          zoneTwo.push([timeStamp, this.perHrZoneData[i][3]]);
          zoneThree.push([timeStamp, this.perHrZoneData[i][4]]);
          zoneFour.push([timeStamp, this.perHrZoneData[i][5]]);
          zoneFive.push([timeStamp, this.perHrZoneData[i][6]]);
        }

      }
    }

    const HRTrendDataset = [
      {
        name: 'Zone5',
        data: zoneFive,
        showInLegend: false,
        color: '#f36953'
      },
      {
        name: 'Zone4',
        data: zoneFour,
        showInLegend: false,
        color: '#f3b353'
      },
      {
        name: 'Zone3',
        data: zoneThree,
        showInLegend: false,
        color: '#f7f25b'
      },
      {
        name: 'Zone2',
        data: zoneTwo,
        showInLegend: false,
        color: '#abf784'
      },
      {
        name: 'Zone1',
        data: zoneOne,
        showInLegend: false,
        color: '#64e0ec'
      },
      {
        name: 'Zone0',
        data: zoneZero,
        showInLegend: false,
        color: '#70b1f3'
      }
    ];

    const HRTrendChartOptions = new ChartOptions(HRTrendDataset),
          HRTrendChartDiv = this.container.nativeElement;

    // 設定圖表x軸時間間距-kidin-1090204
    if (this.dateRange === 'day') {
      HRTrendChartOptions['xAxis'].tickInterval = 7 * 24 * 3600 * 1000;  // 間距一週
    } else {
      HRTrendChartOptions['xAxis'].tickInterval = 30 * 24 * 4600 * 1000;  // 間距一個月
    }

    // 設定圖表y軸單位格式-kidin-1090204
    HRTrendChartOptions['yAxis'].labels = {
      formatter: function () {
        const yVal = this.value,
              costhr = Math.floor(yVal / 3600),
              costmin = Math.floor((yVal - costhr * 60 * 60) / 60),
              costsecond = Math.round(yVal - costmin * 60),
              timeHr = ('0' + costhr).slice(-2),
              timeMin = ('0' + costmin).slice(-2),
              timeSecond = ('0' + costsecond).slice(-2);

        if (timeHr === '00' && timeMin === '00') {
          return `0:${timeSecond}`;
        } else if (timeHr === '00') {
          return `${timeMin}:${timeSecond}`;
        } else {
          return `${timeHr}:${timeMin}:${timeSecond}`;
        }
      }
    };

    // 設定浮動提示框顯示格式-kidin-1090204
    HRTrendChartOptions['tooltip'] = {
      formatter: function () {
        const yVal = this.y,
              costhr = Math.floor(yVal / 3600),
              costmin = Math.floor((yVal - costhr * 60 * 60) / 60),
              costsecond = Math.round(yVal - costmin * 60),
              timeHr = ('0' + costhr).slice(-2),
              timeMin = ('0' + costmin).slice(-2),
              timeSecond = ('0' + costsecond).slice(-2);

        let zoneTime = '';

        if (timeHr === '00' && timeMin === '00') {
          zoneTime = `0:${timeSecond}`;
        } else if (timeHr === '00') {
          zoneTime = `${timeMin}:${timeSecond}`;
        } else {
          zoneTime = `${timeHr}:${timeMin}:${timeSecond}`;
        }

        const yTotal = this.total,
              totalHr = Math.floor(yTotal / 3600),
              totalmin = Math.floor(Math.round(yTotal - totalHr * 60 * 60) / 60),
              totalsecond = Math.round(yTotal - totalmin * 60),
              timeTotalHr = ('0' + totalHr).slice(-2),
              timeTotalMin = ('0' + totalmin).slice(-2),
              timeTotalSecond = ('0' + totalsecond).slice(-2);

        let totalZoneTime = '';

        if (timeTotalHr === '00' && timeTotalMin === '00') {
          totalZoneTime = `0:${timeTotalSecond}`;
        } else if (timeTotalHr === '00') {
          totalZoneTime = `${timeTotalMin}:${timeTotalSecond}`;
        } else {
          totalZoneTime = `${timeTotalHr}:${timeTotalMin}:${timeTotalSecond}`;
        }

        if (this.series.xAxis.tickInterval === 30 * 24 * 4600 * 1000) {
          return `${moment(this.x).format('YYYY/MM/DD')}~${moment(this.x + 6 * 24 * 3600 * 1000).format('YYYY/MM/DD')}
            <br/>${this.series.name}: ${zoneTime}
            <br/>Total: ${totalZoneTime}`;
        } else {
          return `${moment(this.x).format('YYYY/MM/DD')}
            <br/>${this.series.name}: ${zoneTime}
            <br/>Total: ${totalZoneTime}`;
        }

      }

    };

    // 根據圖表清單依序將圖表顯示出來-kidin-1081217
    setTimeout(() => {
      chart(HRTrendChartDiv, HRTrendChartOptions);
    }, 0);

  }

  ngOnDestroy () {
    // 將之前生成的highchart卸除避免新生成的highchart無法顯示-kidin-1081219
    Highcharts.charts.forEach((_highChart, idx) => {
      if (_highChart !== undefined) {
        _highChart.destroy();
      }
    });
  }

}
