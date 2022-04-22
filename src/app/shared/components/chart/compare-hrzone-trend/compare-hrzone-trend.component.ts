import { Component, OnInit, OnChanges, OnDestroy, ViewChild, ElementRef, Input } from '@angular/core';
import { of } from 'rxjs';
import { map } from 'rxjs/operators';
import { chart } from 'highcharts';
import { TranslateService } from '@ngx-translate/core';
import { yAxisTimeFormat, tooltipHrZoneFormat, getDateTimeLabelFormats } from '../../../utils/chart-formatter';


@Component({
  selector: 'app-compare-hrzone-trend',
  templateUrl: './compare-hrzone-trend.component.html',
  styleUrls: ['./compare-hrzone-trend.component.scss']
})
export class CompareHrzoneTrendComponent implements OnInit {

  @Input('data') data: Array<any>;

  @ViewChild('container', {static: false})
  container: ElementRef;


  /**
   * 是否沒有心率區間數據
   */
  noData = true;

  constructor(
    private translate: TranslateService
  ) { }

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

/**
 * 無比較時使用的圖表設定
 */
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
        formatter: yAxisTimeFormat
      },
      startOnTick: false,
      minPadding: 0.01,
      maxPadding: 0.01,
      tickAmount: 5
    },
    tooltip: {
      formatter: tooltipHrZoneFormat
    },
    plotOptions: {
      column: <any>{
        stacking: 'normal'
      },
      series: {
        pointWidth: null,
        maxPointWidth: 30
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
        dateTimeLabelFormats: getDateTimeLabelFormats(),
        title: {
          enabled: false
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