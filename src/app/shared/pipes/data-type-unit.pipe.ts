import { Pipe, PipeTransform } from '@angular/core';
import { unit } from '../models/bs-constant';
import { SportCode } from '../models/report-condition';

@Pipe({name: 'dataTypeUnit'})
export class DataTypeUnitPipe implements PipeTransform {

  /**
   * 根據運動資料數據類別及公英制回傳相對應的單位
   * @param value {string}-運動資料數據類別
   * @param args {Array<number>}-[運動類別, 公制/英制]
   * @returns {any}-單位
   * @author kidin
   */
  transform(value: string, args: number[]): any {
    const [sportType, userUnit] = [...args];
    switch (value) {
      case 'hr':
        return 'bpm';
      case 'speed':
        return userUnit === unit.metric ? 'km/h' : 'mi/h';
      case 'pace':
        switch (sportType) {
          case SportCode.run:
            return userUnit === unit.metric ? 't/km' : 't/mi';
          case SportCode.swim:
            return 't/100m';
          case SportCode.row:
            return 't/500m';
        }

      case 'cadence':
        switch (sportType) {
          case SportCode.run:
          case SportCode.weightTrain:
          case SportCode.swim:
            return 'spm';
          case SportCode.cycle:
          case SportCode.row:
            return 'rpm';
        }

      case 'power':
        return 'w';
      case 'temperature':
        return userUnit === unit.metric ? '°C' : '°F';
      case 'altitude':
        return userUnit === unit.metric ? 'm' : 'ft';;
      case 'gforceX':
      case 'gforceY':
      case 'gforceZ':
      case 'xMoveGForce':
      case 'yMoveGForce':
      case 'zMoveGForce':
        return 'g';
      default:
        return '';
    }

  }

}