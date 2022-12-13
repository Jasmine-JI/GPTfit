import { FileSimpleInfo } from '../../../core/models/compo';
import { mathRounding, deepCopy } from '../../../core/utils';

/**
 * 處理複合式運動檔案
 */
export class ComplexSportsHandler {
  /**
   * 整理過的檔案列表，順序為 總覽->lap_1->lap_2->...
   */
  private _fileList: Array<any> = [];

  constructor(file: any) {
    this._fileList = Array.isArray(file)
      ? this.handleJoinModeData(file)
      : this.restructureFile(file);
  }

  /**
   * 將api 2111 response的數據合併
   * @param file {Array<any>}-api 2111 response
   */
  handleJoinModeData(file: Array<any>) {
    const simulationFile: any = {};
    let totalHeartRateBpm = 0;
    let effectHrPointNum = 0;
    let totalSpeed = 0;
    let calories = 0;
    let maxHeartRateBpm = 0;
    let maxSpeed = 0;
    let startTime = '';
    let totalDistanceMeters = 0;
    let totalHrZone0Second = 0;
    let totalHrZone1Second = 0;
    let totalHrZone2Second = 0;
    let totalHrZone3Second = 0;
    let totalHrZone4Second = 0;
    let totalHrZone5Second = 0;
    let avgTemp = 0;
    let effectTempLength = 0;
    let maxTemp = null;
    let minTemp = null;
    let totalSecond = 0;
    let totalActivitySecond = 0;
    let totalRestSecond = 0;

    file.forEach((_file, _index) => {
      const { activityInfoLayer, fileInfo } = _file;
      const {
        avgHeartRateBpm,
        avgSpeed,
        calories: _calories,
        maxHeartRateBpm: _maxHeartRateBpm,
        maxSpeed: _maxSpeed,
        startTime: _startTime,
        totalDistanceMeters: _totalDistanceMeters,
        totalHrZone0Second: _totalHrZone0Second,
        totalHrZone1Second: _totalHrZone1Second,
        totalHrZone2Second: _totalHrZone2Second,
        totalHrZone3Second: _totalHrZone3Second,
        totalHrZone4Second: _totalHrZone4Second,
        totalHrZone5Second: _totalHrZone5Second,
        totalSecond: _totalSecond,
        totalActivitySecond: _totalActivitySecond,
        totalRestSecond: _totalRestSecond,
        avgTemp: _avgTemp,
        maxTemp: _maxTemp,
        minTemp: _minTemp,
        type: _type,
      } = activityInfoLayer;

      if (_index === 0) {
        simulationFile.fileInfo = deepCopy(fileInfo);
        simulationFile.fileInfo.dispName = '複合式運動';
        startTime = _startTime;
      }

      if (avgHeartRateBpm) {
        totalHeartRateBpm += avgHeartRateBpm;
        effectHrPointNum++;
      }

      if (typeof _avgTemp === 'number') {
        avgTemp += _avgTemp;
        effectTempLength++;
      }

      totalSpeed += avgSpeed || 0;
      calories += _calories || 0;
      maxHeartRateBpm = _maxHeartRateBpm > maxHeartRateBpm ? _maxHeartRateBpm : maxHeartRateBpm;
      maxSpeed = _maxSpeed > maxSpeed ? _maxSpeed : maxSpeed;
      totalDistanceMeters += _totalDistanceMeters || 0;
      totalHrZone0Second += _totalHrZone0Second || 0;
      totalHrZone1Second += _totalHrZone1Second || 0;
      totalHrZone2Second += _totalHrZone2Second || 0;
      totalHrZone3Second += _totalHrZone3Second || 0;
      totalHrZone4Second += _totalHrZone4Second || 0;
      totalHrZone5Second += _totalHrZone5Second || 0;
      totalSecond += _totalSecond || 0;
      totalActivitySecond += _totalActivitySecond || 0;
      totalRestSecond += _totalRestSecond || 0;
      if (_maxTemp && _maxTemp > maxTemp) maxTemp = _maxTemp;
      if (minTemp === null || (_minTemp && _minTemp < minTemp)) minTemp = _minTemp;
    });

    const lapLength = file.length || Infinity;
    simulationFile.activityInfoLayer = {
      avgHeartRateBpm: mathRounding(totalHeartRateBpm / (effectHrPointNum || Infinity), 2),
      avgSpeed: mathRounding(totalSpeed / lapLength, 2),
      calories,
      maxHeartRateBpm,
      maxSpeed,
      startTime,
      subtype: 0,
      totalDistanceMeters,
      totalHrZone0Second,
      totalHrZone1Second,
      totalHrZone2Second,
      totalHrZone3Second,
      totalHrZone4Second,
      totalHrZone5Second,
      totalSecond,
      totalActivitySecond,
      totalRestSecond,
      avgTemp: mathRounding(avgTemp / (effectTempLength ?? Infinity), 2),
      maxTemp,
      minTemp,
      type: '100',
    };

    simulationFile.info = file;
    return this.restructureFile(simulationFile);
  }

  /**
   * 將複合式檔案整理為檔案列表，並將點資訊合併以產生總覽的圖表
   * @param file {any}-複合式運動檔案內容
   */
  restructureFile(file: any) {
    const { activityInfoLayer, fileInfo, info } = file;
    let currentSecond = 0;
    let lapStartDistance = 0;
    const totalPoint = [];
    const fileList = [];
    info.forEach((_info, _index) => {
      fileList.push(_info);
      const {
        activityInfoLayer: { resolutionSeconds, totalDistanceMeters },
        activityPointLayer,
      } = _info;
      lapStartDistance += totalDistanceMeters ?? 0;
      activityPointLayer.forEach((_point) => {
        const {
          heartRateBpm,
          temp,
          speed,
          runCadence,
          cycleCadence,
          cycleWatt,
          distanceMeters,
          swimCadence,
          rowingCadence,
          rowingWatt,
        } = _point;
        currentSecond += resolutionSeconds;
        totalPoint.push({
          heartRateBpm: heartRateBpm ?? 0,
          temp: temp ?? 0,
          speed: speed ?? 0,
          complexCadence: runCadence || cycleCadence || swimCadence || rowingCadence || 0,
          complexWatt: cycleWatt || rowingWatt || 0,
          distanceMeters: lapStartDistance + (distanceMeters ?? 0),
          pointSecond: currentSecond,
        });
      });
    });

    fileList.unshift({
      activityInfoLayer,
      fileInfo,
      activityLapLayer: [],
      activityPointLayer: totalPoint,
    });

    return fileList;
  }

  /**
   * 取得指定檔案數據
   * @param index {number}-檔案序列
   */
  getAssignFile(index: number) {
    return this._fileList[index];
  }

  /**
   * 取得各檔案概要資訊列表
   */
  getInfoList(): Array<FileSimpleInfo> {
    return this._fileList.map((_list) => {
      const {
        activityInfoLayer: { type, totalSecond, avgHeartRateBpm, avgSpeed },
        fileInfo: { dispName },
      } = _list;
      return { type: +type, totalSecond, avgHeartRateBpm, avgSpeed: avgSpeed ?? 0, dispName };
    });
  }
}
