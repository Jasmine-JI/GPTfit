import { HrBase } from '../../enums/sports';

export interface HrZoneRange {
  hrBase: HrBase;
  z0: number | 'Z0';
  z1: number | 'Z1';
  z2: number | 'Z2';
  z3: number | 'Z3';
  z4: number | 'Z4';
  z5: number | 'Z5';
}

/**
 * Array<[timestamp<number>, zoneseconds<number>]>
 */
export interface ZoneTrendData {
  zoneZero: Array<[number, number]>;
  zoneOne: Array<[number, number]>;
  zoneTwo: Array<[number, number]>;
  zoneThree: Array<[number, number]>;
  zoneFour: Array<[number, number]>;
  zoneFive: Array<[number, number]>;
  zoneSix?: Array<[number, number]>;
}

export interface DiscolorTrendData {
  avgCadence?: number;
  bestCadence?: number;
  cadence?: Array<number>;
  oneRangeBestCadence?: number;
  avgPace?: string;
  bestPace?: Array<number>;
  pace?: Array<number>;
  oneRangeBestPace?: string;
  dataArr?: Array<{ x: number; y: number; low: number }>;
  avgSpeed?: number;
  maxSpeed?: number;
  minSpeed?: number;
  maxCadence?: number;
  minCadence?: number;
  avgSwolf?: number;
  maxSwolf?: number;
  minSwolf?: number;
  colorSet?: Array<string>;
  date?: Array<number>;
}

export interface CompareLineTrendChart {
  HR?: Array<number>;
  avgHR?: number;
  bestHR?: Array<number>;
  oneRangeBestHR?: number;
  hrArr?: Array<Array<number>>;
  maxHrArr?: Array<Array<number>>;
  avgHr?: number;
  maxHr?: number;
  powerArr?: Array<Array<number>>;
  maxPowerArr?: Array<Array<number>>;
  avgPower?: number;
  maxPower?: number;
  maxXArr?: Array<Array<number>>;
  minXArr?: Array<Array<number>>;
  maxX?: number;
  minX?: number;
  maxYArr?: Array<Array<number>>;
  minYArr?: Array<Array<number>>;
  maxY?: number;
  minY?: number;
  maxZArr?: Array<Array<number>>;
  minZArr?: Array<Array<number>>;
  maxZ?: number;
  minZ?: number;
  colorSet?: Array<string>;
  date?: Array<number>;
}

export interface FilletTrendChart {
  avgCalories?: number;
  calories?: Array<number> | Array<Array<number>>;
  totalCalories?: number;
  maxCalories?: number;
  avgCostTime?: number;
  bestCostTime?: number;
  costTime?: Array<number>;
  maxStrokeNum?: number;
  avgStrokeNum?: number;
  strokeNum?: Array<Array<number>>;
  maxTotalTime?: number;
  avgTotalTime?: number;
  totalTime?: Array<Array<number>>;
  maxDistance?: number;
  avgDistance?: number;
  distance?: Array<Array<number>>;
  maxPlaneGForce?: number;
  avgPlaneGForce?: number;
  planeGForce?: Array<Array<number>>;
  maxPlaneMaxGForce?: number;
  avgPlaneMaxGForce?: number;
  planeMaxGForce?: Array<Array<number>>;
  colorSet?: string;
  date?: Array<number>;
}

export interface RelativeTrendChart {
  positiveData: Array<Array<number>>;
  negativeData: Array<Array<number>>;
  maxGForce?: number;
  minGForce?: number;
  maxForehandCount?: number;
  maxBackhandCount?: number;
}

/**
 * 比較圖表預設設定值
 */
export const compareChartDefault: any = {
  chart: {
    height: 200,
    backgroundColor: 'transparent',
    marginLeft: 85,
    marginRight: 40,
  },
  title: {
    text: '',
  },
  credits: {
    enabled: false,
  },
  xAxis: {
    title: {
      text: '',
      offset: 20,
    },
    labels: {
      style: {
        fontSize: '10px',
      },
    },
  },
  yAxis: {
    min: 0,
    title: {
      enabled: false,
    },
    labels: {},
    startOnTick: false,
    minPadding: 0.01,
    maxPadding: 0.01,
    tickAmount: 5,
  },
  tooltip: {},
  plotOptions: {
    column: {},
    series: {
      pointWidth: null,
      maxPointWidth: 30,
    },
  },
  legend: {
    enabled: false,
  },
  series: [],
};
