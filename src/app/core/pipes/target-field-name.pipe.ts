import { Pipe, PipeTransform } from '@angular/core';
import { TargetField } from '../models/api/api-common/sport-target.model';

@Pipe({
  name: 'targetFieldName',
  standalone: true,
})
export class TargetFieldNamePipe implements PipeTransform {
  constructor() {}

  /**
   * 根據運動目標條件項目或圖表回覆對應的多國語系鍵名
   * @param value {TargetField}-運動目標條件項目
   * @return {string}-多國語系鍵名
   */
  transform(value: TargetField | string): string {
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
      case 'achievementRate':
        return 'universal_lifeTracking_achievementRate';
      case 'distance':
        return 'universal_activityData_totalDistance';
      case 'totalFeedbackEnergy':
        return 'universal_activityData_totalEnergyGen';
      default:
        return value;
    }
  }
}
