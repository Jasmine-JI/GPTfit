import {
  Component,
  OnInit,
  OnChanges,
  OnDestroy,
  Input,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { QuadrantSetting } from '../../../../../core/models/compo';
import { MinMaxHandler } from '../../../../../core/classes';
import { speedToPace, mathRounding } from '../../../../../core/utils';
import { SportType } from '../../../../../core/enums/sports';
import { Subject, of, merge, fromEvent } from 'rxjs';
import { tap, map, delay, takeUntil, debounceTime } from 'rxjs/operators';
import { quadrantColor } from '../../../../../core/models/represent-color';
import { UserService, GlobalEventsService } from '../../../../../core/services';
import { DataUnitType } from '../../../../../core/enums/common';

@Component({
  selector: 'app-quadrant-chart',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './quadrant-chart.component.html',
  styleUrls: ['./quadrant-chart.component.scss'],
})
export class QuadrantChartComponent implements OnInit, OnChanges, OnDestroy {
  @ViewChild('container', { static: false })
  container: ElementRef;

  @ViewChild('canvasElement', { static: false })
  canvasElement: ElementRef;

  /**
   * 象限圖點數據
   */
  @Input() chartData: Array<{ x: number; y: number; color: string }>;

  /**
   * 象限圖設定
   */
  @Input() setting: QuadrantSetting;

  /**
   * 象限圖數據最大最小值
   */
  @Input() boundary: { x: MinMaxHandler; y: MinMaxHandler };

  /**
   * 運動類別
   */
  @Input() sportsType = SportType.run;

  /**
   * canvas
   */
  private _ctx: CanvasRenderingContext2D;

  /**
   * 象限圖設定
   */
  canvasSetting = {
    height: 300,
    width: 500,
    padding: 0.2,
    labelWidth: 50,
    dotRadius: 3,
  };

  private _ngUnsubscribe = new Subject();

  constructor(private userService: UserService, private globalEventsService: GlobalEventsService) {}

  /**
   * 取得使用者使用公或英制
   */
  get unit() {
    return this.userService.getUser().unit as DataUnitType;
  }

  ngOnInit() {
    this.subscribeResizeEvent();
  }

  ngOnChanges() {
    this.createChart();
  }

  /**
   * 訂閱螢幕大小改變事件
   */
  subscribeResizeEvent() {
    const resizeEvent = fromEvent(window, 'resize');
    const globalEvent = this.globalEventsService.getRxSideBarMode();
    merge(resizeEvent, globalEvent)
      .pipe(debounceTime(200), takeUntil(this._ngUnsubscribe))
      .subscribe(() => {
        this.clearCanvas();
        this.createChart();
      });
  }

  /**
   * 建立象限圖
   */
  createChart() {
    const { chartData, setting, boundary } = this;
    if (chartData && setting && boundary) {
      of('')
        .pipe(
          delay(0), // 用來確保 template 先渲染以畫布容器寬度
          tap(() => this.setContainerWidth()),
          delay(0), // 用來確保畫布尺寸已按設定渲染
          map(() => this.clearCanvas()),
          map((canvas) => this.getChartBoundary(canvas)),
          map((res) => this.drawDot(res)),
          map((res) => this.drawAxis(res)),
          map((res) => this.drawAxisLabel(res)),
          map((res) => this.drawQuadrantLabel(res))
        )
        .subscribe(({ canvas }) => {
          this._ctx = canvas;
        });
    }
  }

  /**
   * 取得canvas容器大小
   */
  setContainerWidth() {
    const { width } = this.container.nativeElement.getBoundingClientRect();
    this.canvasSetting.width = width;
  }

  /**
   * 清除畫布
   */
  clearCanvas(ctx?: CanvasRenderingContext2D) {
    const { width, height } = this.canvasSetting;
    const canvas = ctx ?? this.canvasElement.nativeElement?.getContext('2d');
    canvas.clearRect(0, 0, width, height); // clear canvas
    return canvas;
  }

  /**
   * 取得象限圖邊界
   * @param canvas 畫布
   */
  getChartBoundary(canvas: CanvasRenderingContext2D) {
    const { boundary } = this;
    const { padding } = this.canvasSetting;
    const xPadding = boundary.x.minMaxDiff * padding;
    const yPadding = boundary.y.minMaxDiff * padding;
    const xMax = (boundary.x.max ?? 0) + xPadding; // 象限圖最右點
    const xMin = (boundary.x.min ?? 0) - xPadding; // 象限圖最左點
    const xRange = xMax - xMin;
    const yMax = (boundary.y.max ?? 0) + yPadding; // 象限圖最高點
    const yMin = (boundary.y.min ?? 0) - yPadding; // 象限圖最低點
    const yRange = yMax - yMin;
    return {
      canvas,
      boundaryInfo: { xMax, xMin, yMax, yMin, xRange, yRange },
    };
  }

  /**
   * 繪製數據點
   * @param canvas 畫布
   * @param boundaryInfo 圖表邊界相關資訊
   */
  drawDot({ canvas, boundaryInfo }) {
    const {
      chartData,
      canvasSetting: { dotRadius, width, height, labelWidth },
    } = this;
    const { xMin, xRange, yMax, yRange } = boundaryInfo;
    chartData.forEach((_data) => {
      const { x, y, color } = _data;
      const _x = mathRounding(labelWidth + ((x - xMin) / xRange) * (width - labelWidth), 0);
      const _y = mathRounding(((yMax - y) / yRange) * (height - labelWidth), 0);

      canvas.beginPath();
      canvas.arc(_x, _y, dotRadius, 0, 2 * Math.PI);
      canvas.fillStyle = color;
      canvas.fill();
      canvas.lineWidth = 1;
      canvas.strokeStyle = color;
      canvas.stroke();
    });

    return { canvas, boundaryInfo };
  }

  /**
   * 繪製軸線
   * @param canvas 畫布
   * @param boundaryInfo 圖表邊界相關資訊
   */
  drawAxis({ canvas, boundaryInfo }) {
    const { xRange, xMin, yRange, yMax } = boundaryInfo;
    const {
      canvasSetting: { width, height, labelWidth },
      setting: {
        xAxis: { origin: xAxisOrigin },
        yAxis: { origin: yAxisOrigin },
      },
    } = this;
    const xAxisYPosition = mathRounding(((yMax - yAxisOrigin) / yRange) * (height - labelWidth), 0);
    const yAxisXPosition = mathRounding(
      labelWidth + ((xAxisOrigin - xMin) / xRange) * (width - labelWidth),
      0
    );

    canvas.beginPath();
    canvas.strokeStyle = 'rgba(0, 0, 0, 1)';

    // x軸
    canvas.moveTo(mathRounding(labelWidth, 0), xAxisYPosition);
    canvas.lineTo(width, xAxisYPosition);
    canvas.stroke();

    // y軸
    canvas.moveTo(yAxisXPosition, 0);
    canvas.lineTo(yAxisXPosition, height - labelWidth);
    canvas.stroke();

    return { canvas, boundaryInfo };
  }

  /**
   * 繪製軸線標註
   * @param canvas 畫布
   * @param boundaryInfo 圖表邊界相關資訊
   */
  drawAxisLabel({ canvas, boundaryInfo }) {
    const {
      setting: {
        xAxis: { type: xAxisType },
        yAxis: { type: yAxisType },
      },
      canvasSetting: { height, width, labelWidth },
      sportsType,
      unit,
    } = this;
    const { xMax, xMin, yMax, yMin } = boundaryInfo;
    const convertLabel = (val: number, type: string) => {
      const value = val < 0 ? 0 : Math.round(val);
      return type === 'speed' ? speedToPace(value, sportsType, unit).value : value;
    };

    canvas.beginPath();
    const fontSize = 12;
    canvas.font = `${fontSize}px Arial`;
    canvas.fillStyle = 'rgba(100, 100, 100, 1)';

    // x軸標註
    canvas.textBaseline = 'top';
    const yPosition = height - labelWidth + 10;

    // x軸左邊標註
    canvas.textAlign = 'left';
    canvas.fillText(convertLabel(xMin, xAxisType), labelWidth, yPosition);

    // x軸中間標註
    canvas.textAlign = 'center';
    canvas.fillText(
      convertLabel((xMax + xMin) * 0.5, xAxisType),
      Math.round(labelWidth + 0.5 * (width - labelWidth)),
      yPosition
    );

    // x軸右邊標註
    canvas.textAlign = 'right';
    canvas.fillText(convertLabel(xMax, xAxisType), width, yPosition);

    // y軸標註
    const xPosition = labelWidth - 10;
    canvas.textAlign = 'right';

    // y軸下方標註
    canvas.textBaseline = 'bottom';
    canvas.fillText(convertLabel(yMin, yAxisType), xPosition, Math.round(height - labelWidth));

    // y軸中間標註
    canvas.textBaseline = 'middle';
    canvas.fillText(
      convertLabel((yMax + yMin) * 0.5, yAxisType),
      xPosition,
      Math.round((height - labelWidth) * 0.5)
    );

    // y軸上方標註
    canvas.textBaseline = 'top';
    canvas.fillText(convertLabel(yMax, yAxisType), xPosition, 0);

    return { canvas, boundaryInfo };
  }

  /**
   * 繪製象限標註
   * @param canvas 畫布
   * @param boundaryInfo 圖表邊界相關資訊
   */
  drawQuadrantLabel({ canvas, boundaryInfo }) {
    const { width, height, labelWidth } = this.canvasSetting;
    const fontSize = 24;

    canvas.beginPath();
    canvas.font = `${fontSize}px Arial`;

    canvas.textAlign = 'right';
    canvas.textBaseline = 'top';
    canvas.fillStyle = quadrantColor.i;
    canvas.fillText('I', width, 0);

    canvas.textAlign = 'left';
    canvas.textBaseline = 'top';
    canvas.fillStyle = quadrantColor.ii;
    canvas.fillText('II', labelWidth, 0);

    canvas.textAlign = 'left';
    canvas.textBaseline = 'bottom';
    canvas.fillStyle = quadrantColor.iii;
    canvas.fillText('III', labelWidth, height - labelWidth);

    canvas.textAlign = 'right';
    canvas.textBaseline = 'bottom';
    canvas.fillStyle = quadrantColor.iv;
    canvas.fillText('IV', width, height - labelWidth);

    return { canvas, boundaryInfo };
  }

  /**
   * 解除rxjs訂閱
   */
  ngOnDestroy(): void {
    this._ngUnsubscribe.next(null);
    this._ngUnsubscribe.complete();
  }
}
