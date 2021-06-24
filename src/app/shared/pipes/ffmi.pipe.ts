import { Pipe, PipeTransform } from '@angular/core';
import { ReportService } from '../services/report.service';

@Pipe({name: 'ffmi'})
export class FFMIPipe implements PipeTransform {

  constructor(
    private reportService: ReportService
  ) {}

  /**
   * 依身高、體重、脂肪率，計算FFMI。
   * @param value {Array<number>}-[身高(cm), 體重, 脂肪率]
   * @return {number}-FFMI
   * @author kidin-1100623
   */
  transform(value: Array<number>): number {
    const [height, weight, fatRate] = value;    
    return this.reportService.countFFMI(height, weight, fatRate);
  }

}
