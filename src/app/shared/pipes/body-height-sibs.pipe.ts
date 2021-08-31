import { Pipe, PipeTransform } from '@angular/core';
import { ft } from '../models/bs-constant';

@Pipe({name: 'bodyHeightSibs'})
export class BodyHeightSibsPipe implements PipeTransform {

  /**
   * 依公英制轉換身高單位。
   * @param value {number}-身高(cm)
   * @param args {[number, boolean]}-[公英制, 是否顯示單位]
   * @return {string}-長度單位
   * @author kidin-1100106
   */
  transform(value: number, args: [number, boolean]): string {
    const [unitType, showUnit] = [...args];
    let finalValue: number,
        unit: string;
    if (unitType === 0) {
      finalValue = parseFloat(value.toFixed(1));;
      unit = 'cm';
    } else {
      finalValue = parseFloat(((value / 100) / ft).toFixed(2));
      unit = 'ft';
    }
    
    return showUnit || showUnit === undefined ? `${finalValue} ${unit}` : `${finalValue}`;
  }

}
