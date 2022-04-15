import { Component, OnInit, OnChanges, OnDestroy, ViewChild, ElementRef, Input } from '@angular/core';
import { of } from 'rxjs';
import { map } from 'rxjs/operators';
import dayjs from 'dayjs';
import { chart } from 'highcharts';
import { TranslateService } from '@ngx-translate/core';
import { DAY, MONTH, WEEK } from '../../../models/utils-constant';


@Component({
  selector: 'app-compare-column-trend',
  templateUrl: './compare-column-trend.component.html',
  styleUrls: ['./compare-column-trend.component.scss']
})
export class CompareColumnTrendComponent implements OnInit {

  @Input('data') data: Array<any>;

  @Input('type') type: 'normal' | 'time' | 'percentage' = 'normal';

  @ViewChild('container', {static: false})
  container: ElementRef;

  /**
   * 是否沒有心率區間數據
   */
  noData = true;

  constructor() { }

  ngOnInit(): void {
  }

  ngOnChanges() {

    if (!this.data) {
      this.noData = true;
    } else {
      of(this.data).pipe(
        map((data) => this.initChart(data)),
        map(chartData => this.createChart(chartData))
      ).subscribe();
console.log('trend chart', this.data);
      this.noData = false;
    }

  }

  /**
   * 初始化圖表
   * @param data {Array<number>}-各區間數據
   * @author kidin-1110413
   */
  initChart(data: Array<number>) {
    const chartOption = new ChartOption(data);
    return chartOption.option;
  }

  /**
   * 建立圖表
   * @param option {any}-圖表設定值
   * @author kidin-1110413
   */
  createChart(option: any) {
    setTimeout (() => {
      if (!this.container) {
        this.createChart(option);
      } else {
        const chartDiv = this.container.nativeElement;
        chart(chartDiv, option);
      }
    }, 200);
  }


  ngOnDestroy(): void {}

}


class ChartOption {

  private _option = {
    chart: {
      type: 'column',
      height: 200,
      backgroundColor: 'transparent',
      marginLeft: 65
    },
    title: {
      text: ''
    },
    credits: {
      enabled: false
    },
    xAxis: <any>{
      title: {
        enabled: false
      },
    },
    yAxis: {
      min: 0,
      title: {
        text: ''
      },
      labels: {
        formatter: function () {
          const yVal = this.value;
          const costhr = Math.floor(yVal / 3600);
          const costmin = Math.floor((yVal - costhr * 60 * 60) / 60);
          const costsecond = Math.round(yVal - costmin * 60);
          const timeMin = ('0' + costmin).slice(-2);
          const timeSecond = ('0' + costsecond).slice(-2);
  
          if (costhr === 0 && timeMin === '00') {
            return `0:${timeSecond}`;
          } else if (costhr === 0) {
            return `${timeMin}:${timeSecond}`;
          } else {
            return `${costhr}:${timeMin}:${timeSecond}`;
          }

        }
      },
      startOnTick: false,
      minPadding: 0.01,
      maxPadding: 0.01,
      tickAmount: 5
    },
    tooltip: {
      formatter: function () {
        const yVal = this.y;
        const costhr = Math.floor(yVal / 3600);
        const costmin = Math.floor((yVal - costhr * 60 * 60) / 60);
        const costsecond = Math.round(yVal - costmin * 60);
        const timeMin = ('0' + costmin).slice(-2);
        const timeSecond = ('0' + costsecond).slice(-2);
        let zoneTime = '';

        if (costhr === 0 && timeMin === '00') {
          zoneTime = `0:${timeSecond}`;
        } else if (costhr === 0) {
          zoneTime = `${timeMin}:${timeSecond}`;
        } else {
          zoneTime = `${costhr}:${timeMin}:${timeSecond}`;
        }

        const yTotal = this.total;
        const totalHr = Math.floor(yTotal / 3600);
        const totalmin = Math.floor(Math.round(yTotal - totalHr * 60 * 60) / 60);
        const totalsecond = Math.round(yTotal - totalmin * 60);
        const timeTotalMin = ('0' + totalmin).slice(-2);
        const timeTotalSecond = ('0' + totalsecond).slice(-2);
        let totalZoneTime = '';

        if (totalHr === 0 && timeTotalMin === '00') {
          totalZoneTime = `0:${timeTotalSecond}`;
        } else if (totalHr === 0) {
          totalZoneTime = `${timeTotalMin}:${timeTotalSecond}`;
        } else {
          totalZoneTime = `${totalHr}:${timeTotalMin}:${timeTotalSecond}`;
        }

        const dateRangeIndex = this.point.index;
        const [startTime, endTime] = this.series.options.custom.dateRange[dateRangeIndex];
        return `${dayjs(startTime).format('YYYY-MM-DD')}~${dayjs(endTime).format('YYYY-MM-DD')}
          <br/>${this.series.name}: ${zoneTime}
          <br/>Total: ${totalZoneTime}`;

      }
    },
    plotOptions: {
      column: {
        pointPlacement: 0.33
      },
      series: {
        pointWidth: null,
        maxPointWidth: 30,
        borderRadius: 5
      }
    },
    series: []
  };

  constructor(data: Array<any>) {
    this.initChart(data);
  }

  /**
   * 確認是否為比較模式，並初始化圖表
   * @param data {Array<any>}-圖表數據
   * @author kidin-1110413
   */
  initChart(data: Array<any>) {
    const isCompareMode = (data.length / 2) >= 5;
    if (isCompareMode) {
      this.handleCompareOption(data);
      
    } else {
      this.handleNormalOption(data);
    }

  }

  /**
   * 處理一般（非比較）圖表的設定
   * @param data {Array<any>}-圖表數據
   */
  handleNormalOption(data: Array<any>) {
    const { xAxis, plotOptions } = this._option;
    this._option = {
      ...this._option,
      xAxis: {
        ...xAxis,
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
        },
      },
      plotOptions: {
        ...plotOptions,
        column: {
          ...plotOptions.column,
          pointPlacement: 0.2
        }
      },
      series: data
    };

  }

  /**
   * 處理比較圖表的設定
   * @param data {Array<any>}-圖表數據
   */
  handleCompareOption(data: Array<any>) {
    const categories = new Array(data.length).map((_arr, _index) => _index + 1);
    const { xAxis } = this._option;
    this._option = {
      ...this._option,
      xAxis: {
        ...xAxis,
        categories,
        crosshair: true,
      },
      series: data
    };

  }

  /**
   * 取得圖表設定
   */
  get option() {
    return this._option;
  }

}