import { Component, OnInit, Input, OnChanges, OnDestroy, ViewChild, ElementRef, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { SportType } from '../../../enum/sports';
import { changeOpacity, mathRounding } from '../../../utils/index';
import { of, fromEvent, Subject, Subscription, merge } from 'rxjs';
import { map, debounceTime, takeUntil, tap } from 'rxjs/operators';
import { ChartBlock } from '../../../enum/chart';
import { Percentage } from '../../../classes/percentage';
import { DISTRIBUTION_CHART_COLOR } from '../../../models/chart-data';
import { GlobalEventsService } from '../../../../core/services/global-events.service';

@Component({
  selector: 'app-distribution-canvas-chart',
  templateUrl: './distribution-canvas-chart.component.html',
  styleUrls: ['./distribution-canvas-chart.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DistributionCanvasChartComponent implements OnInit, OnChanges, OnDestroy {

  private ngUnsubscribe = new Subject();
  private pluralEventSubscription = new Subscription();

  /**
   * 運動或生活追蹤數據
   */
  @Input() data: Array<any>;

  /**
   * 心率區間上下限
   */
  @Input() hrRange: Array<any>;

  /**
   * 目前選擇的運動類別
   */
  @Input() selectType: number;

  @ViewChild('container', {static: false})
  container: ElementRef;

  /**
   * 是否上浮圖表文字
   */
  floatText = true;

  /**
   * 畫布寬度
   */
  canvasWidth = 800;

  /**
   * 畫布高度
   */
  canvasHeight = 400;

  /**
   * 畫布縮放比例
   */
  canvasScale = 1;

  /**
   * 圖表落點
   */
  points = [];

  /**
   * 用於計算各區塊百分比
   */
  percentage = new Percentage(9);

  /**
   * 用來紀錄canvas畫筆狀態
   */
  ctxStatus = {
    step: [],
    restore: function (ctx: any, action: string) {
      ctx.restore();
      const previousStep = this.step[this.step.length - 1];
      const stopRestore = action === previousStep;
      this.step.pop();
      if (!stopRestore) this.restore(ctx, action);
    },
    save: function (ctx: any, action: string) {
      this.step.push(action);
      ctx.save();
    }
  };

  /**
   * 圖表基礎設定
   */
  readonly chartBaseOption = {
    blockMargin: 5,
    blockPadding: 3,
    blockWidth: 135,
    blockHeight: 60,
    topY: 17,
    leftX: 45,
    get middleY() {
      return this.topY + this.blockHeight + this.blockMargin;
    },
    get bottomY() {
      return this.topY + (this.blockHeight + this.blockMargin) * 2
    },
    get middleX() {
      return this.leftX + this.blockWidth + this.blockMargin
    },
    get rightX() {
      return this.leftX + (this.blockWidth + this.blockMargin) * 2
    }
  };

  constructor(
    private translate: TranslateService,
    private changeDetectorRef: ChangeDetectorRef,
    private globalEventsService: GlobalEventsService
  ) { }

  ngOnInit() {
    this.handleScale();
    this.subscribePluralEvent();
  }

  ngOnChanges () {
    const { hrRange, data, selectType } = this;
    of('').pipe(
      map(() => this.getSportBoundary(hrRange)),
      map(boundary => this.handlePoint(boundary, data, hrRange, selectType)),
      map(points => this.drawChart(points))
    ).subscribe();
  }

  /**
   * 訂閱resize和多國語系變更事件
   */
  subscribePluralEvent() {
    const resizeEvent = fromEvent(window, 'resize');
    this.pluralEventSubscription = merge(
      resizeEvent,
      this.translate.onLangChange,
      this.globalEventsService.getRxSideBarMode()
    ).pipe(
      debounceTime(200),
      tap(() => this.handleScale()),
      takeUntil(this.ngUnsubscribe)
    ).subscribe(() => {
      if (this.data) this.drawChart(this.points);
    });

  }

  /**
   * 取得運動成效分佈圖，各區塊x軸之心率邊界值
   * @param hrRange {Array<number | string>}-心率區間上下限
   */
  getSportBoundary(hrRange: Array<any>) {
    const [hrZone0, hrZone5] = hrRange;
    const range = Math.floor((hrZone5 - +hrZone0) / 3);
    return [+hrZone0, +hrZone0 + range, +hrZone0 + range * 2, hrZone5];
  }

  /**
   * 根據數據與各區塊心率邊界值產生分佈圖之落點
   * @param boundary {Array<number>}-各區塊心率邊界值
   * @param data {Array<any>}-所需之心率與運動時間數據
   * @param hrRange {Array<any>}-心率區間上下限
   * @param selectedType {SportType}-活動分析所選運動類別
   */
  handlePoint(boundary: Array<number>, data: Array<any>, hrRange: Array<any>, selectedType: SportType) {
    this.percentage.init();
    this.points = [];
    const { bottomY, middleY, topY, leftX, middleX, rightX } = this.chartBaseOption;
    const [rangeMin, rangeTwo, rangeThree, rangeMax] = boundary;
    const [hrMin, hrMax] = hrRange;
    const [yBottomValue, yMiddleValue, yTopValue] = [0, 1200, 2400];
    data.forEach(_data => {
      const { sportType, avgSecond, avgHeartRateBpm } = _data;
      if ([SportType.all, sportType].includes(selectedType)) {
        let y: number;
        if (avgHeartRateBpm >= rangeMin && avgHeartRateBpm <= rangeTwo) {
          if (+avgSecond <= yMiddleValue) {
            y = this.getYPoint(avgSecond, yBottomValue, bottomY);
            this.percentage.count(ChartBlock.leftBottom);
          } else if (+avgSecond > yMiddleValue && +avgSecond <= yTopValue) {
            y = this.getYPoint(avgSecond, yMiddleValue, middleY);
            this.percentage.count(ChartBlock.leftMiddle);
          } else {
            y = this.getYPoint(+avgSecond, yTopValue, topY);
            this.percentage.count(ChartBlock.leftTop);
          }

          this.points.push({
            x: this.getXPoint(avgHeartRateBpm, rangeMin, rangeTwo, leftX, hrMax),
            y: y
          });

        } else if (avgHeartRateBpm > rangeTwo && avgHeartRateBpm <= rangeThree) {
          if (+avgSecond <= yMiddleValue) {
            y = this.getYPoint(avgSecond, yBottomValue, bottomY);
            this.percentage.count(ChartBlock.middleBottom);
          } else if (+avgSecond > yMiddleValue && +avgSecond <= yTopValue) {
            y = this.getYPoint(avgSecond, yMiddleValue, middleY);
            this.percentage.count(ChartBlock.center);
          } else {
            y = this.getYPoint(avgSecond, yTopValue, topY);
            this.percentage.count(ChartBlock.middleTop);
          }

          this.points.push({
            x: this.getXPoint(avgHeartRateBpm, rangeTwo, rangeThree, middleX, hrMax),
            y: y
          });

        } else if (avgHeartRateBpm > rangeThree) {

          if (+avgSecond <= yMiddleValue) {
            y = this.getYPoint(avgSecond, yBottomValue, bottomY);
            this.percentage.count(ChartBlock.rightBottom);
          } else if (+avgSecond > yMiddleValue && +avgSecond <= yTopValue) {
            y = this.getYPoint(avgSecond, yMiddleValue, middleY);
            this.percentage.count(ChartBlock.rightMiddle);
          } else {
            y = this.getYPoint(avgSecond, yTopValue, topY);
            this.percentage.count(ChartBlock.rightTop);
          }

          this.points.push({
            x: this.getXPoint(avgHeartRateBpm, rangeThree, rangeMax, rightX, hrMax),
            y: y
          });

        }
  
      }

    });

    return this.points;
  }

  /**
   * 縮放畫布以符合視窗大小
   */
  handleScale() {
    const maxWidth = 800;
    const canvasInitWidth = 480;
    const targetElement = document.querySelector('.report-distributionChartBlock');
    const elementWidth = targetElement.getBoundingClientRect().width;
    this.canvasScale = mathRounding((elementWidth > maxWidth ? maxWidth : elementWidth) / canvasInitWidth, 2);
    this.canvasWidth = Math.ceil(canvasInitWidth * this.canvasScale);
    this.canvasHeight = Math.ceil((canvasInitWidth / 1.9) * this.canvasScale);
    this.changeDetectorRef.markForCheck();
  }

  /**
   * 使用canvas繪出圖表
   * @param points {Array<any>}-落點
   */
  drawChart(points: Array<any>) {
    setTimeout(() => {
      const canvas = this.container.nativeElement;
      if (canvas.getContext) {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, 800, 400); // clear canvas
        this.ctxStatus.save(ctx, 'initial');
        ctx.scale(this.canvasScale, this.canvasScale);
        this.ctxStatus.save(ctx, 'scale');

        // 軸線顏色
        ctx.fillStyle = DISTRIBUTION_CHART_COLOR.axis;

        // y軸
        const yAxis = {
          centerX: 30,
          startY: 205,
          width: 16,
          length: 195,
          barWidth: 6,
          barLength: 185
        };

        ctx.beginPath();
        ctx.moveTo(yAxis.centerX - yAxis.barWidth / 2, yAxis.startY);
        ctx.lineTo(yAxis.centerX - yAxis.barWidth / 2, yAxis.startY - yAxis.barLength);
        ctx.lineTo(yAxis.centerX - yAxis.width / 2, yAxis.startY - yAxis.barLength);
        ctx.lineTo(yAxis.centerX, yAxis.startY - yAxis.length);
        ctx.lineTo(yAxis.centerX + yAxis.width / 2, yAxis.startY - yAxis.barLength);
        ctx.lineTo(yAxis.centerX + yAxis.barWidth / 2, yAxis.startY - yAxis.barLength);
        ctx.lineTo(yAxis.centerX + yAxis.barWidth / 2, yAxis.startY);
        ctx.closePath();
        ctx.fill();

        // x軸
        const xAxis = {
          centerY: 220,
          startX: 45,
          width: 16,
          length: 425,
          barWidth: 6,
          barLength: 415
        };

        ctx.beginPath();
        ctx.moveTo(xAxis.startX, xAxis.centerY - xAxis.barWidth / 2);
        ctx.lineTo(xAxis.startX + xAxis.barLength, xAxis.centerY - xAxis.barWidth / 2);
        ctx.lineTo(xAxis.startX + xAxis.barLength, xAxis.centerY - xAxis.width / 2);
        ctx.lineTo(xAxis.startX + xAxis.length, xAxis.centerY);
        ctx.lineTo(xAxis.startX + xAxis.barLength, xAxis.centerY + xAxis.width / 2);
        ctx.lineTo(xAxis.startX + xAxis.barLength, xAxis.centerY + xAxis.barWidth / 2);
        ctx.lineTo(xAxis.startX, xAxis.centerY + xAxis.barWidth / 2);
        ctx.closePath();
        ctx.fill();

        // 軸文字顏色與文字對齊位置
        this.ctxStatus.save(ctx, 'axisText');
        ctx.fillStyle = DISTRIBUTION_CHART_COLOR.axisText;
        ctx.textAlign = "center";

        // y軸文字
        ctx.font = 'bold 14px Microsoft JhengHei';
        this.ctxStatus.save(ctx, 'position_1');
        ctx.translate(20, 110);  // 指定文字位置
        ctx.rotate((Math.PI / 180) * 270);  // canvas旋轉使用單位為弧度
        ctx.fillText(this.translate.instant('universal_deviceSetting_timer'), 0, 0);

        // x軸文字
        this.ctxStatus.restore(ctx, 'position_1');
        ctx.translate(250, 240);  // 指定文字位置
        ctx.fillText(this.translate.instant('universal_activityData_hrZone'), 0, 0);

        // 九宮格
        this.ctxStatus.restore(ctx, 'axisText');
        const { blockWidth, blockHeight } = this.chartBaseOption;
        const allPercentage = this.percentage.getAllPercentage();
        this.ctxStatus.save(ctx, 'block');
        allPercentage.forEach((_percentage, _index) => {
          const { x, y, background, fill } = this.getBlockSet(_index);
          // 繪製各完整區塊
          ctx.fillStyle = background;
          ctx.fillRect(x, y, blockWidth, blockHeight);

          // 繪製各區塊佔比
          ctx.fillStyle = fill;
          ctx.fillRect(x, y, this.getFillWidth(_percentage), blockHeight);
        });

        // 落點
        this.ctxStatus.restore(ctx, 'block');
        ctx.font = '100 6px Microsoft JhengHei';
        ctx.strokeStyle = this.floatText ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 1)';
        const symbol = '✛';
        points.forEach(_point => {
          const { x, y } = _point;
          ctx.strokeText(symbol, x, y);
        });

        // 九宮格文字（最後再畫避免被落點覆蓋）
        allPercentage.forEach((_percentage, _index) => {
          const { text: { content, shadow, x: textX, y: textY } } = this.getBlockSet(_index);
          ctx.font = '700 10px Microsoft JhengHei';
          const completeContent = `${this.translate.instant(content)}${_percentage}%`;
          const outlineColor = this.floatText ? shadow : changeOpacity(shadow, 0.5);
          ctx.lineWidth = 3;
          this.wrapText(ctx, completeContent, textX, textY, outlineColor);
        });

        this.ctxStatus.restore(ctx, 'initial');
      }

      this.changeDetectorRef.markForCheck();
    });

  }

  /**
   * 根據y點比例對比圖表該區高度給予y軸落點(不貼邊)
   * @param y {number}-y軸數值
   * @param min {number}-y軸最小數值
   * @param yStart {number}-該區塊起始y軸數值
   * @returns {number}-y軸落點
   * @author kidin-1090131
   */
  getYPoint (y: number, min: number, yStart: number) {
    const yRange = 1200;
    const yMax = 3600;
    const { topY, blockPadding, blockHeight } = this.chartBaseOption;
    if (y / yMax >= 1) {
      return topY + blockPadding * 2;
    } else {
      return yStart + blockHeight - (((y - min) / yRange) * (blockHeight - blockPadding * 2));
    }

  }

  /**
   * 根據x點比例對比圖表該區寬度給予x軸落點(不貼邊)
   * @param x {number}-x軸數值
   * @param min {number}-x軸最小數值
   * @param max {number}-x軸最大數值
   * @param xStart {number}-該區塊起始x軸數值
   * @param xMax {number}-該區塊最大x軸數值
   * @returns {number}-x軸落點
   * @author kidin-1090131
   */
  getXPoint (x: number, min: number, max: number, xStart: number, xMax: number) {
    const { blockPadding, blockWidth } = this.chartBaseOption;
    if (x > xMax) {
      return xStart + blockWidth - blockPadding;
    } else {
      return ((x - min) / (max - min) * (blockWidth - blockPadding * 2)) + xStart;
    }

  }

  /**
   * 取得該區塊之基本設定
   * @param index {number}-該區塊序列
   */
  getBlockSet(index: number) {
    const { 
      leftX,
      topY,
      middleY,
      bottomY,
      middleX,
      rightX
     } = this.chartBaseOption;

    const set = {
      x: 0,
      y: 0,
      background: '',
      fill: '',
      text: {
        content: '',
        shadow: '',
        x: 0,
        y: 0
      },
      update: function (x: number, y: number, colorSet: any, content: string) {
        const { background, fill, textShadow } = colorSet;
        this.x = x;
        this.y = y;
        this.background = background;
        this.fill = fill;
        this.text = {
          content,
          shadow: textShadow,
          x: this.x + 10,
          y: this.y + 15,
        };

      }

    };

    let content: string;
    switch (index) {
      case ChartBlock.leftTop:
        content = 'universal_activityData_hardWorkButLowIntensity';
        set.update(leftX, topY, DISTRIBUTION_CHART_COLOR.leftTop, content);
        break;
      case ChartBlock.leftMiddle:
        content = 'universal_activityData_needToStrengthenTrainingIntensity';
        set.update(leftX, middleY, DISTRIBUTION_CHART_COLOR.leftMiddle, content);
        break;
      case ChartBlock.leftBottom:
        content = 'universal_activityData_insufficientAmountAndIntensity';
        set.update(leftX, bottomY, DISTRIBUTION_CHART_COLOR.leftBottom, content);
        break;
      case ChartBlock.middleTop:
        content = 'universal_activityData_hardAndSureTraining';
        set.update(middleX, topY, DISTRIBUTION_CHART_COLOR.middleTop, content);
        break;
      case ChartBlock.center:
        content = 'universal_activityData_goodAndStableTraining';
        set.update(middleX, middleY, DISTRIBUTION_CHART_COLOR.center, content);
        break;
      case ChartBlock.middleBottom:
        content = 'universal_activityData_durationNeedsToBeStrengthened';
        set.update(middleX, bottomY, DISTRIBUTION_CHART_COLOR.middleBottom, content);
        break;
      case ChartBlock.rightTop:
        content = 'universal_activityData_easyToCausePhysicalBurden';
        set.update(rightX, topY, DISTRIBUTION_CHART_COLOR.rightTop, content);
        break;
      case ChartBlock.rightMiddle:
        content = 'universal_activityData_moderateHighIntensityTraining';
        set.update(rightX, middleY, DISTRIBUTION_CHART_COLOR.rightMiddle, content);
        break;
      case ChartBlock.rightBottom:
        content = 'universal_activityData_shortBurstTraining';
        set.update(rightX, bottomY, DISTRIBUTION_CHART_COLOR.rightBottom, content);
        break;
    };

    return set;
  }

  /**
   * 取得九宮格佔比
   * @param percentage {number}-該區塊佔比
   */
  getFillWidth(percentage: number) {
    const { blockWidth } = this.chartBaseOption;
    return Math.floor((percentage / 100) * blockWidth);
  }

  /**
   * 若文字過長則換行
   * @param ctx {any}-canvas
   * @param text {string}-九宮格文字
   * @param x {number}-文字x軸位置
   * @param y {number}-文字y軸位置
   * @param outlineColor {string}-文字外框顏色
   */
  wrapText(ctx: any, text: string, x: number, y: number, outlineColor: string) {
    const overlapText = (line: string, x: number, y: number) => {
      ctx.strokeStyle = outlineColor;
      ctx.strokeText(line, x, y);
      ctx.fillStyle = 'white';
      ctx.fillText(line, x, y);
    };

    const { blockWidth, blockPadding } = this.chartBaseOption;
    const maxLineWidth = blockWidth - blockPadding * 6;  // 避免文字太貼邊
    let line = '';
    const words = text.split(' ');
    words.forEach((_word, _index) => {
      const testLine = `${line}${_word} `;
      const testLineWidth = ctx.measureText(testLine).width;
      if (testLineWidth > maxLineWidth && _index > 0) {
        overlapText(line, x, y);
        line = `${_word} `;
        y += 12;  // 根據字高偏移下行文字y軸位置
      } else {
        line = testLine;
      }

    });

    overlapText(line, x, y);
  }

  /**
   * 圖表文字上浮與否
   * @author kidin-1110421
   */
  floatChartText () {
    this.floatText = !this.floatText;
    this.drawChart(this.points);
  }

  /**
   * 解除rxjs訂閱
   */
  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

}
