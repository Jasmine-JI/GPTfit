import { Pipe, PipeTransform } from '@angular/core';
import { ReportService } from '../services/report.service';

@Pipe({ name: 'pythagorean' })
export class PythagoreanPipe implements PipeTransform {
  constructor(private reportService: ReportService) {}

  /**
   * 畢氏定理
   * @param value {Array<number>}-欲計算的數字
   * @returns 畢氏定理結果
   */
  transform(value: Array<number>): number {
    return this.reportService.pythagorean(value);
  }
}
