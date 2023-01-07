import { Pipe, PipeTransform } from '@angular/core';
import { lb } from '../../shared/models/bs-constant';
import { DataUnitType } from '../enums/common';

@Pipe({
  name: 'weightSibs',
  standalone: true,
})
export class WeightSibsPipe implements PipeTransform {
  /**
   * 依公英制轉換重量單位。
   * @param value {number}-重量
   * @param args {number[]}-[公英制, 是否回傳單位（0. 是, 1. 否）]
   */
  transform(value: number, args: number[] = [DataUnitType.metric, 1]): string {
    const [unitType, showUnit] = args;
    let finalValue: number, unit: string;
    if (unitType === DataUnitType.metric) {
      finalValue = value || 0;
      unit = 'kg';
    } else {
      finalValue = +(value / lb) || 0;
      unit = 'lb';
    }

    const fixedValue = parseFloat(finalValue.toFixed(0));
    return showUnit === 0 ? `${fixedValue} ${unit}` : `${fixedValue}`;
  }
}
