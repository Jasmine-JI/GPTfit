import { Pipe, PipeTransform } from '@angular/core';

@Pipe({name: 'productType'})
export class ProductTypePipe implements PipeTransform {
  transform(value: string, args: string[]): any {
    if (value === '1') {
      return 'SH.ProductType.wearable';
    } else if (value === '2') {
      return 'SH.ProductType.treadmill';
    } else if (value === 'wearable') {
      return 'SH.ProductType.wearable';
    } else {
      return 'SH.ProductType.treadmill';
    }
  }
}
