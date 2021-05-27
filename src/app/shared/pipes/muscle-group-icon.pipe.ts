import { Pipe, PipeTransform } from '@angular/core';
import { MuscleGroup } from '../models/weight-train';

/**
 * 依據不同運動類型回傳該icon的class name（需隨類別增加而更新）
 */
@Pipe({name: 'muscleGroupIcon'})
export class MuscleGroupIconPipe implements PipeTransform {
  transform(value: number, args: string[]): any {
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
