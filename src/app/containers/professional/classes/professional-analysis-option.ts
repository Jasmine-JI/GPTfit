import { GroupLevel } from '../../../shared/enum/professional';
import { SportType } from '../../../shared/enum/sports';
import { AnalysisSportsColumn } from '../../../shared/enum/report-analysis';
import { of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AnalysisOneOption } from '../../../shared/classes/analysis-one-option';
import { AnalysisOption } from '../../../shared/classes/analysis-option';

/**
 * 群組報告內團體與個人分析項目可設定的選項
 */
export class ProfessionalAnalysisOption extends AnalysisOption {
  /**
   * 群組篩選項目清單
   */
  private _layerList: Array<AnalysisOneOption> = [];

  /**
   * 取得階層清單
   */
  get layerList() {
    return this._layerList;
  }

  /**
   * 根據頁面與區塊，建立可選擇的選項清單
   */
  createOptionList() {
    const { currentGroupLevel } = this.optionInfo;
    of(currentGroupLevel)
      .pipe(
        tap((level) => this.handleGroupOption(level)),
        tap(() => this.createOption()),
        tap(() => this.checkStorage()),
        tap(() => this.checkOverLimit()),
        tap(() => this.fillItem())
      )
      .subscribe();
  }

  /**
   * 建立選項
   */
  createOption() {
    const { object } = this.optionInfo;
    if (object === 'group') return this.createGroupSportOption();
    return this.createPersonalSportOption();
  }

  /**
   * 建立可選擇的群組選項清單
   * @param level {GroupLevel}-群組階層
   */
  handleGroupOption(level: GroupLevel) {
    this._layerList = [];
    if (level <= GroupLevel.branch) {
      this._layerList.unshift(new AnalysisOneOption({ level: GroupLevel.class }, true));
      this._layerList.unshift(new AnalysisOneOption({ level: GroupLevel.branch }, true));
    }

    if (level <= GroupLevel.brand) {
      this._layerList.unshift(new AnalysisOneOption({ level: GroupLevel.brand }, true));
    }

    return;
  }

  /**
   * 建立運動報告團體分析可選擇的欄位選項清單
   */
  createGroupSportOption() {
    const { sportType } = this.optionInfo;
    let list = [
      AnalysisSportsColumn.targetAchievedRate,
      AnalysisSportsColumn.activityPeople,
      AnalysisSportsColumn.activities,
      AnalysisSportsColumn.totalSecond,
      AnalysisSportsColumn.calories,
      AnalysisSportsColumn.averageHeartRate,
      AnalysisSportsColumn.hrChart,
    ];

    switch (sportType) {
      case SportType.all:
        list = list.concat([AnalysisSportsColumn.benefitTime, AnalysisSportsColumn.pai]);
        break;
      case SportType.run:
      case SportType.swim:
        list = list.concat([
          AnalysisSportsColumn.distance,
          AnalysisSportsColumn.speedOrPace,
          AnalysisSportsColumn.cadence,
        ]);
        break;
      case SportType.cycle:
      case SportType.row:
        list = list.concat([
          AnalysisSportsColumn.distance,
          AnalysisSportsColumn.speedOrPace,
          AnalysisSportsColumn.cadence,
          AnalysisSportsColumn.power,
        ]);
        break;
      case SportType.weightTrain:
        list = list.concat([AnalysisSportsColumn.totalActivitySecond]);
        break;
      case SportType.ball:
        list = list.concat([AnalysisSportsColumn.distance]);
        break;
    }

    this.itemList = list
      .sort((a, b) => a - b)
      .map((_item) => new AnalysisOneOption({ item: _item }));

    this.storageKey = `groupReport-${sportType}`;
    return;
  }

  /**
   * 建立運動報告個人分析可選擇的欄位選項清單
   */
  createPersonalSportOption() {
    const { sportType } = this.optionInfo;
    let list = [
      AnalysisSportsColumn.targetAchievedRate,
      AnalysisSportsColumn.activities,
      AnalysisSportsColumn.totalSecond,
      AnalysisSportsColumn.calories,
      AnalysisSportsColumn.averageHeartRate,
      AnalysisSportsColumn.hrChart,
    ];

    switch (sportType) {
      case SportType.all:
        list = list.concat([
          AnalysisSportsColumn.benefitTime,
          AnalysisSportsColumn.pai,
          AnalysisSportsColumn.preferSports,
        ]);
        break;
      case SportType.run:
      case SportType.swim:
        list = list.concat([
          AnalysisSportsColumn.distance,
          AnalysisSportsColumn.speedOrPace,
          AnalysisSportsColumn.cadence,
        ]);
        break;
      case SportType.cycle:
      case SportType.row:
        list = list.concat([
          AnalysisSportsColumn.distance,
          AnalysisSportsColumn.speedOrPace,
          AnalysisSportsColumn.cadence,
          AnalysisSportsColumn.power,
        ]);
        break;
      case SportType.weightTrain:
        list = list.concat([
          AnalysisSportsColumn.totalActivitySecond,
          AnalysisSportsColumn.preferMuscle,
          AnalysisSportsColumn.armMuscle,
          AnalysisSportsColumn.pectoralsMuscle,
          AnalysisSportsColumn.shoulderMuscle,
          AnalysisSportsColumn.backMuscle,
          AnalysisSportsColumn.abdominalMuscle,
          AnalysisSportsColumn.legMuscle,
        ]);
        break;
      case SportType.ball:
        list = list.concat([AnalysisSportsColumn.distance]);
        break;
    }

    this.itemList = list
      .sort((a, b) => a - b)
      .map((_item) => new AnalysisOneOption({ item: _item }));

    this.storageKey = `groupReport-${sportType}`;
    return;
  }

  /**
   * 設定預設選擇的項目
   */
  getDefaultOption() {
    const { object } = this.optionInfo;
    if (object === 'group') {
      return [
        AnalysisSportsColumn.targetAchievedRate,
        AnalysisSportsColumn.activityPeople,
        AnalysisSportsColumn.activities,
        AnalysisSportsColumn.totalSecond,
        AnalysisSportsColumn.hrChart,
      ];
    }

    return [
      AnalysisSportsColumn.targetAchievedRate,
      AnalysisSportsColumn.activities,
      AnalysisSportsColumn.totalSecond,
      AnalysisSportsColumn.averageHeartRate,
      AnalysisSportsColumn.hrChart,
    ];
  }

  /**
   * 取得特定階層選擇狀態
   * @param level {GroupLevel}-群組階層
   */
  getLayerSelectStatus(level: GroupLevel) {
    // 若沒有階層清單代表為課程階，必為選擇狀態
    if (this.layerList.length === 0) return true;
    const index = this._layerList.findIndex((_layer) => _layer.info.level === level);
    return this._layerList[index].selected;
  }
}
