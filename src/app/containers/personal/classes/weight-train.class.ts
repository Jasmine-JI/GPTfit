import { MuscleCode, MuscleGroup, WeightTrainingLevel } from '../../../core/enums/sports';
import { WeightTrainingInfo } from '../../../core/models/api/api-common';
import {
  deepCopy,
  getCorrespondingMuscleGroup,
  getWeightTrainingColor,
  getWeightProficiency,
} from '../../../core/utils';

export class WeightTrain {
  /**
   * 重訓程度
   */
  private _trainingLevel = WeightTrainingLevel.metacarpus;

  /**
   * 體重
   */
  private _bodyWeight = 60;

  /**
   * 運動檔案概要資訊各肌肉訓練數據列表
   */
  private _muscleList: Array<WeightTrainingInfo>;

  /**
   * 各肌群訓練數據列表
   */
  private _muscleGroupList: Array<WeightTrainingInfo>;

  /**
   * 目前聚焦的肌肉部位
   */
  private _focusMuscle: MuscleCode | null = null;

  /**
   * 目前聚焦的肌群
   */
  private _focusMuscleGroup: MuscleGroup | null = null;

  /**
   * 現在聚焦的肌肉數據
   */
  private _displayMuscleList: Array<WeightTrainingInfo> = [];

  /**
   * 有訓練到的副肌肉清單
   */
  private _useViceMuscle: Array<MuscleCode> = [];

  /**
   * @param trainInfo 重訓概要資訊
   * @param args.useViceMuscle 副肌肉訓練清單
   * @param args.trainingLevel 使用者訓練程度
   * @param args.bodyWeight 使用者體重
   */
  constructor(
    trainInfo: Array<WeightTrainingInfo>,
    args?: {
      useViceMuscle?: Array<MuscleCode>;
      trainingLevel?: WeightTrainingLevel;
      bodyWeight?: number;
    }
  ) {
    if (args) {
      const { trainingLevel, useViceMuscle, bodyWeight } = args;
      if (trainingLevel) this._trainingLevel = trainingLevel;
      if (useViceMuscle) this._useViceMuscle = useViceMuscle.map((_muscle) => +_muscle);
      if (bodyWeight) this._bodyWeight = bodyWeight;
    }

    this._muscleList = this.handleMuscleList(trainInfo);
    this._displayMuscleList = deepCopy(this._muscleList);
    this._muscleGroupList = this.getMuscleGroupList(trainInfo);
  }

  /**
   * 取得現在聚焦肌肉部位
   */
  get focusMuscle(): MuscleCode | null {
    return this._focusMuscle;
  }

  /**
   * 取得現在聚焦肌群
   */
  get focusMuscleGroup(): MuscleGroup | null {
    return this._focusMuscleGroup;
  }

  /**
   * 取得肌肉部位訓練列表
   */
  get muscleList() {
    return this._muscleList;
  }

  /**
   * 取得肌群訓練列表
   */
  get muscleGroupList() {
    return this._muscleGroupList;
  }

  /**
   * 取得目前肌肉地圖需要顯示的肌肉清單
   */
  get displayMuscleList() {
    return this._displayMuscleList;
  }

  /**
   * 取得訓練的副肌群清單，若有聚焦肌肉部位，則不傳次要訓練部位
   */
  get useViceMuscle() {
    const { _focusMuscle, _focusMuscleGroup, _useViceMuscle } = this;
    return _focusMuscle || _focusMuscleGroup ? [] : _useViceMuscle;
  }

  /**
   * 將api回覆的肌肉部位字串轉數字，
   * 並將各肌肉部位資訊填入所屬肌群資訊，方便圖表呈現
   * @param trainInfo 重訓概要資訊
   */
  private handleMuscleList(trainInfo: Array<WeightTrainingInfo>) {
    return trainInfo.map((_info) => {
      const code = +(_info.muscle as MuscleCode);
      _info.muscle = code;
      _info.muscleGroup = getCorrespondingMuscleGroup(code);

      const proficiency = getWeightProficiency(this._trainingLevel);
      _info.color = getWeightTrainingColor(_info.max1RmWeightKg, {
        bodyWeight: this._bodyWeight,
        proficiency,
      });
      return _info;
    });
  }

