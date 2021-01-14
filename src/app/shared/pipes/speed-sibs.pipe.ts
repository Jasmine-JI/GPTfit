import { Pipe, PipeTransform } from '@angular/core';
import { mi } from '../models/bs-constant';

@Pipe({name: 'speedSibs'})
export class SpeedSibsPipe implements PipeTransform {

  /**
   * 若為英制，則將速度轉為英哩/小時
   * @param value {number}-速度
   * @param args {number}-公英制
   * @author kidin-1100108
   */
  transform(value: number, args: number): string {
    const unitType = args;

    if (unitType === 0) {
      return `${value.toFixed(1)} km/hr`;
    } else {
      return `${(value / mi).toFixed(1)} mi/hr`;
    }
    
  }

}
