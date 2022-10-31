import { Pipe, PipeTransform, NgModule } from '@angular/core';
import { Unit } from '../../shared/enum/value-conversion';
import { SportType } from '../enums/sports';

@Pipe({ name: 'speedPaceUnit' })
export class SpeedPaceUnitPipe implements PipeTransform {
  constructor() {}

  /**
   * 根據運動類別與使用者使用單位取得配速單位
   * @param unit {DateUnit}-數據類別
   * @return {string}-多國語系鍵名
   */
  transform(sportType: SportType, unit: Unit): string {
    const isMetric = unit === Unit.metric;
    switch (sportType) {
      case SportType.run:
        return isMetric ? 'min/km' : 'min/mi';
      case SportType.cycle:
        return isMetric ? 'km/hr' : 'mi/hr';
      case SportType.swim:
        return 'min/100m';
      case SportType.row:
        return 'min/500m';
      default:
        return '';
    }
  }
}
@NgModule({
  declarations: [SpeedPaceUnitPipe],
  exports: [SpeedPaceUnitPipe],
})
export class SpeedPaceUnitModule {}
