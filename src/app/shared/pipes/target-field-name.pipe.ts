import { Pipe, PipeTransform } from '@angular/core';
import { TargetField } from '../models/sport-target';

@Pipe({name: 'targetFieldName'})
export class TargetFieldNamePipe implements PipeTransform {

  constructor() {}

  /**
   * 根據運動目標條件項目回覆對應的多國語系鍵名
   * @param value {TargetField}-運動目標條件項目
   * @return {string}-多國語系鍵名
   * @author kidin-1110307
   */
  transform(value: TargetField): string {
    switch (value) {
      case 'totalActivities':
        return 'universal_activityData_reps';
      case 'totalTime':
        return 'universal_activityData_totalTime';
      case 'benefitTime':
        return 'universal_activityData_benefitime';
      case 'pai':
        return 'PAI';
      case 'calories':
        return 'universal_userProfile_calories';
    }

  }

}