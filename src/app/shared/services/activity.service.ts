import { HttpClient } from '@angular/common/http';

import { Injectable } from '@angular/core';
import { UtilsService } from './utils.service';
import * as Highcharts from 'highcharts';

@Injectable()
class Option {
  constructor(dataset, colorIdx) {
    return {
      chart: {
        // marginLeft: 60, // Keep all charts left aligned
        spacingTop: 20,
        spacingBottom: 20,
        zoomType: 'x'
      },
      title: {
        text: dataset.name,
        align: 'left',
        margin: 0,
        x: 30
      },
      xAxis: {
        crosshair: true,
        events: {},
        type: 'datetime',
        dateTimeLabelFormats: {
          millisecond: '%H:%M:%S',
          second: '%H:%M:%S',
          minute: '%H:%M:%S',
          day: '%H:%M:%S',
          hour: '%H:%M:%S',
          year: '%H:%M:%S'
        }
      },
      yAxis: {
        title: {
          text: null,
          min: null,
          max: null,
          tickInterval: null,
          labels: null
        }
      },
      plotOptions: {
        column: {
            pointPlacement: -0.5
        },
        series: {
          pointPadding: 0,
          groupPadding: 0
        }
      },
      tooltip: {
        pointFormat: '{point.y}',
        xDateFormat: '%H:%M:%S',
        shadow: false,
        style: {
          fontSize: '14px'
        },
        valueDecimals: dataset.valueDecimals,
        split: true,
        share: true
      },
      series: [
        {
          data: dataset.data,
          name: dataset.name,
          type: dataset.type,
          color: Highcharts.getOptions().colors[colorIdx],
          fillOpacity: 0.3,
          tooltip: {
            valueSuffix: ' ' + dataset.unit
          }
        }
      ]
    };
  }
}
@Injectable()
export class ActivityService {
  private userWeight = 70;  // 儲存使用者體重-kidin-1081121
  private heavyTrainDate = [];  // 儲存重訓資料-kidin-1081121
  private heavyTrainDateState = [];  // 備份重訓資料-kidin-1081121
  private muscleListColor = []; // 儲存肌肉清單顏色列表-kidin-1081128
  private focusMusclePart = false;
  private Proficiency = 'asept';  // 儲存重訓熟練度-kidin-1081121
  private showMusclePart = '';  // 展示部份肌肉訓練地圖-kidin-1081127

