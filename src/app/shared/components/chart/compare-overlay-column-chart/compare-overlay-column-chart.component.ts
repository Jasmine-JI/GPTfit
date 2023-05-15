import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  Input,
  OnDestroy,
  OnChanges,
} from '@angular/core';
import { of, Subject } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';
import { chart } from 'highcharts';
import { TranslateService } from '@ngx-translate/core';
import dayjs from 'dayjs';
import { GlobalEventsService } from '../../../../core/services';
import { complexTrendTooltip } from '../../../../core/utils/chart-formatter';
import { deepCopy } from '../../../../core/utils/index';
import { compareChartDefault, TARGET_LINE_COLOR } from '../../../models/chart-data';

@Component({
  selector: 'app-compare-overlay-column-chart',
  templateUrl: './compare-overlay-column-chart.component.html',
  styleUrls: ['./compare-overlay-column-chart.component.scss', '../chart-share-style.scss'],
})
export class CompareOverlayColumnChartComponent implements OnInit, OnDestroy, OnChanges {
  private ngUnsubscribe = new Subject();

  @Input() data: Array<any>;

  @Input() xAxisTitle: string;

  @Input() chartUnit = '';

  @Input() conditionValue: number;

  @ViewChild('container', { static: false })
  container: ElementRef;

  /**
   * 是否沒有數據
   */
  noData = true;

  constructor(
    private globalEventsService: GlobalEventsService,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.subscribeGlobalEvents();
  }

  ngOnChanges() {
    this.handleChart();
  }

  /**
   * 訂閱全域自定義事件
   */
  subscribeGlobalEvents() {
    this.globalEventsService
      .getRxSideBarMode()
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe(() => {
        this.handleChart();
      });
  }

  /**
   * 處理繪製圖表流程
   */
  handleChart() {
    if (!this.data) {
      this.noData = true;
    } else {
      const { data, conditionValue } = this;
      of('')
        .pipe(
          map(() => this.initChart(data, conditionValue)),
          map((option) => this.handleSeriesName(option)),
          map((final) => this.createChart(final))
        )
        .subscribe();

      this.noData = false;
    }
  }

  /**
   * 初始化圖表
   * @param data {Array<number>}-圖表所需數據
   * @param targetLineValue {number | null}-運動目標線數值
   */
  initChart(data: Array<number>, targetLineValue: number | null) {
    const { xAxisTitle, chartUnit } = this;
    const chartOption = new ChartOption(data, xAxisTitle, chartUnit, targetLineValue);
    return chartOption.option;
  }

  /**
   * 處理圖表數據名稱多國語系
   * @param option {any}
   * @author kidin-1110318
   */
  handleSeriesName(option: any) {
    option.series = option.series.map((_series, _index) => {
      _series['name'] = this.translate.instant(_series['name']);
      return _series;
    });

    return option;
  }

  /**
   * 建立圖表
   * @param option {any}-圖表設定值
   * @author kidin-1110413
   */
  createChart(option: any) {
    setTimeout(() => {
      if (!this.container) {
        this.createChart(option);
      } else {
        const chartDiv = this.container.nativeElement;
        chart(chartDiv, option);
      }
    }, 200);
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next(null);
    this.ngUnsubscribe.complete();
  }
}

class ChartOption {
  private _option = deepCopy(compareChartDefault);

  constructor(
    data: Array<any>,
    xAxisTitle: string,
    chartUnit: string,
    targetLineValue: number | null
  ) {
    this.initChart(data, xAxisTitle, chartUnit);
    if (targetLineValue) this.handleTargetLine(targetLineValue);
  }

  /**
   * 確認是否為比較模式，並初始化圖表
   * @param data {Array<any>}-圖表數據
   * @param xAxisTitle {Array<any>}-x軸標題
   * @param chartUnit {string}-圖表顯示單位
   */
  initChart(data: Array<any>, xAxisTitle: string, chartUnit: string) {
    this.setOtherOption(chartUnit);
    const isCompareMode = data.length === 4;
    if (isCompareMode) {
      this.handleCompareOption(data, xAxisTitle);
    } else {
      this.handleNormalOption(data);
    }
  }

  /**
   * 增加此圖表專用設定值
   * @param chartUnit {string}-圖表顯示單位
   */
  setOtherOption(chartUnit: string) {
    this._option.chart.type = 'column';
    this._option.plotOptions.series.borderRadius = 5;
    this._option.tooltip.shared = true;
    this._option.tooltip.formatter = complexTrendTooltip(chartUnit);
  }

  /**
   * 處理一般（非比較）圖表的設定
   * @param data {Array<any>}-圖表數據
   */
  handleNormalOption(data: Array<any>) {
    const [maxData, avgData] = data;
    const { xAxis } = this._option;
    const { labels } = xAxis;
    this._option = {
      ...this._option,
      xAxis: {
        ...xAxis,
        type: 'datetime',
        tickPositions: avgData.data.map((_data) => _data.additionalInfo[0]),
        labels: {
          ...labels,
          formatter: function () {
            return dayjs(this.value).format('MM/DD');
          },
        },
      },
      series: data,
    };
  }

  /**
   * 處理比較圖表的設定
   * @param chartData {Array<any>}-圖表數據
   * @param xAxisTitle {Array<any>}-x軸標題
   */
  handleCompareOption(chartData: Array<any>, xAxisTitle: string) {
    const dataLength = chartData[0].data.length;
    const categories = new Array(dataLength).fill(0).map((_arr, _index) => _index + 1);
    const { xAxis } = this._option;
    this._option = {
      ...this._option,
      xAxis: {
        ...xAxis,
        title: {
          ...xAxis.title,
          text: `( ${xAxisTitle} )`,
        },
        categories,
        crosshair: true,
      },
      series: chartData,
    };
  }

  /**
   * 若有設定運動目標，則顯示目標線
   * @param value {number}-目標線數值
   */
  handleTargetLine(value: number) {
    this._option.yAxis['plotLines'] = [
      {
        color: TARGET_LINE_COLOR,
        width: 2,
        value,
      },
    ];
  }

  /**
   * 取得圖表設定
   */
  get option() {
    return this._option;
  }
}
