import { Pipe, PipeTransform } from '@angular/core';
import { MuscleGroup } from '../models/weight-train';


@Pipe({name: 'muscleGroupIcon'})
export class MuscleGroupIconPipe implements PipeTransform {
  /**
   * 依據不同肌群代碼回傳該icon的class name
   * @param value {number}-肌群代碼
   * @returns {string}-肌群icon的class name
   * @author kidin-1100528
   */
  transform(value: number): string {
    switch (value) {
      case MuscleGroup.armMuscle:
        return 'icon-svg_web-icon_p3_028-hand_muscle';
      case MuscleGroup.legMuscle:
        return 'icon-svg_web-icon_p3_029-foot_muscles';
      case MuscleGroup.abdominalMuscle:
        return 'icon-svg_web-icon_p3_030-abdominal_muscles';
      case MuscleGroup.backMuscle:
        return 'icon-svg_web-icon_p3_031-back_muscles';
      case MuscleGroup.shoulderMuscle:
        return 'icon-svg_web-icon_p3_032-shoulder_muscles';
      case MuscleGroup.pectoralsMuscle:
        return 'icon-svg_web-icon_p3_033-chest_muscles';
    }

  }
  
}
