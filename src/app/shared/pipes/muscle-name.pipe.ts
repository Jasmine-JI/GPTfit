import { Pipe, PipeTransform } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { MuscleCode } from '../enum/weight-train';

@Pipe({ name: 'muscleName' })
export class MuscleNamePipe implements PipeTransform {
  constructor(public translateService: TranslateService) {}

  /**
   * 將肌肉代碼轉為多國語系的鍵
   * @param value {string | number}-肌肉代碼
   * @returns {string}-翻譯後的字詞
   * @author kidin
   */
  transform(value: string | number): string {
    switch (+value) {
      case MuscleCode.bicepsInside:
        return this.translateService.instant('universal_muscleName_bicepsInside');
      case MuscleCode.triceps:
        return this.translateService.instant('universal_muscleName_triceps');
      case MuscleCode.pectoralsMuscle:
        return this.translateService.instant('universal_muscleName_pectoralsMuscle');
      case MuscleCode.pectoralisUpper:
        return this.translateService.instant('universal_muscleName_pectoralisUpper');
      case MuscleCode.pectoralisLower:
        return this.translateService.instant('universal_muscleName_pectoralisLower');
      case MuscleCode.pectoralsInside:
        return this.translateService.instant('universal_muscleName_pectoralsInside');
      case MuscleCode.pectoralsOutside:
        return this.translateService.instant('universal_muscleName_pectoralsOutside');
      case MuscleCode.frontSerratus:
        return this.translateService.instant('universal_muscleName_frontSerratus');
      case MuscleCode.shoulderMuscle:
        return this.translateService.instant('universal_muscleName_shoulderMuscle');
      case MuscleCode.deltoidMuscle:
        return this.translateService.instant('universal_muscleName_deltoidMuscle');
      case MuscleCode.deltoidAnterior:
        return this.translateService.instant('universal_muscleName_deltoidAnterior');
      case MuscleCode.deltoidLateral:
        return this.translateService.instant('universal_muscleName_deltoidLateral');
      case MuscleCode.deltoidPosterior:
        return this.translateService.instant('universal_muscleName_deltoidPosterior');
      case MuscleCode.trapezius:
        return this.translateService.instant('universal_muscleName_trapezius');
      case MuscleCode.backMuscle:
        return this.translateService.instant('universal_muscleName_backMuscle');
      case MuscleCode.latissimusDorsi:
        return this.translateService.instant('universal_muscleName_latissimusDorsi');
      case MuscleCode.erectorSpinae:
        return this.translateService.instant('universal_muscleName_erectorSpinae');
      case MuscleCode.abdominalMuscle:
        return this.translateService.instant('universal_muscleName_abdominalMuscle');
      case MuscleCode.rectusAbdominis:
        return this.translateService.instant('universal_muscleName_rectusAbdominis');
      case MuscleCode.rectusAbdominisUpper:
        return this.translateService.instant('universal_muscleName_rectusAbdominisUpper');
      case MuscleCode.rectusAbdominisLower:
        return this.translateService.instant('universal_muscleName_rectusAbdominisLower');
      case MuscleCode.abdominisOblique:
        return this.translateService.instant('universal_muscleName_abdominisOblique');
      case MuscleCode.legMuscle:
        return this.translateService.instant('universal_muscleName_legMuscle');
      case MuscleCode.hipMuscle:
        return this.translateService.instant('universal_muscleName_hipMuscle');
      case MuscleCode.quadricepsFemoris:
        return this.translateService.instant('universal_muscleName_quadricepsFemoris');
      case MuscleCode.hamstrings:
        return this.translateService.instant('universal_muscleName_hamstrings');
      case MuscleCode.ankleFlexor:
        return this.translateService.instant('universal_muscleName_ankleFlexor');
      case MuscleCode.gastrocnemius:
        return this.translateService.instant('universal_muscleName_gastrocnemius');
      case MuscleCode.wristFlexor:
        return this.translateService.instant('universal_muscleName_wristFlexor');
      default:
        return this.translateService.instant('universal_status_noData');
    }
  }
}
