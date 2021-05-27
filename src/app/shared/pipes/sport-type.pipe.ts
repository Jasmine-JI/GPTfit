import { Pipe, PipeTransform } from '@angular/core';
import { SportCode } from '../models/report-condition';

/**
 * 根據運動類別回傳對應多國語系的鍵。
 */
@Pipe({name: 'sportType'})
export class SportTypePipe implements PipeTransform {
  transform(value: string | number, args: string[]): any {
    switch (+value) {
      case SportCode.run:
        return 'universal_activityData_run';
      case SportCode.cycle:
        return 'universal_activityData_cycle';
      case SportCode.weightTrain:
        return 'universal_activityData_weightTraining';
      case SportCode.swim:
        return 'universal_activityData_swin';
      case SportCode.aerobic:
        return 'universal_activityData_aerobic';
      case SportCode.row:
        return 'universal_sportsName_boating';
      case SportCode.ball:
        return 'universal_activityData_ballSports';
      case SportCode.all:
        return 'universal_adjective_all';
      default:
        return 'universal_userAccount_otherTypes';
    }

  }
  
}
