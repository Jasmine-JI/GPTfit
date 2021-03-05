/**
 * 使用者重訓程度
 */
export type UserLevel = 'asept' | 'metacarpus' | 'novice';

/**
 * 各使用者重訓程度之肌肉訓練範圍
 */
export const asept = ['1%', '100%', '200%'] as const;  // 高階者
export const metacarpus = ['1%', '50%', '100%'] as const;  // 進階者
export const novice = ['1%', '25%', '50%'] as const;  // 初學者

/**
 * 重訓計算係數（對應使用者重訓程度）
 */
export type ProficiencyCoefficient = 1 | 2 | 4;

/**
 * 肌肉編碼
 */
export type MuscleCode = 
  16 | 32 | 48 | 49 | 50 | 51 | 52 | 53 | 64 | 65 | 66 | 67 | 68 | 69 | 80 | 81 | 82 | 96 | 97 | 98 | 99 | 100 | 112 | 113 | 114 | 115 | 116 | 117 | 128;

/**
 * 手臂肌群
 */
export type ArmMusclesCode = 16 | 32 | 128;

/**
 * 胸部肌群
 */
export type PectoralsMuscle = 48 | 49 | 50 | 51 | 52 | 53;

/**
 * 肩部肌群
 */
export type ShoulderMuscle = 64 | 65 | 66 | 67 | 68 | 69;

/**
 * 背部肌群
 */
export type BackMuscle = 80 | 81 | 82;

/**
 * 腹部肌群
 */
export type AbdominalMuscle = 96 | 97 | 98 | 99 | 100;

/**
 * 腿部肌群
 */
export type LegMuscle = 112 | 113 | 114 | 115 | 116 | 117;

/**
 * 肌肉地圖主部位相關顏色設定
 */
export const muscleMapColorSetting = {
  saturation: '100%',
  brightness: '70%',
  transparency: 0.5
} as const;