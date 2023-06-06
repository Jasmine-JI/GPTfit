import { Pipe, PipeTransform } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { MuscleGroup } from '../enums/sports';

@Pipe({
  name: 'muscleGroupName',
  standalone: true,
})
export class MuscleGroupNamePipe implements PipeTransform {
  constructor(public translateService: TranslateService) {}

  /**
   * 將肌肉代碼轉為多國語系的鍵
   * @param value {string | number}-肌肉代碼
   * @returns {string}-翻譯後的字詞
   */
  transform(value: string | number): string {
    switch (+value) {
      case MuscleGroup.armMuscle:
        return this.translateService.instant('universal_muscleName_armMuscles');
      case MuscleGroup.pectoralsMuscle:
        return this.translateService.instant('universal_muscleName_pectoralsMuscle');
      case MuscleGroup.shoulderMuscle:
        return this.translateService.instant('universal_muscleName_shoulderMuscle');
      case MuscleGroup.backMuscle:
        return this.translateService.instant('universal_muscleName_backMuscle');
      case MuscleGroup.abdominalMuscle:
        return this.translateService.instant('universal_muscleName_abdominalMuscle');
      case MuscleGroup.legMuscle:
        return this.translateService.instant('universal_muscleName_legMuscle');
      default:
        return this.translateService.instant('universal_status_noData');
    }
  }
}
