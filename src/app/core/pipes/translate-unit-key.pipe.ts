import { Pipe, PipeTransform, NgModule } from '@angular/core';

@Pipe({ name: 'translateUnitKey' })
export class TranslateUnitKeyPipe implements PipeTransform {
  constructor() {}

  /**
   * 根據數據類別回覆單位的翻譯鍵名
   * @param value {string}-運動目標條件項目
   * @return {string}-單位的多國語系鍵名
   */
  transform(value: string): string {
    switch (value) {
      case 'totalActivities':
        return 'universal_unit_times';
      case 'totalTime':
      case 'benefitTime':
        return 'universal_unit_min';
      case 'calories':
        return 'universal_unit_calories';
      case 'avgHeartRate':
        return 'universal_unit_bpm';
      default:
        return '';
    }
  }
}

@NgModule({
  declarations: [TranslateUnitKeyPipe],
  exports: [TranslateUnitKeyPipe],
})
export class TranslateUnitKeyModule {}
