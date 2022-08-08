import { Pipe, PipeTransform } from '@angular/core';
import { ProductShipped } from '../models/activity-content';

/**
 * 將出貨狀態代碼轉為多國語系翻譯的key
 * @author kidin-1101125
 */
@Pipe({ name: 'shippedStatus' })
export class ShippedStatusPipe implements PipeTransform {
  transform(value: ProductShipped): any {
    switch (value) {
      case ProductShipped.unShip:
        return 'universal_vocabulary_unshipped';
      case ProductShipped.shipped:
        return 'universal_vocabulary_delivered';
      case ProductShipped.returnGoods:
        return 'universal_vocabulary_returned';
      case ProductShipped.needNotShip:
        return 'universal_vocabulary_noShipping';
      case ProductShipped.closeCase:
        return 'universal_vocabulary_caseClosed';
    }
  }
}
