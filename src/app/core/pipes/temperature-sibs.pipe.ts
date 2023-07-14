import { Pipe, PipeTransform } from '@angular/core';
import { DataUnitOption } from '../models/common';
import { tempTransfer } from '../utils';

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
    return tempTransfer(value, args);
  }
}
