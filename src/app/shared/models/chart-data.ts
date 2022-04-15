import { HrBase } from './user-profile-info';

export type DisplayPage = 'cloudrun' | 'sport' | 'lifeTracking' | 'sportReport';

export const costTimeColor = 'rgba(188, 226, 58, 1)';
export const strokeNumColor = 'rgba(53, 168, 201, 1)';
export const caloriesColor = 'rgba(248, 181, 81, 1)';
export const distanceColor = 'rgba(110, 155, 255, 1)';
export const rightMoveColor = 'rgba(110, 168, 255, 1)';
export const leftMoveColor = 'rgba(206, 110, 255, 1)';
export const acclerateColor = 'rgba(35, 255, 181, 1)';
export const hitColor = 'rgba(255, 110, 170, 1)';
export const jumpColor = 'rgba(152, 255, 110, 1)';
export const landingColor = 'rgba(255, 165, 0, 1)';
export const planeGColor = 'rgba(85, 54, 255, 1)';
export const planeMaxGColor = 'rgba(255, 54, 240, 1)';
export const forehandSwingColor = 'rgba(0, 137, 152, 1)';
export const backHandSwingColor = 'rgba(197, 118, 16, 1)';
export const paceTrendColor = ['#6a4db8', '#e04c62', '#ffd451'];
export const speedTrendColor = ['#ff00ff', '#ffff00', '#ffff00'];
export const cadenceTrendColor = ['#aafc42', '#d6ff38', '#f56300'];
export const swolfTrendColor = ['#aafc42', '#d6ff38', '#7fd9ff'];
export const swingSpeedTrendColor = ['#3da200', '#0012ff', '#0012ff'];
export const fitTimeColor = 'rgba(248, 181, 81, 1)';
export const COLUMN_BORDER_COLOR = 'rgba(48, 48, 48, 1)';
export const COMPARE_COLUMN_BORDER_COLOR = 'rgba(255, 89, 89, 1)';
export const TARGET_LINE_COLOR = 'rgba(255, 48, 110, 1)';

/**
 * 心率或閾值各區間代表色
 */
export const zoneColor = [
  'rgba(112, 177, 243, 1)',
  'rgba(100, 224, 236, 1)',
  'rgba(171, 247, 132, 1)',
  'rgba(247, 242, 91, 1)',
  'rgba(243, 179, 83, 1)',
  'rgba(243, 105, 83, 1)',
  'rgba(239, 56, 150, 1)'
];

/**
 * 心率或閾值說明各區間代表色（與圖表顏色有差異深淺色差是為了畫面好看）
 */
export const infoColor = [
  'rgba(70, 156, 245, 1)',
  'rgba(64, 218, 232, 1)',
  'rgba(86, 255, 0, 1)',
  'rgba(255, 220, 1, 1)',
  'rgba(234, 164, 4, 1)',
  'rgba(243, 105, 83, 1)',
  'rgba(239, 56, 150, 1)'
];


export const SPORT_TYPE_COLOR = [
  'rgba(234, 87, 87, 1)',
  'rgba(255, 154, 34, 1)',
  'rgba(249, 204, 61, 1)',
  'rgba(207, 239, 75, 1)',
  'rgba(117, 242, 95, 1)',
  'rgba(114, 232, 176, 1)',
  'rgba(107, 235, 249, 1)'
];

/**
 * 步數趨勢圖顏色
 */
export const stepColor = {
  step: '#6fd205',
  target: '#7f7f7f',
  reach: '#eb5293'
};

/**
 * 睡眠趨勢圖顏色
 */
export const sleepColor = {
  light: '#35a8c9',
  deep: '#1e61bb',
  standup: '#ccff00'
};

/**
 * BMI趨勢圖顏色
 */
export const BMIColor = {
  low: '#7ee33a',
  middle: 'yellow',
  high: 'red'
};

/**
 * 脂肪率趨勢圖顏色
 */
export const fatRateColor = {
  low: '#e0a63a',
  high: '#e04fc4'
};

/**
 * 肌肉率趨勢圖顏色
 */
export const muscleRateColor = {
  low: '#3ae5da',
  high: '#299fc6'
};

/**
 * 休息心率趨勢圖顏色
 */
export const restHrColor = {
  line: '#ababab',
  rest: '#31df93',
  max: '#e23333'
};

export const maleBodyBoundary = {
  fatRate: [17, 21, 50],
  FFMI: [18, 21, 28]
};

export const femaleBodyBoundary = {
  fatRate: [23, 27, 56],
  FFMI: [15, 18, 25]
};

/**
 * 運動報告趨勢圖顏色設定
 */
export const trendChartColor = {
  totalSecond: {
    base: {
      top: 'rgba(106, 162, 203, 1)',
      bottom: 'rgba(39, 181, 190, 1)'
    },
    compare: {
      top: 'rgba(106, 203, 122, 1)',
      bottom: 'rgba(178, 190, 39, 1)'
    }
  },
  calories: {
    base: {
      top: 'rgba(255, 84, 55, 1)',
      bottom: 'rgba(255, 150, 34, 1)'
    },
    compare: {
      top: 'rgba(68, 71, 196, 1)',
      bottom: 'rgba(241, 69, 160, 1)'
    }
  },
  target: {
    base: {
      top: 'rgba(255, 84, 55, 1)',
      bottom: 'rgba(255, 150, 34, 1)'
    },
    compare: {
      top: 'rgba(96, 198, 80, 1)',
      bottom: 'rgba(45, 147, 195, 1)'
    }
  }

}

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
  dataArr?: Array<{x: number; y: number; low: number}>;
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