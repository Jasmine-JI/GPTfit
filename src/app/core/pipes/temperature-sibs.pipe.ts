import { Pipe, PipeTransform } from '@angular/core';
import { DataUnitOption } from '../models/common';
import { DataUnitType } from '../enums/common';

@Pipe({
  name: 'temperatureSibs',
  standalone: true,
})
export class TemperatureSibsPipe implements PipeTransform {
  /**
   * 若為英制，則將攝氏溫度轉華氏溫度
   * @param value 溫度
   * @param args.unitType 單位類別(公英制)
   * @param args.showUnit 是否顯示單位
   */
  transform(value: number, args: DataUnitOption): number | string {
    const checkValue = value ? value : 0;
    const { unitType, showUnit } = args;
    if (unitType === DataUnitType.metric) {
      const resultValue = checkValue.toFixed(1);
      return showUnit ?? true ? `${resultValue} °C` : +`${resultValue}`;
    } else {
      const resultValue = (checkValue * (9 / 5) + 32).toFixed(1);
      return showUnit ?? true ? `${resultValue} °F` : +`${resultValue}`;
    }
  }
}
