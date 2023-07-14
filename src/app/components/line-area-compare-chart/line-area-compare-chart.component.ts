import {
  Component,
  Input,
  OnInit,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { HighchartSetting, AreaZoneColor } from '../../core/models/compo';
import { HighchartOption } from '../../core/classes';
import { chart } from 'highcharts';
import * as Highcharts from 'highcharts';
import { GlobalEventsService } from '../../core/services/global-events.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import {
  changeOpacity,
  timeFormatter,
  paceSecondTimeFormat,
  paceYAxisFormatter,
} from '../../core/utils';

@Component({
  selector: 'app-line-area-compare-chart',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './line-area-compare-chart.component.html',
  styleUrls: ['./line-area-compare-chart.component.scss'],
})
export class LineAreaCompareChartComponent implements OnInit, OnChanges, OnDestroy {
  @ViewChild('container') container: ElementRef;

  /**
   * 數據類別翻譯鍵名
   */
  @Input() tooltipTranslateKey: string;

  /**
   * 數據單位
   */
  @Input() unit: string;

  /**
   * 基準數據
   */
  @Input() data: Array<number>;

  /**
   * 比較數據
   */
  @Input() compareData: Array<number>;

  /**
   * 區域圖各區間顏色設定
   */
  @Input() zoneColor: Array<AreaZoneColor>;

  /**
   * 是否為配速數據
   */
  @Input() isPaceData = false;

  /**
   * 基準數據區域圖邊界線顏色
   */
  @Input() baseBorderColor = 'rgba(254, 202, 87, 1)';

  /**
   * 比較數據折線顏色
   */
  @Input() compareLineColor = 'rgba(154, 135, 249, 1)';

  /**
   * y軸軸線標示位置
   */
  @Input() yAxisTickPosition: Array<number>;

  private ngUnsubscribe = new Subject();
  private _option: HighchartOption;
  private _chart: Highcharts.Chart;

  noData = true;

  constructor(
    private globalEventsService: GlobalEventsService,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.subscribeGlobalEvents();
    this.subscribeLangChange();
  }

  ngOnChanges(changes: SimpleChanges): void {
    const { data, compareData } = changes;
    if (data?.currentValue) this.initChart(data.currentValue);
    if (compareData && !compareData.firstChange) this.handleCompareData(compareData?.currentValue);
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
   * @param data 圖表數據
   */
  initChart(data: Array<number>) {
    if (data?.length === 0) return (this.noData = true);
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
   * 設定圖表
   */
  getChartOption() {
    const { isPaceData, zoneColor, baseBorderColor, yAxisTickPosition } = this;
    const chartOption = new HighchartOption('area', 200);
    chartOption.marginLeft = 60;
    chartOption.zoomType = 'x';
    chartOption.legend = { enabled: false };
    chartOption.plotOptions = {
      area: {
        marker: { enabled: false },
        lineWidth: 3,
        fillOpacity: 0.5,
        ...(isPaceData ? { threshold: 3600 } : {}),
        ...(zoneColor
          ? { zones: zoneColor }
          : {
              color: baseBorderColor,
              fillColor: {
                linearGradient: {
                  x1: 0,
                  y1: 0,
                  x2: 0,
                  y2: 1,
                },
                stops: [
                  [0, baseBorderColor],
                  [1, changeOpacity(baseBorderColor, 0)],
                ],
              },
            }),
      },
    };

    chartOption.xAxis = {
      labels: {
        formatter: function () {
          return timeFormatter(this.value) as string;
        },
      },
    };

    chartOption.yAxis = {
      title: null,
      endOnTick: true,
      reversed: isPaceData,
      min: 0,
      ...this.getPaceYAxisFormatter(isPaceData),
      ...(yAxisTickPosition ? { tickPositions: yAxisTickPosition } : {}),
    };

    chartOption.tooltip = {
      formatter: this.getTooltipFormatter(),
      valueDecimals: 0,
      shared: true,
    };

    chartOption.series = [
      {
        name: 'Base',
        type: 'area',
        data: this.data,
      },
    ];

    return chartOption;
  }

  /**
   * 將y軸數據格式轉為配速格式
   * @param isPaceData 是否為配速數據
   */
  getPaceYAxisFormatter(isPaceData: boolean) {
    if (!isPaceData) return {};
    return { labels: { formatter: paceYAxisFormatter } };
  }

  /**
   * 設定tooltip格式
   */
  getTooltipFormatter() {
    const { tooltipTranslateKey, unit, isPaceData } = this;
    const seriesName = this.translate.instant(tooltipTranslateKey);
    const circle = (color: string) => `<span style="color:${color};">●</span>`;
    return function () {
      let result = '';
      this.points.forEach((_point, _index) => {
        const y = isPaceData ? paceSecondTimeFormat(_point.y) : _point.y;
        result += `${_index > 0 ? '<br/><br/>' : ''}${circle(_point.color)}${timeFormatter(
          this.x
        )}<br/>${seriesName}: ${y} ${unit}`;
      });
      return result;
    };
  }

  /**
   * 處理比較數據
   */
  handleCompareData(compareData: Array<number>) {
    if (this._chart?.series.length === 2) this._chart.series.at(-1).remove();
    if (compareData)
      this._chart.addSeries({
        name: 'compare',
        type: 'line',
        data: this.compareData,
        color: this.compareLineColor,
        marker: {
          enabled: false,
        },
      });
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next(null);
    this.ngUnsubscribe.complete();
  }
}
