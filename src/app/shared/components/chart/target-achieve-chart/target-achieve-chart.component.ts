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
import dayjs from 'dayjs';
import { chart } from 'highcharts';
import Highcharts from 'highcharts';
import heatmap from 'highcharts/modules/heatmap';
import { ReportCondition } from '../../../models/report-condition';
import { targetAchieveTooltip } from '../../../../core/utils/chart-formatter';
import { compareChartDefault } from '../../../models/chart-data';
import { deepCopy } from '../../../../core/utils/index';
import { GlobalEventsService } from '../../../../core/services';

// highchart 引入 heatmap
heatmap(Highcharts);

@Component({
  selector: 'app-target-achieve-chart',
  templateUrl: './target-achieve-chart.component.html',
  styleUrls: ['./target-achieve-chart.component.scss', '../chart-share-style.scss'],
})
export class TargetAchieveChartComponent implements OnInit, OnChanges, OnDestroy {
  @Input() data: Array<any>;

  @Input() isCompareMode = false;

  @Input() condition: ReportCondition;

  @Input() xAxisTitle: string;

  private ngUnsubscribe = new Subject();

  @ViewChild('container', { static: false })
  container: ElementRef;

  /**
   * 是否沒有數據
   */
  noData = true;

  constructor(private globalEventsService: GlobalEventsService) {}

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
      of(this.data)
        .pipe(
          map((data) => this.initChart(data)),
          map((final) => this.createChart(final))
        )
        .subscribe();

      this.noData = false;
    }
  }

  /**
   * 初始化圖表
   * @param data {Array<any>}-圖表數據
   */
  initChart(data: Array<any>) {
    const chartOption = new ChartOption(this.isCompareMode, data, this.condition, this.xAxisTitle);
    return chartOption.option;
  }

  /**
   * 建立圖表
   * @param option {any}-圖表設定值
   * @author kidin-1110517
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

  constructor(
    isCompareMode: boolean,
    data: Array<any>,
    condition: ReportCondition,
    xAxisTitle: string
  ) {
    this.init(isCompareMode, data, condition, xAxisTitle);
  }

  /**
   * 初始化圖表
   * @param isCompareMode {boolean}-是否為比較模式
   * @param data {Array<any>}-圖表數據
   * @param condition {ReportCondition}-報告篩選條件
   * @param xAxisTitle {Array<any>}-x軸標題
   */
  init(isCompareMode: boolean, data: Array<any>, condition: ReportCondition, xAxisTitle: string) {
    this.setOtherOption();
    const { baseTime, compareTime } = condition;
    const dateFormat = 'YYYY-MM-DD';
    const baseStartDate = baseTime.getStartTimeFormat(dateFormat);
    const baseEndDate = baseTime.getEndTimeFormat(dateFormat);
    if (!isCompareMode) {
      this._option.yAxis.categories = [`${baseStartDate}-${baseEndDate}`];
      this.handleNormalOption(data);
    } else {
      const compareStartDate = compareTime.getStartTimeFormat(dateFormat);
      const compareEndDate = compareTime.getEndTimeFormat(dateFormat);
      this._option.yAxis.categories = [
        `${baseStartDate}-${baseEndDate}`,
        `${compareStartDate}-${compareEndDate}`,
      ];

      this.handleCompareOption(data, xAxisTitle);
    }
  }

  /**
   * 增加此圖表專用設定值
   */
  setOtherOption() {
    this._option.chart.type = 'heatmap';
    this._option.yAxis.categories = [];
    this._option.yAxis.reversed = true;
    this._option.yAxis.labels = {
      style: {
        fontSize: '9px',
      },
    };

    this._option.tooltip.formatter = targetAchieveTooltip;
  }

  /**
   * 處理一般（非比較）圖表的設定
   * @param data {Array<any>}-圖表數據
   */
  handleNormalOption(data: Array<any>) {
    const { xAxis } = this._option;
    const { labels } = xAxis;
    this._option = {
      ...this._option,
      xAxis: {
        ...xAxis,
        type: 'datetime',
        labels: {
          ...labels,
          formatter: function () {
            const { baseDateRange } = this.chart.series[0].options.custom;
            return dayjs(baseDateRange[this.value][0]).format('MM/DD');
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
    const dataLength = Math.ceil(chartData[0].data.length / 2);
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
