import { Component, OnInit, OnChanges, OnDestroy, ViewChild, ElementRef, Input } from '@angular/core';

import { chart } from 'highcharts';
import * as _Highcharts from 'highcharts';
import * as moment from 'moment';
import { TranslateService } from '@ngx-translate/core';

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
        },
        startOnTick: false,
        minPadding: 0.01,
        maxPadding: 0.01,
        tickAmount: 1
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

  noData = true;

  dateList = [];

  @Input() perHrZoneData: Array<any>;  // 心率區間用變數-kidin-1090218
  @Input() dateRange: string;

  @Input() data: any;  // 生活追蹤用變數-kidin-1090218
  @Input() searchDate: Array<number>;

  @ViewChild('container')
  container: ElementRef;

  constructor(
    private translate: TranslateService,
  ) { }

  ngOnInit () { }

  ngOnChanges () {
    if (this.perHrZoneData) {
      if (this.perHrZoneData.length === 0) {
        this.noData = true;
      } else {
        this.noData = false;
      }
      this.initHRChart();
    } else if (this.data) {
      this.initSleepChart();
    }

  }

  // 心率用圖表-kidin-1090218
  initHRChart () {

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
              timeMin = ('0' + costmin).slice(-2),
              timeSecond = ('0' + costsecond).slice(-2);

        if (costhr === 0 && timeMin === '00') {
          return `0:${timeSecond}`;
        } else if (costhr === 0) {
          return `${timeMin}:${timeSecond}`;
        } else {
          return `${costhr}:${timeMin}:${timeSecond}`;
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
              timeMin = ('0' + costmin).slice(-2),
              timeSecond = ('0' + costsecond).slice(-2);

        let zoneTime = '';

        if (costhr === 0 && timeMin === '00') {
          zoneTime = `0:${timeSecond}`;
        } else if (costhr === 0) {
          zoneTime = `${timeMin}:${timeSecond}`;
        } else {
          zoneTime = `${costhr}:${timeMin}:${timeSecond}`;
        }

        const yTotal = this.total,
              totalHr = Math.floor(yTotal / 3600),
              totalmin = Math.floor(Math.round(yTotal - totalHr * 60 * 60) / 60),
              totalsecond = Math.round(yTotal - totalmin * 60),
              timeTotalMin = ('0' + totalmin).slice(-2),
              timeTotalSecond = ('0' + totalsecond).slice(-2);

        let totalZoneTime = '';

        if (totalHr === 0 && timeTotalMin === '00') {
          totalZoneTime = `0:${timeTotalSecond}`;
        } else if (totalHr === 0) {
          totalZoneTime = `${timeTotalMin}:${timeTotalSecond}`;
        } else {
          totalZoneTime = `${totalHr}:${timeTotalMin}:${timeTotalSecond}`;
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

  // 生活追蹤用圖表-kidin-1090218
  initSleepChart () {

    Highcharts.charts.length = 0;  // 初始化global highchart物件，可避免HighCharts.Charts為 undefined -kidin-1081212
    this.createDateList();

    const newTotalData = [],
          newDeepSleepData = [],
          newLightSleepData = [],
          newAwakeData = [],
          newTargetData = [];

    let idx = 0;
    for (let i = 0; i < this.dateList.length; i++) {
      if (this.dateList[i] === this.data.date[idx]) {
        if (this.data.lightSleepList[0]) {
          newLightSleepData.push(this.data.lightSleepList[idx]);
          newDeepSleepData.push(this.data.deepSleepList[idx]);
          newAwakeData.push(this.data.awakeList[idx]);
        } else {
          newTotalData.push(this.data.totalSleepList[idx]);
        }

        idx++;
      } else {
        if (this.data.lightSleepList[0]) {
          newLightSleepData.push(0);
          newDeepSleepData.push(0);
          newAwakeData.push(0);
        } else {
          newTotalData.push(0);
        }
      }
    }

    let deepSleepData = [],
        lightSleepData = [],
        awakeData = [],
        totalSleepData = [],
        dataSet;
    if (this.data.lightSleepList[0]) {
      this.noData = false;

      deepSleepData = newDeepSleepData.map((_data, index) => {
        return [this.dateList[index], _data];
      });

      lightSleepData = newLightSleepData.map((_data, index) => {
        return [this.dateList[index], _data];
      });

      awakeData = newAwakeData.map((_data, index) => {
        return [this.dateList[index], _data];
      });

      dataSet = [
        {
          name: this.translate.instant('other.deepSleep'),
          data: deepSleepData,
          showInLegend: false,
          color: '#35a8c9'
        },
        {
          name: this.translate.instant('other.lightSleep'),
          data: lightSleepData,
          showInLegend: false,
          color: '#1e61bb'
        },
        {
          name: this.translate.instant('other.wideAwake'),
          data: awakeData,
          showInLegend: false,
          color: '#ccff00'
        }
      ];
    } else {
      this.noData = false;

      totalSleepData = newTotalData.map((_data, index) => {
        return [this.dateList[index], _data];
      });

      dataSet = [
        {
          name: this.translate.instant('other.totalSleepTime'),
          data: totalSleepData,
          showInLegend: false,
          color: '#35a8c9'
        }
      ];
    }

    const chartOptions = new ChartOptions(dataSet),
          chartDiv = this.container.nativeElement;

    // 設定圖表高度-kidin-1090221
    chartOptions['chart'].height = 170;

    // 設定圖表x軸時間間距-kidin-1090204
    if (this.dateRange === 'day') {
      chartOptions['xAxis'].tickInterval = 7 * 24 * 3600 * 1000;  // 間距一週
    } else {
      chartOptions['xAxis'].tickInterval = 30 * 24 * 4600 * 1000;  // 間距一個月
    }

    // 設定圖表y軸單位格式-kidin-1090204
    chartOptions['yAxis'].labels = {
      formatter: function () {
        const yVal = this.value;

        let costhr = Math.floor(yVal / 3600),
            costmin = Math.floor((yVal - costhr * 60 * 60) / 60);
        const costsecond = Math.round(yVal - costmin * 60);

        if (costsecond !== 0) {
          costmin++;
          if (costmin === 60) {
            costmin = 0;
            costhr++;
          }
        }

        const timeMin = ('0' + costmin).slice(-2);

        if (costhr === 0 && timeMin === '00') {
          return `0:00`;
        } else if (costhr === 0) {
          return `0:${timeMin}`;
        } else {
          return `${costhr}:${timeMin}`;
        }
      }
    };

    // 設定浮動提示框顯示格式-kidin-1090204
    chartOptions['tooltip'] = {
      formatter: function () {
        const yVal = this.y;

        let costhr = Math.floor(yVal / 3600),
            costmin = Math.floor((yVal - costhr * 60 * 60) / 60);
        const costsecond = Math.round(yVal - costmin * 60);

        if (costsecond !== 0) {
          costmin++;
          if (costmin === 60) {
            costmin = 0;
            costhr++;
          }
        }

        const timeMin = ('0' + costmin).slice(-2);

        let zoneTime = '';

        if (costhr === 0 && timeMin === '00') {
          zoneTime = `0:00`;
        } else if (costhr === 0) {
          zoneTime = `0:${timeMin}`;
        } else {
          zoneTime = `${costhr}:${timeMin}`;
        }

        const yTotal = this.total;

        let totalHr = Math.floor(yTotal / 3600),
            totalmin = Math.floor(Math.round(yTotal - totalHr * 60 * 60) / 60);
        const totalsecond = Math.round(yTotal - totalmin * 60),
              timeTotalMin = ('0' + totalmin).slice(-2);

        if (totalsecond !== 0) {
          totalmin++;
          if (costmin === 60) {
            totalmin = 0;
            totalHr++;
          }
        }

        let totalZoneTime = '';

        if (totalHr === 0 && timeTotalMin === '00') {
          totalZoneTime = `0:00`;
        } else if (totalHr === 0) {
          totalZoneTime = `0:${timeTotalMin}`;
        } else {
          totalZoneTime = `${totalHr}:${timeTotalMin}`;
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
      chart(chartDiv, chartOptions);
    }, 0);
  }

  // 根據搜尋期間，列出日期清單供圖表使用-kidin-1090220
  createDateList () {
    let diff,
        weekStartDay,
        weekEndDay;
    if (this.dateRange === 'day') {
      diff = (this.searchDate[1] - this.searchDate[0]) / (86400 * 1000);

      for (let i = 0; i < diff + 1; i++) {
        this.dateList.push(this.searchDate[0] + 86400 * 1000 * i);
      }

    } else if (this.dateRange === 'week') {

      // 周報告開頭是星期日-kidin-1090220
      if (moment(this.searchDate[0]).isoWeekday() !== 7) {
        weekStartDay = this.searchDate[0] + 86400 * 1000 * (7 - moment(this.searchDate[0]).isoWeekday());
      } else {
        weekStartDay = this.searchDate[0];
      }

      if (moment(this.searchDate[0]).isoWeekday() !== 7) {
        weekEndDay = this.searchDate[1] - 86400 * 1000 * moment(this.searchDate[1]).isoWeekday();
      } else {
        weekEndDay = this.searchDate[1];
      }

      diff = (weekEndDay - weekStartDay) / (86400 * 1000 * 7);

      for (let i = 0; i < diff + 1; i++) {
        this.dateList.push(weekStartDay + 86400 * 1000 * 7 * i);
      }
    }

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
