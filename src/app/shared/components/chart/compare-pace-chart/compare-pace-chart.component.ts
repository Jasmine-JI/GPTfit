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
import { deepCopy, paceTooltipFormatter, paceYAxisFormatter } from '../../../../core/utils/index';
import { compareChartDefault } from '../../../models/chart-data';
import { speedToPaceSecond } from '../../../../core/utils/sports';
import { SportType } from '../../../enum/sports';
import { DataUnitType } from '../../../../core/enums/common';

@Component({
  selector: 'app-compare-pace-chart',
  templateUrl: './compare-pace-chart.component.html',
  styleUrls: ['./compare-pace-chart.component.scss'],
})
export class ComparePaceChartComponent implements OnInit, OnChanges, OnDestroy {
  private ngUnsubscribe = new Subject();

  @Input() data: Array<any>;

  @Input() xAxisTitle: string;

  @Input() sportType: SportType;

  @Input() unit: DataUnitType;

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
          map((data) => this.transformSpeedToPace(data)),
          map((paceData) => this.initChart(paceData)),
          map((option) => this.handleSeriesName(option)),
          map((final) => this.createChart(final))
        )
        .subscribe();

      this.noData = false;
    }
  }

  /**
   * 將速度轉換為配速（秒）
   * @param data {Array<any>}-速度數據
   */
  transformSpeedToPace(data: Array<any>) {
    let [baseMaxData, baseAvgData, compareMaxData, compareAvgData] = deepCopy(data);
    const low = 3600; // 圖表最低點（最低配速3600秒）
    const { sportType, unit } = this;
    const transform = (speedData: any, isMaxData: boolean) => {
      speedData.name = isMaxData
        ? 'universal_activityData_liveBestPace'
        : 'universal_activityData_avgPace';
      speedData.data = speedData.data.map((_point) => {
        const _speed = _point.y;
        return {
          ..._point,
          y: speedToPaceSecond(_speed, sportType, unit),
          low,
        };
      });

      return speedData;
    };

    baseMaxData = transform(baseMaxData, true);
    baseAvgData = transform(baseAvgData, false);
    if (compareAvgData) {
      compareMaxData = transform(compareMaxData, true);
      compareAvgData = transform(compareAvgData, false);
    }

    return [baseMaxData, baseAvgData].concat(
      compareAvgData ? [compareMaxData, compareAvgData] : []
    );
  }

  /**
   * 初始化圖表
   * @param data {Array<number>}-圖表所需數據
   */
  initChart(data: Array<number>) {
    const { xAxisTitle, sportType, unit } = this;
    const chartOption = new ChartOption(data, xAxisTitle, sportType, unit);
    return chartOption.option;
  }

  /**
   * 處理圖表數據名稱多國語系
   * @param option {any}
   * @author kidin-1110318
   */
  handleSeriesName(option: any) {
    option.series = option.series.map((_series, _index) => {
      _series['name'] = this.translate.instant(_series['name']);
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
    this.ngUnsubscribe.next(null);
    this.ngUnsubscribe.complete();
  }
}

class ChartOption {
  private _option = deepCopy(compareChartDefault);

  constructor(data: Array<any>, xAxisTitle: string, sportType: SportType, unit: DataUnitType) {
    this.initChart(data, xAxisTitle, sportType, unit);
  }

  /**
   * 確認是否為比較模式，並初始化圖表
   * @param data {Array<any>}-圖表數據
   * @param xAxisTitle {Array<any>}-x軸標題
   * @param sportType {SportType}-運動類別
   * @param unit {string}-使用者使用單位
   */
  initChart(data: Array<any>, xAxisTitle: string, sportType: SportType, unit: DataUnitType) {
    this.setOtherOption(sportType, unit);
    const isCompareMode = data.length === 4;
    if (isCompareMode) {
      this.handleCompareOption(data, xAxisTitle);
    } else {
      this.handleNormalOption(data);
    }
  }

  /**
   * 增加此圖表專用設定值
   * @param sportType {SportType}-運動類別
   * @param unit {DataUnitType}-使用者使用單位
   */
  setOtherOption(sportType: SportType, unit: DataUnitType) {
    const { yAxis } = this._option;
    this._option.yAxis = {
      ...yAxis,
      reversed: true,
      max: 1800, // 速度過慢不顯示
      tickAmount: 7, // 為了讓柱狀圖底部可與x軸接觸
      labels: {
        formatter: paceYAxisFormatter,
      },
    };

    this._option.chart.type = 'column';
    this._option.plotOptions.series.borderRadius = 5;
    this._option.tooltip.shared = true;
    this._option.tooltip.formatter = paceTooltipFormatter(sportType, unit);
  }

  /**
   * 處理一般（非比較）圖表的設定
   * @param data {Array<any>}-圖表數據
   */
  handleNormalOption(data: Array<any>) {
    const [maxData, avgData] = data;
    const { xAxis } = this._option;
    const { labels } = xAxis;
    this._option = {
      ...this._option,
      xAxis: {
        ...xAxis,
        type: 'datetime',
        tickPositions: avgData.data.map((_data) => _data.additionalInfo[0]),
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
