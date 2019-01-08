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
  const pointSeconds = [],
    speeds = [],
    elevations = [],
    heartRates = [],
    runCadences = [],
    paces = [];
  datas.forEach((_point, idx) => {
    pointSeconds.push(resolutionSeconds * (idx + 1) * 1000);
    speeds.push(+_point.speed);
    if (+_point.speed === 0) {
      paces.push(3600);
    } else {
      paces.push((60 / +_point.speed) * 60);
    }

    elevations.push(+_point.altitudeMeters);
    heartRates.push(+_point.heartRateBpm);
    runCadences.push(+_point.runCadence);
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
  speedDataset.data = speedDataset.data.map((val, j) => [
    pointSeconds[j],
    val
  ]);
  elevationDataset.data = elevationDataset.data.map((val, j) => [
    pointSeconds[j],
    val
  ]);
  hrDataset.data = hrDataset.data.map((val, j) => [
    pointSeconds[j],
    val
  ]);
  paceDataset.data = paceDataset.data.map((val, j) => [
    pointSeconds[j],
    val
  ]);
  runCadenceDataset.data = runCadenceDataset.data.map((val, j) => [
    pointSeconds[j],
    val
  ]);
  const speedOptions = new Option(speedDataset, colorIdx);
  colorIdx++;
  const paceOptions = new Option(paceDataset, colorIdx);
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
    }};
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
  const elevationOptions = new Option(elevationDataset, colorIdx);
  colorIdx++;
  const hrOptions = new Option(hrDataset, colorIdx);
  colorIdx++;
  const runCadenceOptions = new Option(runCadenceDataset, colorIdx);
  colorIdx++;

  return [
    { speedChartTarget: speedOptions },
    { elevationChartTarget: elevationOptions },
    { hrChartTarget: hrOptions },
    { cadenceChartTarget: runCadenceOptions },
    { paceChartTarget: paceOptions }
  ];
};
