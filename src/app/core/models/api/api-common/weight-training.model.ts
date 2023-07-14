import { MuscleGroup, MuscleCode } from '../../../../core/enums/sports';

/**
 * 各肌肉部位重訓概要資訊
 */
export interface WeightTrainingInfo {
  muscle: MuscleCode | null; // 肌肉部位代碼
  max1RmWeightKg: number; // 1RM
  totalWeightKg: number; // 總重
  totalSets: number; // 總組數
  totalReps: number; // 總次數
  muscleGroup?: MuscleGroup; // api無此數據，需自行處理後填入，方便分類肌群用
  color?: string; // 根據訓練程度與數據顯示顏色，需自行處理後填入
}
