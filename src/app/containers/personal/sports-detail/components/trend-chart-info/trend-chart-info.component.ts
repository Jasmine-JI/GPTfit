import { Component, OnChanges, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { TimeFormatPipe, PaceSecondToPacePipe } from '../../../../../core/pipes';
import { mathRounding, paceToPaceSecond } from '../../../../../core/utils';

@Component({
  selector: 'app-trend-chart-info',
  standalone: true,
  imports: [CommonModule, TranslateModule, TimeFormatPipe, PaceSecondToPacePipe],
  templateUrl: './trend-chart-info.component.html',
  styleUrls: ['./trend-chart-info.component.scss'],
})
export class TrendChartInfoComponent implements OnChanges {
  /**
   * 數據類別翻譯鍵名
   */
  @Input() titleKey: string;

  /**
   * 是否為配速類別數據
   */
  @Input() isPaceData = false;

  /**
   * 數據單位
   */
  @Input() unit: string;

  /**
   * 基準檔案開始日期
   */
  @Input() baseDate: string;

  /**
   * 基準檔案平均數據
   */
  @Input() baseAvg: number;

  /**
   * 基準檔案最佳數據
   */
  @Input() baseBest: number;

  /**
   * 比較檔案開始日期
   */
  @Input() compareDate: string;

  /**
   * 比較檔案平均數據
   */
  @Input() compareAvg: number;

  /**
   * 比較檔案最佳數據
   */
  @Input() compareBest: number;

  /**
   * 平均差值
   */
  avgDiff: string | number;

  /**
   * 取得最佳差值
   */
  bestDiff: string | number;

  /**
   * 根據螢幕大小決定是否顯示單位
   */
  get showUnit() {
    return window.innerWidth > 767;
  }

  ngOnChanges() {
    this.avgDiff = this.countAvgDiff();
    this.bestDiff = this.countBestDiff();
  }

  /**
   * 取得平均差值
   */
  countAvgDiff() {
    const { baseAvg, compareAvg } = this;
    return this.countDiff(baseAvg, compareAvg);
  }

  /**
   * 取得最佳差值
   */
  countBestDiff() {
    const { baseBest, compareBest } = this;
    return this.countDiff(baseBest, compareBest);
  }

  /**
   * 取得差值
   * @param baseValue 基準數據
   * @param compareValue 比較數據
   */
  countDiff(baseValue: string | number, compareValue: string | number) {
    if (!this.isPaceData) return mathRounding((baseValue as number) - (compareValue as number), 1);
    const baseSecond = paceToPaceSecond(baseValue as string);
    const compareSecond = paceToPaceSecond(compareValue as string);
    return baseSecond - compareSecond;
  }
}
