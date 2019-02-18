import { Pipe, PipeTransform } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Pipe({ name: 'mapTranslate' })
export class MapTranslatePipe implements PipeTransform {
  constructor(private translate: TranslateService) {}
  transform(value: number, args: string[]): any {
    switch (value) {
      case 1:
        return 'SH.Map.EffelTowerRoadRunning';
      case 2:
        return 'SH.Map.OberwiesenfeldOlympiapark';
      case 3:
        return 'SH.Map.GreatWallRoadRunning';
      case 4:
        return 'SH.Map.AlpsHillRoad';
      case 5:
        return 'SH.Map.KallimarmaroStadium';
      case 6:
        return 'SH.Map.WanjinshiWarmUp';
      case 7:
        return 'SH.Map.TheBundInternationalMarathon';
      case 8:
        return 'SH.Map.WanjinshiMiniMarathon';
      case 9:
        return 'SH.Map.AlishanRoadRunningExperience';
      case 10:
        return 'SH.Map.LanyuRoundabout';
      case 11:
        return 'SH.Map.LanyuRoundabout';
      case 12:
        return 'SH.Map.LanyuRoundabout';
      case 13:
        return 'SH.Map.LanyuRoundabout';
      case 14:
        return 'SH.Map.LanyuRoundabout';
      case 15:
        return 'SH.Map.BeijingMarathon';
      default:
        return 'SH.No-information';
    }
  }
}
