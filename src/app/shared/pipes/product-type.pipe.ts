import { Pipe, PipeTransform } from '@angular/core';


@Pipe({name: 'productType'})
export class ProductTypePipe implements PipeTransform {
  /**
   * 根據裝置類型回傳對應多國語系的鍵
   * @param value {string | number}-裝置類別名稱或代號
   * @returns {string}-翻譯的鍵
   */
  transform(value: string | number): string {
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
