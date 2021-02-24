import { Pipe, PipeTransform } from '@angular/core';

/**
 * 根據運動資料類別及公英制回傳相對應的單位
 * @author kidin-1100121
 */
@Pipe({name: 'dataTypeUnit'})
export class DataTypeUnitPipe implements PipeTransform {
  transform(value: string, args: number[]): any {
    const sportType = args[0],
          unit = args[1];

    switch (value) {
      case 'hr':
        return 'bpm';
      case 'speed':
        return unit === 0 ? 'km/hr' : 'mi/hr';
      case 'pace':

        switch (sportType) {
          case 1:
            return unit === 0 ? 't/km' : 't/mi';
          case 4:
            return 't/100m';
          case 6:
            return 't/500m';
        }

      case 'cadence':
        
        switch (sportType) {
          case 1:
          case 3:
          case 4:
            return 'spm';
          case 2:
          case 6:
            return 'rpm';
        }

      case 'power':
        return 'w';
      case 'temperature':
        return unit === 0 ? '°C' : '°F';
      case 'altitude':
        return unit === 0 ? 'm' : 'ft';;
      case 'gforceX':
      case 'gforceY':
      case 'gforceZ':
        return 'g';
      default:
        return '';
    }

  }

}