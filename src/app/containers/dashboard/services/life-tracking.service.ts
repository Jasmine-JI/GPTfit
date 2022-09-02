import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { UtilsService } from '../../../shared/services/utils.service';
import { getOptions } from 'highcharts';

class Option {
  constructor(dataset, colorIdx) {
    return {
      chart: {
        // marginLeft: 60, // Keep all charts left aligned
        spacingTop: 20,
        spacingBottom: 20,
        zoomType: 'x',
      },
      title: {
        text: dataset.name,
        align: 'left',
        margin: 0,
        x: 30,
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
          year: '%H:%M:%S',
        },
      },
      yAxis: {
        title: {
          text: null,
          min: null,
          max: null,
          tickInterval: null,
          labels: null,
        },
      },
      tooltip: {
        pointFormat: '{point.y}',
        xDateFormat: '%H:%M:%S',
        shadow: false,
        style: {
          fontSize: '14px',
        },
        valueDecimals: dataset.valueDecimals,
        split: true,
        share: true,
      },
      series: [
        {
          data: dataset.data,
          name: dataset.name,
          type: dataset.type,
          color: getOptions().colors[colorIdx],
          fillOpacity: 0.3,
          tooltip: {
            valueSuffix: ' ' + dataset.unit,
          },
        },
      ],
    };
  }
}

@Injectable()
export class LifeTrackingService {
  constructor(private http: HttpClient, private utils: UtilsService) {}

  getTrackingDayDetail(body) {
    return this.http.post<any>('/api/v2/sport/getTrackingDayDetail', body);
  }