  /**
   * 將各肌肉部位依所屬肌群個別加總以計算各肌群數據
   * @param file 運動檔案數據
   */
  private getMuscleGroupList(trainInfo: Array<WeightTrainingInfo>) {
    // 避免有機群因無數據而未列表於畫面上
    const resultObj = {
      [MuscleGroup.armMuscle]: this.getMuscleGroupDataModel(MuscleGroup.armMuscle),
      [MuscleGroup.pectoralsMuscle]: this.getMuscleGroupDataModel(MuscleGroup.pectoralsMuscle),
      [MuscleGroup.shoulderMuscle]: this.getMuscleGroupDataModel(MuscleGroup.shoulderMuscle),
      [MuscleGroup.backMuscle]: this.getMuscleGroupDataModel(MuscleGroup.backMuscle),
      [MuscleGroup.abdominalMuscle]: this.getMuscleGroupDataModel(MuscleGroup.abdominalMuscle),
      [MuscleGroup.legMuscle]: this.getMuscleGroupDataModel(MuscleGroup.legMuscle),
    };

    const countResult = trainInfo.reduce((_prev, _curr) => {
      const { muscleGroup, max1RmWeightKg, totalWeightKg, totalSets, totalReps } = _curr;
      const muscleGroupCode = muscleGroup as MuscleGroup;
      const _prevGroup = _prev[muscleGroupCode];
      _prev[muscleGroupCode] = {
        muscle: null,
        muscleGroup: muscleGroupCode,
        max1RmWeightKg:
          _prevGroup.max1RmWeightKg > max1RmWeightKg ? _prevGroup.max1RmWeightKg : max1RmWeightKg,
        totalWeightKg: _prevGroup.totalWeightKg + totalWeightKg,
        totalSets: _prevGroup.totalSets + totalSets,
        totalReps: _prevGroup.totalReps + totalReps,
      };

      return _prev;
    }, resultObj);

    return Object.values(countResult);
  }

  /**
   * 取得肌群模型
   * @param muscleGroup 肌群代碼
   */
  private getMuscleGroupDataModel(muscleGroup: MuscleGroup) {
    return {
      muscle: null,
      muscleGroup,
      max1RmWeightKg: 0,
      totalWeightKg: 0,
      totalSets: 0,
      totalReps: 0,
    };
  }

  /**
   * 聚焦某個肌肉部位
   * @param muscleCode 肌肉代碼
   */
  setFocusMuscle(muscleCode: MuscleCode) {
    const { _focusMuscle } = this;
    this._focusMuscle = _focusMuscle === muscleCode ? null : muscleCode;
    const displayList = !this._focusMuscle
      ? this._muscleList
      : this._muscleList.filter((_list) => _list.muscle === muscleCode);

    this._displayMuscleList = deepCopy(displayList);
  }

  /**
   * 聚焦某個肌群
   * @param muscleGroup 肌群代碼
   */
  setFocusMuscleGroup(muscleGroup: MuscleGroup) {
    const { _focusMuscleGroup } = this;
    this._focusMuscleGroup = _focusMuscleGroup === muscleGroup ? null : muscleGroup;
    const displayList = !this._focusMuscleGroup
      ? this._muscleList
      : this._muscleList.filter((_list) => _list.muscleGroup === muscleGroup);

    this._displayMuscleList = deepCopy(displayList);
  }

  /**
   * 離焦肌肉部位
   */
  blurMuscle() {
    this._focusMuscle = null;
    this._focusMuscleGroup = null;
    this._displayMuscleList = deepCopy(this._muscleList);
  }

  /**
   * 變更使用者重訓程度
   * @param level 重訓程度
   */
  changeWeightTrainLevel(level: WeightTrainingLevel) {
    this._focusMuscle = null;
    this._focusMuscleGroup = null;
    this._trainingLevel = level;
    this._muscleList = this._muscleList.map((_info) => {
      const proficiency = getWeightProficiency(level);
      _info.color = getWeightTrainingColor(_info.max1RmWeightKg, {
        bodyWeight: this._bodyWeight,
        proficiency,
      });

      return _info;
    });

    this._displayMuscleList = deepCopy(this._muscleList);
  }
}
