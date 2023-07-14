import {
  Component,
  OnInit,
  OnChanges,
  OnDestroy,
  Input,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  SimpleChanges,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { chart } from 'highcharts';
import * as Highcharts from 'highcharts';
import { HighchartOption } from '../../core/classes';
import { GlobalEventsService } from '../../core/services/global-events.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import dayjs from 'dayjs';
import { changeOpacity } from '../../core/utils';

const defaultLineColor = 'rgba(81, 137, 248, 1)';

@Component({
  selector: 'app-line-compare-chart',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './line-compare-chart.component.html',
  styleUrls: ['./line-compare-chart.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LineCompareChartComponent implements OnInit, OnChanges, OnDestroy {
  @ViewChild('container') container: ElementRef;
  @Input() data: any;
  @Input() compareData: any;
  @Input() compareName: string;
  @Input() lineColor = defaultLineColor;
  @Input() tooltipTranslateKey: string;
  @Input() unit: string;

  private ngUnsubscribe = new Subject();
  private _option: HighchartOption;
  private _chart: Highcharts.Chart;

  noData = true;

  constructor(
    private globalEventsService: GlobalEventsService,
    private translate: TranslateService,
    private changeDetectorRef: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.subscribeGlobalEvents();
    this.subscribeLangChange();
  }

  ngOnChanges(e: SimpleChanges): void {
    const { data, compareData } = e;
    if (data?.firstChange) this.initChart(data.currentValue);
    if (compareData && !compareData.firstChange) this.updateChart(compareData.currentValue);
    this.changeDetectorRef.markForCheck();
  }

  /**
   * 訂閱全域自定義事件
   */
  subscribeGlobalEvents() {
    this.globalEventsService
      .getRxSideBarMode()
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe(() => {
        setTimeout(() => {
          if (this._chart) this._chart.reflow();
        }, 300);
      });
  }

  /**
   * 處理語系變更事件
   */
  subscribeLangChange() {
    this.translate.onLangChange.pipe(takeUntil(this.ngUnsubscribe)).subscribe(() => {
      if (this._chart) {
        this._option.tooltip = { formatter: this.getTooltipFormatter() };
        this._chart.update(this._option.option as any);
      }
    });
  }

  /**
   * 初始化圖表
   * @param data {Array<any>}-圖表數據
   */
  initChart(data: Array<any>) {
    if (!data || data.length === 0) return (this.noData = true);
    this.noData = false;
    this._option = this.getChartOption();
    setTimeout(() => {
      const chartContainer = this.container.nativeElement;
      if (chartContainer) {
        this._chart = chart(chartContainer, this._option.option as any);
      }
    });
  }

  /**
   * 取得圖表設定
   */
  getChartOption() {
    const chartOption = new HighchartOption('line', 200);
    chartOption.plotOptions = { line: { pointPlacement: 'on' } };
    chartOption.xAxis = {
      startOnTick: true,
      endOnTick: true,
      tickPositions: this.getTickPosition(),
      labels: {
        formatter: function () {
          return dayjs(this.value).format('MM/DD');
        },
      },
      tickInterval: 24 * 60 * 60 * 1000,
    };
    chartOption.yAxis = { title: null };
    chartOption.tooltip = {
      formatter: this.getTooltipFormatter(),
      valueDecimals: 0,
    };
    chartOption.series = [this.getMainSeriesData()];
    return chartOption;
  }

  /**
   * 取得提示框格式
   */
  getTooltipFormatter() {
    const { tooltipTranslateKey, unit } = this;
    const seriesName = this.translate.instant(tooltipTranslateKey);
    return function () {
      return `${dayjs(this.x).format('YYYY-MM-DD')}<br/>${seriesName}: ${this.y} ${unit}`;
    };
  }

  /**
   * 取得圖表x軸線標示位置
   */
  getTickPosition() {
    return this.data.map((_data) => _data.x);
  }

  /**
   * 將主要數據轉為圖表用數據
   * @param color {string}-主要數據的圖表顏色
   */
  getMainSeriesData(color = this.lineColor): any {
    const { data } = this;
    return { data, color, showInLegend: false };
  }

  /**
   * 將比較的數據轉為圖表用數據
   */
  getCompareSeriesData(compareData: any | null) {
    const result: any = [];
    const { data, lineColor, compareName } = this;
    let compareIndex = 0;
    data.forEach((_data) => {
      const { x: timestamp } = _data;
      const { x, y } = compareData[compareIndex] || { x: null, y: null };
      if (timestamp !== x) {
        result.push({ x: timestamp, y: 0 });
      } else {
        result.push({ x, y });
        compareIndex++;
      }
    });

    return { data: result, color: lineColor, name: compareName };
  }

  /**
   * 更新圖表數據
   * @param compareData {any}-比較的數據
   */
  updateChart(compareData: any | null) {
    const {
      noData,
      _chart: { series },
      lineColor,
    } = this;
    if (noData) return false;
    if (compareData !== null) {
      const mainDataColor = changeOpacity(lineColor, 0.4);
      series[0].update(this.getMainSeriesData(mainDataColor));
      const completeData = this.getCompareSeriesData(compareData) as any;
      if (series[1]) {
        this._chart.series[1].update(completeData);
      } else {
        this._chart.addSeries(completeData);
      }
    } else {
      if (series[1]) {
        this._chart.series[1].remove();
        series[0].update(this.getMainSeriesData());
      }
    }
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next(null);
    this.ngUnsubscribe.complete();
  }
}
