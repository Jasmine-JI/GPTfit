import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'monthKey',
  standalone: true,
})
export class MonthKeyPipe implements PipeTransform {
  constructor() {}

  /**
   * 根據月份回覆對應的多國語系鍵名
   * @param month {string | number}-月份
   * @return {string}-多國語系鍵名
   */
  transform(month: string | number): string {
    const monthKey = {
      1: 'universal_time_limit_january',
      2: 'universal_time_limit_february',
      3: 'universal_time_limit_march',
      4: 'universal_time_limit_april',
      5: 'universal_time_limit_may',
      6: 'universal_time_limit_june',
      7: 'universal_time_limit_july',
      8: 'universal_time_limit_august',
      9: 'universal_time_limit_september',
      10: 'universal_time_limit_october',
      11: 'universal_time_limit_november',
      12: 'universal_time_limit_december',
    };

    return monthKey[+month] ?? '';
  }
}
