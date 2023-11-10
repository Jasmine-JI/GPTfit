import {
  Api2103Response,
  SportsFileInfo,
  ActivityInfo,
  ActivityLap,
  ActivityPoint,
} from '../../../core/models/api/api-21xx';
import { of } from 'rxjs';
import { tap, map } from 'rxjs/operators';
import { deepCopy } from '../../../core/utils';
import {
  SportsFilePoint,
  SportsFileGpsPoint,
  SportsFileSpeedPoint,
  SportsFileRunPacePoint,
  SportsFileSwimPacePoint,
  SportsFileRowPacePoint,
  SportsFileAltitudePoint,
  SportsFileTempPoint,
  WeightTrain,
} from './index';
import { DataUnitType } from '../../../core/enums/common';
import { SportType, MuscleCode, WeightTrainingLevel } from '../../../core/enums/sports';
import { WeightTrainingInfo } from '../../../core/models/api/api-common';

/**
 * 將運動檔案數據處理為各區塊圖表所需資訊
 */
export class SportsDetailHandler {
  /**
   * 運動檔案原始資料
   */
  private _file: Api2103Response;

  /**
   * 心率區間圖表用數據
   */
  private _hrZoneArr: Array<number>;

  /**
   * gps路徑
   */
  private _latLngPath: SportsFileGpsPoint;

  /**
   * point心率數據
   */
  private _hr: SportsFilePoint;

  /**
   * point速度數據
   */
  private _speedPace:
    | SportsFileSpeedPoint
    | SportsFileRunPacePoint
    | SportsFileSwimPacePoint
    | SportsFileRowPacePoint;

  /**
   * point海拔數據
   */
  private _altitude: SportsFileAltitudePoint;

  /**
   * point步頻數據
   */
  private _runCadence: SportsFilePoint;

  /**
   * point溫度數據
   */
  private _temp: SportsFileTempPoint;

  /**
   * point踏頻數據
   */
  private _cycleCadence: SportsFilePoint;

  /**
   * point功率數據
   */
  private _cycleWatt: SportsFilePoint;

  /**
   * point重訓動作節奏數據
   */
  private _moveRepetitions: SportsFilePoint;

  /**
   * point划頻數據
   */
  private _swimCadence: SportsFilePoint;

  /**
   * point槳頻數據
   */
  private _rowCadence: SportsFilePoint;

  /**
   * point划船功率數據
   */
  private _rowWatt: SportsFilePoint;

  /**
   * 重訓概要資訊
   */
  private _weightTrainData: WeightTrain;

  /**
   * 使用者使用單位
   */
  private _unit = DataUnitType.metric;

  /**
   * 使用者體重
   */
  private _bodyWeight = 60;

  /**
   * 重訓程度
   */
  private _weightTrainLevel = WeightTrainingLevel.metacarpus;

  /**
   * @param data 運動檔案詳細
   * @param args.unit 使用者使用公英制
   * @param bodyWeight 使用者體重
   */
  constructor(
    data: Api2103Response,
    args: {
      unit: DataUnitType;
      bodyWeight?: number;
      weightTrainLevel?: WeightTrainingLevel;
      hrRange?: Array<number>;
    }
  ) {
    if (args) {
      const { unit, bodyWeight, weightTrainLevel } = args;
      this._unit = unit;
      if (bodyWeight) this._bodyWeight = bodyWeight;
      if (weightTrainLevel) this._weightTrainLevel = weightTrainLevel;
    }

    this._file = data;
    console.log('successss', this._file);

    this.initializeChartData(data);
    this.handleFile(data);
  }

  /**
   * 取得檔案資訊
   */
  get fileInfo() {
    return this._file.fileInfo;
  }

  /**
   * 取得概要資訊
   */
  get activityInfoLayer() {
    return this._file.activityInfoLayer;
  }

  /**
   * 取得分段資訊
   */
  get activityLapLayer() {
    return this._file.activityLapLayer;
  }

  /**
   * 取得分點資訊
   */
  get activityPointLayer() {
    return this._file.activityPointLayer;
  }

  /**
   * 取得心率區間陣列
   */
  get hrZoneArray() {
    return this._hrZoneArr;
  }

  /**
   * 取得完整gps路徑
   */
  get gpsPath() {
    return this._latLngPath;
  }

  /**
   * 取得 hr 數據
   */
  get hr() {
    return this._hr;
  }

  /**
   * 取得速度數據
   */
  get speedPace() {
    return this._speedPace;
  }

  /**
   * 取得海拔數據
   */
  get altitude() {
    return this._altitude;
  }

  /**
   * 取得步頻數據
   */
  get runCadence() {
    return this._runCadence;
  }

  /**
   * 取得溫度數據
   */
  get temp() {
    return this._temp;
  }

  /**
   * 取得踏頻數據
   */
  get cycleCadence() {
    return this._cycleCadence;
  }

  /**
   * 取得騎乘功率數據
   */
  get cycleWatt() {
    return this._cycleWatt;
  }

