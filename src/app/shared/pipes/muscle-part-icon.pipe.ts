import { Pipe, PipeTransform } from '@angular/core';
import { MuscleCode } from '../enum/weight-train';

@Pipe({ name: 'musclePartIcon' })
export class MusclePartIconPipe implements PipeTransform {
  /**
   * 依據不同肌肉部位代碼回傳該icon的class name
   * @param value {number}-肌肉部位代碼
   * @returns {string}-肌群icon的class name
   */
  transform(value: number): string {
    switch (+value) {
      case MuscleCode.bicepsInside:
        return 'icon-svg_web-icon_p2_088-muscle_16';
      case MuscleCode.triceps:
        return 'icon-svg_web-icon_p2_089-muscle_32';
      case MuscleCode.pectoralsMuscle:
        return 'icon-svg_web-icon_p2_090-muscle_48';
      case MuscleCode.pectoralisUpper:
        return 'icon-svg_web-icon_p3_088-muscle_49';
      case MuscleCode.pectoralisLower:
        return 'icon-svg_web-icon_p3_089-muscle_50';
      case MuscleCode.pectoralsInside:
        return 'icon-svg_web-icon_p3_090-muscle_51';
      case MuscleCode.pectoralsOutside:
        return 'icon-svg_web-icon_p3_091-muscle_52';
      case MuscleCode.frontSerratus:
        return 'icon-svg_web-icon_p3_092-muscle_53';
      case MuscleCode.shoulderMuscle:
        return 'icon-svg_web-icon_p2_091-muscle_64';
      case MuscleCode.deltoidMuscle:
        return 'icon-svg_web-icon_p3_093-muscle_65';
      case MuscleCode.deltoidAnterior:
        return 'icon-svg_web-icon_p3_094-muscle_66';
      case MuscleCode.deltoidLateral:
        return 'icon-svg_web-icon_p3_095-muscle_67';
      case MuscleCode.deltoidPosterior:
        return 'icon-svg_web-icon_p3_096-muscle_68';
      case MuscleCode.trapezius:
        return 'icon-svg_web-icon_p3_097-muscle_69';
      case MuscleCode.backMuscle:
        return 'icon-svg_web-icon_p2_092-muscle_80';
      case MuscleCode.latissimusDorsi:
        return 'icon-svg_web-icon_p3_098-muscle_81';
      case MuscleCode.erectorSpinae:
        return 'icon-svg_web-icon_p3_099-muscle_82';
      case MuscleCode.abdominalMuscle:
        return 'icon-svg_web-icon_p2_093-muscle_96';
      case MuscleCode.rectusAbdominis:
        return 'icon-svg_web-icon_p4_008-muscle_97';
      case MuscleCode.rectusAbdominisUpper:
        return 'icon-svg_web-icon_p3_100-muscle_98';
      case MuscleCode.rectusAbdominisLower:
        return 'icon-svg_web-icon_p4_001-muscle_99';
      case MuscleCode.abdominisOblique:
        return 'icon-svg_web-icon_p4_002-muscle_100';
      case MuscleCode.legMuscle:
        return 'icon-svg_web-icon_p2_094-muscle_112';
      case MuscleCode.hipMuscle:
        return 'icon-svg_web-icon_p4_003-muscle_113';
      case MuscleCode.quadricepsFemoris:
        return 'icon-svg_web-icon_p4_004-muscle_114';
      case MuscleCode.hamstrings:
        return 'icon-svg_web-icon_p4_005-muscle_115';
      case MuscleCode.ankleFlexor:
        return 'icon-svg_web-icon_p4_006-muscle_116';
      case MuscleCode.gastrocnemius:
        return 'icon-svg_web-icon_p4_007-muscle_117';
      case MuscleCode.wristFlexor:
        return 'icon-svg_web-icon_p2_095-muscle_128';
    }
  }
}
