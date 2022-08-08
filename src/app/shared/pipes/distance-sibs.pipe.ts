import { Pipe, PipeTransform } from '@angular/core';
import { transformDistance } from '../utils/sports';
import { Unit } from '../enum/value-conversion';

@Pipe({ name: 'distanceSibs' })
export class DistanceSibsPipe implements PipeTransform {
  /**
   * 依公英制及距離長度轉換距離單位。
   * @param value {number}-距離
   * @param args {[Unit, boolean]}-[公英制, 是否顯示單位]
   * @return {string}-長度單位
   * @author kidin-1100106
   */
  transform(value: number, args: [Unit, boolean]): string | number {
    if (value === undefined) return value;
    const [unitType, showUnit] = [...args];
    const { value: distance, unit: dataUnit } = transformDistance(value, unitType);
    return showUnit || showUnit === undefined ? `${distance} ${dataUnit}` : `${distance}`;
  }
}
