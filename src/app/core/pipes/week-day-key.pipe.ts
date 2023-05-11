import { Pipe, PipeTransform } from '@angular/core';
import dayjs from 'dayjs';

@Pipe({
  name: 'weekDayKey',
  standalone: true,
})
export class WeekDayKeyPipe implements PipeTransform {
  /**
   * 根據日期時間取得星期的多國語系鍵名
   * @param value {string | number}-timestamp或dayjs可直接使用的時間格式
   */
  transform(value: string | number): string {
    const dayInWeek = dayjs(value).weekday();
    const weekDayKey = {
      0: 'universal_time_sun',
      1: 'universal_time_mon',
      2: 'universal_time_tue',
      3: 'universal_time_wed',
      4: 'universal_time_thu',
      5: 'universal_time_fri',
      6: 'universal_time_sat',
    };

    return weekDayKey[dayInWeek] ?? '';
  }
}
