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
import { TargetField } from '../../../../core/models/api/api-common/sport-target.model';
import { compareChartDefault } from '../../../../core/models/compo/chart-data.model';
import { targetLineColor } from '../../../../core/models/represent-color';
import {
  yAxisTimeFormat,
  tooltipTimeFormat,
  yAxisPercentageFormat,
  tooltipPercentageFormat,
  tooltipFormat,
  distanceAxisFormat,
  distanceTooltipFormat,
  dataLabelsFormatter,
  deepCopy,
} from '../../../../core/utils';
import { TargetFieldNamePipe } from '../../../../core/pipes';
import dayjs from 'dayjs';
import { GlobalEventsService, UserService } from '../../../../core/services';
import { DataUnitType } from '../../../../core/enums/common';

@Component({
  selector: 'app-compare-column-trend',
  templateUrl: './compare-column-trend.component.html',
  styleUrls: ['./compare-column-trend.component.scss', '../chart-share-style.scss'],
})
export class CompareColumnTrendComponent implements OnInit, OnChanges, OnDestroy {
  private ngUnsubscribe = new Subject();

  @Input() data: Array<any>;

  @Input() type: TargetField;

  @Input() conditionValue: number;

  @Input() xAxisTitle: string;

  @ViewChild('container', { static: false })
  container: ElementRef;

  /**
   * 是否沒有數據
   */
  noData = true;

  constructor(
    private translate: TranslateService,
    private targetFieldNamePipe: TargetFieldNamePipe,
    private globalEventsService: GlobalEventsService,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    this.subscribeGlobalEvents();
  }

  ngOnChanges() {
    this.handleChart();
  }

  /**
   * 處理繪製圖表流程
   */
  handleChart() {
    if (!this.data) {
      this.noData = true;
    } else {
      const { data, conditionValue, type } = this;
      of('')
        .pipe(
          map(() => this.initChart(data, type, conditionValue)),
          map((option) => this.handleSeriesName(option, type)),
          map((final) => this.createChart(final))
        )
        .subscribe();

      this.noData = false;
    }
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
   * 初始化圖表
   * @param data {Array<number>}-圖表所需數據
   * @param type {TargetField}-數據類別
   * @param targetLineValue {number | null}-運動目標線數值
   * @author kidin-1110413
   */
  initChart(data: Array<number>, type: TargetField, targetLineValue: number | null) {
    const userUnit = this.userService.getUser().userProfile.unit as DataUnitType;
    const chartOption = new ChartOption(data, type, targetLineValue, userUnit, this.xAxisTitle);
    return chartOption.option;
  }

  /**
   * 處理圖表數據名稱多國語系
   * @param option {any}
   * @param type {TargetField}-數據類型
   * @author kidin-1110318
   */
  handleSeriesName(option: any, type: TargetField) {
    option.series = option.series.map((_series) => {
      _series['name'] = this.translate.instant(this.targetFieldNamePipe.transform(type));
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

  constructor(
    data: Array<any>,
    type: TargetField | string,
    targetLineValue: number | null,
    unit: DataUnitType,
    xAxisTitle: string
  ) {
    this.initChart(data, xAxisTitle);
    this.handleDataType(type, unit);
    if (targetLineValue) this.handleTargetLine(targetLineValue);
  }

  /**
   * 確認是否為比較模式，並初始化圖表
   * @param allData {Array<any>}-圖表數據
   * @param xAxisTitle {string}-x軸標題
   */
  initChart(data: Array<any>, xAxisTitle: string) {
    this.setOtherOption();
    const isCompareMode = data.length === 2;
    if (isCompareMode) {
      this.handleCompareOption(data, xAxisTitle);
    } else {
      this.handleNormalOption(data);
    }
  }

  /**
   * 設定此圖表專用設定值
   */
  setOtherOption() {
    this._option.chart.type = 'column';
    this._option.plotOptions.series.borderRadius = 5;
  }

  /**
   * 根據數據類別設定y軸與浮動框顯示格式
   * @param type {TargetField | string}-數據類別
   * @param unit {DataUnitType}-使用者使用單位
   */
  handleDataType(type: TargetField | string, unit: DataUnitType) {
    switch (type) {
      case 'totalTime':
      case 'benefitTime':
        this._option.yAxis['labels'] = {
          formatter: yAxisTimeFormat,
        };

        this._option['tooltip'] = {
          formatter: tooltipTimeFormat,
        };

        break;
      case 'achievementRate':
        this._option.yAxis['labels'] = {
          formatter: yAxisPercentageFormat,
        };

        this._option['tooltip'] = {
          formatter: tooltipPercentageFormat,
        };

        this.option['plotOptions'].series.dataLabels = {
          enabled: true,
          formattter: dataLabelsFormatter,
        };
        break;
      case 'distance':
        this._option.yAxis['labels'] = {
          formatter: distanceAxisFormat(unit),
        };

        this._option['tooltip'] = {
          formatter: distanceTooltipFormat(unit),
        };

        break;
      default:
        this._option['tooltip'] = {
          formatter: tooltipFormat,
        };

        break;
    }
  }

  /**
   * 處理一般（非比較）圖表的設定
   * @param data {Array<any>}-圖表數據
   */
  handleNormalOption(data: Array<any>) {
    const { xAxis, plotOptions } = this._option;
    const { labels } = xAxis;
    this._option = {
      ...this._option,
      xAxis: {
        ...xAxis,
        type: 'datetime',
        tickPositions: data[0].custom.dateRange.map((_range) => _range[0]),
        labels: {
          ...labels,
          formatter: function () {
            return dayjs(this.value).format('MM/DD');
          },
        },
      },
      plotOptions: {
        ...plotOptions,
        column: {
          ...plotOptions.column,
        },
      },
      series: data,
    };
  }

  /**
   * 處理比較圖表的設定
   * @param chartData {Array<any>}-圖表數據
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
   * 若有設定運動目標，則顯示目標線
   * @param value {number}-目標線數值
   */
  handleTargetLine(value: number) {
    this._option.yAxis['plotLines'] = [
      {
        color: targetLineColor,
        width: 2,
        value,
      },
    ];
  }

  /**
   * 取得圖表設定
   */
  get option() {
    return this._option;
  }
}
