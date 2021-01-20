import { Pipe, PipeTransform } from '@angular/core';

/**
 * 根據泳姿回傳對應多國語系的鍵。
 */
@Pipe({name: 'swimPosture'})
export class swimPosture implements PipeTransform {
  transform(value: string | number, args: string[]): any {
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
