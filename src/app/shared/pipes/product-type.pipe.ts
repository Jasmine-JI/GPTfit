import { Pipe, PipeTransform } from '@angular/core';

@Pipe({name: 'productType'})
export class ProductTypePipe implements PipeTransform {
  transform(value: string, args: string[]): any {
    if (value === '1' || value === 'wearable') {
      return 'universal_vocabulary_wearableDevice';
    } else if (value === '2' || value === 'treadmill') {
      return 'universal_vocabulary_treadmill';
    } else if (value === 'spinBike' || value === '3') {
      return 'universal_vocabulary_spinBike';
    } else if (value === 'rowMachine' || value === '4') {
      return 'universal_vocabulary_rowingMachine';
    } else if (value === 'sensor' || value === '5') {
      return 'universal_vocabulary_sensor';
    } else {
      return 'unknown type';
    }
  }
}
