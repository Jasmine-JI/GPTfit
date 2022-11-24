import {
  NgModule,
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
import { TranslateModule } from '@ngx-translate/core';
import { chart } from 'highcharts';
import * as Highcharts from 'Highcharts';
import { HighchartOption } from '../../core/classes';
import { GlobalEventsService } from '../../core/services/global-events.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-pie-chart',
  templateUrl: './pie-chart.component.html',
  styleUrls: ['./pie-chart.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PieChartComponent implements OnInit, OnChanges, OnDestroy {
  @Input() page: string;
  @Input() type: string;
  @Input() data: any;
  @Input() chartHeight: number;
  @Input() focusIndex: number | null;
  @ViewChild('container') container: ElementRef;

  private ngUnsubscribe = new Subject();
  private _option: HighchartOption;
  private _chart: Highcharts.Chart;

  nodata = true;

  constructor(private globalEventsService: GlobalEventsService) {}

  ngOnInit(): void {
    this.subscribeGlobalEvents();
  }

  ngOnChanges(e: SimpleChanges): void {
    const { data, focusIndex } = e;
    if (data.firstChange) this.initChart(data.currentValue);
    if (!focusIndex.firstChange) this.updateChart(focusIndex.currentValue);
  }

  /**
   * 訂閱全域自定義事件
   */
  subscribeGlobalEvents() {
    this.globalEventsService
      .getRxSideBarMode()
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe(() => {});
  }

  /**
   * 初始化圖表
   * @param data {Array<any>}-圖表數據
   */
  initChart(data: Array<any>) {
    this._option = new HighchartOption('pie', 300);
    this._option.plotOptions = {
      pie: {
        center: ['50%', '30%'],
        size: '60%',
        borderWidth: 3,
        dataLabels: {
          enabled: true,
          formatter: function () {
            let percent = ((this.point.y / this.point.total) * 100).toFixed(1);
            if (percent.slice(-1) === '0') {
              percent = '' + (this.point.y / this.point.total) * 100;
            }
            return `${this.key}<br> ${percent}%`;
          },
        },
      },
    };

    this._option.series = [{ data }];
    setTimeout(() => {
      const chartContainer = this.container.nativeElement;
      if (chartContainer) {
        this._chart = chart(chartContainer, this._option.option as any);
      }
    });
  }

  /**
   * 更新圖表數據
   * @param index {number}-指定的序列
   */
  updateChart(index: number | null) {
    if (index === null) {
      this._option.cancelSliced();
    } else {
      this._option.assignSliced(index);
    }

    this._chart.update(this._option.option as any);
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }
}
@NgModule({
  declarations: [PieChartComponent],
  exports: [PieChartComponent],
  imports: [CommonModule, TranslateModule],
})
export class PieChartModule {}
