export type DisplayPage = 'cloudrun' | 'sport' | 'lifeTracking';
export const paceTrendColor = ['#6a4db8', '#e04c62', '#ffd451'];
export const hrColor = [
  'rgba(70, 156, 245, 1)',
  'rgba(64, 218, 232, 1)',
  'rgba(86, 255, 0, 1)',
  'rgba(214, 207, 1, 1)',
  'rgba(234, 164, 4, 1)',
  'rgba(243, 105, 83, 1)'
];
export const costTimeColor = 'rgba(188, 226, 58, 1)';

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
 * Array<[timestamp<number>, hrZoneseconds<number>]>
 */
export interface HrZoneTrendData {
  zoneZero: Array<[number, number]>;
  zoneOne: Array<[number, number]>;
  zoneTwo: Array<[number, number]>;
  zoneThree: Array<[number, number]>;
  zoneFour: Array<[number, number]>;
  zoneFive: Array<[number, number]>;
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
  colorSet: Array<string>;
  date: Array<number>;
}

export interface CompareLineTrendChart {
  HR?: Array<number>;
  avgHR?: number;
  bestHR?: Array<number>;
  oneRangeBestHR?: number;
  colorSet: Array<string>;
  date: Array<number>;
}

export interface FilletTrendChart {
  avgCalories?: number;
  calories?: Array<number>;
  totalCalories?: number;
  oneRangeBestCalories?: number;
  avgCostTime?: number;
  bestCostTime?: number;
  costTime?: Array<number>;
  colorSet: string;
  date: Array<number>;
}