import { Pipe, PipeTransform } from '@angular/core';
import { mi, ft } from '../models/bs-constant';

@Pipe({name: 'distanceSibs'})
export class DistanceSibsPipe implements PipeTransform {

  /**
   * 依公英制及距離長度轉換距離單位。
   * @param value {number}-距離
   * @param args {number}-公英制
   * @author kidin-1100106
   */
  transform(value: number, args: number): string {
    const unitType = args;
    let finalValue: number,
        unit: string;
    if (unitType === 0) {

      if (value >= 1000) {
        finalValue = +(value / 1000).toFixed(2);
        unit = 'km';
      } else {
        finalValue = value;
        unit = 'm';
      }
      
    } else {

      const bsValue = value / ft;
      if (bsValue >= 1000) {
        finalValue = +((value / mi) / 1000).toFixed(2);
        unit = 'mi';
      } else {
        finalValue = +bsValue.toFixed(2);
        unit = 'ft';
      }

    }
    
    return `${finalValue} ${unit}`;
  }

}
