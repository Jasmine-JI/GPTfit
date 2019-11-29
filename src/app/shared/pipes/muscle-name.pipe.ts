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
        return this.translateService.instant('Dashboard.MyActivity.MuscleName.bicepsInside');
      case '32' :
        return this.translateService.instant('Dashboard.MyActivity.MuscleName.triceps');
      case '48' :
        return this.translateService.instant('Dashboard.MyActivity.MuscleName.pectoralsMuscle');
      case '49' :
        return this.translateService.instant('Dashboard.MyActivity.MuscleName.pectoralisUpper');
      case '50' :
        return this.translateService.instant('Dashboard.MyActivity.MuscleName.pectoralisLower');
      case '51' :
        return this.translateService.instant('Dashboard.MyActivity.MuscleName.pectoralsInside');
      case '52' :
        return this.translateService.instant('Dashboard.MyActivity.MuscleName.pectoralsOutside');
      case '53' :
        return this.translateService.instant('Dashboard.MyActivity.MuscleName.frontSerratus');
      case '64' :
        return this.translateService.instant('Dashboard.MyActivity.MuscleName.shoulderMuscle');
      case '65' :
        return this.translateService.instant('Dashboard.MyActivity.MuscleName.deltoidMuscle');
      case '66' :
        return this.translateService.instant('Dashboard.MyActivity.MuscleName.deltoidAnterior');
      case '67' :
        return this.translateService.instant('Dashboard.MyActivity.MuscleName.deltoidLateral');
      case '68' :
        return this.translateService.instant('Dashboard.MyActivity.MuscleName.deltoidPosterior');
      case '69' :
        return this.translateService.instant('Dashboard.MyActivity.MuscleName.trapezius');
      case '80' :
        return this.translateService.instant('Dashboard.MyActivity.MuscleName.backMuscle');
      case '81' :
        return this.translateService.instant('Dashboard.MyActivity.MuscleName.latissimusDorsi');
      case '82' :
        return this.translateService.instant('Dashboard.MyActivity.MuscleName.erectorSpinae');
      case '96' :
        return this.translateService.instant('Dashboard.MyActivity.MuscleName.abdominalMuscle');
      case '97' :
        return this.translateService.instant('Dashboard.MyActivity.MuscleName.rectusAbdominis');
      case '98' :
        return this.translateService.instant('Dashboard.MyActivity.MuscleName.rectusAbdominisUpper');
      case '99' :
        return this.translateService.instant('Dashboard.MyActivity.MuscleName.rectusAbdominisLower');
      case '100' :
        return this.translateService.instant('Dashboard.MyActivity.MuscleName.abdominisOblique');
      case '112' :
        return this.translateService.instant('Dashboard.MyActivity.MuscleName.legMuscle');
      case '113' :
        return this.translateService.instant('Dashboard.MyActivity.MuscleName.hipMuscle');
      case '114' :
        return this.translateService.instant('Dashboard.MyActivity.MuscleName.quadricepsFemoris');
      case '115' :
        return this.translateService.instant('Dashboard.MyActivity.MuscleName.hamstrings');
      case '116' :
        return this.translateService.instant('Dashboard.MyActivity.MuscleName.ankleFlexor');
      case '117' :
        return this.translateService.instant('Dashboard.MyActivity.MuscleName.gastrocnemius');
      case '128' :
        return this.translateService.instant('Dashboard.MyActivity.MuscleName.wristFlexor');
      default :
        return this.translateService.instant('SH.noData');
    }
  }
}
