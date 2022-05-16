import { Pipe, PipeTransform } from '@angular/core';
import { mi, ft } from '../models/bs-constant';

@Pipe({name: 'distanceSibs'})
export class DistanceSibsPipe implements PipeTransform {

  /**
   * 依公英制及距離長度轉換距離單位。
   * @param value {number}-距離
   * @param args {[number, boolean]}-[公英制, 是否顯示單位]
   * @return {string}-長度單位
   * @author kidin-1100106
   */
  transform(value: number, args: [number, boolean]): string | number {
    if (value === undefined) return value;
    const [unitType, showUnit] = [...args];
    let finalValue: number,
        unit: string;
    if (unitType === 0) {

      if (value >= 1000) {
        finalValue = +(value / 1000);
        unit = 'km';
      } else {
        finalValue = value;
        unit = 'm';
      }
      
    } else {

      const bsValue = value / ft;
      if (bsValue >= 1000) {
        finalValue = +((value / mi) / 1000);
        unit = 'mi';
      } else {
        finalValue = +bsValue;
        unit = 'ft';
      }

    }
    
    const fixedValue = +finalValue.toFixed(2);
    return showUnit || showUnit === undefined ? `${fixedValue} ${unit}` : `${fixedValue}`;
  }

}
