import { Lang } from '../../models/i18n';
import { ReportDateType } from '../../models/report-condition';
import { getCorrespondingMuscleGroup } from '../../../core/utils/sports';
import { MuscleCode } from '../../enum/weight-train';

/**
 * 處理重訓運動檔案訓練菜單分析
 */
export class WeightTrainingAnalysis {
  /**
   * 個別重訓動作名稱
   */
  private _menuDispName = {};

  /**
   * 重訓名稱與sortIndex對照表，方便取得sortIndex
   */
  private _dispNameComparison = new Map();

  /**
   * 基準日期範圍個別重訓動作概要物件
   */
  private _menuObj = {};

  /**
   * 個別重訓動作概要陣列
   */
  private _menuList = [];

  private _bodyWeight: number;

  constructor(menuConfig: Array<any>, bodyWeight = 60) {
    this._bodyWeight = bodyWeight;
    this.handleMenuDispName(menuConfig);
  }

  /**
   * 將重訓安裝檔動作資訊轉成以sortIndex為key的物件，以方便使用
   * @param menuConfig {Array<any>}-重訓安裝檔動作菜單資訊
   */
  handleMenuDispName(menuConfig: Array<any>) {
    menuConfig.forEach((_menu) => {
      const { dispName, sortIndex, setWorkOutMuscleMain } = _menu;
      this._menuDispName[sortIndex] = {
        dispName,
        belongMuscleGroup: this.getBelongMuscleGroupList(setWorkOutMuscleMain),
      };

      dispName.forEach((_dispName) => {
        const { disp } = _dispName;
        this._dispNameComparison.set(disp, sortIndex);
      });
    });
  }

  /**
   * 根據訓練肌肉部位取得該訓練肌群
   * @param partList {Array<string>}-肌肉訓練部位清單
   */
  getBelongMuscleGroupList(partList: Array<string>) {
    const groupSet = new Set();
    partList.forEach((_part) => {
      groupSet.add(getCorrespondingMuscleGroup(+_part as MuscleCode));
    });

    return Array.from(groupSet);
  }

  /**
   * 將動作菜單之各項數據進行加總
   * @param dateType {ReportDateType}-報告日期範圍類別
   * @param lap {any}-運動檔案lap部份資訊
   */
  countLapTrainingData(dateType: ReportDateType, lap: any) {
    const { dispName, sortIndex, type, setOneRepMax, setTotalReps, setTotalWeightKg } = lap;
    const notRestLap = type == 0;
    const isEffectIndex = sortIndex && +sortIndex > 0;
    if (notRestLap) {
      const menuIndex = isEffectIndex ? sortIndex : this._dispNameComparison.get(dispName);
      const specificMenuData = this._menuObj[menuIndex];
      if (!specificMenuData) {
        const countModel = {
          totalSets: 0,
          totalReps: 0,
          totalWeightKg: 0,
          oneRepMax: 0,
          totalOneRepMax: 0,
        };

        Object.assign(this._menuObj, { [menuIndex]: { base: countModel, compare: countModel } });
      }

      const currentLapData = this._menuObj[menuIndex][dateType];
      const { totalSets, totalReps, totalWeightKg, oneRepMax, totalOneRepMax } = currentLapData;
      this._menuObj[menuIndex][dateType] = {
        totalSets: totalSets + 1,
        totalReps: totalReps + setTotalReps,
        totalWeightKg: totalWeightKg + setTotalWeightKg,
        oneRepMax: oneRepMax < setOneRepMax ? setOneRepMax : oneRepMax,
        totalOneRepMax: totalOneRepMax + setOneRepMax,
      };
    }
  }

  /**
   * 將基準與比較數據合併為一清單
   */
  combineList() {
    const getTrainingLevel = (totalSets, totalOneRepMax) => {
      if (!totalSets) return 0;
      return Math.round((totalOneRepMax / totalSets / this._bodyWeight) * 100);
    };

    this._menuList = Object.keys(this._menuObj).map((_key) => {
      const { base, compare } = this._menuObj[_key];
      const {
        totalSets: baseTotalSets,
        totalOneRepMax: baseTotalOneRepMax,
        totalWeightKg: baseTotalWeightKg,
      } = base;
      const {
        totalSets: compareTotalSets,
        totalOneRepMax: compareTotalOneRepMax,
        totalWeightKg: compareTotalWeightKg,
      } = compare;
      base.avgWeightKg = Math.round(baseTotalWeightKg / (baseTotalSets ?? Infinity));
      base.trainingLevel = getTrainingLevel(baseTotalSets, baseTotalOneRepMax);
      compare.avgWeightKg = Math.round(compareTotalWeightKg / (compareTotalSets ?? Infinity));
      compare.trainingLevel = getTrainingLevel(compareTotalSets, compareTotalOneRepMax);
      return [_key, { base, compare }];
    });
  }

  /**
   * 根據多國語序回傳該菜單名稱
   * @param sortIndex {string}-動作菜單序號
   * @param lang {Lang}-目前使用的多國語系
   */
  getDispName(sortIndex: string, lang: Lang) {
    let i18nIndex: number;
    switch (lang) {
      case 'zh-tw':
        i18nIndex = 0;
        break;
      case 'zh-cn':
        i18nIndex = 1;
        break;
      default:
        i18nIndex = 2;
        break;
    }

    return this._menuDispName[sortIndex].dispName[i18nIndex].disp;
  }

  /**
   * 取得該重訓動作訓練之肌群
   * @param sortIndex {string}-重訓動作編號
   */
  getBelongMuscleGroup(sortIndex: string) {
    return this._menuDispName[sortIndex].belongMuscleGroup;
  }

  /**
   * 取得基準日期範圍所有動作菜單概要資訊
   */
  get menuList() {
    return this._menuList;
  }
}
