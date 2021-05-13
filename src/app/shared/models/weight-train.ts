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

export enum Proficiency {
  novice = 1,
  metacarpus = 2,
  asept = 4
}

/**
 * 重訓計算係數（對應使用者重訓程度）
 */
export type ProficiencyCoefficient = Proficiency.novice | Proficiency.metacarpus | Proficiency.asept;

/**
 * 肌肉編碼
 */
export enum MuscleCode {
  /**
   * 肱二頭肌
   */
  bicepsInside = 16,
  /**
   * 肱三頭肌
   */
  triceps = 32,
  /**
   * 胸部肌群
   */
  pectoralsMuscle = 48,
  /**
   * 上胸肌
   */
  pectoralisUpper,
  /**
   * 下胸肌
   */
  pectoralisLower,
  /**
   * 胸肌內側
   */
  pectoralsInside,
  /**
   * 胸肌外側
   */
  pectoralsOutside,
  /**
   * 前鋸肌
   */
  frontSerratus,
  /**
   * 肩部肌群
   */
  shoulderMuscle = 64,
  /**
   * 三角肌群
   */
  deltoidMuscle,
  /**
   * 前三角肌束
   */
  deltoidAnterior,
  /**
   * 中三角肌束
   */
  deltoidLateral,
  /**
   * 後三角肌束
   */
  deltoidPosterior,
  /**
   * 斜方肌
   */
  trapezius,
  /**
   * 背肌群
   */
  backMuscle = 80,
  /**
   * 背闊肌
   */
  latissimusDorsi,
  /**
   * 束脊肌群
   */
  erectorSpinae,
  /**
   * 腹部肌群
   */
  abdominalMuscle = 96,
  /**
   * 腹直肌
   */
  rectusAbdominis,
  /**
   * 上腹直肌
   */
  rectusAbdominisUpper,
  /**
   * 下腹直肌
   */
  rectusAbdominisLower,
  /**
   * 腹外斜肌
   */
  abdominisOblique,
  /**
   * 腿部肌群
   */
  legMuscle = 112,
  /**
   * 臀部肌群
   */
  hipMuscle,
  /**
   * 股四頭肌群
   */
  quadricepsFemoris,
  /**
   * 股二頭肌群
   */
  hamstrings,
  /**
   * 踝部曲肌
   */
  ankleFlexor,
  /**
   * 腓腸肌
   */
  gastrocnemius,
  /**
   * 腕伸屈肌
   */
  wristFlexor = 128
}

/**
 * 肌群代碼（目前無文件規範，故自定義）
 */
export enum MuscleGroup {
  armMuscle,
  pectoralsMuscle,
  shoulderMuscle,
  backMuscle,
  abdominalMuscle,
  legMuscle
}

/**
 * 手臂肌群
 */
export type ArmMuscle = 
  MuscleCode.bicepsInside | MuscleCode.triceps | MuscleCode.wristFlexor;

/**
 * 胸部肌群
 */
export type PectoralsMuscle =
  MuscleCode.pectoralsMuscle
  | MuscleCode.pectoralisUpper
  | MuscleCode.pectoralisLower
  | MuscleCode.pectoralsInside
  | MuscleCode.pectoralsOutside
  | MuscleCode.frontSerratus;

/**
 * 肩部肌群
 */
export type ShoulderMuscle =
  MuscleCode.shoulderMuscle
  | MuscleCode.deltoidMuscle
  | MuscleCode.deltoidAnterior
  | MuscleCode.deltoidLateral
  | MuscleCode.deltoidPosterior
  | MuscleCode.trapezius;

/**
 * 背部肌群
 */
export type BackMuscle =  MuscleCode.backMuscle | MuscleCode.latissimusDorsi | MuscleCode.erectorSpinae;

/**
 * 腹部肌群
 */
export type AbdominalMuscle =
  MuscleCode.abdominalMuscle
  | MuscleCode.rectusAbdominis
  | MuscleCode.rectusAbdominisUpper
  | MuscleCode.rectusAbdominisLower
  | MuscleCode.abdominisOblique;

/**
 * 腿部肌群
 */
export type LegMuscle =
  MuscleCode.legMuscle
  | MuscleCode.hipMuscle
  | MuscleCode.quadricepsFemoris
  | MuscleCode.hamstrings
  | MuscleCode.ankleFlexor
  | MuscleCode.gastrocnemius;

/**
 * 肌肉地圖主部位相關顏色設定
 */
export const muscleMapColorSetting = {
  saturation: '100%',
  brightness: '70%',
  transparency: 0.5
} as const;