  /**
   * 取得重訓動作節奏數據
   */
  get moveRepetitions() {
    return this._moveRepetitions;
  }

  /**
   * 取得游泳划頻數據
   */
  get swimCadence() {
    return this._swimCadence;
  }

  /**
   * 取得槳頻數據
   */
  get rowCadence() {
    return this._rowCadence;
  }

  /**
   * 取得划船功率數據
   */
  get rowWatt() {
    return this._rowWatt;
  }

  /**
   * 取得肌群概要資訊
   */
  get weightTrainData() {
    return this._weightTrainData;
  }

  /**
   * 確認是否有任一有效趨勢圖
   */
  get haveEffectTrend() {
    const {
      _hr,
      _speedPace,
      _altitude,
      _runCadence,
      _temp,
      _cycleCadence,
      _cycleWatt,
      _moveRepetitions,
      _swimCadence,
      _rowCadence,
      _rowWatt,
    } = this;

    return (
      _hr.hasEffectValue ||
      _speedPace.hasEffectValue ||
      _altitude.hasEffectValue ||
      _runCadence.hasEffectValue ||
      _temp.hasEffectValue ||
      _cycleCadence.hasEffectValue ||
      _cycleWatt.hasEffectValue ||
      _moveRepetitions.hasEffectValue ||
      _swimCadence.hasEffectValue ||
      _rowCadence.hasEffectValue ||
      _rowWatt.hasEffectValue
    );
  }

  /**
   * 變更檔案名稱
   * @param name 檔案名稱
   */
  set fileName(name: string) {
    this._file.fileInfo.dispName = name;
  }

  /**
   * 變更檔案圖片
   */
  set photo(url: string) {
    this._file.fileInfo.photo = url;
  }

  /**
   * 初始化趨勢圖表數據
   * @param data 運動檔案數據
   */
  private initializeChartData(data: Api2103Response) {
    const { _unit } = this;
    this._latLngPath = new SportsFileGpsPoint();
    this._hr = new SportsFilePoint();
    this._speedPace = this.getPointClass(data, _unit);
    this._altitude = new SportsFileAltitudePoint({ unit: _unit });
    this._runCadence = new SportsFilePoint();
    this._temp = new SportsFileTempPoint({ unit: _unit });
    this._cycleCadence = new SportsFilePoint();
    this._cycleWatt = new SportsFilePoint();
    this._moveRepetitions = new SportsFilePoint();
    this._swimCadence = new SportsFilePoint();
    this._rowCadence = new SportsFilePoint();
    this._rowWatt = new SportsFilePoint();
  }

  /**
   * 根據運動類別取得對應的處理速度點數據class
   * @param data 運動檔案數據
   * @param unit 使用者使用單位
   */
  private getPointClass(data: Api2103Response, unit: DataUnitType) {
    const handler = {
      [SportType.run]: SportsFileRunPacePoint,
      [SportType.swim]: SportsFileRunPacePoint,
      [SportType.row]: SportsFileRunPacePoint,
    };
    const type = +data.activityInfoLayer.type;
    return new (handler[type] ?? SportsFileSpeedPoint)({ unit });
  }

  /**
   * 將運動檔案數據處理為各區塊圖表所需資訊
   * @param file 運動檔案詳細
   */
  private handleFile(file: Api2103Response) {
    of(file)
      .pipe(
        map((file) => this.handleComplexFile(file)),
        tap((file) => this.handleMuscleData(file)),
        tap((file) => (this._hrZoneArr = this.getHrZoneArr(file))),
        tap((file) => this.handlePoint(file))
      )
      .subscribe();
  }

  /**
   * 若為複合式運動則將子檔案point接起來，以顯示趨勢圖表
   * @param file 運動檔案數據
   */
  private handleComplexFile(file: Api2103Response) {
    const {
      activityInfoLayer: { type },
      info,
    } = file;
    if (+type !== SportType.complex) return file;

    let totalIndex = 0;
    const tmpMap = new Map<string, Array<any>>(); // 用來先將同類別數據串接
    info?.forEach((_file) => {
      const activityPointLayer = deepCopy(_file.activityPointLayer);
      const _keyList = activityPointLayer.shift() as Array<string>;
      activityPointLayer.forEach((_point) => {
        (_point as Array<any>).forEach((_value, _index) => {
          const _keyName = _keyList[_index];
          const dataArr = tmpMap.get(_keyName) ?? [];
          dataArr.push([totalIndex, _value]);
          tmpMap.set(_keyName, dataArr);
        });

        totalIndex++;
      });
    });

    file.activityPointLayer = this.handleTempMap(tmpMap, totalIndex);
    return file;
  }

  /**
   * 將各肌肉部位依所屬肌群個別加總以計算各肌群數據
   * @param file 運動檔案數據
   */
  private handleMuscleData(file: Api2103Response) {
    const {
      activityInfoLayer: { type, useViceMuscle, weightTrainingInfo },
    } = file;
    if (+type === SportType.weightTrain) {
      const { _bodyWeight, _weightTrainLevel } = this;
      this._weightTrainData = new WeightTrain(weightTrainingInfo as Array<WeightTrainingInfo>, {
        useViceMuscle: useViceMuscle as Array<MuscleCode>,
        bodyWeight: _bodyWeight,
        trainingLevel: _weightTrainLevel,
      });
    }
  }

