/**
 * api 1010用重訓程度係數
 */
export enum WeightTrainingLevel {
  novice = 50,
  metacarpus = 100,
  asept = 200
}

/**
 * 重訓程度係數
 */
export enum Proficiency {
  asept = 1,
  metacarpus = 2,
  novice = 4
}

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
  armMuscle = 1,
  pectoralsMuscle,
  shoulderMuscle,
  backMuscle,
  abdominalMuscle,
  legMuscle
}

/**
 * 重訓動作分析欄位
 */
export enum MuscleAnalysisColumn {
  oneRepMax = 1,
  totalSets,
  totalReps,
  avgWeightKg,
  trainingLevel,
  belongMuscleGroup
}