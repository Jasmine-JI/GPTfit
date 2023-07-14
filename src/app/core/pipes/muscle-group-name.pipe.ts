import { Pipe, PipeTransform } from '@angular/core';
import { MuscleGroup } from '../enums/sports';

@Pipe({
  name: 'muscleGroupName',
  standalone: true,
})
export class MuscleGroupNamePipe implements PipeTransform {
  /**
   * 將肌肉代碼轉為多國語系的鍵
   * @param value {string | number}-肌肉代碼
   * @returns {string}-翻譯後的字詞
   */
  transform(value: string | number): string {
    switch (+value) {
      case MuscleGroup.armMuscle:
        return 'universal_muscleName_armMuscles';
      case MuscleGroup.pectoralsMuscle:
        return 'universal_muscleName_pectoralsMuscle';
      case MuscleGroup.shoulderMuscle:
        return 'universal_muscleName_shoulderMuscle';
      case MuscleGroup.backMuscle:
        return 'universal_muscleName_backMuscle';
      case MuscleGroup.abdominalMuscle:
        return 'universal_muscleName_abdominalMuscle';
      case MuscleGroup.legMuscle:
        return 'universal_muscleName_legMuscle';
      default:
        return 'universal_status_noData';
    }
  }
}
