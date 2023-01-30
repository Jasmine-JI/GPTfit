import { Component, OnInit, OnChanges, Input, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FloatTooltipOption } from '../../core/models/compo';

const leadTriangleWidth = 6;
const leadTriangleHeight = 6;
const defaultOption = {
  x: 0,
  y: 0,
  text: '',
  height: 30,
  width: 40,
  fontColor: 'rgba(0, 0, 0, 1)',
  fontSize: `12px`,
  borderColor: 'rgba(150, 150, 150, 1)',
  backgroundColor: 'rgba(255, 255, 255, 0.9)',
  borderRadius: 5,
};

@Component({
  selector: 'app-float-tooltip',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './float-tooltip.component.html',
  styleUrls: ['./float-tooltip.component.scss'],
})
export class FloatTooltipComponent implements OnInit, OnChanges {
  @ViewChild('container', { static: false })
  container: ElementRef;

  @Input() option: FloatTooltipOption;

  private _ctx: CanvasRenderingContext2D;

  canvasWidth = defaultOption.width;
  canvasHeight = defaultOption.height + leadTriangleHeight;

  ngOnInit() {}

  ngOnChanges() {
    this.drawTooltip();
  }

  /**
   * 使用canvas繪製tooltip
   */
  drawTooltip() {
    // 待this.container.nativeElement生成後再繪圖
    setTimeout(() => {
      const canvas = this.container.nativeElement as HTMLCanvasElement;
      if (canvas.getContext) {
        const option = { ...defaultOption, ...this.option };
        const {
          text,
          height,
          width,
          fontColor,
          borderColor,
          backgroundColor,
          borderRadius,
          fontSize,
        } = option;
        this.canvasHeight = height + leadTriangleHeight;
        this._ctx = canvas.getContext('2d');
        const padding = 2;
        const borderWidth = 1;
        this._ctx.font = `${fontSize} sans-serif`;
        const textWidth = this._ctx.measureText(text).width;
        const totalWidth = textWidth + padding * 2 + borderWidth * 2;
        const canvasWidth = width >= totalWidth ? width : totalWidth;
        this.canvasWidth = canvasWidth;
        const centerX = this.canvasWidth / 2;

        this._ctx.beginPath();
        this._ctx.moveTo(borderRadius, 0);
        this._ctx.lineTo(canvasWidth - borderRadius, 0);
        this._ctx.quadraticCurveTo(canvasWidth, 0, canvasWidth, borderRadius); // 右上圓角
        this._ctx.lineTo(canvasWidth, height - borderRadius);
        this._ctx.quadraticCurveTo(canvasWidth, height, canvasWidth - borderRadius, height); // 右下圓角
        this._ctx.lineTo(centerX + leadTriangleWidth / 2, height);
        this._ctx.lineTo(centerX, height + leadTriangleHeight);
        this._ctx.lineTo(centerX - leadTriangleWidth / 2, height);
        this._ctx.lineTo(borderRadius, height);
        this._ctx.quadraticCurveTo(0, height, 0, height - borderRadius); // 左下圓角
        this._ctx.lineTo(0, borderRadius);
        this._ctx.quadraticCurveTo(0, 0, borderRadius, 0); // 左上圓角

        this._ctx.fillStyle = backgroundColor;
        this._ctx.fill();

        this._ctx.strokeStyle = borderColor;
        this._ctx.stroke();

        this._ctx.fillStyle = fontColor;
        this._ctx.textAlign = 'center';
        this._ctx.textBaseline = 'middle';
        this._ctx.fillText(text, canvasWidth / 2, height / 2);

        this.setTooltip(canvas, option);
      }
    });
  }

  /**
   * 取得提示框顯示基準位置
   * @param canvas {HTMLCanvasElement}-canvas元素
   * @param option {FloatTooltipOption}-提示框設定
   */
  setTooltip(canvas: HTMLCanvasElement, option: FloatTooltipOption) {
    const { x, y, height, width } = option;
    const totalHeight = height + leadTriangleHeight;
    const positionX = x - width / 2;
    const positionY = y - totalHeight;
    canvas.style.transform = `translate(${positionX}px, ${positionY}px)`;
  }
}
