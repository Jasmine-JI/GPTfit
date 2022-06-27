import dayjs from 'dayjs';
import quarterOfYear from 'dayjs/plugin/quarterOfYear';
import { WeightTrainingInfo } from '../../models/weight-train';
import { MuscleGroup, MuscleCode, Proficiency, WeightTrainingLevel } from '../../enum/weight-train';
import { mathRounding } from '../../utils/index';
import { WEIGHT_TRAIN_COLOR } from '../../models/chart-data';
import { deepCopy } from '../../utils/index';
import { getCorrespondingMuscleGroup } from '../../utils/sports';
import { ReportDateType } from '../../models/report-condition';


dayjs.extend(quarterOfYear);


/**
 * 重訓肌群與肌肉部位疊合趨勢圖之數據
 */
const trendModel = [
  {
    name: 'universal_activityData_max1Rm',
    linkedTo: 'base',
    pointPlacement: 0.1,
    data: []
  },
  {
    name: 'universal_activityData_avgWeight',
    id: 'base',
    showInLegend: false,
    data: []
  }
];


/**
 * 處理 api 2104 response
 */
export class WeightTrainingTrend {

  /**
   * 使用者體重
   */
  private _bodyWeight: number;

  /**
   * 重訓程度計算參數
   */
  private _proficiency: Proficiency;

  /**
   * 基準或比較日期範圍期間各時間前同部位最大1RM
   */
  private _max1RMTrendData = {
    base: [],
    compare: []
  };

  /**
   * 紀錄各部位最大1RM數據
   */
  private _max1RM = {
    base: {},
    compare: {}
  };

  /**
   * 紀錄每一筆數據之日期（不管有無重訓數據與否），方便後續補零用
   */
  private _allDateList = [];

  /**
   * 期間同部位訓練趨勢數據
   */
  private _partTrainingData = {};

  /**
   * 期間同肌群訓練趨勢數據
   */
  private _groupTrainingData = {};

  /**
   * 用來暫存同肌群數據
   */
  private _sameGroupData = {};

  constructor(
    level: WeightTrainingLevel = WeightTrainingLevel.metacarpus,
    bodyWeight: number = 60
  ) {
    this._proficiency = this.getProficiency(level);
    this._bodyWeight = bodyWeight;
  }

  /**
   * 根據使用者設定之重訓程度取得係數，以用於顏色呈現設定
   * @param level {WeightTrainingLevel}-使用者設定之重訓程度
   */
  getProficiency(level: WeightTrainingLevel): Proficiency {
    switch (level) {
      case WeightTrainingLevel.asept:
        return Proficiency.asept;
      case WeightTrainingLevel.metacarpus:
        return Proficiency.metacarpus;
      case WeightTrainingLevel.novice:
        return Proficiency.novice;
    }

  }

  /**
   * 新增重訓數據
   * @param type {ReportDateType}-報告日期範圍類別
   * @param info {Array<WeightTrainingInfo>}-重訓數據
   * @param dateRange {Array<number>}-該數據時間範圍
   */
  addTrainData(type: ReportDateType, info: Array<WeightTrainingInfo>, dateRange: Array<number>) {
    this._allDateList.push(dateRange);
    this._max1RMTrendData[type].push({ dateRange, max1RM: {} });
    this._sameGroupData = {};
    info.forEach(_info => {
      const { max1RmWeightKg, muscle } = _info;
      const currentMax1RM = this._max1RM[type][muscle];
      // 1RM取該部位目前最大值
      this._max1RM[type][muscle] = !currentMax1RM || currentMax1RM < max1RmWeightKg ? max1RmWeightKg : currentMax1RM;
      if (type === 'base') {
        this.handlePartTrainingData(_info, dateRange);
        this.mergeSameMuscleGroup(_info);
      }

    });

    this.handlePartMax1RMData(type);
    if (type === 'base') this.handleGroupTrainingData(dateRange);
  }

  /**
   * 紀錄各部位至該時間之前的最大1RM
   * @param type {ReportDateType}-報告日期範圍類別
   */
  handlePartMax1RMData(type: ReportDateType) {
    const max1RMData = this._max1RMTrendData[type];
    const currentDataLength = max1RMData.length - 1;
    this._max1RMTrendData[type][currentDataLength].max1RM = {
      ...this.setMuscleMapColor(this._max1RM[type])
    };

  }

  /**
   * 根據使用者體重、訓練程度設定與訓練數據設定肌肉地圖顏色
   * @param data {any}-各肌肉部位1RM
   */
  setMuscleMapColor(data: any) {
    const result = {};
    Object.entries(data).forEach(_data => {
      const [_key, _value] = _data;
      Object.assign(result, { [_key]: this.setColor(_value as number).max1RMColor });
    });

    return result;
  }

  /**
   * 紀錄各部位該期間1RM與平均重量
   * @param partInfo {WeightTrainingInfo}-重訓數據
   * @param dateRange {Array<number>}-該數據日期範圍
   */
  handlePartTrainingData(partInfo: WeightTrainingInfo, dateRange: Array<number>) {
    const { max1RmWeightKg, muscle, totalWeightKg, totalReps } = partInfo;
    const avgWeight = mathRounding(totalWeightKg / totalReps, 3);
    const [startDate, ...rest] = dateRange;
    if (!this._partTrainingData[muscle]) this._partTrainingData[muscle] = deepCopy(trendModel);

    const [max1RMData, avgWeightData] = this._partTrainingData[muscle];
    const { max1RMColor, avgWeightColor } = this.setColor(max1RmWeightKg, false);
    max1RMData.data.push({ x: startDate, y: max1RmWeightKg, color: max1RMColor, additionalInfo: dateRange });
    avgWeightData.data.push({ x: startDate, y: avgWeight, color: avgWeightColor, additionalInfo: dateRange });
  }

