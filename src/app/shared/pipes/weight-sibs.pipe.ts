import { Pipe, PipeTransform } from '@angular/core';
import { lb } from '../models/bs-constant';
import { Unit } from '../enum/value-conversion';

@Pipe({name: 'weightSibs'})
export class WeightSibsPipe implements PipeTransform {

  /**
   * 依公英制轉換重量單位。
   * @param value {number}-重量
   * @param args {number[]}-[公英制, 是否回傳單位（0. 是, 1. 否）]
   * @author kidin-1100106
   */
  transform(value: number, args: number[] = [Unit.metric, 1]): string {
    const [unitType, showUnit] = args;
    let finalValue: number,
        unit: string;
    if (unitType === Unit.metric) {
      finalValue = value || 0;
      unit = 'kg';
    } else {
      finalValue = +(value / lb) || 0;
      unit = 'lb';
    }
    
    const fixedValue = parseFloat(finalValue.toFixed(0));
    return !showUnit ? `${fixedValue} ${unit}` : `${fixedValue}`;
  }

}
