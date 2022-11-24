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
import { zoneColor, zoneCompareColor } from '../../shared/models/chart-data';
import { GlobalEventsService } from '../../core/services/global-events.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-hr-zone-chart',
  templateUrl: './hr-zone-chart.component.html',
  styleUrls: ['./hr-zone-chart.component.scss'],
})
export class HrZoneChartComponent implements OnInit, OnChanges, OnDestroy {
  @Input() data: Array<number>;
  @Input() compareData: Array<number> | null = null;
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
    const { data } = e;
    if (data.firstChange) this.initChart();
    if (!data.firstChange) this.updateChart();
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
   */
  initChart() {
    const { data, compareData } = this;
  }

  /**
   * 更新圖表數據
   */
  updateChart() {}

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }
}
@NgModule({
  declarations: [HrZoneChartComponent],
  exports: [HrZoneChartComponent],
  imports: [CommonModule, TranslateModule],
})
export class HrZoneChartModule {}
