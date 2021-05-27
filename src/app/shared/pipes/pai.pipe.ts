import { Pipe, PipeTransform } from '@angular/core';
import { ReportService } from '../services/report.service';

/**
 * 根據心率區間秒數與報告選擇時間範圍，計算pai
 */
@Pipe({name: 'pai'})
export class PaiPipe implements PipeTransform {

  constructor(
    private reportService: ReportService
  ) {}

  transform(value: Array<number>, args: number): any {
    return this.reportService.countPai(value, args);
  }

}

