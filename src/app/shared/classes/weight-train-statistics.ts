import { MuscleCode, MuscleGroup } from '../enum/weight-train';
import { WeightTrainingInfo } from '../models/weight-train';
import { mathRounding } from '../utils/index';


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
    [MuscleGroup.legMuscle]: [0, 0, 0]
  };

  /**
   * 更新運動類別次數
   */
  countMuscleGroup(muscleCode: MuscleCode, count: number) {
    const { _preferMuscleGroup } = this;
    const muscleGroup = WeightTrainStatistics.getBelongMuscleGroup(muscleCode);
    if (_preferMuscleGroup[muscleGroup]) {
      this._preferMuscleGroup[muscleGroup] += count;
    } else {
      this._preferMuscleGroup = { ..._preferMuscleGroup, [muscleGroup]: count };
    }

  }

  /**
   * 取得次數前三多的運動類別
   */
  get preferMuscleGroup() {
    const sortMuscleGroup = Object.entries(this._preferMuscleGroup)
      .sort((_a, _b) => {
        const [_aKey, _aValue] = _a;
        const [_bKey, _bValue] = _b;
        return (_bValue as number) - (_aValue as number);
      })
      .map(_result => {
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
    const muscleGroup = WeightTrainStatistics.getBelongMuscleGroup(muscle);
    const [weight, reps, sets] = this._muscleGroupData[muscleGroup];
    this._muscleGroupData[muscleGroup] = [weight + totalWeightKg, reps + totalReps, sets + totalSets];
  }

  /**
   * 取得各肌群訓練數據
   */
  get muscleGroupData() {
    let data = {};
    Object.entries(this._muscleGroupData).forEach(_muscleGroup => {
      const [key, valueArray] = _muscleGroup;
      const [totalWeight, totalReps, totalSets] = valueArray;
      const avgWeightPerRep = (totalWeight / totalReps) || 0;  // 可能需再轉換成英制單位，故不先四捨五入
      const avgRepsPerSet = mathRounding((totalReps / totalSets), 1) || 0;
      data = { ...data, [key]: [avgWeightPerRep, avgRepsPerSet, totalSets] };
    });

    return data;
  }

  /**
   * 判斷肌肉部位所屬肌群
   */
  static getBelongMuscleGroup(muscleCode: MuscleCode): MuscleGroup {
    switch (+muscleCode) {
      case MuscleCode.bicepsInside:
      case MuscleCode.triceps:
      case MuscleCode.wristFlexor:
        return MuscleGroup.armMuscle;
      case MuscleCode.pectoralsMuscle:
      case MuscleCode.pectoralisUpper:
      case MuscleCode.pectoralisLower:
      case MuscleCode.pectoralsInside:
      case MuscleCode.pectoralsOutside:
      case MuscleCode.frontSerratus:
        return MuscleGroup.pectoralsMuscle;
      case MuscleCode.shoulderMuscle:
      case MuscleCode.deltoidMuscle:
      case MuscleCode.deltoidAnterior:
      case MuscleCode.deltoidLateral:
      case MuscleCode.deltoidPosterior:
      case MuscleCode.trapezius:
        return MuscleGroup.shoulderMuscle;
      case MuscleCode.backMuscle:
      case MuscleCode.latissimusDorsi:
      case MuscleCode.erectorSpinae:
        return MuscleGroup.backMuscle;
      case MuscleCode.abdominalMuscle:
      case MuscleCode.rectusAbdominis:
      case MuscleCode.rectusAbdominisUpper:
      case MuscleCode.rectusAbdominisLower:
      case MuscleCode.abdominisOblique:
        return MuscleGroup.abdominalMuscle;
      case MuscleCode.legMuscle:
      case MuscleCode.hipMuscle:
      case MuscleCode.quadricepsFemoris:
      case MuscleCode.hamstrings:
      case MuscleCode.ankleFlexor:
      case MuscleCode.gastrocnemius:
        return MuscleGroup.legMuscle;
    }

  }


}