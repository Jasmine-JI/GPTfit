export type DisplayPage = 'cloudrun' | 'sport' | 'lifeTracking' | 'sportReport';

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

/**
 * 步數趨勢圖顏色
 */
export const stepColor = [
  '#6fd205',
  '#7f7f7f',
  '#eb5293'
];

/**
 * 睡眠趨勢圖顏色
 */
export const sleepColor = [
  '#35a8c9',
  '#1e61bb',
  '#ccff00'
];

export const BMIColor = [
  '#7ee33a',
  'yellow',
  'red'
];

export const fatRateColor = [
  '#e0a63a',
  '#e04fc4'
];

export const muscleRateColor = [
  '#3ae5da',
  '#299fc6'
];


export const costTimeColor = 'rgba(188, 226, 58, 1)',
             strokeNumColor = 'rgba(53, 168, 201, 1)',
             caloriesColor = 'rgba(248, 181, 81, 1)',
             distanceColor = 'rgba(110, 155, 255, 1)',
             rightMoveColor = 'rgba(110, 168, 255, 1)',
             leftMoveColor = 'rgba(206, 110, 255, 1)',
             acclerateColor = 'rgba(35, 255, 181, 1)',
             hitColor = 'rgba(255, 110, 170, 1)',
             jumpColor = 'rgba(152, 255, 110, 1)',
             landingColor = 'rgba(255, 165, 0, 1)',
             planeGColor = 'rgba(85, 54, 255, 1)',
             planeMaxGColor = 'rgba(255, 54, 240, 1)',
             forehandSwingColor = 'rgba(0, 137, 152, 1)',
             backHandSwingColor = 'rgba(197, 118, 16, 1)',
             paceTrendColor = ['#6a4db8', '#e04c62', '#ffd451'],
             speedTrendColor = ['#ff00ff', '#ffff00', '#ffff00'],
             cadenceTrendColor = ['#aafc42', '#d6ff38', '#f56300'],
             swolfTrendColor = ['#aafc42', '#d6ff38', '#7fd9ff'],
             swingSpeedTrendColor = ['#3da200', '#0012ff', '#0012ff'],
             fitTimeColor = 'rgba(248, 181, 81, 1)';

export const maleBodyBoundary = {
  fatRate: [17, 21, 50],
  FFMI: [18, 21, 28]
};

export const femaleBodyBoundary = {
  fatRate: [23, 27, 56],
  FFMI: [15, 18, 25]
};

export interface HrZoneRange {
  hrBase: 0 | 1;
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
  HR?: Array<number>;  // 待個人運動報告重構後再將相容移除
  avgHR?: number;  // 待個人運動報告重構後再將相容移除
  bestHR?: Array<number>;  // 待個人運動報告重構後再將相容移除
  oneRangeBestHR?: number;  // 待個人運動報告重構後再將相容移除
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
  calories?: Array<number> | Array<Array<number>>;  // 待個人運動報告重構後再將相容移除
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