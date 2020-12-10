import { Pipe, PipeTransform } from '@angular/core';

/**
 * 根據裝置類型回傳對應多國語系的鍵
 */
@Pipe({name: 'productType'})
export class ProductTypePipe implements PipeTransform {
  transform(value: string | number, args: string[]): any {
    switch (value + '') {
      case '1':
      case 'wearable':
        return 'universal_vocabulary_wearableDevice';
      case '2':
      case 'treadmill':
        return 'universal_vocabulary_treadmill';
      case '3':
      case 'spinBike':
        return 'universal_vocabulary_spinBike';
      case '4':
      case 'rowMachine':
        return 'universal_vocabulary_rowingMachine';
      case '5':
      case 'sensor':
        return 'universal_vocabulary_sensor';
      default:
        return 'unknown type';
    }

  }

}
