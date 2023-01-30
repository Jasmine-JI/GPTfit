import { Pipe, PipeTransform } from '@angular/core';
import { SportType } from '../enums/sports';

@Pipe({
  name: 'sportTypeIcon',
  standalone: true,
})
export class SportTypeIconPipe implements PipeTransform {
  /**
   * 依據不同運動類型回傳該icon的class name（需隨類別增加而更新）
   * @param value {string | number}-運動類型
   * @return {string}-icon class name
   */
  transform(value: string | number): any {
    switch (+value) {
      case SportType.run:
        return 'icon-svg_web-icon_p1_083-run';
      case SportType.cycle:
        return 'icon-svg_web-icon_p1_084-cycle';
      case SportType.weightTrain:
        return 'icon-svg_web-icon_p1_086-weight_training';
      case SportType.swim:
        return 'icon-svg_web-icon_p1_085-swim';
      case SportType.aerobic:
        return 'icon-svg_web-icon_p1_087-aerobic';
      case SportType.row:
        return 'icon-svg_web-icon_p1_088-row';
      case SportType.ball:
        return 'icon-svg_web-icon_p3_056-ball';
      case SportType.all:
        return 'icon-svg_web-icon_p4_015-select_all';
      case SportType.rest:
        return 'icon-svg_web-icon_p2_039-rest';
      default:
        return 'icon-svg_web-icon_p2_038-complex';
    }
  }
}
