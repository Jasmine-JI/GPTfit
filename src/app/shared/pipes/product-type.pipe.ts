import { Pipe, PipeTransform } from '@angular/core';

@Pipe({name: 'productType'})
export class ProductTypePipe implements PipeTransform {
  transform(value: string, args: string[]): any {
    if (value === '1' || value === 'wearable') {
      return 'SH.ProductType.wearable';
    } else if (value === '2' || value === 'treadmill') {
      return 'SH.ProductType.treadmill';
    } else if (value === 'spinBike' || value === '3') {
      return 'SH.ProductType.spinBike';
    } else if (value === 'rowMachine' || value === '4') {
      return 'SH.ProductType.rowMachine';
    } else {
      return 'unknown type';
    }
  }
}