  constructor(private http: HttpClient, private utils: UtilsService) {}
  fetchTestData() {
    return this.http.get<any>('https://data.jianshukeji.com/jsonp?filename=json/activity.json');
  }
  fetchSportList(body) {
    return this.http.post<any>('/api/v2/sport/getSportList', body);
  }
  fetchSportListDetail(body) {
    return this.http.post<any>('/api/v2/sport/getSportListDetail', body);
  }
  fetchEditActivityProfile(body) {
    return this.http.post<any>('/api/v2/sport/editActivityProfile', body);
  }
  handleChartDatas(pointDatas, lapDatas, type, resolutionSeconds, hrFormatData, isDebug, chartKind, xaxisUnit, segRange) {
    let colorIdx = 0;
    let isNoSpeeds = false,
      isNoElevations = false,
      isNoHeartRates = false,
      isNoRunCadences = false,
      isNoPaces = false,
      isNoTemps = false,
      isNoZones = false,
      isNoCycleWatt = false,
      isNoRowingWatt = false,
      isNoCycleCadences = false,
      isNoSwimCadences = false,
      isNoRowingCadences = false,
      accumulateTime = 0;
    const pointUnit = [],
      speeds = [],
      elevations = [],
      heartRates = [],
      runCadences = [],
      paces = [],
      temps = [],
      watts = [],
      cycleCadences = [],
      swimCadences = [],
      rowingCadences = [],
      userZoneTimes = [
        { y: 0, color: '#2e4d9f' },
        { y: 0, color: '#2eb1e7' },
        { y: 0, color: '#92c422' },
        { y: 0, color: '#f5ab14' },
        { y: 0, color: '#eb5b19' },
        { y: 0, color: '#c11920' }
      ],
      userHRZones = [0, 0, 0, 0, 0, 0];
    if (type !== '4') {
      const { userHRBase, userAge, userMaxHR, userRestHR } = hrFormatData;
      if (userMaxHR && userRestHR) {
        if (userHRBase === 0) {
          // 區間數值採無條件捨去法
          userHRZones[0] = Math.floor((220 - userAge) * 0.5);
          userHRZones[1] = Math.floor((220 - userAge) * 0.6 - 1);
          userHRZones[2] = Math.floor((220 - userAge) * 0.7 - 1);
          userHRZones[3] = Math.floor((220 - userAge) * 0.8 - 1);
          userHRZones[4] = Math.floor((220 - userAge) * 0.9 - 1);
          userHRZones[5] = Math.floor((220 - userAge) * 1);
        } else {
          userHRZones[0] = (userMaxHR - userRestHR) * (0.55) + userRestHR;
          userHRZones[1] = (userMaxHR - userRestHR) * (0.6) + userRestHR;
          userHRZones[2] = (userMaxHR - userRestHR) * (0.65) + userRestHR;
          userHRZones[3] = (userMaxHR - userRestHR) * (0.75) + userRestHR;
          userHRZones[4] = (userMaxHR - userRestHR) * (0.85) + userRestHR;
          userHRZones[5] = (userMaxHR - userRestHR) * (1) + userRestHR;
        }
      } else {
        if (userHRBase === 0) {
          // 區間數值採無條件捨去法
          userHRZones[0] = Math.floor((220 - userAge) * 0.5);
          userHRZones[1] = Math.floor((220 - userAge) * 0.6 - 1);
          userHRZones[2] = Math.floor((220 - userAge) * 0.7 - 1);
          userHRZones[3] = Math.floor((220 - userAge) * 0.8 - 1);
          userHRZones[4] = Math.floor((220 - userAge) * 0.9 - 1);
          userHRZones[5] = Math.floor((220 - userAge) * 1);
        } else {
          userHRZones[0] = ((220 - userAge) - userRestHR) * (0.55) + userRestHR;
          userHRZones[1] = ((220 - userAge) - userRestHR) * (0.6) + userRestHR;
          userHRZones[2] = ((220 - userAge) - userRestHR) * (0.65) + userRestHR;
          userHRZones[3] = ((220 - userAge) - userRestHR) * (0.75) + userRestHR;
          userHRZones[4] = ((220 - userAge) - userRestHR) * (0.85) + userRestHR;
          userHRZones[5] = ((220 - userAge) - userRestHR) * (1) + userRestHR;
        }
      }
    }
    // 2:腳踏車 3:重訓 5:有氧
    if (type === '2' || type === '3' || type === '5') {
      isNoPaces = true;
    }
    // 預埋裝置分段顯示-kidin-1081113
    if (chartKind === 'lineChart' && segRange === 'deviceLap') {
      lapDatas.forEach((_lap, idx) => {
        if (xaxisUnit === 'time') {
          accumulateTime += +_lap.lapTotalSecond;
          pointUnit.push(accumulateTime * 1000);
        } else {
          pointUnit.push(+_lap.lapTotalDistanceMeters);
        }
        if (!this.utils.isNumber(_lap.lapAvgSpeed) && !isDebug) {
          isNoSpeeds = true;
          isNoPaces = true;
        } else {
          if (!this.utils.isNumber(_lap.lapAvgSpeed)) {
            speeds.push(null);
          } else {
            speeds.push(+_lap.lapAvgSpeed);
          }
        }
        if (!isNoPaces && _lap.lapAvgSpeed === 0) {
          paces.push(3600);
        } else {
          if (type === '1') {  // 1:跑步
            paces.push((60 / +_lap.lapAvgSpeed) * 60);
          } else if (type === '4') {  // 4:游泳
            paces.push(((60 / +_lap.lapAvgSpeed) * 60) / 10);
          } else if (type === '6') {  // 6:划船
            paces.push(((60 / +_lap.lapAvgSpeed) * 60) / 2);
          } else {
          }
        }
        if (!this.utils.isNumber(_lap.lapCycleAvgWatt) && !isDebug) {
          isNoCycleWatt = true;
        } else {
          if (!this.utils.isNumber(_lap.lapCycleAvgWatt)) {
            watts.push(null);
          } else {
            watts.push(+_lap.lapCycleAvgWatt);
          }
        }
        if (!this.utils.isNumber(_lap.lapRowingAvgWatt) && !isDebug) {
          isNoRowingWatt = true;
        } else {
          if (!this.utils.isNumber(_lap.lapRowingAvgWatt)) {
            watts.push(null);
          } else {
            watts.push(+_lap.lapRowingAvgWatt);
          }
        }
        if ((!_lap.altitudeMeters || _lap.altitudeMeters.length === 0) && !isDebug) {
          isNoElevations = true;
        } else {
          if (!_lap.altitudeMeters || _lap.altitudeMeters.length === 0) {
            elevations.push(null);
          } else {
            elevations.push(+_lap.altitudeMeters);
          }
        }
        if (!this.utils.isNumber(_lap.lapAvgHeartRateBpm) && !isDebug) {
          isNoHeartRates = true;
          isNoZones = true;
        } else {
          heartRates.push(+_lap.lapAvgHeartRateBpm);
          if (+_lap.lapAvgHeartRateBpm >= userHRZones[0] && +_lap.lapAvgHeartRateBpm <= userHRZones[1]) {
            userZoneTimes[1].y = userZoneTimes[1].y + resolutionSeconds;
          } else if (+_lap.lapAvgHeartRateBpm >= userHRZones[1] + 1 && +_lap.lapAvgHeartRateBpm <= userHRZones[2]) {
            userZoneTimes[2].y += resolutionSeconds;
          } else if (+_lap.lapAvgHeartRateBpm >= userHRZones[2] + 1 && +_lap.lapAvgHeartRateBpm <= userHRZones[3]) {
            userZoneTimes[3].y += resolutionSeconds;
          } else if (+_lap.lapAvgHeartRateBpm >= userHRZones[3] + 1 && +_lap.lapAvgHeartRateBpm <= userHRZones[4]) {
            userZoneTimes[4].y += resolutionSeconds;
          } else if (+_lap.lapAvgHeartRateBpm >= userHRZones[4] + 1) {
            userZoneTimes[5].y += resolutionSeconds;
          } else {
            userZoneTimes[0].y += resolutionSeconds;
          }
        }
        if (!this.utils.isNumber(_lap.lapRunAvgCadence) && !isDebug) {
          isNoRunCadences = true;
        } else {
          if (!this.utils.isNumber(_lap.lapRunAvgCadence)) {
            runCadences.push(null);
          } else {
            runCadences.push(+_lap.lapRunAvgCadence);
          }
        }
        if (!this.utils.isNumber(_lap.lapCycleAvgCadence) && !isDebug) {
          isNoCycleCadences = true;
        } else {
          if (!this.utils.isNumber(_lap.lapCycleAvgCadence)) {
            cycleCadences.push(null);
          } else {
            cycleCadences.push(+_lap.lapCycleAvgCadence);
          }
        }
        if (!this.utils.isNumber(_lap.lapSwimAvgCadence) && !isDebug) {
          isNoSwimCadences = true;
        } else {
          if (!this.utils.isNumber(_lap.lapSwimAvgCadence)) {
            swimCadences.push(null);
          } else {
            swimCadences.push(+_lap.lapSwimAvgCadence);
          }
        }
        if (!this.utils.isNumber(_lap.lapRowingAvgCadence) && !isDebug) {
          isNoRowingCadences = true;
        } else {
          if (!this.utils.isNumber(_lap.lapRowingAvgCadence)) {
            rowingCadences.push(null);
          } else {
            rowingCadences.push(+_lap.lapRowingAvgCadence);
          }
        }
        if (!this.utils.isNumber(_lap.temp) && !isDebug) {
          isNoTemps = true;
        } else {
          if (!this.utils.isNumber(_lap.temp)) {
            temps.push(null);
          } else {
            temps.push(+_lap.temp);
          }
        }
      });
    } else {
      pointDatas.forEach((_point, idx) => {
        // 不同X軸參考單位-kidin-1081114
        if (xaxisUnit === 'time') {
          pointUnit.push(resolutionSeconds * (idx + 1) * 1000);
        } else {
          pointUnit.push(+_point.distanceMeters);
        }

        if (!this.utils.isNumber(_point.speed) && !isDebug) {
          isNoSpeeds = true;
          isNoPaces = true;
        } else {
          if (!this.utils.isNumber(_point.speed)) {
            speeds.push(null);
          } else {
            speeds.push(+_point.speed);
          }
        }
        if (!isNoPaces && _point.speed === 0) {
          paces.push(3600);
        } else {
          if (type === '1') {  // 1:跑步
            paces.push((60 / +_point.speed) * 60);
          } else if (type === '4') {  // 4:游泳
            paces.push(((60 / +_point.speed) * 60) / 10);
          } else if (type === '6') {  // 6:划船
            paces.push(((60 / +_point.speed) * 60) / 2);
          } else {
          }
        }
        if (!this.utils.isNumber(_point.cycleWatt) && !isDebug) {
          isNoCycleWatt = true;
        } else {
          if (!this.utils.isNumber(_point.cycleWatt)) {
            watts.push(null);
          } else {
            watts.push(+_point.cycleWatt);
          }
        }
        if (!this.utils.isNumber(_point.rowingWatt) && !isDebug) {
          isNoRowingWatt = true;
        } else {
          if (!this.utils.isNumber(_point.rowingWatt)) {
            watts.push(null);
          } else {
            watts.push(+_point.rowingWatt);
          }
        }
        if ((!_point.altitudeMeters || _point.altitudeMeters.length === 0) && !isDebug) {
          isNoElevations = true;
        } else {
          if (!_point.altitudeMeters || _point.altitudeMeters.length === 0) {
            elevations.push(null);
          } else {
            elevations.push(+_point.altitudeMeters);
          }
        }
        if (!this.utils.isNumber(_point.heartRateBpm) && !isDebug) {
          isNoHeartRates = true;
          isNoZones = true;
        } else {
          heartRates.push(+_point.heartRateBpm);
          if (+_point.heartRateBpm >= userHRZones[0] && +_point.heartRateBpm <= userHRZones[1]) {
            userZoneTimes[1].y = userZoneTimes[1].y + resolutionSeconds;
          } else if (+_point.heartRateBpm >= userHRZones[1] + 1 && +_point.heartRateBpm <= userHRZones[2]) {
            userZoneTimes[2].y += resolutionSeconds;
          } else if (+_point.heartRateBpm >= userHRZones[2] + 1 && +_point.heartRateBpm <= userHRZones[3]) {
            userZoneTimes[3].y += resolutionSeconds;
          } else if (+_point.heartRateBpm >= userHRZones[3] + 1 && +_point.heartRateBpm <= userHRZones[4]) {
            userZoneTimes[4].y += resolutionSeconds;
          } else if (+_point.heartRateBpm >= userHRZones[4] + 1) {
            userZoneTimes[5].y += resolutionSeconds;
          } else {
            userZoneTimes[0].y += resolutionSeconds;
          }
        }
        if (!this.utils.isNumber(_point.runCadence) && !isDebug) {
          isNoRunCadences = true;
        } else {
          if (!this.utils.isNumber(_point.runCadence)) {
            runCadences.push(null);
          } else {
            runCadences.push(+_point.runCadence);
          }
        }
        if (!this.utils.isNumber(_point.cycleCadence) && !isDebug) {
          isNoCycleCadences = true;
        } else {
          if (!this.utils.isNumber(_point.cycleCadence)) {
            cycleCadences.push(null);
          } else {
            cycleCadences.push(+_point.cycleCadence);
          }
        }
        if (!this.utils.isNumber(_point.swimCadence) && !isDebug) {
          isNoSwimCadences = true;
        } else {
          if (!this.utils.isNumber(_point.swimCadence)) {
            swimCadences.push(null);
          } else {
            swimCadences.push(+_point.swimCadence);
          }
        }
        if (!this.utils.isNumber(_point.rowingCadence) && !isDebug) {
          isNoRowingCadences = true;
        } else {
          if (!this.utils.isNumber(_point.rowingCadence)) {
            rowingCadences.push(null);
          } else {
            rowingCadences.push(+_point.rowingCadence);
          }
        }
        if (!this.utils.isNumber(_point.temp) && !isDebug) {
          isNoTemps = true;
        } else {
          if (!this.utils.isNumber(_point.temp)) {
            temps.push(null);
          } else {
            temps.push(+_point.temp);
          }
        }
      });
    }
    const speedDataset = {
      name: 'Speed',
      data: speeds,
      unit: 'km/h',
      type: 'line',
      valueDecimals: 1
    };
    const elevationDataset = {
      name: 'Altitude',
      data: elevations,
      unit: 'm',
      type: 'area',
      valueDecimals: 0
    };
    const hrDataset = {
      name: 'Heart rate',
      data: heartRates,
      unit: 'bpm',
      type: 'area',
      valueDecimals: 0
    };
    const runCadenceDataset = {
      name: 'Run Cadence',
      data: runCadences,
      unit: 'spm',
      type: 'scatter',
      valueDecimals: 0
    };
    const cycleCadenceDataset = {
      name: 'Cadence',
      data: cycleCadences,
      unit: 'spm',
      type: 'scatter',
      valueDecimals: 0
    };
    const swimCadenceDataset = {
      name: 'Cadence',
      data: swimCadences,
      unit: 'spm',
      type: 'scatter',
      valueDecimals: 0
    };
    const rowingCadenceDataset = {
      name: 'Cadence',
      data: rowingCadences,
      unit: 'spm',
      type: 'scatter',
      valueDecimals: 0
    };
    const paceDataset = {
      name: 'Pace',
      data: paces,
      unit: 't/km',
      type: 'line',
      valueDecimals: 1
    };
    const wattDataset = {
      name: 'Watt',
      data: watts,
      unit: 'w',
      type: 'line',
      valueDecimals: 1
    };
    const tempDataset = {
      name: 'Temperature',
      data: temps,
      unit: '°C',
      type: 'line',
      valueDecimals: 1
    };
    const zoneDataset = {
      name: 'HR zone',
      data: userZoneTimes,
      unit: '',
      type: 'column',
      valueDecimals: 0
    };
    const finalDatas = [];
    const chartTargets = [];
    let speedOptions,
      elevationOptions,
      hrOptions,
      runCadenceOptions,
      cycleCadenceOptions,
      swimCadenceOptions,
      rowingCadenceOptions,
      wattOptions,
      paceOptions,
      tempOptions,
      zoneOptions;
    // 新增長條圖均化顯示和綜合分析顯示-kidin-1081113
    if (!isNoSpeeds) {
      if (chartKind === 'columnChart') {
        speedDataset.type = 'column';
        speedDataset.data = this.segmentData(pointUnit, speedDataset.data, segRange);
      } else {
        speedDataset.data = speedDataset.data.map((val, j) => [
          pointUnit[j],
          val
        ]);
      }
      speedOptions = new Option(speedDataset, colorIdx);
      colorIdx++;
      if (xaxisUnit === 'distance') {
        speedOptions['xAxis'].type = '';
        speedOptions['xAxis'].dateTimeLabelFormats = null;
      }
      finalDatas.push({ speedChartTarget: speedOptions, isSyncExtremes: true });
      chartTargets.push('speedChartTarget');
    }
    if (!isNoCycleWatt) {
      if (chartKind === 'columnChart') {
        wattDataset.type = 'column';
        wattDataset.data = this.segmentData(pointUnit, wattDataset.data, segRange);
      } else {
        wattDataset.data = wattDataset.data.map((val, j) => [
          pointUnit[j],
          val
        ]);
      }
      wattOptions = new Option(wattDataset, colorIdx);
      colorIdx++;
      if (xaxisUnit === 'distance') {
        wattOptions['xAxis'].type = '';
        wattOptions['xAxis'].dateTimeLabelFormats = null;
      }
      finalDatas.push({ wattChartTarget: wattOptions, isSyncExtremes: true });
      chartTargets.push('wattChartTarget');
    }
    if (!isNoRowingWatt) {
      if (chartKind === 'columnChart') {
        wattDataset.type = 'column';
        wattDataset.data = this.segmentData(pointUnit, wattDataset.data, segRange);
      } else {
        wattDataset.data = wattDataset.data.map((val, j) => [
          pointUnit[j],
          val
        ]);
      }
      wattOptions = new Option(wattDataset, colorIdx);
      colorIdx++;
      if (xaxisUnit === 'distance') {
        wattOptions['xAxis'].type = '';
        wattOptions['xAxis'].dateTimeLabelFormats = null;
      }
      finalDatas.push({ wattChartTarget: wattOptions, isSyncExtremes: true });
      chartTargets.push('wattChartTarget');
    }
    if (!isNoElevations) {
      if (chartKind === 'columnChart') {
        elevationDataset.type = 'column';
        elevationDataset.data = this.segmentData(pointUnit, elevationDataset.data, segRange);
      } else {
        elevationDataset.data = elevationDataset.data.map((val, j) => [
          pointUnit[j],
          val
        ]);
      }
      elevationOptions = new Option(elevationDataset, colorIdx);
      colorIdx++;
      if (xaxisUnit === 'distance') {
        elevationOptions['xAxis'].type = '';
        elevationOptions['xAxis'].dateTimeLabelFormats = null;
      }
      finalDatas.push({ elevationChartTarget: elevationOptions, isSyncExtremes: true });
      chartTargets.push('elevationChartTarget');
    }
    if (!isNoHeartRates) {
      if (chartKind === 'columnChart') {
        hrDataset.type = 'column';
        hrDataset.data = this.segmentData(pointUnit, hrDataset.data, segRange);
      } else {
        hrDataset.data = hrDataset.data.map((val, j) => [
          pointUnit[j],
          val
        ]);
      }
      hrOptions = new Option(hrDataset, colorIdx);
      colorIdx++;
      if (xaxisUnit === 'distance') {
        hrOptions['xAxis'].type = '';
        hrOptions['xAxis'].dateTimeLabelFormats = null;
      }
      finalDatas.push({ hrChartTarget: hrOptions, isSyncExtremes: true });
      chartTargets.push('hrChartTarget');
    }
    if (!isNoZones) {
      zoneDataset.data = zoneDataset.data.map((val, j) => val);
      zoneOptions = new Option(zoneDataset, colorIdx);
      colorIdx++;
      zoneOptions['plotOptions'].column['pointPlacement'] = 0;
      zoneOptions['chart'].zoomType = '';
      zoneOptions['xAxis'].type = '';
      zoneOptions['xAxis'].dateTimeLabelFormats = null;
      zoneOptions['tooltip'] = {
        formatter: function () {
          const costhr = Math.floor(this.y / 3600);
          const costmin = Math.floor(Math.round(this.y - costhr * 60 * 60) / 60);
          const costsecond = Math.round(this.y - costmin * 60);
          const timeHr = ('0' + costhr).slice(-2);
          const timeMin = ('0' + costmin).slice(-2);
          const timeSecond = ('0' + costsecond).slice(-2);

          this.y = `${timeHr}:${timeMin}:${timeSecond}`;
          return this.y;
        }
      };

      zoneOptions['yAxis'].labels = {
        formatter: function () {
          const distance = Math.round(this.value / 60);
          return distance + ' min';
        }
      };
      zoneOptions['xAxis'].categories = [
        'z0(Normal)', 'z1(Warm Up)', 'z2(Easy)', 'z3(Aerobic)', 'z4(Threshold)', 'z5(Maximum)'];

      finalDatas.push({ zoneChartTarget: zoneOptions, isSyncExtremes: false });
      chartTargets.push('zoneChartTarget');
    }
    if (!isNoPaces) {
      if (chartKind === 'columnChart') {
        paceDataset.type = 'column';
        const relayDatas = this.segmentData(pointUnit, paceDataset.data, segRange);
        // y軸反轉後長條圖也會反轉，因此設定長條圖起始點和終點-kidin-1081114
        paceDataset.data = relayDatas.map((val, j) => {
          return {
            x: val[0],
            y: val[1],
            low: 3600
          };
        });
      } else {
        paceDataset.data = paceDataset.data.map((val, j) => [
          pointUnit[j],
          val
        ]);
      }
      paceOptions = new Option(paceDataset, colorIdx);
      colorIdx++;
      paceOptions['yAxis'].min = 0;
      paceOptions['yAxis'].max = 3600;
      paceOptions['yAxis'].tickInterval = 600;
      paceOptions['yAxis'].labels = {
        formatter: function () {
          const val = +this.value;
          const costminperkm = Math.floor(val / 60);
          const costsecondperkm = Math.round(val - costminperkm * 60);
          const timeMin = ('0' + costminperkm).slice(-2);
          const timeSecond = ('0' + costsecondperkm).slice(-2);

          const paceVal = `${timeMin}'${timeSecond}"`;
          return paceVal;
        }
      };
      paceOptions['yAxis'].reversed = true;
      paceOptions['tooltip'] = {
        formatter: function () {
          let yVal = this.y;
          const costminperkm = Math.floor(yVal / 60);
          const costsecondperkm = Math.round(yVal - costminperkm * 60);
          const timeMin = ('0' + costminperkm).slice(-2);
          const timeSecond = ('0' + costsecondperkm).slice(-2);
          yVal = `${timeMin}'${timeSecond}"`;
          return yVal;
        },
        split: true
      };
      if (xaxisUnit === 'distance') {
        paceOptions['xAxis'].type = '';
        paceOptions['xAxis'].dateTimeLabelFormats = null;
      }
      finalDatas.push({ paceChartTarget: paceOptions, isSyncExtremes: true });
      chartTargets.push('paceChartTarget');
    }
    if (!isNoRunCadences) {
      if (chartKind === 'columnChart') {
        runCadenceDataset.type = 'column';
        runCadenceDataset.data = this.segmentData(pointUnit, runCadenceDataset.data, segRange);
      } else {
        runCadenceDataset.data = runCadenceDataset.data.map((val, j) => [
          pointUnit[j],
          val
        ]);
      }
      runCadenceOptions = new Option(runCadenceDataset, colorIdx);
      colorIdx++;
      if (xaxisUnit === 'distance') {
        runCadenceOptions['xAxis'].type = '';
        runCadenceOptions['xAxis'].dateTimeLabelFormats = null;
      }
      finalDatas.push({ cadenceChartTarget: runCadenceOptions, isSyncExtremes: true });
      chartTargets.push('cadenceChartTarget');
    }
    if (!isNoCycleCadences) {
      if (chartKind === 'columnChart') {
        cycleCadenceDataset.type = 'column';
        cycleCadenceDataset.data = this.segmentData(pointUnit, cycleCadenceDataset.data, segRange);
      } else {
        cycleCadenceDataset.data = cycleCadenceDataset.data.map((val, j) => [
          pointUnit[j],
          val
        ]);
      }
      cycleCadenceOptions = new Option(cycleCadenceDataset, colorIdx);
      colorIdx++;
      if (xaxisUnit === 'distance') {
        cycleCadenceOptions['xAxis'].type = '';
        cycleCadenceOptions['xAxis'].dateTimeLabelFormats = null;
      }
      finalDatas.push({ cadenceChartTarget: cycleCadenceOptions, isSyncExtremes: true });
      chartTargets.push('cadenceChartTarget');
    }
    if (!isNoSwimCadences) {
      if (chartKind === 'columnChart') {
        swimCadenceDataset.type = 'column';
        swimCadenceDataset.data = this.segmentData(pointUnit, swimCadenceDataset.data, segRange);
      } else {
        swimCadenceDataset.data = swimCadenceDataset.data.map((val, j) => [
          pointUnit[j],
          val
        ]);
      }
      swimCadenceOptions = new Option(swimCadenceDataset, colorIdx);
      colorIdx++;
      if (xaxisUnit === 'distance') {
        swimCadenceOptions['xAxis'].type = '';
        swimCadenceOptions['xAxis'].dateTimeLabelFormats = null;
      }
      finalDatas.push({ cadenceChartTarget: swimCadenceOptions, isSyncExtremes: true });
      chartTargets.push('cadenceChartTarget');
    }
    if (!isNoRowingCadences) {
      if (chartKind === 'columnChart') {
        rowingCadenceDataset.type = 'column';
        rowingCadenceDataset.data = this.segmentData(pointUnit, rowingCadenceDataset.data, segRange);
      } else {
        rowingCadenceDataset.data = rowingCadenceDataset.data.map((val, j) => [
          pointUnit[j],
          val
        ]);
      }
      rowingCadenceOptions = new Option(rowingCadenceDataset, colorIdx);
      colorIdx++;
      if (xaxisUnit === 'distance') {
        rowingCadenceOptions['xAxis'].type = '';
        rowingCadenceOptions['xAxis'].dateTimeLabelFormats = null;
      }
      finalDatas.push({ cadenceChartTarget: rowingCadenceOptions, isSyncExtremes: true });
      chartTargets.push('cadenceChartTarget');
    }
    if (!isNoTemps) {
      if (chartKind === 'columnChart') {
        tempDataset.type = 'column';
        tempDataset.data = this.segmentData(pointUnit, tempDataset.data, segRange);
      } else {
        tempDataset.data = tempDataset.data.map((val, j) => [
          pointUnit[j],
          val
        ]);
      }
      tempOptions = new Option(tempDataset, colorIdx);
      colorIdx++;
      if (xaxisUnit === 'distance') {
        tempOptions['xAxis'].type = '';
        tempOptions['xAxis'].dateTimeLabelFormats = null;
      }
      finalDatas.push({ tempChartTarget: tempOptions, isSyncExtremes: true });
      chartTargets.push('tempChartTarget');
    }

    return { finalDatas, chartTargets };
  }

