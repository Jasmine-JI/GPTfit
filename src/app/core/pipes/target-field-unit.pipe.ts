import { Pipe, PipeTransform } from '@angular/core';
import { TargetField } from '../models/api/api-common/sport-target.model';

@Pipe({
  name: 'targetFieldUnit',
  standalone: true,
})
export class TargetFieldUnitPipe implements PipeTransform {
  constructor() {}

  /**
   * 根據運動目標條件項目回覆對應的單位多國語系鍵名
   * @param value {TargetField}-運動目標條件項目
   * @return {string}-單位的多國語系鍵名
   */
  transform(value: TargetField): string {
    switch (value) {
      case 'totalActivities':
        return 'universal_unit_times';
      case 'totalTime':
      case 'benefitTime':
        return 'universal_time_minute';
      case 'pai':
        return '';
      case 'calories':
        return 'universal_unit_calories';
    }
  }
}
