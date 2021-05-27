import { Pipe, PipeTransform } from '@angular/core';
import { mi } from '../models/bs-constant';

@Pipe({name: 'speedSibs'})
export class SpeedSibsPipe implements PipeTransform {

  /**
   * 若為英制，則將速度轉為英哩/小時
   * @param value {number}-速度
   * @param args {number | Array<number>}-公英制或[公英制, 是否顯示單位]
   * @author kidin-1100108
   */
  transform(value: number, args: number | Array<number>): string {
    let unitType: number,
        showUnit = 0;
    if (Array.isArray(args)) {
      [unitType, showUnit] = [...args];
    } else {
      unitType = args;
    }

    if (unitType === 0) {
      const finalValue = +value.toFixed(1);
      return showUnit === 0 ? `${finalValue} km/h` : `${finalValue}`;
    } else {
      const finalValue = (value / mi).toFixed(1);
      return showUnit === 0 ? `${finalValue} mi/h` : `${finalValue}`;
    }
    
  }

}
