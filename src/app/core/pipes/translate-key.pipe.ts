import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'translateKey',
  standalone: true,
})
export class TranslateKeyPipe implements PipeTransform {
  constructor() {}

  /**
   * 根據數據類別回覆對應的多國語系鍵名
   * @param name {TargetField}-數據類別
   * @return {string}-多國語系鍵名
   */
  transform(name: string): string {
    switch (name) {
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
      case 'avgHeartRate':
        return 'universal_activityData_avgHr';
      default:
        return name;
    }
  }
}
