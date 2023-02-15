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
  selector: 'app-category-column-chart',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './category-column-chart.component.html',
  styleUrls: ['./category-column-chart.component.scss'],
})
export class CategoryColumnChartComponent implements OnInit, OnChanges, OnDestroy {
  @ViewChild('container') container: ElementRef;
  @Input() data: Array<any>;
  @Input() seriesName: Array<string>;
  @Input() compareData: Array<any>;
  @Input() unit: string;
  @Input() tooltipLegendKey: string;
  @Input() lineData: Array<any>;
  @Input() compareLineData: Array<any>;

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
    const { unit } = this;
    chartOption.plotOptions = { series: { pointPadding: 0, dataLabels: { enabled: true } } };
    chartOption.xAxis = { type: 'category' };
    chartOption.yAxis = { title: null };
    chartOption.series = this.getSeries();
    if (unit) {
      const { yAxis, tooltip } = chartOption.option;
      chartOption.yAxis = { ...(yAxis ?? {}), labels: { format: `{value} ${unit}` } };
      chartOption.tooltip = { ...(tooltip ?? {}), valueSuffix: unit };
    }

    return chartOption;
  }

  /**
   * 將圖表數據再進行加工，含多國語系轉換、單位置入、數據格式化為highchart用格式
   */
  getSeries() {
    const { data, seriesName } = this;
    return data.map((_data, _index) => {
      const _value = _data.data ?? _data;
      const result: any = {
        name: seriesName && seriesName[_index] ? this.translate.instant(seriesName[_index]) : '',
        data: _value.map((_oneData) => {
          if (!Array.isArray(_oneData)) return _oneData;
          const [_category, _value] = _oneData;
          return {
            name: this.translate.instant(_category),
            y: _value,
          };
        }),
      };

      if (_data.color) result.color = _data.color;
      return result;
    });
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }
}
