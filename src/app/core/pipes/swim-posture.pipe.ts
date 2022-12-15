import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'swimPosture',
  standalone: true,
})
export class swimPosture implements PipeTransform {
  /**
   * 根據泳姿回傳對應多國語系的鍵。
   * @param value {string | number}-泳姿
   * @return {string}-多國語系的鍵
   */
  transform(value: string | number): string {
    switch (+value) {
      case 1:
        return 'universal_activityData_individualMedley';
      case 2:
        return 'universal_activityData_freestyle';
      case 3:
        return 'universal_activityData_breastStroke';
      case 4:
        return 'universal_activityData_backStroke';
      case 5:
        return 'universal_activityData_butterflyStroke';
    }
  }
}
