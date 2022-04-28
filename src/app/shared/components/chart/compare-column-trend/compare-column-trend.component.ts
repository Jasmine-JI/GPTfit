import { Component, OnInit, ViewChild, ElementRef, Input, OnDestroy } from '@angular/core';
import { of, Subject } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';
import { chart } from 'highcharts';
import { TranslateService } from '@ngx-translate/core';
import { TargetCondition, TargetField } from '../../../models/sport-target';
import { TARGET_LINE_COLOR } from '../../../models/chart-data';
import {
  yAxisTimeFormat,
  tooltipTimeFormat,
  yAxisPercentageFormat,
  tooltipPercentageFormat,
  tooltipFormat,
} from '../../../utils/chart-formatter';
import { TargetFieldNamePipe } from '../../../pipes/target-field-name.pipe';
import dayjs from 'dayjs';
import { GlobalEventsService } from '../../../../core/services/global-events.service';


@Component({
  selector: 'app-compare-column-trend',
  templateUrl: './compare-column-trend.component.html',
  styleUrls: ['./compare-column-trend.component.scss']
})
export class CompareColumnTrendComponent implements OnInit, OnDestroy {

  private ngUnsubscribe = new Subject();

  @Input('data') data: Array<any>;

  @Input('type') type: TargetField;

  @Input('condition') condition: Array<TargetCondition>;

  @ViewChild('container', {static: false})
  container: ElementRef;

  /**
   * 是否沒有數據
   */
  noData = true;

  constructor(
    private translate: TranslateService,
    private targetFieldNamePipe: TargetFieldNamePipe,
    private globalEventsService: GlobalEventsService
  ) { }

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
      const { data, condition, type } = this;
      of('').pipe(
        map(() => this.getRelatedCondition(type, condition)),
        map(targetLineValue => this.initChart(data, type, targetLineValue)),
        map(option => this.handleSeriesName(option, type)),
        map(chartData => this.createChart(chartData))
      ).subscribe();

      this.noData = false;
    }
  }

  /**
   * 訂閱全域自定義事件
   */
  subscribeGlobalEvents() {
    this.globalEventsService.getRxSideBarMode().pipe(
      takeUntil(this.ngUnsubscribe)
    ).subscribe(() => {
      this.handleChart();
    });
  }

  /**
   * 取得與此圖表有關的運動目標條件
   * @param type {TargetField}-此圖表的類別
   * @param condition {Array<TargetCondition>}-所有運動目標條件
   * @author kidin-1110418
   */
  getRelatedCondition(type: TargetField, condition: Array<TargetCondition>) {
    const relatedIndex = condition.findIndex(_condition => _condition.filedName === type);
    return relatedIndex > -1 ? condition[relatedIndex].filedValue : null;
  }

  /**
   * 初始化圖表
   * @param data {Array<number>}-各區間數據
   * @param type {TargetField}-數據類別
   * @param targetLineValue {number}-運動目標線數值
   * @author kidin-1110413
   */
  initChart(data: Array<number>, type: TargetField, targetLineValue: number) {
    const chartOption = new ChartOption(data, type, targetLineValue);
    return chartOption.option;
  }

  /**
   * 處理圖表數據名稱多國語系
   * @param option {any}
   * @param type {TargetField}-數據類型
   * @author kidin-1110318
   */
  handleSeriesName(option: any, type: TargetField) {
    option.series = option.series.map(_series => {
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
    setTimeout (() => {
      if (!this.container) {
        this.createChart(option);
      } else {
        const chartDiv = this.container.nativeElement;
        chart(chartDiv, option);
      }
    }, 200);
  }


  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

}


class ChartOption {

  private _option = {
    chart: {
      type: 'column',
      height: 200,
      backgroundColor: 'transparent',
      marginLeft: 85
    },
    title: {
      text: ''
    },
    credits: {
      enabled: false
    },
    xAxis: <any>{
      title: {
        enabled: false
      }
    },
    yAxis: {
      min: 0,
      title: {
        text: ''
      },
      startOnTick: false,
      minPadding: 0.01,
      maxPadding: 0.01,
      tickAmount: 5
    },
    plotOptions: {
      column: {},
      series: {
        pointWidth: null,
        maxPointWidth: 30,
        borderRadius: 5
      }
    },
    series: []
  };

  constructor(data: Array<any>, type: TargetField, targetLineValue: number) {
    this.initChart(data);
    this.handleDataType(type);
    if (targetLineValue) this.handleTargetLine(targetLineValue);
  }

  /**
   * 確認是否為比較模式，並初始化圖表
   * @param allData {Array<any>}-圖表數據
   * @author kidin-1110413
   */
  initChart(data: Array<any>) {
    const isCompareMode = data.length === 2;
    if (isCompareMode) {
      this.handleCompareOption(data);
    } else {
      this.handleNormalOption(data);
    }

  }

  /**
   * 根據數據類別設定y軸與浮動框顯示格式
   * @param type {TargetField}-數據類別
   */
  handleDataType(type: TargetField) {
    switch (type) {
      case 'totalTime':
        this._option.yAxis['labels'] = {
          formatter: yAxisTimeFormat
        };

        this._option['tooltip'] = {
          formatter: tooltipTimeFormat
        };

        
        break;
      case 'achievementRate':
        this._option.yAxis['labels'] = {
          formatter: yAxisPercentageFormat
        };

        this._option['tooltip'] = {
          formatter: tooltipPercentageFormat
        };
        break;
      default:
        this._option['tooltip'] = {
          formatter: tooltipFormat
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
    this._option = {
      ...this._option,
      xAxis: {
        ...xAxis,
        type: 'datetime',
        tickPositions: data[0].custom.dateRange.map(_range => _range[0]),
        labels: {
          formatter: function() {
            return dayjs(this.value).format('MM/DD');
          }
        }
      },
      plotOptions: {
        ...plotOptions,
        column: {
          ...plotOptions.column
        }
      },
      series: data
    };

  }

  /**
   * 處理比較圖表的設定
   * @param chartData {Array<any>}-圖表數據
   */
  handleCompareOption(chartData: Array<any>) {
    const dataLength = chartData[0].data.length;
    const categories = new Array(dataLength).fill(0).map((_arr, _index) => _index + 1);
    const { xAxis } = this._option;
    this._option = {
      ...this._option,
      xAxis: {
        ...xAxis,
        categories,
        crosshair: true,
      },
      series: chartData
    };

  }

  /**
   * 若有設定運動目標，則顯示目標線
   * @param value {number}-目標線數值
   */
  handleTargetLine(value: number) {
    this._option.yAxis['plotLines'] = [{
      color: TARGET_LINE_COLOR,
      width: 2,
      value
    }];

  }

  /**
   * 取得圖表設定
   */
  get option() {
    return this._option;
  }

}