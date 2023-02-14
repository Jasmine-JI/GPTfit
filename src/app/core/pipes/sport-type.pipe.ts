import { Pipe, PipeTransform } from '@angular/core';
import { SportType } from '../../shared/enum/sports';

@Pipe({
  name: 'sportType',
  standalone: true,
})
export class SportTypePipe implements PipeTransform {
  /**
   * 根據運動類別回傳對應多國語系的鍵
   * @param value {string | number}-運動類型
   * @return {string}-多國語系的鍵
   */
  transform(value: string | number): string {
    switch (+value) {
      case SportType.run:
        return 'universal_activityData_run';
      case SportType.cycle:
        return 'universal_activityData_cycle';
      case SportType.weightTrain:
        return 'universal_activityData_weightTraining';
      case SportType.swim:
        return 'universal_activityData_swin';
      case SportType.aerobic:
        return 'universal_activityData_aerobic';
      case SportType.row:
        return 'universal_sportsName_boating';
      case SportType.ball:
        return 'universal_activityData_ballSports';
      case SportType.all:
        return 'universal_adjective_all';
      case SportType.complex:
        return 'universal_activityData_complex';
      case SportType.rest:
        return 'universal_activityData_restSection';
      default:
        return 'universal_userAccount_otherTypes';
    }
  }
}