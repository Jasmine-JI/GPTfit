import { WeightTrainingInfo } from '../../core/models/api/api-common';
import { mathRounding } from '../../core/utils';
import { getCorrespondingMuscleGroup } from '../../core/utils/sports';
import { MuscleCode, MuscleGroup } from '../../core/enums/sports';

/**
 * 統計個人重訓肌群數據
 */
export class WeightTrainStatistics {
  /**
   * 統計偏好肌群
   */
  private _preferMuscleGroup = {};

  /**
   * 計算各肌群訓練數據
   */
  private _muscleGroupData = {
    [MuscleGroup.armMuscle]: [0, 0, 0],
    [MuscleGroup.pectoralsMuscle]: [0, 0, 0],
    [MuscleGroup.shoulderMuscle]: [0, 0, 0],
    [MuscleGroup.backMuscle]: [0, 0, 0],
    [MuscleGroup.abdominalMuscle]: [0, 0, 0],
    [MuscleGroup.legMuscle]: [0, 0, 0],
  };

  /**
   * 更新各肌群訓練次數
   */
  countMuscleGroup(muscleCode: MuscleCode, count: number) {
    const { _preferMuscleGroup } = this;
    const muscleGroup = getCorrespondingMuscleGroup(muscleCode);
    if (_preferMuscleGroup[muscleGroup]) {
      this._preferMuscleGroup[muscleGroup] += count;
    } else {
      this._preferMuscleGroup = { ..._preferMuscleGroup, [muscleGroup]: count };
    }
  }

  /**
   * 取得次數前三多的肌群
   */
  get preferMuscleGroup() {
    const sortMuscleGroup = Object.entries(this._preferMuscleGroup)
      .sort((_a, _b) => {
        const [_aKey, _aValue] = _a;
        const [_bKey, _bValue] = _b;
        return (_bValue as number) - (_aValue as number);
      })
      .map((_result) => {
        const [_key, _value] = _result;
        return +_key;
      });

    return sortMuscleGroup.slice(0, 3);
  }

  /**
   * 計算肌群訓練數據
   */
  countMuscleGroupData(info: WeightTrainingInfo) {
    const { muscle, totalWeightKg, totalSets, totalReps } = info;
    const muscleGroup = getCorrespondingMuscleGroup(+muscle);
    const [weight, reps, sets] = this._muscleGroupData[muscleGroup];
    this._muscleGroupData[muscleGroup] = [
      weight + totalWeightKg,
      reps + totalReps,
      sets + totalSets,
    ];
  }

  /**
   * 取得各肌群訓練數據
   */
  get muscleGroupData() {
    let data = {};
    Object.entries(this._muscleGroupData).forEach((_muscleGroup) => {
      const [key, valueArray] = _muscleGroup;
      const [totalWeight, totalReps, totalSets] = valueArray;
      const avgWeightPerRep = totalWeight / totalReps || 0; // 可能需再轉換成英制單位，故不先四捨五入
      const avgRepsPerSet = mathRounding(totalReps / totalSets, 1) || 0;
      data = { ...data, [key]: [avgWeightPerRep, avgRepsPerSet, totalSets] };
    });

    return data;
  }

  /**
   * 取得各肌群總訓練次數
   */
  get muscleGroupTotalReps() {
    const result = [0, 0, 0, 0, 0, 0];
    Object.entries(this._muscleGroupData).forEach((_muscleGroup) => {
      const [key, valueArray] = _muscleGroup;
      const [totalWeight, totalReps, ...rest] = valueArray;
      result[+key - 1] = totalReps;
    });

    return result;
  }
}
