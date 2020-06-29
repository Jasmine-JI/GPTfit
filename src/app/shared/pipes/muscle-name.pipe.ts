import { Pipe, PipeTransform } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Pipe({name: 'muscleName'})
export class MuscleNamePipe implements PipeTransform {
  constructor(
    public translateService: TranslateService
  ) {
  }
  transform(value: string, args: string[]): any {
    switch (value) {
      case '16' :
        return this.translateService.instant('universal_muscleName_bicepsInside');
      case '32' :
        return this.translateService.instant('universal_muscleName_triceps');
      case '48' :
        return this.translateService.instant('universal_muscleName_pectoralsMuscle');
      case '49' :
        return this.translateService.instant('universal_muscleName_pectoralisUpper');
      case '50' :
        return this.translateService.instant('universal_muscleName_pectoralisLower');
      case '51' :
        return this.translateService.instant('universal_muscleName_pectoralsInside');
      case '52' :
        return this.translateService.instant('universal_muscleName_pectoralsOutside');
      case '53' :
        return this.translateService.instant('universal_muscleName_frontSerratus');
      case '64' :
        return this.translateService.instant('universal_muscleName_shoulderMuscle');
      case '65' :
        return this.translateService.instant('universal_muscleName_deltoidMuscle');
      case '66' :
        return this.translateService.instant('universal_muscleName_deltoidAnterior');
      case '67' :
        return this.translateService.instant('universal_muscleName_deltoidLateral');
      case '68' :
        return this.translateService.instant('universal_muscleName_deltoidPosterior');
      case '69' :
        return this.translateService.instant('universal_muscleName_trapezius');
      case '80' :
        return this.translateService.instant('universal_muscleName_backMuscle');
      case '81' :
        return this.translateService.instant('universal_muscleName_latissimusDorsi');
      case '82' :
        return this.translateService.instant('universal_muscleName_erectorSpinae');
      case '96' :
        return this.translateService.instant('universal_muscleName_abdominalMuscle');
      case '97' :
        return this.translateService.instant('universal_muscleName_rectusAbdominis');
      case '98' :
        return this.translateService.instant('universal_muscleName_rectusAbdominisUpper');
      case '99' :
        return this.translateService.instant('universal_muscleName_rectusAbdominisLower');
      case '100' :
        return this.translateService.instant('universal_muscleName_abdominisOblique');
      case '112' :
        return this.translateService.instant('universal_muscleName_legMuscle');
      case '113' :
        return this.translateService.instant('universal_muscleName_hipMuscle');
      case '114' :
        return this.translateService.instant('universal_muscleName_quadricepsFemoris');
      case '115' :
        return this.translateService.instant('universal_muscleName_hamstrings');
      case '116' :
        return this.translateService.instant('universal_muscleName_ankleFlexor');
      case '117' :
        return this.translateService.instant('universal_muscleName_gastrocnemius');
      case '128' :
        return this.translateService.instant('universal_muscleName_wristFlexor');
      default :
        return this.translateService.instant('universal_status_noData');
    }
  }
}
