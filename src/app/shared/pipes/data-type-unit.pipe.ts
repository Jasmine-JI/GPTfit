import { Pipe, PipeTransform } from '@angular/core';
import { Unit } from '../enum/value-conversion';
import { SportType } from '../enum/sports';

@Pipe({name: 'dataTypeUnit'})
export class DataTypeUnitPipe implements PipeTransform {

  /**
   * 根據運動資料數據類別及公英制回傳相對應的單位
   * @param value {string}-運動資料數據類別
   * @param args {Array<number>}-[運動類別, 公制/英制]
   * @returns {any}-單位
   * @author kidin
   */
  transform(value: string, args: number[] = []): any {
    const [sportType, userUnit] = [...args];
    switch (value) {
      case 'hr':
        return 'bpm';
      case 'speed':
        return userUnit === Unit.metric ? 'km/h' : 'mi/h';
      case 'pace':
        switch (sportType) {
          case SportType.run:
            return userUnit === Unit.metric ? 't/km' : 't/mi';
          case SportType.swim:
            return 't/100m';
          case SportType.row:
            return 't/500m';
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
        }

      case 'power':
        return 'w';
      case 'temperature':
        return userUnit === Unit.metric ? '°C' : '°F';
      case 'altitude':
        return userUnit === Unit.metric ? 'm' : 'ft';;
      case 'gforceX':
      case 'gforceY':
      case 'gforceZ':
      case 'xMoveGForce':
      case 'yMoveGForce':
      case 'zMoveGForce':
        return 'g';
      case 'bodyHeight':
        return userUnit === Unit.metric ? 'cm' : 'inch';
      case 'bodyWeight':
        return userUnit === Unit.metric ? 'kg' : 'lb';
      case 'wheelSize':
        return userUnit === Unit.metric ? 'mm' : 'inch';
      case 'stepLength':
        return userUnit === Unit.metric ? 'cm' : 'inch';
      case 'targetDistance':
        return userUnit === Unit.metric ? 'm' : 'ft';
      default:
        return '';
    }

  }

}