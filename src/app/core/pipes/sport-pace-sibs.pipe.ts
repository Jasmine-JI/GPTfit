import { NgModule, Pipe, PipeTransform } from '@angular/core';
import { speedToPace } from '../../shared/utils/sports';

@Pipe({ name: 'sportPaceSibs' })
export class SportPaceSibsPipe implements PipeTransform {
  /**
   * 根據運動類型將速度轉成配速(若為bs英制則公里配速轉英哩配速)
   * @param value {number}-速度
   * @param args {number[]}-[運動類別, 公英制, 是否顯示單位(0. 是, 1. 否)]
   * @author kidin-1100106
   */
  transform(value: number, args: number[]): string | number {
    const [sportType, unit, showUnit] = args;
    const { value: pace, unit: paceUnit } = speedToPace(value, sportType, unit);
    return +showUnit === 0 ? `${pace} ${paceUnit}` : pace;
  }
}
@NgModule({
  declarations: [SportPaceSibsPipe],
  exports: [SportPaceSibsPipe],
})
export class SportPaceSibsModule {}
