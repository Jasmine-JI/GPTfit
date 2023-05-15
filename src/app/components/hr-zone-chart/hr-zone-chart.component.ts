import {
  Component,
  OnInit,
  OnChanges,
  OnDestroy,
  Input,
  SimpleChanges,
  ViewChild,
  ElementRef,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { chart } from 'highcharts';
import * as Highcharts from 'highcharts';
import { HighchartOption } from '../../core/classes';
import { zoneColor, zoneCompareColor } from '../../shared/models/chart-data';
import { GlobalEventsService } from '../../core/services/global-events.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

interface SeriesData {
  y: number;
  z: string;
  color?: string;
}

const mainDataOption = {
  name: 'Avg',
  showInLegend: false,
};

@Component({
  selector: 'app-hr-zone-chart',
  templateUrl: './hr-zone-chart.component.html',
  styleUrls: ['./hr-zone-chart.component.scss'],
  standalone: true,
  imports: [CommonModule, TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HrZoneChartComponent implements OnInit, OnChanges, OnDestroy {
  @Input() data: Array<SeriesData>;
  @Input() compareData: Array<SeriesData> | null = null;
  @Input() compareUserName = '';
  @ViewChild('container') container: ElementRef;

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
    if (data?.firstChange) this.initChart();
    if (compareData) this.updateChart(!compareData.firstChange);
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
        this._option.xAxis = { categories: this.getHrZoneTranslate() };
        this._chart.update(this._option.option as any);
      }
    });
  }

  /**
   * 初始化圖表
   */
  initChart() {
    const { data } = this;
    if (!data || data.length === 0) return (this.noData = true);
    this.noData = false;
    this._option = this.getChartOption();
    setTimeout(() => {
      const chartContainer = this.container.nativeElement;
      if (chartContainer) {
        this._chart = chart(chartContainer, this._option.option as any);
      }

      this.changeDetectorRef.markForCheck();
    });
  }

  /**
   * 取得心率比較圖表設定
   */
  getChartOption() {
    const chartOption = new HighchartOption('column', 300);
    chartOption.plotOptions = {
      column: { pointPlacement: 0 },
      series: {
        dataLabels: {
          enabled: true,
          formatter: function () {
            return this.point.z;
          },
        },
      },
    };
    chartOption.xAxis = { categories: this.getHrZoneTranslate() };
    chartOption.yAxis = {
      title: null,
      labels: {
        formatter: function () {
          return `${this.value}%`;
        },
      },
    };
    chartOption.tooltip = {
      pointFormat: `{series.name}：{point.y}`,
      valueSuffix: ' %',
    };
    chartOption.series = this.getSeriesData();
    return chartOption;
  }

  /**
   * 確認比較數據有無，並賦予各心率區間顏色
   */
  getSeriesData() {
    const { data, compareData } = this;
    const seriesData: Array<any> = [];
    if (compareData && compareData.length > 0) {
      seriesData.push({
        data: this.assignColor(data, zoneCompareColor),
        ...mainDataOption,
      });
      seriesData.push({
        data: this.assignColor(compareData, zoneColor),
        name: this.compareUserName,
      });
    } else {
      seriesData.push({
        data: this.assignColor(data, zoneColor),
        ...mainDataOption,
      });
    }

    return seriesData;
  }

  /**
   * 取得心率區間翻譯文字
   */
  getHrZoneTranslate() {
    return [
      this.translate.instant('universal_activityData_limit_generalZone'),
      this.translate.instant('universal_activityData_warmUpZone'),
      this.translate.instant('universal_activityData_aerobicZone'),
      this.translate.instant('universal_activityData_enduranceZone'),
      this.translate.instant('universal_activityData_marathonZone'),
      this.translate.instant('universal_activityData_anaerobicZone'),
    ];
  }

  /**
   * 確認比較數據有無，並賦予各心率區間顏色
   * @param data {Array<SeriesData>}-心率區間
   * @param color {Array<string>}-欲賦予的區間顏色
   */
  assignColor(data: Array<SeriesData>, color: Array<string>) {
    return data.map((_data, _index) => {
      _data.color = color[_index];
      return _data;
    });
  }

  /**
   * 更新圖表數據
   * @param update {boolean}-是否更新數據
   */
  updateChart(update = false) {
    if (this.noData || !update) return false;
    const [mainData, compareData] = this.getSeriesData();
    setTimeout(() => {
      const { series } = this._chart;
      series[0].update(mainData);
      if (compareData) {
        if (series[1]) {
          this._chart.series[1].update(compareData);
        } else {
          this._chart.addSeries(compareData);
        }
      } else {
        if (series[1]) this._chart.series[1].remove();
      }

      this.changeDetectorRef.markForCheck();
    });
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next(null);
    this.ngUnsubscribe.complete();
  }
}
