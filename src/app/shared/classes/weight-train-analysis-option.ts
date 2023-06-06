import { AnalysisOneOption } from './analysis-one-option';
import { AnalysisOption } from './analysis-option';
import { MuscleAnalysisColumn } from '../../core/enums/sports';
import { LocalStorageKey } from '../../core/enums/common';

const muscleAnalysisColumnList = Object.values(MuscleAnalysisColumn).filter(
  (value) => typeof value === 'number'
) as Array<number>;

/**
 * 報告內分析項目可設定的選項
 */
export class WeightTrainAnalysisOption extends AnalysisOption {
  /**
   * 建立分析可選擇的欄位選項清單
   */
  createOption() {
    this.itemList = muscleAnalysisColumnList
      .sort((a, b) => a - b)
      .map((_item) => new AnalysisOneOption({ item: _item }));

    this.storageKey = LocalStorageKey.weightTrainAnalysis;
    return;
  }

  /**
   * 設定預設選擇的項目
   */
  getDefaultOption() {
    return muscleAnalysisColumnList;
  }
}
