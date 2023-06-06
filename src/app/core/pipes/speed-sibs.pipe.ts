import { Pipe, PipeTransform } from '@angular/core';
import { mi } from '../models/const/bs-constant.model';
import { DataUnitType } from '../enums/common';
import { DataUnitOption } from '../models/common';

@Pipe({
  name: 'speedSibs',
  standalone: true,
})
export class SpeedSibsPipe implements PipeTransform {
  /**
   * 若為英制，則將速度轉為英哩/小時
   * @param value 速度
   * @param args.unitType 單位類別(公英制)
   * @param args.showUnit 是否顯示單位
   */
  transform(value: number, args: DataUnitOption): string {
    const { unitType, showUnit } = args;
    if (unitType === DataUnitType.imperial) {
      const finalValue = (value / mi).toFixed(1);
      return showUnit ? `${finalValue} mph` : `${finalValue}`;
    } else {
      const finalValue = +value.toFixed(1);
      return showUnit ? `${finalValue} kph` : `${finalValue}`;
    }
  }
}
