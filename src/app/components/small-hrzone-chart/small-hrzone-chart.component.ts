import {
  Component,
  OnInit,
  OnDestroy,
  OnChanges,
  ViewChild,
  ElementRef,
  Input,
  NgModule,
} from '@angular/core';
import { zoneColor } from '../../shared/models/chart-data';

@Component({
  selector: 'app-small-hrzone-chart',
  templateUrl: './small-hrzone-chart.component.html',
  styleUrls: ['./small-hrzone-chart.component.scss'],
})
export class SmallHrzoneChartComponent implements OnInit, OnChanges, OnDestroy {
  @Input() data: Array<number>; // 各心率區間總秒數，ex.[992, 123, 1534, 1234, 1231, 321]

  @ViewChild('container', { static: false })
  container: ElementRef;

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
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, 180, 40); // clear canvas

        // 心率圖底線
        ctx.moveTo(0, 40);
        ctx.lineTo(180, 40);
        ctx.stroke();

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
          const startX = 0 + _index * 30;
          const height = -Math.floor((_percentage * 40) / 100);
          ctx.fillStyle = zoneColor[_index];
          ctx.fillRect(startX, 40, 30, height);
        });
      }
    });
  }

  ngOnDestroy() {}
}
@NgModule({
  declarations: [SmallHrzoneChartComponent],
  exports: [SmallHrzoneChartComponent],
})
export class SmallHrzoneChartModule {}
