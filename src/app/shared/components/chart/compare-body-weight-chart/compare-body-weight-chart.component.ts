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
import { deepCopy, mathRounding } from '../../../../core/utils/index';
import { compareChartDefault } from '../../../models/chart-data';
import { bodyWeightTooltip } from '../../../../core/utils/chart-formatter';
import { lb } from '../../../models/bs-constant';

@Component({
  selector: 'app-compare-body-weight-chart',
  templateUrl: './compare-body-weight-chart.component.html',
  styleUrls: ['./compare-body-weight-chart.component.scss', '../chart-share-style.scss'],
})
export class CompareBodyWeightChartComponent implements OnInit, OnDestroy, OnChanges {
  private ngUnsubscribe = new Subject();

  @Input() data: Array<any>;

  @Input() xAxisTitle: string;

  @Input() isMetric: boolean;

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
          map((data) => this.handleImperialUnit(data)),
          map((transform) => this.initChart(transform)),
          map((option) => this.handleSeriesName(option)),
          map((final) => this.createChart(final))
        )
        .subscribe();

      this.noData = false;
    }
  }

  /**
   * 依使用者使用單位轉換體重公英制單位
   * @param data {Array<any>}-使用者體重與體脂數據
   */
  handleImperialUnit(data: Array<any>) {
    if (this.isMetric) return data;
    const [baseFatRateInfo, baseWeightInfo, compareFatRateInfo, compareWeightInfo] = deepCopy(data);
    const transform = (info: any) => {
      info.data = info.data.map((_weight) => {
        _weight.y = mathRounding(_weight.y / lb, 1);
        return _weight;
      });

      return info;
    };

    let result = [baseFatRateInfo, transform(baseWeightInfo)];
    if (compareWeightInfo)
      result = result.concat([compareFatRateInfo, transform(compareWeightInfo)]);

    return result;
  }

  /**
   * 初始化圖表
   * @param data {Array<number>}-圖表所需數據
   * @author kidin-1110413
   */
  initChart(data: Array<number>) {
    const { xAxisTitle, isMetric } = this;
    const chartOption = new ChartOption(data, xAxisTitle, isMetric);
    return chartOption.option;
  }

  /**
   * 處理圖表數據名稱多國語系
   * @param option {any}
   * @author kidin-1110318
   */
  handleSeriesName(option: any) {
    option.series = option.series.map((_series, _index) => {
      const isFatRate = _index % 2 === 0;
      _series['name'] = this.translate.instant(
        isFatRate ? 'universal_activityData_bodyFatRate' : 'universal_userProfile_bodyWeight'
      );

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

  constructor(data: Array<any>, xAxisTitle: string, isMetric: boolean) {
    this.initChart(data, xAxisTitle, isMetric);
  }

  /**
   * 確認是否為比較模式，並初始化圖表
   * @param data {Array<any>}-圖表數據
   * @param xAxisTitle {Array<any>}-x軸標題
   * @param isMetric {boolean}-是否使用公制單位
   */
  initChart(data: Array<any>, xAxisTitle: string, isMetric: boolean) {
    this.setOtherOption(isMetric);
    const isCompareMode = data.length === 4;
    if (isCompareMode) {
      this.handleCompareOption(data, xAxisTitle);
    } else {
      this.handleNormalOption(data);
    }
  }

  /**
   * 增加此圖表專用設定值
   * @param isMetric {boolean}-是否使用公制單位
   */
  setOtherOption(isMetric: boolean) {
    const { yAxis: yAxisDefault } = compareChartDefault;
    this._option.chart.type = 'line';
    this._option.chart.zoomType = 'y';
    this._option.xAxis.zoomEnabled = true;
    this._option.plotOptions.series.lineWidth = 3;
    this._option.tooltip.shared = true;
    this._option.tooltip.formatter = bodyWeightTooltip(isMetric);
    this._option.yAxis = [
      {
        ...deepCopy(yAxisDefault),
        labels: {
          format: `{value} ${isMetric ? 'kg' : 'lb'}`,
        },
      },
      {
        ...deepCopy(yAxisDefault),
        labels: {
          format: '{value}%',
        },
        opposite: true,
      },
    ];
  }

  /**
   * 處理一般（非比較）圖表的設定
   * @param data {Array<any>}-圖表數據
   */
  handleNormalOption(data: Array<any>) {
    const [fatRateData, weightData] = data;
    const { xAxis } = this._option;
    const { labels } = xAxis;
    this._option = {
      ...this._option,
      xAxis: {
        ...xAxis,
        type: 'datetime',
        tickPositions: weightData.data.map((_data) => _data.additionalInfo[0]),
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
