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
import { deepCopy } from '../../../../core/utils/index';
import { compareChartDefault } from '../../../models/chart-data';
import { complexTrendTooltip } from '../../../../core/utils/chart-formatter';

@Component({
  selector: 'app-compare-extreme-gforce-chart',
  templateUrl: './compare-extreme-gforce-chart.component.html',
  styleUrls: ['./compare-extreme-gforce-chart.component.scss'],
})
export class CompareExtremeGforceChartComponent implements OnInit, OnChanges, OnDestroy {
  private ngUnsubscribe = new Subject();

  @Input() data: Array<any>;

  @Input() xAxisTitle: string;

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
      const { data } = this;
      of(data)
        .pipe(
          map((data) => this.initChart(data)),
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
   */
  initChart(data: Array<number>) {
    const { xAxisTitle } = this;
    const chartOption = new ChartOption(data, xAxisTitle);
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
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }
}

class ChartOption {
  private _option = deepCopy(compareChartDefault);

  constructor(data: Array<any>, xAxisTitle: string) {
    this.initChart(data, xAxisTitle);
  }

  /**
   * 確認是否為比較模式，並初始化圖表
   * @param data {Array<any>}-圖表數據
   * @param xAxisTitle {Array<any>}-x軸標題
   */
  initChart(data: Array<any>, xAxisTitle: string) {
    this.setOtherOption();
    const isCompareMode = data.length === 4;
    if (isCompareMode) {
      this.handleCompareOption(data, xAxisTitle);
    } else {
      this.handleNormalOption(data);
    }
  }

  /**
   * 增加此圖表專用設定值
   */
  setOtherOption() {
    const { yAxis } = this._option;
    this._option.yAxis = {
      ...yAxis,
      tickAmount: 7, // 為了讓柱狀圖底部可與x軸接觸
      min: undefined,
    };

    this._option.chart.type = 'column';
    this._option.plotOptions.series.borderRadius = 5;
    this._option.plotOptions.series.stacking = 'bar';
    this._option.tooltip.shared = true;
    this._option.tooltip.formatter = complexTrendTooltip('g');
  }

  /**
   * 處理一般（非比較）圖表的設定
   * @param data {Array<any>}-圖表數據
   */
  handleNormalOption(data: Array<any>) {
    const [maxData, minData] = data;
    const { xAxis } = this._option;
    const { labels } = xAxis;
    this._option = {
      ...this._option,
      xAxis: {
        ...xAxis,
        type: 'datetime',
        tickPositions: minData.data.map((_data) => _data.additionalInfo[0]),
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
   * 取得圖表設定
   */
  get option() {
    return this._option;
  }
}
