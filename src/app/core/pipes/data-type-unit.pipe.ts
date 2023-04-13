import { Pipe, PipeTransform } from '@angular/core';
import { DataUnitType } from '../enums/common';
import { SportType } from '../enums/sports';

@Pipe({
  name: 'dataTypeUnit',
  standalone: true,
})
export class DataTypeUnitPipe implements PipeTransform {
  /**
   * 根據運動資料數據類別及公英制回傳相對應的單位
   * @param value {string}-運動資料數據類別
   * @param args {any}-[運動類別, 公制/英制]
   * @returns {any}-單位
   */
  transform(value: string, args: any = [SportType.all, DataUnitType.metric]): any {
    let sportType: SportType;
    let userUnit: DataUnitType;
    if (!Array.isArray(args)) {
      sportType = args.sportType || SportType.all;
      userUnit = args.userUnit || DataUnitType.metric;
    } else {
      [sportType, userUnit] = args;
    }

    switch (value) {
      case 'hr':
        return 'bpm';
      case 'speed':
        switch (sportType) {
          case SportType.run:
          case SportType.cycle:
            return userUnit === DataUnitType.metric ? 'km/h' : 'mi/h';
          case SportType.swim:
            return 'min/100m';
          case SportType.row:
            return 'min/500m';
          default:
            return '';
        }
      case 'pace':
        switch (sportType) {
          case SportType.run:
            return userUnit === DataUnitType.metric ? 'min/km' : 'min/mi';
          case SportType.cycle:
            return userUnit === DataUnitType.metric ? 'km/h' : 'mi/h';
          case SportType.swim:
            return 'min/100m';
          case SportType.row:
            return 'min/500m';
          default:
            return '';
        }
      case 'cadence':
        switch (sportType) {
          case SportType.run:
          case SportType.weightTrain:
          case SportType.swim:
            return 'spm';
          case SportType.cycle:
          case SportType.row:
            return 'rpm';
          default:
            return '';
        }
      case 'power':
        return 'w';
      case 'temperature':
        return userUnit === DataUnitType.metric ? '°C' : '°F';
      case 'altitude':
        return userUnit === DataUnitType.metric ? 'm' : 'ft';
      case 'gforceX':
      case 'gforceY':
      case 'gforceZ':
      case 'xMoveGForce':
      case 'yMoveGForce':
      case 'zMoveGForce':
        return 'g';
      case 'bodyHeight':
        return userUnit === DataUnitType.metric ? 'cm' : 'inch';
      case 'bodyWeight':
        return userUnit === DataUnitType.metric ? 'kg' : 'lb';
      case 'wheelSize':
        return userUnit === DataUnitType.metric ? 'mm' : 'inch';
      case 'stepLength':
        return userUnit === DataUnitType.metric ? 'cm' : 'inch';
      case 'targetDistance':
        return userUnit === DataUnitType.metric ? 'm' : 'ft';
      case 'feedbackWatt':
        return 'w';
      case 'distanceKilo':
        return userUnit === DataUnitType.metric ? 'km' : 'mi';
      default:
        return '';
    }
  }
}
