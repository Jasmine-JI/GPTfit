import { Pipe, PipeTransform } from '@angular/core';

/**
 * 根據運動類別回傳對應多國語系的鍵。
 */
@Pipe({name: 'sportType'})
export class SportTypePipe implements PipeTransform {
  transform(value: string | number, args: string[]): any {
    switch (+value) {
      case 1:
        return 'universal_activityData_run';
      case 2:
        return 'universal_activityData_cycle';
      case 3:
        return 'universal_activityData_weightTraining';
      case 4:
        return 'universal_activityData_swin';
      case 5:
        return 'universal_activityData_aerobic';
      case 6:
        return 'universal_sportsName_boating';
      case 7:
        return 'universal_activityData_ballSports';
      case 99:
        return 'universal_adjective_all';
      default:
        return 'universal_userAccount_otherTypes';
    }

  }
  
}
