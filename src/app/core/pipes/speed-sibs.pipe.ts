import { Pipe, PipeTransform } from '@angular/core';
import { mi } from '../../shared/models/bs-constant';
import { DataUnitType } from '../enums/common';

@Pipe({
  name: 'speedSibs',
  standalone: true,
})
export class SpeedSibsPipe implements PipeTransform {
  /**
   * 若為英制，則將速度轉為英哩/小時
   * @param value {number}-速度
   * @param args {{ unitType: DataUnitType; showUnit?: boolean; }}-{公英制, 是否顯示單位}
   */
  transform(value: number, args: { unitType: DataUnitType; showUnit?: boolean }): string {
    const { unitType, showUnit } = args;
    if (unitType === DataUnitType.imperial) {
      const finalValue = (value / mi).toFixed(1);
      return showUnit ? `${finalValue} mi/h` : `${finalValue}`;
    } else {
      const finalValue = +value.toFixed(1);
      return showUnit ? `${finalValue} km/h` : `${finalValue}`;
    }
  }
}
