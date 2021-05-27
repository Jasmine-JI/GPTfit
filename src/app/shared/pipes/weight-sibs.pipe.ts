import { Pipe, PipeTransform } from '@angular/core';
import { lb } from '../models/bs-constant';

@Pipe({name: 'weightSibs'})
export class WeightSibsPipe implements PipeTransform {

  /**
   * 依公英制轉換重量單位。
   * @param value {number}-重量
   * @param args {number[]}-[公英制, 是否回傳單位（0. 是, 1. 否）]
   * @author kidin-1100106
   */
  transform(value: number, args: number[]): string {
    const unitType = args[0];
    let finalValue: number,
        unit: string;
    if (unitType === 0) {
      finalValue = value || 0;
      unit = 'kg';
    } else {
      finalValue = +(value / lb) || 0;
      unit = 'lb';
    }
    
    const fixedValue = parseFloat(finalValue.toFixed(1));
    return !args[1] || args[1] === 0 ? `${fixedValue} ${unit}` : `${fixedValue}`;
  }

}