  // 根據分段單位將資料做均化-kidin-1081112
  segmentData (xAxisData: Array<number>, yAxisData: Array<number>, segmentationUnit: number) {
    const segYAxisData = [];
    const segXAxisData = [];
    for (let s = segmentationUnit; s < xAxisData[xAxisData.length - 1] + segmentationUnit; s = s + segmentationUnit) {
      let segSum = 0;
      let items = 0;
      for (let i = 0; i < xAxisData.length; i++) {
        if (xAxisData[i] <= s && xAxisData[i] > s - segmentationUnit) {
          segSum = segSum + yAxisData[i];
          items++;
        }
      }
      const avgYAxisData = segSum / items;
      segYAxisData.push(Number(avgYAxisData.toFixed(2)));
      segXAxisData.push(s);
    }
    return segXAxisData.map((val, j) => [
      val,
      segYAxisData[j]
    ]);
  }

  // 儲存使用者體重-kidin-1081121
  saveUserWeight(weight) {
    this.userWeight = weight;
  }
  // 存入重訓資料-kidin-1081121
  saveLapsData(data) {
    this.heavyTrainDate = data;
    this.heavyTrainDateState = data;
  }
  // 儲存重訓熟練度-kidin-1081121
  saveProficiency(Proficiency) {
    this.Proficiency = Proficiency;
  }
  // 針對使用者點選的肌肉清單篩選資料-kidin-1081128
  saveMusclePart(muscleCode) {
    if (muscleCode !== '') {
      this.focusMusclePart = true;
      this.showMusclePart = muscleCode;
      const trainingData = this.heavyTrainDateState;
      for (let i = 0; i < trainingData.length; i++) {
        this.heavyTrainDate = trainingData.filter(data => {
          const traininfPart = data.setWorkOutMuscleMain;
          for (let j = 0; j < traininfPart.length; j++) {
            if (traininfPart[j] === muscleCode) {
              return true;
            }
          }
          return false;
        });
      }
    } else {
      this.focusMusclePart = false;
    }
  }
  // 儲存肌肉清單顏色設定-kidin-1081128
  saveMuscleListColor(muscleColor) {
    this.muscleListColor = muscleColor;
  }
  getLapsData() {
    return this.heavyTrainDateState;
  }
  getMuscleListColor() {
    return this.muscleListColor;
  }
  getAllData() {
    if (this.focusMusclePart === true) {
      const heavyTrainingData = {
        userWeight: this.userWeight,
        proficiency: this.Proficiency,
        lapDatas: this.heavyTrainDate,
        showMusclePart: this.showMusclePart,
        focusMusclePart: true
      };
      return heavyTrainingData;
    } else {
      const heavyTrainingData = {
        userWeight: this.userWeight,
        proficiency: this.Proficiency,
        lapDatas: this.heavyTrainDateState,
        showMusclePart: this.showMusclePart,
        focusMusclePart: false
      };
      return heavyTrainingData;
    }
  }
}
