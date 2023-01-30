import { Pipe, PipeTransform } from '@angular/core';
import { transformDistance } from '../utils/sports';
import { DataUnitType } from '../enums/common';

@Pipe({
  name: 'distanceSibs',
  standalone: true,
})
export class DistanceSibsPipe implements PipeTransform {
  /**
   * 依公英制及距離長度轉換距離單位。
   * @param value {number}-距離
   * @param args {{ unitType: DataUnitType; showUnit: boolean; convertKiloAlways?: boolean }}-{公英制, 是否顯示單位, 是否統一轉為公里/英哩}
   */
  transform(
    value: number,
    args: { unitType: DataUnitType; showUnit: boolean; convertKiloAlways?: boolean }
  ): string | number {
    if (value === undefined) return value;
    const { unitType, showUnit, convertKiloAlways } = args;
    const { value: distance, unit: dataUnit } = transformDistance(
      value,
      unitType,
      convertKiloAlways
    );
    return showUnit || showUnit === undefined ? `${distance} ${dataUnit}` : `${distance}`;
  }
}
