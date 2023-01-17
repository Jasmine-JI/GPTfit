import { SportType } from '../../../shared/enum/sports';
import { AnalysisSportsColumn } from '../../../shared/enum/report-analysis';
import { AnalysisOneOption } from '../../../shared/classes/analysis-one-option';
import { AnalysisOption } from '../../../shared/classes/analysis-option';

/**
 * 群組與個人運動報告圖表數據表格分析可設定的選項
 */
export class PersonalChartAnalysisOption extends AnalysisOption {
  /**
   * 建立選項
   */
  createOption() {
    const { sportType } = this.optionInfo;
    let list = [
      AnalysisSportsColumn.targetAchievedRate,
      AnalysisSportsColumn.activities,
      AnalysisSportsColumn.totalSecond,
      AnalysisSportsColumn.calories,
      AnalysisSportsColumn.averageHeartRate,
      AnalysisSportsColumn.bodyWeight,
      AnalysisSportsColumn.fatRate,
      AnalysisSportsColumn.hrChart,
    ];

    switch (sportType) {
      case SportType.all:
        list = list.concat([
          AnalysisSportsColumn.benefitTime,
          AnalysisSportsColumn.pai,
          AnalysisSportsColumn.totalFeedbackEnergy,
        ]);
        break;
      case SportType.run:
        list = list.concat([
          AnalysisSportsColumn.distance,
          AnalysisSportsColumn.speedOrPace,
          AnalysisSportsColumn.cadence,
          AnalysisSportsColumn.totalFeedbackEnergy,
        ]);
        break;
      case SportType.cycle:
      case SportType.row:
        list = list.concat([
          AnalysisSportsColumn.distance,
          AnalysisSportsColumn.speedOrPace,
          AnalysisSportsColumn.cadence,
          AnalysisSportsColumn.power,
          // AnalysisSportsColumn.totalFeedbackEnergy
        ]);
        break;
      case SportType.weightTrain:
        break;
      case SportType.swim:
        list = list.concat([
          AnalysisSportsColumn.distance,
          AnalysisSportsColumn.speedOrPace,
          AnalysisSportsColumn.cadence,
        ]);
        break;
      case SportType.ball:
        list = list.concat([AnalysisSportsColumn.distance]);
        break;
    }

    this.itemList = list
      .sort((a, b) => a - b)
      .map((_item) => new AnalysisOneOption({ item: _item }));

    this.storageKey = `personalReport-chart-${sportType}`;
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
      AnalysisSportsColumn.averageHeartRate,
      AnalysisSportsColumn.hrChart,
    ];
  }
}
