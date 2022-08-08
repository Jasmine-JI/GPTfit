import { MuscleCode } from '../enum/weight-train';

/**
 * 使用者重訓程度
 */
export type UserLevel = 'asept' | 'metacarpus' | 'novice';

/**
 * 高階者重訓程度
 */
export const asept = ['1%', '100%', '200%'] as const;

/**
 * 進階者重訓程度
 */
export const metacarpus = ['1%', '50%', '100%'] as const;

/**
 * 初學者重訓程度
 */
export const novice = ['1%', '25%', '50%'] as const;

/**
 * 手臂肌群
 */
export const ArmMuscle = [
  MuscleCode.bicepsInside,
  MuscleCode.triceps,
  MuscleCode.wristFlexor,
] as const;

/**
 * 胸部肌群
 */
export const PectoralsMuscle = [
  MuscleCode.pectoralsMuscle,
  MuscleCode.pectoralisUpper,
  MuscleCode.pectoralisLower,
  MuscleCode.pectoralsInside,
  MuscleCode.pectoralsOutside,
  MuscleCode.frontSerratus,
] as const;

/**
 * 肩部肌群
 */
export const ShoulderMuscle = [
  MuscleCode.shoulderMuscle,
  MuscleCode.deltoidMuscle,
  MuscleCode.deltoidAnterior,
  MuscleCode.deltoidLateral,
  MuscleCode.deltoidPosterior,
  MuscleCode.trapezius,
] as const;

/**
 * 背部肌群
 */
export const BackMuscle = [
  MuscleCode.backMuscle,
  MuscleCode.latissimusDorsi,
  MuscleCode.erectorSpinae,
] as const;

/**
 * 腹部肌群
 */
export const AbdominalMuscle = [
  MuscleCode.abdominalMuscle,
  MuscleCode.rectusAbdominis,
  MuscleCode.rectusAbdominisUpper,
  MuscleCode.rectusAbdominisLower,
  MuscleCode.abdominisOblique,
] as const;

/**
 * 腿部肌群
 */
export const LegMuscle = [
  MuscleCode.legMuscle,
  MuscleCode.hipMuscle,
  MuscleCode.quadricepsFemoris,
  MuscleCode.hamstrings,
  MuscleCode.ankleFlexor,
  MuscleCode.gastrocnemius,
] as const;

/**
 * 肌肉地圖主部位相關顏色設定
 */
export const muscleMapColorSetting = {
  saturation: '100%',
  brightness: '70%',
  transparency: 0.5,
} as const;

/**
 * api 2104 response weightTrainingInfo[]內的資訊
 */
export interface WeightTrainingInfo {
  muscle: MuscleCode;
  max1RmWeightKg: number;
  totalWeightKg: number;
  totalSets: number;
  totalReps: number;
}