  /**
   * 紀錄各肌群該期間1RM與平均重量
   * @param dateRange {Array<number>}-該數據日期範圍
   */
  handleGroupTrainingData(dateRange: Array<number>) {
    const { _sameGroupData } = this;
    const [startDate, ...rest] = dateRange;
    Object.entries(_sameGroupData).forEach(_muscleGroupData => {
      const [_muscleCode, _data] = _muscleGroupData;
      const { max1RM, totalWeight, totalReps } = _data as any;
      const avgWeight = mathRounding(totalWeight / totalReps, 3);
      if (!this._groupTrainingData[_muscleCode]) this._groupTrainingData[_muscleCode] = deepCopy(trendModel);

      const [max1RMData, avgWeightData] = this._groupTrainingData[_muscleCode];
      const { max1RMColor, avgWeightColor } = this.setColor(max1RM, false);
      max1RMData.data.push({ x: startDate, y: max1RM, color: max1RMColor, additionalInfo: dateRange });
      avgWeightData.data.push({ x: startDate, y: avgWeight, color: avgWeightColor, additionalInfo: dateRange });
    });

  }

  /**
   * 根據使用者設定訓練程度設定呈現顏色
   * @param max1RM {number}-最大1RM
   */
  setColor(max1RM: number, useInMuscleMap: boolean = true) {
    const { saturation, brightnessFor1RM, brightnessForAvgWeight, transparency } = WEIGHT_TRAIN_COLOR;
    const { _bodyWeight, _proficiency } = this;
    const transparencyPercentage = useInMuscleMap ? transparency : 1;
    let hue = Math.round(200 - ((max1RM / _bodyWeight) * 100 * _proficiency));
    if (hue < 0) hue = 0;
    if (hue > 200) hue = 200;

    return {
      max1RMColor: `hsla(${hue}, ${saturation}, ${brightnessFor1RM}, ${transparencyPercentage})`,
      avgWeightColor: `hsla(${hue}, ${saturation}, ${brightnessForAvgWeight}, ${transparencyPercentage})`
    };

  }

  /**
   * 合併同肌群之肌肉部位數據
   */
  mergeSameMuscleGroup(partInfo: WeightTrainingInfo) {
    const { max1RmWeightKg: current1RM, muscle, totalWeightKg: currentWeight, totalReps: currentReps } = partInfo;
    const muscleGroup = getCorrespondingMuscleGroup(muscle);
    if (!this._sameGroupData[muscleGroup]) {
      this._sameGroupData[muscleGroup] = {
        max1RM: current1RM,
        totalWeight: currentWeight,
        totalReps: currentReps,
      };
    } else {
      const { max1RM, totalWeight, totalReps } = this._sameGroupData[muscleGroup];
      this._sameGroupData[muscleGroup] = {
        max1RM: max1RM < current1RM ? current1RM : max1RM,
        totalWeight: totalWeight + currentWeight,
        totalReps: totalReps + currentReps,
      };

    }

  }

  /**
   * 將各肌群或部位趨勢數據的日期補齊，讓不同圖表的日期位置可以對齊
   * @param dataArray {any}-重訓趨勢數據
   */
  fillupDate(dataArray: any) {
    let index = 0;
    const maxData = [];
    const avgData = [];
    const fillup = (obj: any) => {
      maxData.push(obj)
      avgData.push(obj);
    };

    this._allDateList.forEach(_date => {
      const [_startDate, ...rest] = _date;
      const filler = { x: _startDate, y: 0, additionalInfo: _date };
      const currentIndexData = dataArray[0].data[index];
      if (!currentIndexData) {
        fillup(filler);
      } else {
        const [startDate, ...rest] = currentIndexData.additionalInfo;
        if (_startDate !== startDate) {
          fillup(filler);
        } else {
          maxData.push(dataArray[0].data[index]);
          avgData.push(dataArray[1].data[index]);
          index++;
        }

      }

    });

    dataArray[0].data = maxData;
    dataArray[1].data = avgData;
    return dataArray;
  }

  /**
   * 取得期間各時間前同部位最大1RM數據
   */
  get max1RMTrendData() {
    return this._max1RMTrendData;
  }

  /**
   * 取得期間同部位訓練趨勢數據
   */
  get partTrainingData() {
    let result = {};
    for (let _muscleCode in this._partTrainingData as any) {
      const muscleCode = +_muscleCode as MuscleCode;
      const muscleGroup = getCorrespondingMuscleGroup(muscleCode);
      const _data = this._partTrainingData[_muscleCode];
      const dataInfo = { muscleCode, data: this.fillupDate(_data) };
      result[muscleGroup] ?
        result[muscleGroup].info.push(dataInfo) : Object.assign(result, { [muscleGroup]: { unfold: false, info: [dataInfo] } });
    }

    return result;
  }

  /**
   * 取得期間同肌群訓練趨勢數據
   */
  get groupTrainingData() {
    return Object.entries(this._groupTrainingData).map(([_muscleGroup, _data]) => {
      return { index: _muscleGroup, data: this.fillupDate(_data) };
    });

  }

}