import { Pipe, PipeTransform } from '@angular/core';
import { transformDistance } from '../utils/sports';
import { DataUnitType } from '../enums/common';
import { DataUnitOption } from '../models/common';

@Pipe({
  name: 'distanceSibs',
  standalone: true,
})
export class DistanceSibsPipe implements PipeTransform {
  /**
   * 依公英制及距離長度轉換距離單位。
   * @param value 距離
   * @param args.unitType 單位類別(公英制)
   * @param args.showUnit 是否顯示單位
   * @param args.convertKiloAlways 是否總是轉成千單位
   */
  transform(value: number, args: DataUnitOption): string | number {
    if (value === undefined) return value;
    const { unitType, showUnit, convertKiloAlways } = args;
    const { value: distance, unit: dataUnit } = transformDistance(
      value,
      unitType as DataUnitType,
      convertKiloAlways
    );
    return showUnit ?? true ? `${distance} ${dataUnit}` : `${distance}`;
  }
}
