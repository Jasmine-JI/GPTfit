import { Pipe, PipeTransform } from '@angular/core';

/**
 * 依據不同運動類型回傳該icon的class name（需隨類別增加而更新）
 */
@Pipe({name: 'sportTypeIcon'})
export class SportTypeIconPipe implements PipeTransform {
  transform(value: string | number, args: string[]): any {
    switch (+value) {
      case 1:
        return 'icon-svg_web-icon_p1_083-run';
      case 2:
        return 'icon-svg_web-icon_p1_084-cycle';
      case 3:
        return 'icon-svg_web-icon_p1_086-weight_training';
      case 4:
        return 'icon-svg_web-icon_p1_085-swim';
      case 5:
        return 'icon-svg_web-icon_p1_087-aerobic';
      case 6:
        return 'icon-svg_web-icon_p1_088-row';
      case 7:
        return 'icon-svg_web-icon_p3_056-ball';
      case 99:
        return 'icon-svg_web-icon_p2_038-complex';
      default:
        return 'icon-svg_web-icon_p2_038-complex';
    }

  }
  
}
