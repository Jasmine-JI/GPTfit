import { Pipe, PipeTransform, NgModule } from '@angular/core';
import { BenefitTimeStartZone } from '../enums/common';

@Pipe({ name: 'referenceHrZone' })
export class ReferenceHrZonePipe implements PipeTransform {
  constructor() {}

  /**
   * 根據參考的心率區間範圍回覆對應的多國語系鍵名
   * @param zone {BenefitTimeStartZone}-心率區間範圍
   */
  transform(zone: BenefitTimeStartZone): string {
    switch (zone) {
      case BenefitTimeStartZone.zone1:
        return 'universal_system_aboveZone1';
      case BenefitTimeStartZone.zone3:
        return 'universal_system_aboveZone3';
      case BenefitTimeStartZone.zone4:
        return 'universal_system_aboveZone4';
      default:
        return 'universal_system_aboveZone2';
    }
  }
}

@NgModule({
  declarations: [ReferenceHrZonePipe],
  exports: [ReferenceHrZonePipe],
})
export class ReferenceHrZoneModule {}
