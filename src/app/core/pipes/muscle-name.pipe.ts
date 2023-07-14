import { Pipe, PipeTransform } from '@angular/core';
import { MuscleCode } from '../enums/sports';

@Pipe({
  name: 'muscleName',
  standalone: true,
})
export class MuscleNamePipe implements PipeTransform {
  /**
   * 將肌肉代碼轉為多國語系的鍵
   * @param value {string | number}-肌肉代碼
   * @returns {string}-翻譯後的字詞
   */
  transform(value: string | number): string {
    switch (+value) {
      case MuscleCode.bicepsInside:
        return 'universal_muscleName_bicepsInside';
      case MuscleCode.triceps:
        return 'universal_muscleName_triceps';
      case MuscleCode.pectoralsMuscle:
        return 'universal_muscleName_pectoralsMuscle';
      case MuscleCode.pectoralisUpper:
        return 'universal_muscleName_pectoralisUpper';
      case MuscleCode.pectoralisLower:
        return 'universal_muscleName_pectoralisLower';
      case MuscleCode.pectoralsInside:
        return 'universal_muscleName_pectoralsInside';
      case MuscleCode.pectoralsOutside:
        return 'universal_muscleName_pectoralsOutside';
      case MuscleCode.frontSerratus:
        return 'universal_muscleName_frontSerratus';
      case MuscleCode.shoulderMuscle:
        return 'universal_muscleName_shoulderMuscle';
      case MuscleCode.deltoidMuscle:
        return 'universal_muscleName_deltoidMuscle';
      case MuscleCode.deltoidAnterior:
        return 'universal_muscleName_deltoidAnterior';
      case MuscleCode.deltoidLateral:
        return 'universal_muscleName_deltoidLateral';
      case MuscleCode.deltoidPosterior:
        return 'universal_muscleName_deltoidPosterior';
      case MuscleCode.trapezius:
        return 'universal_muscleName_trapezius';
      case MuscleCode.backMuscle:
        return 'universal_muscleName_backMuscle';
      case MuscleCode.latissimusDorsi:
        return 'universal_muscleName_latissimusDorsi';
      case MuscleCode.erectorSpinae:
        return 'universal_muscleName_erectorSpinae';
      case MuscleCode.abdominalMuscle:
        return 'universal_muscleName_abdominalMuscle';
      case MuscleCode.rectusAbdominis:
        return 'universal_muscleName_rectusAbdominis';
      case MuscleCode.rectusAbdominisUpper:
        return 'universal_muscleName_rectusAbdominisUpper';
      case MuscleCode.rectusAbdominisLower:
        return 'universal_muscleName_rectusAbdominisLower';
      case MuscleCode.abdominisOblique:
        return 'universal_muscleName_abdominisOblique';
      case MuscleCode.legMuscle:
        return 'universal_muscleName_legMuscle';
      case MuscleCode.hipMuscle:
        return 'universal_muscleName_hipMuscle';
      case MuscleCode.quadricepsFemoris:
        return 'universal_muscleName_quadricepsFemoris';
      case MuscleCode.hamstrings:
        return 'universal_muscleName_hamstrings';
      case MuscleCode.ankleFlexor:
        return 'universal_muscleName_ankleFlexor';
      case MuscleCode.gastrocnemius:
        return 'universal_muscleName_gastrocnemius';
      case MuscleCode.wristFlexor:
        return 'universal_muscleName_wristFlexor';
      default:
        return 'universal_status_noData';
    }
  }
}