  /**
   * 將各類別數據map轉回原本Api 2103 point格式
   * @param tmpMap
   * @param totalIndex
   */
  private handleTempMap(tmpMap: Map<string, Array<any>>, totalIndex: number) {
    let i = 0;
    const result = [Array.from(tmpMap.keys())] as Array<Array<string | number | null>>;
    while (i < totalIndex) {
      const valueArr = [] as Array<string | number | null>;
      const keyArr = result[0] as Array<string>;
      keyArr.forEach((_key) => {
        if (_key === 'pointSecond') {
          valueArr.push(i * 3); // 時間序重製
        } else {
          const dataArray = tmpMap.get(_key) ?? [];
          const [_totalIndex, _value] = dataArray[0] ?? [null, null];
          if (_totalIndex === i) {
            valueArr.push(_value);
            tmpMap.get(_key)?.shift(); // 透過call by reference機制直接修改Map內的值
          } else {
            valueArr.push(0);
          }
        }
      });

      result.push(valueArr);
      i++;
    }

    return result;
  }

  /**
   * 取得鍵名索引
   * @param keyArray 鍵名陣列
   */
  private getKeyIndex(keyArray: Array<string>) {
    return keyArray.reduce((prev, curr, index) => {
      return { ...prev, [curr]: index };
    }, {});
  }

  /**
   * 取得心率區間陣列
   * @param file 運動檔案詳細
   */
  private getHrZoneArr(file: Api2103Response) {
    const {
      totalHrZone0Second,
      totalHrZone1Second,
      totalHrZone2Second,
      totalHrZone3Second,
      totalHrZone4Second,
      totalHrZone5Second,
    } = file.activityInfoLayer;

    return [
      totalHrZone0Second ?? 0,
      totalHrZone1Second ?? 0,
      totalHrZone2Second ?? 0,
      totalHrZone3Second ?? 0,
      totalHrZone4Second ?? 0,
      totalHrZone5Second ?? 0,
    ];
  }

  /**
   * 處理分點資訊為各區塊所需數據
   * @param file 運動檔案詳細
   */
  private handlePoint(file: Api2103Response) {
    const activityPointLayer = deepCopy(file.activityPointLayer as Array<any>);
    const keyArray = activityPointLayer.shift() as Array<string>;
    const keyIndex = this.getKeyIndex(keyArray);
    const pointSecondIndex = keyIndex['pointSecond'];
    const latIndex = keyIndex['latitudeDegrees'];
    const lngIndex = keyIndex['longitudeDegrees'];
    const hrIndex = keyIndex['heartRateBpm'];
    const speedIndex = keyIndex['speed'];
    const altitudeIndex = keyIndex['altitudeMeters'];
    const runCadenceIndex = keyIndex['runCadence'];
    const tempIndex = keyIndex['temp'];
    const cycleCadenceIndex = keyIndex['cycleCadence'];
    const cycleWattIndex = keyIndex['cycleWatt'];
    const moveRepetitionsIndex = keyIndex['moveRepetitions'];
    const swimCadenceIndex = keyIndex['swimCadence'];
    const rowingCadenceIndex = keyIndex['rowingCadence'];
    const rowingWattIndex = keyIndex['rowingWatt'];

    activityPointLayer.forEach((_point) => {
      const second = _point[pointSecondIndex];
      if (latIndex != null && lngIndex != null)
        this._latLngPath.handleChartData(second, _point[latIndex], _point[lngIndex]);
      if (hrIndex != null) this._hr.handleChartData(second, _point[hrIndex]);
      if (speedIndex != null) this._speedPace.handleChartData(second, _point[speedIndex]);
      if (altitudeIndex != null) this._altitude.handleChartData(second, _point[altitudeIndex]);
      if (runCadenceIndex != null)
        this._runCadence.handleChartData(second, _point[runCadenceIndex]);
      if (tempIndex != null) this._temp.handleChartData(second, _point[tempIndex]);
      if (cycleCadenceIndex != null)
        this._cycleCadence.handleChartData(second, _point[cycleCadenceIndex]);
      if (cycleWattIndex != null) this._cycleWatt.handleChartData(second, _point[cycleWattIndex]);
      if (moveRepetitionsIndex != null)
        this._moveRepetitions.handleChartData(second, _point[moveRepetitionsIndex]);
      if (swimCadenceIndex != null)
        this._swimCadence.handleChartData(second, _point[swimCadenceIndex]);
      if (rowingCadenceIndex != null)
        this._rowCadence.handleChartData(second, _point[rowingCadenceIndex]);
      if (rowingWattIndex != null) this._rowWatt.handleChartData(second, _point[rowingWattIndex]);
    });
  }
}
