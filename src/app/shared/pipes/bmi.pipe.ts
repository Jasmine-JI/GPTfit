import { Pipe, PipeTransform } from '@angular/core';
import { ReportService } from '../services/report.service';

@Pipe({ name: 'bmi' })
export class BMIPipe implements PipeTransform {
  constructor(private reportService: ReportService) {}

  /**
   * 依公英制轉換身高單位。
   * @param value {Array<number>}-[身高(cm), 體重]
   * @return {number}-BMI
   * @author kidin-1100623
   */
  transform(value: Array<number>): number {
    const [height, weight] = value;
    return this.reportService.countBMI(height, weight);
  }
}
