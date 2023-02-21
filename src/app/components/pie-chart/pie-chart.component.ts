import {
  Component,
  OnInit,
  OnChanges,
  OnDestroy,
  Input,
  ChangeDetectionStrategy,
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
import { mathRounding } from '../../core/utils';

@Component({
  selector: 'app-pie-chart',
  templateUrl: './pie-chart.component.html',
  styleUrls: ['./pie-chart.component.scss'],
  standalone: true,
  imports: [CommonModule, TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PieChartComponent implements OnInit, OnChanges, OnDestroy {
  @Input() page: string;
  @Input() type: string;
  @Input() data: any;
  @Input() chartHeight: number;
  @Input() focusData: number | null;
  @ViewChild('container') container: ElementRef;

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

  ngOnChanges(e: SimpleChanges): void {
    const { data, focusData } = e;
    if (data?.firstChange) this.initChart(data.currentValue);
    if (focusData && !focusData.firstChange) this.updateChart(focusData.currentValue);
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
        this._option.tooltip = { pointFormat: this.getTooltipFormat() };
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
    this._option = this.getChartOption(data);
    setTimeout(() => {
      const chartContainer = this.container.nativeElement;
      if (chartContainer) {
        this._chart = chart(chartContainer, this._option.option as any);
      }
    });
  }

  /**
   * 取得圖表設定
   * @param data {Array<any>}-圖表數據
   */
  getChartOption(data) {
    const chartOption = new HighchartOption('pie', 300);
    chartOption.plotOptions = {
      pie: {
        center: ['50%', '30%'],
        size: '60%',
        borderWidth: 3,
        dataLabels: {
          enabled: true,
          formatter: function () {
            const percent = mathRounding((this.point.y / this.point.total) * 100, 1);
            return `${this.key}<br> ${percent}%`;
          },
        },
      },
    };

    chartOption.tooltip = {
      pointFormat: this.getTooltipFormat(),
      valueDecimals: 0,
    };

    chartOption.series = [{ data }];
    return chartOption;
  }

  /**
   * 取得提示框格式
   */
  getTooltipFormat() {
    const title = this.translate.instant('universal_activityData_people');
    return `${title}: {point.y}`;
  }

  /**
   * 更新圖表數據
   * @param focusCalories {number}-欲聚焦的卡路里
   */
  updateChart(focusCalories: number | null) {
    if (this.noData) return false;
    if (focusCalories === null) {
      this._option.cancelSliced();
    } else {
      const index = this.data.findIndex((_data) => {
        const startRange = +_data.name.split('~')[0];
        return focusCalories >= startRange && focusCalories < startRange + 100;
      });

      this._option.assignSliced(index);
    }

    this._chart.update(this._option.option as any);
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }
}
