import * as _Highcharts from 'highcharts';
const Highcharts: any = _Highcharts; // 不檢查highchart型態
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
export const handlePoints = (datas, type, resolutionSeconds, hrFormatData) => {
  console.log('type: ', type);

  console.log('datas: ', datas);
  let colorIdx = 0;
  let isNoSpeeds = false,
    isNoElevations = false,
    isNoHeartRates = false,
  isNoRunCadences = false,
    isNoPaces = false,
    isNoTemps = false,
    isNoZones = false;
  const pointSeconds = [],
    speeds = [],
    elevations = [],
    heartRates = [],
    runCadences = [],
    paces = [],
    temps = [],
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
    const { userHRBase, userAge, userMaxHR, userRestHR} = hrFormatData;
    if (userMaxHR && userRestHR) {
      if (userHRBase === 0) {
        userHRZones[0] = userMaxHR * (0.5);
        userHRZones[1] = userMaxHR * (0.6);
        userHRZones[2] = userMaxHR * (0.65);
        userHRZones[3] = userMaxHR * (0.75);
        userHRZones[4] = userMaxHR * (0.85);
        userHRZones[5] = userMaxHR * (1);
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
        userHRZones[0] = (220 - userAge) * (0.5);
        userHRZones[1] = (220 - userAge) * (0.6);
        userHRZones[2] = (220 - userAge) * (0.65);
        userHRZones[3] = (220 - userAge) * (0.75);
        userHRZones[4] = (220 - userAge) * (0.85);
        userHRZones[5] = (220 - userAge) * (1);
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
  datas.forEach((_point, idx) => {
    pointSeconds.push(resolutionSeconds * (idx + 1) * 1000);
    if (!_point.speed || _point.speed.length === 0) {
      isNoSpeeds = true;
      isNoPaces = true;
    } else {
      speeds.push(+_point.speed);
    }
    if (!_point.speed || +_point.speed === 0) {
      paces.push(3600);
    } else {
      paces.push((60 / +_point.speed) * 60);
    }
    if (!_point.altitudeMeters || _point.altitudeMeters.length === 0) {
      isNoElevations = true;
    } else {
      elevations.push(+_point.altitudeMeters);
    }
    if (!_point.heartRateBpm || _point.heartRateBpm.length === 0) {
      isNoHeartRates = true;
      isNoZones = true;
    } else {
      heartRates.push(+_point.heartRateBpm);
      if (+_point.heartRateBpm >= userHRZones[0] && +_point.heartRateBpm <= userHRZones[1] - 1) {
        userZoneTimes[1].y = userZoneTimes[1].y + resolutionSeconds;
      } else if (+_point.heartRateBpm >= userHRZones[1] && +_point.heartRateBpm <= userHRZones[2] - 1) {
        userZoneTimes[2].y += resolutionSeconds;
      } else if (+_point.heartRateBpm >= userHRZones[2] && +_point.heartRateBpm <= userHRZones[3] - 1) {
        userZoneTimes[3].y += resolutionSeconds;
      } else if (+_point.heartRateBpm >= userHRZones[3] && +_point.heartRateBpm <= userHRZones[4] - 1) {
        userZoneTimes[4].y += resolutionSeconds;
      } else if (+_point.heartRateBpm >= userHRZones[4]) {
        userZoneTimes[5].y += resolutionSeconds;
      } else {
        userZoneTimes[0].y += resolutionSeconds;
      }
    }
    if (!_point.runCadence || _point.runCadence.length === 0) {
      isNoRunCadences = true;
    } else {
      runCadences.push(+_point.runCadence);
    }
    if (!_point.temp || _point.temp.length === 0) {
      isNoTemps = true;
    } else {
      temps.push(+_point.temp);
    }
  });
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
  const paceDataset = {
    name: 'Pace',
    data: paces,
    unit: 't/km',
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
  let  speedOptions,
      elevationOptions,
      hrOptions,
      runCadenceOptions,
    paceOptions,
    tempOptions,
    zoneOptions;
  if (!isNoSpeeds) {
    speedDataset.data = speedDataset.data.map((val, j) => [
      pointSeconds[j],
      val
    ]);
    speedOptions = new Option(speedDataset, colorIdx);
    colorIdx++;
    finalDatas.push({ speedChartTarget: speedOptions, isSyncExtremes: true });
    chartTargets.push('speedChartTarget');
  }
  if (!isNoElevations) {
    elevationDataset.data = elevationDataset.data.map((val, j) => [
      pointSeconds[j],
      val
    ]);
    elevationOptions = new Option(elevationDataset, colorIdx);
    colorIdx++;
    finalDatas.push({ elevationChartTarget: elevationOptions, isSyncExtremes: true });
    chartTargets.push('elevationChartTarget');
  }
  if (!isNoHeartRates) {
    hrDataset.data = hrDataset.data.map((val, j) => [
      pointSeconds[j],
      val
    ]);
    hrOptions = new Option(hrDataset, colorIdx);
    colorIdx++;
    finalDatas.push({ hrChartTarget: hrOptions, isSyncExtremes: true });
    chartTargets.push('hrChartTarget');
  }
  if (!isNoZones) {
    zoneDataset.data = zoneDataset.data.map((val, j) => val);
    zoneOptions = new Option(zoneDataset, colorIdx);
    colorIdx++;
    zoneOptions['chart'].zoomType = '';
    zoneOptions['xAxis'].type = '';
    zoneOptions['xAxis'].dateTimeLabelFormats = null;
    zoneOptions['tooltip'] = {
      formatter: function() {
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
    paceDataset.data = paceDataset.data.map((val, j) => [
      pointSeconds[j],
      val
    ]);
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
    finalDatas.push({ paceChartTarget: paceOptions, isSyncExtremes: true });
    chartTargets.push('paceChartTarget');
  }
  if (!isNoRunCadences) {
    runCadenceDataset.data = runCadenceDataset.data.map((val, j) => [
      pointSeconds[j],
      val
    ]);
    runCadenceOptions = new Option(runCadenceDataset, colorIdx);
    colorIdx++;
    finalDatas.push({
      cadenceChartTarget: runCadenceOptions,
      isSyncExtremes: true
    });
    chartTargets.push('cadenceChartTarget');
  }

  if (!isNoTemps) {
    tempDataset.data = tempDataset.data.map((val, j) => [
      pointSeconds[j],
      val
    ]);
    tempOptions = new Option(tempDataset, colorIdx);
    colorIdx++;
    finalDatas.push({ tempChartTarget: tempOptions, isSyncExtremes: true });
    chartTargets.push('tempChartTarget');
  }

  return { finalDatas, chartTargets };
};
