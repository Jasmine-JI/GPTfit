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
  transform(
    value: string,
    args = { sportsType: SportType.all, unitType: DataUnitType.metric }
  ): string {
    const { sportsType, unitType } = args;
    switch (value) {
      case 'hr':
        return 'bpm';
      case 'speed':
        switch (sportsType) {
          case SportType.run:
          case SportType.cycle:
            return unitType === DataUnitType.metric ? 'kph' : 'mph';
          case SportType.swim:
            return 'min/100m';
          case SportType.row:
            return 'min/500m';
          default:
            return '';
        }
      case 'pace':
        switch (sportsType) {
          case SportType.run:
            return unitType === DataUnitType.metric ? 'min/km' : 'min/mi';
          case SportType.cycle:
            return unitType === DataUnitType.metric ? 'kph' : 'mph';
          case SportType.swim:
            return 'min/100m';
          case SportType.row:
            return 'min/500m';
          default:
            return '';
        }
      case 'cadence':
        switch (sportsType) {
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
        return unitType === DataUnitType.metric ? '°C' : '°F';
      case 'altitude':
        return unitType === DataUnitType.metric ? 'm' : 'ft';
      case 'gforceX':
      case 'gforceY':
      case 'gforceZ':
      case 'xMoveGForce':
      case 'yMoveGForce':
      case 'zMoveGForce':
        return 'g';
      case 'bodyHeight':
        return unitType === DataUnitType.metric ? 'cm' : 'inch';
      case 'bodyWeight':
        return unitType === DataUnitType.metric ? 'kg' : 'lb';
      case 'wheelSize':
        return unitType === DataUnitType.metric ? 'mm' : 'inch';
      case 'stepLength':
        return unitType === DataUnitType.metric ? 'cm' : 'inch';
      case 'targetDistance':
        return unitType === DataUnitType.metric ? 'm' : 'ft';
      case 'feedbackWatt':
        return 'w';
      case 'distanceKilo':
        return unitType === DataUnitType.metric ? 'km' : 'mi';
      default:
        return '';
    }
  }
}
