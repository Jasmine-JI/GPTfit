import {
  Component,
  OnInit,
  OnChanges,
  SimpleChanges,
  OnDestroy,
  Input,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { chart } from 'highcharts';
import * as Highcharts from 'highcharts';
import { HighchartOption } from '../../core/classes';
import { GlobalEventsService } from '../../core/services/global-events.service';

@Component({
  selector: 'app-line-column-compare-chart',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './line-column-compare-chart.component.html',
  styleUrls: ['./line-column-compare-chart.component.scss'],
})
export class LineColumnCompareChartComponent implements OnInit, OnChanges, OnDestroy {
  @ViewChild('container') container: ElementRef;
  @Input() data: Array<any>;
  @Input() unit: string;
  @Input() compareUnit: string;
  @Input() tooltipLegendKey: string;

  private ngUnsubscribe = new Subject();
  private _option: HighchartOption;
  private _chart: Highcharts.Chart;

  noData = true;

  constructor(
    private translate: TranslateService,
    private globalEventsService: GlobalEventsService
  ) {}

  ngOnInit(): void {
    this.subscribeGlobalEvents();
    this.subscribeLangChange();
  }

  ngOnChanges(e: SimpleChanges): void {
    const { data } = e;
    if (data) this.initChart(data.currentValue);
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
    const chartOption = new HighchartOption('column', 250);
    const { unit, compareUnit } = this;
    chartOption.plotOptions = { series: { pointPadding: 0 } };
    chartOption.xAxis = { type: 'category' };
    chartOption.yAxis = [{ title: null }, { title: null, opposite: true }];
    chartOption.tooltip = { shared: true };
    chartOption.series = this.data;
    if (unit || compareUnit) {
      chartOption.yAxis = chartOption.yAxis.map((_yAxis, _index) => {
        const displayUnit = _index === 0 ? unit ?? '' : compareUnit ?? '';
        Object.assign(_yAxis, { labels: { format: `{value} ${displayUnit}` } });
        return _yAxis;
      });
    }

    return chartOption;
  }

  /**
   * 解除rxjs訂閱
   */
  ngOnDestroy(): void {
    this.ngUnsubscribe.next(null);
    this.ngUnsubscribe.complete();
  }
}
