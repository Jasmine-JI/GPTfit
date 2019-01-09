import * as _Highcharts from 'highcharts';
const Highcharts: any = _Highcharts; // 不檢查highchart型態
class Option {
  constructor(dataset, colorIdx) {
    return {
      chart: {
        marginLeft: 60, // Keep all charts left aligned
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
export const handlePoints = (datas, type, resolutionSeconds) => {
  console.log('type: ', type);

  console.log('datas: ', datas);
  let colorIdx = 0;
  let isNoSpeeds = false,
    isNoElevations = false,
    isNoHeartRates = false,
  isNoRunCadences = false,
    isNoPaces = false,
    isNoTemps = false;
  const pointSeconds = [],
    speeds = [],
    elevations = [],
    heartRates = [],
    runCadences = [],
    paces = [],
    temps = [];
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
    } else {
      heartRates.push(+_point.heartRateBpm);
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
    name: 'Elevation',
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
  const finalDatas = [];
  const chartTargets = [];
  let  speedOptions,
      elevationOptions,
      hrOptions,
      runCadenceOptions,
    paceOptions,
    tempOptions;
  if (!isNoSpeeds) {
    speedDataset.data = speedDataset.data.map((val, j) => [
      pointSeconds[j],
      val
    ]);
    speedOptions = new Option(speedDataset, colorIdx);
    colorIdx++;
    finalDatas.push({ speedChartTarget: speedOptions });
    chartTargets.push('speedChartTarget');
  }
  if (!isNoElevations) {
    elevationDataset.data = elevationDataset.data.map((val, j) => [
      pointSeconds[j],
      val
    ]);
    elevationOptions = new Option(elevationDataset, colorIdx);
    colorIdx++;
    finalDatas.push({ elevationChartTarget: elevationOptions });
    chartTargets.push('elevationChartTarget');
  }
  if (!isNoHeartRates) {
    hrDataset.data = hrDataset.data.map((val, j) => [
      pointSeconds[j],
      val
    ]);
    hrOptions = new Option(hrDataset, colorIdx);
    colorIdx++;
    finalDatas.push({ hrChartTarget: hrOptions });
    chartTargets.push('hrChartTarget');
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
    finalDatas.push({ paceChartTarget: paceOptions });
    chartTargets.push('paceChartTarget');
  }
  if (!isNoRunCadences) {
    runCadenceDataset.data = runCadenceDataset.data.map((val, j) => [
      pointSeconds[j],
      val
    ]);
    runCadenceOptions = new Option(runCadenceDataset, colorIdx);
    colorIdx++;
    finalDatas.push({ cadenceChartTarget: runCadenceOptions });
    chartTargets.push('cadenceChartTarget');
  }

  if (!isNoTemps) {
    tempDataset.data = tempDataset.data.map((val, j) => [
      pointSeconds[j],
      val
    ]);
    tempOptions = new Option(tempDataset, colorIdx);
    colorIdx++;
    finalDatas.push({ tempChartTarget: tempOptions });
    chartTargets.push('tempChartTarget');
  }

  return { finalDatas, chartTargets };
};
