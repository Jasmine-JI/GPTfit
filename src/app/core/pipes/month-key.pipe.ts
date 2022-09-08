import { Pipe, PipeTransform, NgModule } from '@angular/core';

@Pipe({ name: 'monthKey' })
export class MonthKeyPipe implements PipeTransform {
  constructor() {}

  /**
   * 根據月份回覆對應的多國語系鍵名
   * @param month {string | number}-月份
   * @return {string}-多國語系鍵名
   */
  transform(month: string | number): string {
    switch (+month) {
      case 1:
        return 'universal_time_limit_january';
      case 2:
        return 'universal_time_limit_february';
      case 3:
        return 'universal_time_limit_march';
      case 4:
        return 'universal_time_limit_april';
      case 5:
        return 'universal_time_limit_may';
      case 6:
        return 'universal_time_limit_june';
      case 7:
        return 'universal_time_limit_july';
      case 8:
        return 'universal_time_limit_august';
      case 9:
        return 'universal_time_limit_september';
      case 10:
        return 'universal_time_limit_october';
      case 11:
        return 'universal_time_limit_november';
      case 12:
        return 'universal_time_limit_december';
      default:
        return '';
    }
  }
}

@NgModule({
  declarations: [MonthKeyPipe],
  exports: [MonthKeyPipe],
})
export class MonthKeyModule {}
