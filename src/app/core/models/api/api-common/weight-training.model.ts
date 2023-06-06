/**
 * 各肌群重訓概要資訊
 */
export interface WeightTrainingInfo {
  muscle: string; // 肌肉部位代碼
  max1RmWeightKg: number; // 1RM
  totalWeightKg: number; // 總重
  totalSets: number; // 總組數
  totalReps: number; // 總次數
}
