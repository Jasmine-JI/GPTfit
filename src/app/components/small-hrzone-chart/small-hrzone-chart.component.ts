import {
  Component,
  OnInit,
  OnDestroy,
  OnChanges,
  ViewChild,
  ElementRef,
  Input,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { zoneColor } from '../../shared/models/chart-data';
import { FloatTooltipOption } from '../../core/models/compo';
import { FloatTooltipComponent } from '../float-tooltip/float-tooltip.component';

const columnWidth = 30;
const columnHeight = 40;

@Component({
  selector: 'app-small-hrzone-chart',
  templateUrl: './small-hrzone-chart.component.html',
  styleUrls: ['./small-hrzone-chart.component.scss'],
  standalone: true,
  imports: [CommonModule, FloatTooltipComponent],
})
export class SmallHrzoneChartComponent implements OnInit, OnChanges, OnDestroy {
  @Input() data: Array<number>; // 各心率區間總秒數，ex.[992, 123, 1534, 1234, 1231, 321]

  @ViewChild('container', { static: false })
  container: ElementRef;

  private _ctx: CanvasRenderingContext2D;

  /**
   * 用來紀錄各心率區間柱狀位置
   */
  private _hrzoneRect = new Map();

  /**
   * 是否顯示浮動提示框
   */
  showTooltip = false;

  /**
   * 提示框設定
   */
  tooltipOption: FloatTooltipOption = {
    x: 0,
    y: 0,
    text: '',
  };

  constructor() {}

  ngOnInit(): void {}

  ngOnChanges() {
    this.drowChart();
  }

  drowChart() {
    // 待this.container.nativeElement生成後再繪圖
    setTimeout(() => {
      const canvas = this.container.nativeElement;
      if (canvas.getContext) {
        const totalWidth = columnWidth * 6;
        this._ctx = canvas.getContext('2d');
        this._ctx.clearRect(0, 0, totalWidth, columnHeight); // clear canvas

        // 心率圖底線
        this._ctx.moveTo(0, columnHeight);
        this._ctx.lineTo(totalWidth, columnHeight);
        this._ctx.stroke();

        // 計算各區間佔比
        const totalSecond = this.data.reduce((prev, current) => prev + current);
        const hrZonePercentage = this.data.map((_second) =>
          Math.round((_second / totalSecond) * 100)
        );

        // 依最高佔比作為圖表最高點
        const maxSecond = this.data.reduce((prev, current) => (prev < current ? current : prev));
        const hrZoneChartPercentage = this.data.map((_second) =>
          Math.round((_second / maxSecond) * 100)
        );

        hrZoneChartPercentage.forEach((_percentage, _index) => {
          const startX = 0 + _index * columnWidth;
          const height = -Math.floor((_percentage * columnHeight) / 100);
          const zoneRect = new Path2D();
          zoneRect.rect(startX, 39, columnWidth, height);
          this._hrzoneRect.set(_index, {
            path: zoneRect,
            percentage: hrZonePercentage[_index],
            height,
          });
          this._ctx.fillStyle = zoneColor[_index];
          this._ctx.fill(zoneRect);
        });
      }
    });
  }

  /**
   * 處理滑鼠經過事件
   * @param e {MouseEvent}-滑鼠經過事件
   */
  handleMouseMove(e: MouseEvent) {
    const { offsetX, offsetY } = e;
    this._hrzoneRect.forEach((_value, _key) => {
      const { path, percentage, height } = _value;
      if (this._ctx.isPointInPath(path, offsetX, offsetY)) {
        this.showTooltip = true;
        this.tooltipOption = {
          x: _key * columnWidth + columnWidth / 2, // 柱子水平中心
          y: columnHeight - Math.abs(height),
          text: `${percentage}%`,
          borderColor: zoneColor[_key],
        };
      }
    });
  }

  /**
   * 處理滑鼠移出事件
   */
  handleMouseOut() {
    this.showTooltip = false;
  }

  ngOnDestroy() {}
}
