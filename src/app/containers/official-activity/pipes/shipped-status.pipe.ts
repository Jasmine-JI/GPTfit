import { Pipe, PipeTransform } from '@angular/core';
import { ProductShipped } from '../models/activity-content';


/**
 * 將出貨狀態代碼轉為多國語系翻譯的key
 * @author kidin-1101125
 */
@Pipe({name: 'shippedStatus'})
export class ShippedStatusPipe implements PipeTransform {
  transform(value: ProductShipped): any {
    switch (value) {
      case ProductShipped.unShip:
        return '未出貨';
      case ProductShipped.shipped:
        return '已出貨';
      case ProductShipped.returnGoods:
        return '已退貨';
      case ProductShipped.needNotShip:
        return '不須出貨';
      case ProductShipped.closeCase:
        return '已結案';
    }

  }

}
