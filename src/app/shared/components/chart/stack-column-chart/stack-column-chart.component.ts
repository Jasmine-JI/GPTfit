import { Component, OnInit, OnChanges, OnDestroy, ViewChild, ElementRef, Input } from '@angular/core';
import { chart } from 'highcharts';
import * as _Highcharts from 'highcharts';
import moment from 'moment';
import { TranslateService } from '@ngx-translate/core';
import { ZoneTrendData, DisplayPage, zoneColor } from '../../../models/chart-data';
import { day, month, week } from '../../../models/utils-constant';

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
            stacking: 'normal',
            pointPlacement: 0.33,
        },
        series: {
          pointWidth: null,
          maxPointWidth: 30
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

  @Input() perZoneData: ZoneTrendData;  // 心率區間用變數
  @Input() dateRange: string;
  @Input() data: any;  // 生活追蹤用變數-kidin-1090218
  @Input() searchDate: Array<number>;
  @Input() page: DisplayPage;
  @ViewChild('container', {static: false})
  container: ElementRef;

  constructor(
    private translate: TranslateService,
  ) { }

  ngOnInit () {}

  ngOnChanges () {
    if (this.perZoneData) {
      if (this.perZoneData.zoneZero.length === 0) {
        this.noData = true;
      } else {
        this.noData = false;
      }

      this.initZoneTrendChart();
    } else if (this.data) {
      this.initSleepChart();
    }

  }

  // 心率用圖表-kidin-1090218
  initZoneTrendChart () {
    const ZoneTrendDataset = [
      {
        name: 'Zone5',
        data: this.perZoneData.zoneFive,
        showInLegend: false,
        color: zoneColor[5]
      },
      {
        name: 'Zone4',
        data: this.perZoneData.zoneFour,
        showInLegend: false,
        color: zoneColor[4]
      },
      {
        name: 'Zone3',
        data: this.perZoneData.zoneThree,
        showInLegend: false,
        color: zoneColor[3]
      },
      {
        name: 'Zone2',
        data: this.perZoneData.zoneTwo,
        showInLegend: false,
        color: zoneColor[2]
      },
      {
        name: 'Zone1',
        data: this.perZoneData.zoneOne,
        showInLegend: false,
        color: zoneColor[1]
      },
      {
        name: 'Zone0',
        data: this.perZoneData.zoneZero,
        showInLegend: false,
        color: zoneColor[0]
      }
    ];

    // 表示此圖表為閾值區間
    if (this.perZoneData.zoneSix) {
      ZoneTrendDataset.unshift({
        name: 'Zone6',
        data: this.perZoneData.zoneSix,
        showInLegend: false,
        color: zoneColor[6]
      })

    }

    const HRTrendChartOptions = new ChartOptions(ZoneTrendDataset);

    // 設定圖表x軸時間間距-kidin-1090204
    if (this.page !== 'cloudrun') {

      if (this.dateRange === 'day' && this.perZoneData.zoneZero.length <= 7) {
        HRTrendChartOptions['xAxis'].tickInterval = day;
      } else if (this.dateRange === 'day' && this.perZoneData.zoneZero.length > 7) {
        HRTrendChartOptions['xAxis'].tickInterval = week;
      } else {
        HRTrendChartOptions['xAxis'].tickInterval = month;
      }

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

        if (this.series.xAxis.tickInterval === month) {
          return `${moment(this.x).format('YYYY-MM-DD')}~${moment(this.x + 6 * day).format('YYYY-MM-DD')}
            <br/>${this.series.name}: ${zoneTime}
            <br/>Total: ${totalZoneTime}`;
        } else {
          return `${moment(this.x).format('YYYY-MM-DD')}
            <br/>${this.series.name}: ${zoneTime}
            <br/>Total: ${totalZoneTime}`;
        }

      }

    };

    this.createChart(HRTrendChartOptions);
  }

  // 生活追蹤用圖表-kidin-1090218
  initSleepChart () {
    this.createDateList();
    const newDeepSleepData = [],
          newLightSleepData = [],
          newAwakeData = [];
    let idx = 0;
    for (let i = 0; i < this.dateList.length; i++) {
      if (this.dateList[i] === this.data.date[idx]) {
        newLightSleepData.push(this.data.lightSleepList[idx]);
        newDeepSleepData.push(this.data.deepSleepList[idx]);
        newAwakeData.push(this.data.awakeList[idx]);
        idx++;

      } else {
        newLightSleepData.push(0);
        newDeepSleepData.push(0);
        newAwakeData.push(0);
      }
    }

    let deepSleepData = [],
        lightSleepData = [],
        awakeData = [],
        dataSet;

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
        name: this.translate.instant('universal_lifeTracking_lightSleep'),
        data: lightSleepData,
        showInLegend: false,
        color: '#35a8c9'
      },
      {
        name: this.translate.instant('universal_lifeTracking_deepSleep'),
        data: deepSleepData,
        showInLegend: false,
        color: '#1e61bb'
      },
      {
        name: this.translate.instant('universal_lifeTracking_wideAwake'),
        data: awakeData,
        showInLegend: false,
        color: '#ccff00'
      }
    ];

    const chartOptions = new ChartOptions(dataSet);

    // 設定圖表高度-kidin-1090221
    chartOptions['chart'].height = 170;

    // 設定圖表x軸時間間距-kidin-1090204
    if (this.dateRange === 'day' && this.dateList.length <= 7) {
      chartOptions['xAxis'].tickInterval = day;  // 間距一天
    } else if (this.dateRange === 'day' && this.dateList.length > 7) {
      chartOptions['xAxis'].tickInterval = week;  // 間距一週
    } else {
      chartOptions['xAxis'].tickInterval = month;  // 間距一個月
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
        const yVal = this.y,
              costhr = Math.floor(yVal / 3600),
              costmin = Math.floor((yVal - costhr * 60 * 60) / 60),
              timeMin = ('0' + costmin).slice(-2);
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
            totalmin = Math.round((yTotal - totalHr * 60 * 60) / 60);
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

        if (this.series.xAxis.tickInterval === month) {
          return `${moment(this.x).format('YYYY-MM-DD')}~${moment(this.x + 6 * day).format('YYYY-MM-DD')}
            <br/>${this.series.name}: ${zoneTime}
            <br/>Total: ${totalZoneTime}`;
        } else {
          return `${moment(this.x).format('YYYY-MM-DD')}
            <br/>${this.series.name}: ${zoneTime}
            <br/>Total: ${totalZoneTime}`;
        }

      }

    };

    this.createChart(chartOptions);
  }

  // 根據搜尋期間，列出日期清單供圖表使用-kidin-1090220
  createDateList () {
    let diff,
        weekStartDay,
        weekEndDay;
    if (this.dateRange === 'day') {
      diff = (this.searchDate[1] - this.searchDate[0]) / (day);

      for (let i = 0; i < diff + 1; i++) {
        this.dateList.push(this.searchDate[0] + day * i);
      }

    } else if (this.dateRange === 'week') {

      // 周報告開頭是星期日-kidin-1090220
      if (moment(this.searchDate[0]).isoWeekday() !== 7) {
        weekStartDay = this.searchDate[0] - day * moment(this.searchDate[0]).isoWeekday();
      } else {
        weekStartDay = this.searchDate[0];
      }

      if (moment(this.searchDate[0]).isoWeekday() !== 7) {
        weekEndDay = this.searchDate[1] - day * moment(this.searchDate[1]).isoWeekday();
      } else {
        weekEndDay = this.searchDate[1];
      }

      diff = ((weekEndDay - weekStartDay) / (week)) + 1;

      for (let i = 0; i < diff + 1; i++) {
        this.dateList.push(weekStartDay + week * i);
      }
    }

  }

  // 確認取得元素才建立圖表-kidin-1090706
  createChart (option: ChartOptions) {

    setTimeout (() => {
      if (!this.container) {
        this.createChart(option);
      } else {
        const chartDiv = this.container.nativeElement;
        chart(chartDiv, option);
      }
    }, 200);

  }

  ngOnDestroy () {}

}
