import { Pipe, PipeTransform } from '@angular/core';
import { DataUnitType } from '../enums/common';
import { SportType } from '../enums/sports';

@Pipe({
  name: 'dataTypeTranslate',
  standalone: true,
})
export class DataTypeTranslatePipe implements PipeTransform {
  /**
   * 將運動資料類別轉為多國語系的鍵
   * @param value {string}-app id
   * @param args {Array<number>}-[運動類別, 公制/英制]
   * @returns {any}-多國語系的鍵
   */
  transform(
    value: string,
    args = { sportsType: SportType.all, unitType: DataUnitType.metric }
  ): string {
    const { sportsType, unitType } = args;
    switch (value) {
      case 'hr':
        return 'universal_activityData_hr';
      case 'speed':
      case 'pace':
        switch (sportsType) {
          case SportType.run:
            return unitType === DataUnitType.metric
              ? 'universal_activityData_kilometerPace'
              : 'universal_activityData_milePace';
          case SportType.cycle:
            return 'universal_activityData_speedPerHour';
          case SportType.swim:
            return 'universal_activityData_100mPace';
          case SportType.row:
            return 'universal_activityData_500mPace';
          default:
            return 'universal_activityData_speed';
        }
      case 'cadence':
        switch (sportsType) {
          case SportType.run:
            return 'universal_activityData_stepCadence';
          case SportType.cycle:
            return 'universal_activityData_CyclingCadence';
          case SportType.weightTrain:
            return 'universal_activityData_repeatTempo';
          case SportType.swim:
            return 'universal_activityData_swimCadence';
          case SportType.row:
            return 'universal_activityData_rowCadence';
          default:
            return 'universal_activityData_combinedFrequency';
        }
      case 'power':
        return 'universal_activityData_power';
      case 'swolf':
        return 'universal_activityData_swolf';
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
      case 'totalTime':
        switch (sportsType) {
          case SportType.weightTrain:
            return 'universal_activityData_activityTime';
          default:
            return 'universal_activityData_totalTime';
        }

      case 'time':
        return 'universal_activityData_time';
      case 'stroke':
        return 'universal_activityData_numberOf';
      case 'calories':
        return 'universal_userProfile_calories';
      case 'distance':
        return 'universal_activityData_distance';
      case 'xMoveGForce':
        return 'universal_activityData_leftRighMovement';
      case 'yMoveGForce':
        return 'universal_activityData_accelerateShock';
      case 'zMoveGForce':
        return 'universal_activityData_jumpLanding';
      case 'planeGForce':
      case 'planeMaxGForce':
        return 'universal_activityData_planarAcceleration';
      case 'swingSpeed':
        return 'universal_activityData_swingSpeed';
      case 'swingRatio':
        return 'universal_activityData_swingTypeRatio';
      case 'fitTime':
        return 'universal_userProfile_fitTime';
      case 'feedbackWatt':
        return 'universal_activityData_limit_genPower';
      default:
        return 'universal_vocabulary_other';
    }
  }
}
