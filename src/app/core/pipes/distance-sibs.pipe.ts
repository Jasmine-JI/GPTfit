import { Pipe, PipeTransform, NgModule } from '@angular/core';
import { transformDistance } from '../utils/sports';
import { Unit } from '../../shared/enum/value-conversion';

@Pipe({ name: 'distanceSibs' })
export class DistanceSibsPipe implements PipeTransform {
  /**
   * 依公英制及距離長度轉換距離單位。
   * @param value {number}-距離
   * @param args {[Unit, boolean, boolean | undefined]}-[公英制, 是否顯示單位, 是否統一轉為公里/英哩]
   * @return {string}-長度單位
   */
  transform(value: number, args: [Unit, boolean, boolean | undefined]): string | number {
    if (value === undefined) return value;
    const [unitType, showUnit, converseKiloAlways] = [...args];
    const { value: distance, unit: dataUnit } = transformDistance(
      value,
      unitType,
      converseKiloAlways
    );
    return showUnit || showUnit === undefined ? `${distance} ${dataUnit}` : `${distance}`;
  }
}
@NgModule({
  declarations: [DistanceSibsPipe],
  exports: [DistanceSibsPipe],
})
export class DistanceSibsModule {}
