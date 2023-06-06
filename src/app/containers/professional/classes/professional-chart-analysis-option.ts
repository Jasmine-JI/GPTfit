import { AnalysisSportsColumn, SportType } from '../../../core/enums/sports';
import { AnalysisOneOption } from '../../../shared/classes/analysis-one-option';
import { AnalysisOption } from '../../../shared/classes/analysis-option';

/**
 * 群組與個人運動報告圖表數據表格分析可設定的選項
 */
export class ProfessionalChartAnalysisOption extends AnalysisOption {
  /**
   * 建立選項
   */
  createOption() {
    const { sportType } = this.optionInfo;
    const list = [
      AnalysisSportsColumn.targetAchievedRate,
      AnalysisSportsColumn.totalSecond,
      AnalysisSportsColumn.calories,
      AnalysisSportsColumn.hrChart,
    ];

    switch (sportType) {
      case SportType.all:
      case SportType.run:
        list.push(AnalysisSportsColumn.totalFeedbackEnergy);
        break;
    }

    this.itemList = list
      .sort((_a, _b) => _a - _b)
      .map((_item) => new AnalysisOneOption({ item: _item }));
    this.storageKey = `groupReport-chart-${sportType}`;
    return;
  }

  /**
   * 設定預設選擇的項目
   */
  getDefaultOption() {
    return [
      AnalysisSportsColumn.targetAchievedRate,
      AnalysisSportsColumn.totalSecond,
      AnalysisSportsColumn.calories,
      AnalysisSportsColumn.hrChart,
    ];
  }
}
