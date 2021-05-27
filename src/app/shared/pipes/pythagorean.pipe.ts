import { Pipe, PipeTransform } from '@angular/core';
import { ReportService } from '../services/report.service';

/**
 * 畢氏定理
 */
@Pipe({name: 'pythagorean'})
export class PythagoreanPipe implements PipeTransform {

  constructor(
    private reportService: ReportService
  ) {}

  transform(value: Array<number>, args: string[]): any {
    return this.reportService.pythagorean(value);
  }
  
}