  handlePoints(datas, resolutionSeconds) {
    let colorIdx = 0;
    const pointSeconds = [],
      activitys = [],
      airPressures = [],
      elevs = [],
      heartRates = [],
      stresses = [],
      temps = [],
      totalActivityCalories = [],
      totalDistanceMeters = [],
      totalElevGains = [],
      totalElevLoss = [],
      totalLifeCalories = [],
      totalStep = [],
      wearingStatus = [],
      walkElevGain = [],
      walkElevLoss = [],
      localPressure = [];

    datas.forEach((_point, idx) => {
      //pointSeconds.push(resolutionSeconds * (idx + 1) * 1000);
      pointSeconds.push(_point.pointSecond * 1000);

      if (!this.utils.isNumber(_point.activity)) {
        activitys.push(_point.activity);
      } else {
        activitys.push(+_point.activity);
      }

      if (!this.utils.isNumber(_point.airPressure)) {
        airPressures.push(_point.airPressure);
      } else {
        airPressures.push(+_point.airPressure);
      }

      if (!this.utils.isNumber(_point.elev)) {
        elevs.push(_point.elev);
      } else {
        elevs.push(+_point.elev);
      }

      if (!this.utils.isNumber(_point.heartRate)) {
        heartRates.push(_point.heartRate);
      } else {
        heartRates.push(+_point.heartRate);
      }

      if (!this.utils.isNumber(_point.stress)) {
        stresses.push(_point.stress);
      } else {
        stresses.push(+_point.stress);
      }

      if (!this.utils.isNumber(_point.temp)) {
        temps.push(_point.temp);
      } else {
        temps.push(+_point.temp);
      }

      if (!this.utils.isNumber(_point.totalActivityCalories)) {
        totalActivityCalories.push(_point.totalActivityCalories);
      } else {
        totalActivityCalories.push(+_point.totalActivityCalories);
      }

      if (!this.utils.isNumber(_point.totalDistanceMeters)) {
        totalDistanceMeters.push(_point.totalDistanceMeters);
      } else {
        totalDistanceMeters.push(+_point.totalDistanceMeters);
      }

      if (!this.utils.isNumber(_point.totalElevGain)) {
        totalElevGains.push(_point.totalElevGain);
      } else {
        totalElevGains.push(+_point.totalElevGain);
      }

      if (!this.utils.isNumber(_point.totalElevLoss)) {
        totalElevLoss.push(_point.totalElevLoss);
      } else {
        totalElevLoss.push(+_point.totalElevLoss);
      }

      if (!this.utils.isNumber(_point.totalLifeCalories)) {
        totalLifeCalories.push(_point.totalLifeCalories);
      } else {
        totalLifeCalories.push(+_point.totalLifeCalories);
      }

      if (!this.utils.isNumber(_point.totalStep)) {
        totalStep.push(_point.totalStep);
      } else {
        totalStep.push(+_point.totalStep);
      }

      if (!this.utils.isNumber(_point.wearingStatus)) {
        wearingStatus.push(_point.wearingStatus);
      } else {
        wearingStatus.push(+_point.wearingStatus);
      }

      if (!this.utils.isNumber(_point.walkElevGain)) {
        walkElevGain.push(_point.walkElevGain);
      } else {
        walkElevGain.push(+_point.walkElevGain);
      }

      if (!this.utils.isNumber(_point.walkElevLoss)) {
        walkElevLoss.push(_point.walkElevLoss);
      } else {
        walkElevLoss.push(+_point.walkElevLoss);
      }

      if (!this.utils.isNumber(_point.localPressure)) {
        localPressure.push(_point.localPressure);
      } else {
        localPressure.push(+_point.localPressure);
      }
    });

    const activityDataset = {
      name: 'Activity',
      data: activitys,
      unit: '',
      type: 'line',
      valueDecimals: 1,
    };

    const airPressureDataset = {
      name: 'Air Pressure',
      data: airPressures,
      unit: '',
      type: 'line',
      valueDecimals: 1,
    };

    const elevDataset = {
      name: 'Elev',
      data: elevs,
      unit: '',
      type: 'line',
      valueDecimals: 1,
    };

    const heartRateDataset = {
      name: 'Heart Rate',
      data: heartRates,
      unit: '',
      type: 'line',
      valueDecimals: 1,
    };

    const stressDataset = {
      name: 'Stress',
      data: stresses,
      unit: '',
      type: 'line',
      valueDecimals: 1,
    };

    const tempDataset = {
      name: 'Temp',
      data: temps,
      unit: '',
      type: 'line',
      valueDecimals: 1,
    };

    const totalActivityCaloriesDataset = {
      name: 'Total Activity Calories',
      data: totalActivityCalories,
      unit: '',
      type: 'line',
      valueDecimals: 1,
    };

    const totalDistanceMetersDataset = {
      name: 'Total Distance Meters',
      data: totalDistanceMeters,
      unit: '',
      type: 'line',
      valueDecimals: 1,
    };

    const totalElevGainDataset = {
      name: 'Total Elev Gain',
      data: totalElevGains,
      unit: '',
      type: 'line',
      valueDecimals: 1,
    };

    const totalElevLossDataset = {
      name: 'Total Elev Loss',
      data: totalElevLoss,
      unit: '',
      type: 'line',
      valueDecimals: 1,
    };

    const totalLifeCaloriesDataset = {
      name: 'Total Life Calories',
      data: totalLifeCalories,
      unit: '',
      type: 'line',
      valueDecimals: 1,
    };

    const totalStepDataset = {
      name: 'Total Step',
      data: totalStep,
      unit: '',
      type: 'line',
      valueDecimals: 1,
    };

    const wearingStatusDataset = {
      name: 'Wearing Status',
      data: wearingStatus,
      unit: '',
      type: 'line',
      valueDecimals: 1,
    };

    const walkElevGainDataset = {
      name: 'Walk ElevGain',
      data: walkElevGain,
      unit: '',
      type: 'line',
      valueDecimals: 1,
    };

    const walkElevLossDataset = {
      name: 'Walk ElevLoss',
      data: walkElevLoss,
      unit: '',
      type: 'line',
      valueDecimals: 1,
    };

    const localPressureDataset = {
      name: 'Local Pressure',
      data: localPressure,
      unit: '',
      type: 'line',
      valueDecimals: 1,
    };

    const finalDatas = [];
    const chartTargets = [];
    let activityOptions,
      airPressureOptions,
      elevOptions,
      heartRateOptions,
      stressOptions,
      tempOptions,
      totalActivityCaloriesOptions,
      totalDistanceMetersOptions,
      totalElevGainOptions,
      totalElevLossOptions,
      totalLifeCaloriesOptions,
      totalStepOptions,
      wearingStatusOptions,
      walkElevGainOptions,
      walkElevLossOptions,
      localPressureOptions;

    // activity
    activityDataset.data = activityDataset.data.map((val, j) => [pointSeconds[j], val]);
    activityOptions = new Option(activityDataset, colorIdx);
    colorIdx++;
    finalDatas.push({ activityChartTarget: activityOptions, isSyncExtremes: true });
    chartTargets.push('activityChartTarget');

    // heartRate
    heartRateDataset.data = heartRateDataset.data.map((val, j) => [pointSeconds[j], val]);
    heartRateOptions = new Option(heartRateDataset, colorIdx);
    colorIdx++;
    finalDatas.push({ heartRateChartTarget: heartRateOptions, isSyncExtremes: true });
    chartTargets.push('heartRateChartTarget');

    // totalDistanceMeters
    totalDistanceMetersDataset.data = totalDistanceMetersDataset.data.map((val, j) => [
      pointSeconds[j],
      val,
    ]);
    totalDistanceMetersOptions = new Option(totalDistanceMetersDataset, colorIdx);
    colorIdx++;
    finalDatas.push({
      totalDistanceMetersChartTarget: totalDistanceMetersOptions,
      isSyncExtremes: true,
    });
    chartTargets.push('totalDistanceMetersChartTarget');

    // totalLifeCalories
    totalLifeCaloriesDataset.data = totalLifeCaloriesDataset.data.map((val, j) => [
      pointSeconds[j],
      val,
    ]);
    totalLifeCaloriesOptions = new Option(totalLifeCaloriesDataset, colorIdx);
    colorIdx++;
    finalDatas.push({
      totalLifeCaloriesChartTarget: totalLifeCaloriesOptions,
      isSyncExtremes: true,
    });
    chartTargets.push('totalLifeCaloriesChartTarget');

    // totalStep
    totalStepDataset.data = totalStepDataset.data.map((val, j) => [pointSeconds[j], val]);
    totalStepOptions = new Option(totalStepDataset, colorIdx);
    colorIdx++;
    finalDatas.push({ totalStepChartTarget: totalStepOptions, isSyncExtremes: true });
    chartTargets.push('totalStepChartTarget');

    // airPressure
    airPressureDataset.data = airPressureDataset.data.map((val, j) => [pointSeconds[j], val]);
    airPressureOptions = new Option(airPressureDataset, colorIdx);
    colorIdx++;
    finalDatas.push({ airPressureChartTarget: airPressureOptions, isSyncExtremes: true });
    chartTargets.push('airPressureChartTarget');

    // elev
    elevDataset.data = elevDataset.data.map((val, j) => [pointSeconds[j], val]);
    elevOptions = new Option(elevDataset, colorIdx);
    colorIdx++;
    finalDatas.push({ elevChartTarget: elevOptions, isSyncExtremes: true });
    chartTargets.push('elevChartTarget');

    // stress
    stressDataset.data = stressDataset.data.map((val, j) => [pointSeconds[j], val]);
    stressOptions = new Option(stressDataset, colorIdx);
    colorIdx++;
    finalDatas.push({ stressChartTarget: stressOptions, isSyncExtremes: true });
    chartTargets.push('stressChartTarget');

    // temp
    tempDataset.data = tempDataset.data.map((val, j) => [pointSeconds[j], val]);
    tempOptions = new Option(tempDataset, colorIdx);
    colorIdx++;
    finalDatas.push({ tempChartTarget: tempOptions, isSyncExtremes: true });
    chartTargets.push('tempChartTarget');

    // totalActivityCalories
    totalActivityCaloriesDataset.data = totalActivityCaloriesDataset.data.map((val, j) => [
      pointSeconds[j],
      val,
    ]);
    totalActivityCaloriesOptions = new Option(totalActivityCaloriesDataset, colorIdx);
    colorIdx++;
    finalDatas.push({
      totalActivityCaloriesChartTarget: totalActivityCaloriesOptions,
      isSyncExtremes: true,
    });
    chartTargets.push('totalActivityCaloriesChartTarget');

    // totalElevGain
    totalElevGainDataset.data = totalElevGainDataset.data.map((val, j) => [pointSeconds[j], val]);
    totalElevGainOptions = new Option(totalElevGainDataset, colorIdx);
    colorIdx++;
    finalDatas.push({ totalElevGainChartTarget: totalElevGainOptions, isSyncExtremes: true });
    chartTargets.push('totalElevGainChartTarget');

    // totalElevLoss
    totalElevLossDataset.data = totalElevLossDataset.data.map((val, j) => [pointSeconds[j], val]);
    totalElevLossOptions = new Option(totalElevLossDataset, colorIdx);
    colorIdx++;
    finalDatas.push({ totalElevLossChartTarget: totalElevLossOptions, isSyncExtremes: true });
    chartTargets.push('totalElevLossChartTarget');

    // wearingStatus
    wearingStatusDataset.data = wearingStatusDataset.data.map((val, j) => [pointSeconds[j], val]);
    wearingStatusOptions = new Option(wearingStatusDataset, colorIdx);
    colorIdx++;
    finalDatas.push({ wearingStatusChartTarget: wearingStatusOptions, isSyncExtremes: true });
    chartTargets.push('wearingStatusChartTarget');

    // walkElevGain
    walkElevGainDataset.data = walkElevGainDataset.data.map((val, j) => [pointSeconds[j], val]);
    walkElevGainOptions = new Option(walkElevGainDataset, colorIdx);
    colorIdx++;
    finalDatas.push({ walkElevGainChartTarget: walkElevGainOptions, isSyncExtremes: true });
    chartTargets.push('walkElevGainChartTarget');

    // walkElevLoss
    walkElevLossDataset.data = walkElevLossDataset.data.map((val, j) => [pointSeconds[j], val]);
    walkElevLossOptions = new Option(walkElevLossDataset, colorIdx);
    colorIdx++;
    finalDatas.push({ walkElevLossChartTarget: walkElevLossOptions, isSyncExtremes: true });
    chartTargets.push('walkElevLossChartTarget');

    // localPressure
    localPressureDataset.data = localPressureDataset.data.map((val, j) => [pointSeconds[j], val]);
    localPressureOptions = new Option(localPressureDataset, colorIdx);
    colorIdx++;
    finalDatas.push({ localPressureChartTarget: localPressureOptions, isSyncExtremes: true });
    chartTargets.push('localPressureChartTarget');

    return { finalDatas, chartTargets };
  }
}
