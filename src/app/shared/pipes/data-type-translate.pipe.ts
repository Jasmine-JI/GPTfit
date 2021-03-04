import { Pipe, PipeTransform } from '@angular/core';

/**
 * 將運動資料類別轉為多國語系的鍵
 * @author kidin-1100120
 */
@Pipe({name: 'dataTypeTranslate'})
export class DataTypeTranslatePipe implements PipeTransform {
  transform(value: string, args: number[]): any {
    const sportType = args[0],
          unit = args[1];

    switch (value) {
      case 'hr':
        return 'universal_activityData_hr';
      case 'speed':
        return 'universal_activityData_speedPerHour';
      case 'pace':

        switch (sportType) {
          case 1:
            return unit === 0 ? 'universal_activityData_kilometerPace' : 'universal_activityData_milePace';
          case 4:
            return 'universal_activityData_100mPace';
          case 6:
            return 'universal_activityData_500mPace';
        }

      case 'cadence':
        
        switch (sportType) {
          case 1:
            return 'universal_activityData_stepCadence';
          case 2:
            return 'universal_activityData_CyclingCadence';
          case 3:
            return 'universal_activityData_repeatTempo';
          case 4:
            return 'universal_activityData_swimCadence';
          case 6:
            return 'universal_activityData_rowCadence';
        }

      case 'power':
        return 'universal_activityData_power';
      case 'temperature':
        return 'universal_activityData_temperature';
      case 'altitude':
        return 'universal_activityData_altitude';
      case 'gforce':
        return 'universal_unit_gforce';
      case 'gforceX':
        return 'universal_unit_gforceX';
      case 'gforceY':
        return 'universal_unit_gforceY';
      case 'gforceZ':
        return 'universal_unit_gforceZ';
      default:
        return 'universal_vocabulary_other';
    }

  }

}