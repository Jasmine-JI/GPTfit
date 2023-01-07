import { Pipe, PipeTransform } from '@angular/core';
import { DateUnit } from '../enums/common/date-unit.enum';

@Pipe({
  name: 'dateUnitKey',
  standalone: true,
})
export class DateUnitKeyPipe implements PipeTransform {
  constructor() {}

  /**
   * 根據數據類別回覆對應的多國語系鍵名
   * @param unit {DateUnit}-數據類別
   * @return {string}-多國語系鍵名
   */
  transform(unit: DateUnit): string {
    switch (unit) {
      case DateUnit.day:
        return 'universal_time_day';
      case DateUnit.week:
        return 'universal_time_week';
      case DateUnit.month:
        return 'universal_time_months';
      case DateUnit.season:
        return 'universal_system_season';
      case DateUnit.year:
        return 'universal_time_year';
      default:
        return '';
    }
  }
}
