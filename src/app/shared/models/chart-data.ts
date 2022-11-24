import { HrBase } from '../enum/personal';

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
  'rgba(239, 56, 150, 1)',
];

/**
 * 心率或閾值各區間，被比較的代表色（用於兩個不同區間數據比較）
 */
export const zoneCompareColor = [
  'rgba(166, 206, 247, 1)',
  'rgba(154, 241, 249, 1)',
  'rgba(196, 243, 173, 1)',
  'rgba(249, 246, 161, 1)',
  'rgba(241, 211, 166, 1)',
  'rgba(249, 172, 160, 1)',
  'rgba(244, 123, 225, 1)',
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
  'rgba(239, 56, 150, 1)',
];

export const SPORT_TYPE_COLOR = [
  'rgba(234, 87, 87, 1)',
  'rgba(255, 154, 34, 1)',
  'rgba(249, 204, 61, 1)',
  'rgba(207, 239, 75, 1)',
  'rgba(117, 242, 95, 1)',
  'rgba(114, 232, 176, 1)',
  'rgba(107, 235, 249, 1)',
];

export const DISTRIBUTION_CHART_COLOR = {
  axis: 'rgba(210, 210, 210, 1)',
  axisText: 'rgba(135, 135, 135, 1)',
  leftTop: {
    background: 'rgba(213, 249, 246, 1)',
    fill: 'rgba(92, 232, 221, 1)',
    textShadow: 'rgba(95, 179, 172, 1)',
  },
  leftMiddle: {
    background: 'rgba(213, 244, 249, 1)',
    fill: 'rgba(92, 213, 232, 1)',
    textShadow: 'rgba(71, 164, 178, 1)',
  },
  leftBottom: {
    background: 'rgba(213, 237, 249, 1)',
    fill: 'rgba(92, 187, 232, 1)',
    textShadow: 'rgba(71, 145, 178, 1)',
  },
  middleTop: {
    background: 'rgba(237, 249, 213, 1)',
    fill: 'rgba(187, 232, 92, 1)',
    textShadow: 'rgba(145, 178, 71, 1)',
  },
  center: {
    background: 'rgba(217, 248, 214, 1)',
    fill: 'rgba(105, 232, 92, 1)',
    textShadow: 'rgba(82, 178, 71, 1)',
  },
  middleBottom: {
    background: 'rgba(214, 248, 231, 1)',
    fill: 'rgba(92, 232, 157, 1)',
    textShadow: 'rgba(71, 178, 121, 1)',
  },
  rightTop: {
    background: 'rgba(249, 220, 216, 1)',
    fill: 'rgba(233, 121, 101, 1)',
    textShadow: 'rgba(178, 92, 77, 1)',
  },
  rightMiddle: {
    background: 'rgba(248, 231, 213, 1)',
    fill: 'rgba(232, 161, 92, 1)',
    textShadow: 'rgba(178, 125, 71, 1)',
  },
  rightBottom: {
    background: 'rgba(250, 240, 213, 1)',
    fill: 'rgba(232, 197, 92, 1)',
    textShadow: 'rgba(178, 152, 71, 1)',
  },
};

/**
 * 重訓肌肉地圖與趨勢圖顏色設定（hsla）
 */
export const WEIGHT_TRAIN_COLOR = {
  saturation: '100%', // 主訓練部位色彩飽和度
  brightnessFor1RM: '70%', // 主訓練部位色彩明亮度(1RM)
  brightnessForAvgWeight: '80%', // 主訓練部位色彩明亮度(平均重量)
  transparency: 0.7, // 主訓練部位色彩透明度
};

/**
 * 步數趨勢圖顏色
 */
export const stepColor = {
  step: '#6fd205',
  target: '#7f7f7f',
  reach: '#eb5293',
};

/**
 * 睡眠趨勢圖顏色
 */
export const sleepColor = {
  light: '#35a8c9',
  deep: '#1e61bb',
  standup: '#ccff00',
};

/**
 * BMI趨勢圖顏色
 */
export const BMIColor = {
  low: '#7ee33a',
  middle: 'yellow',
  high: 'red',
};

/**
 * 脂肪率趨勢圖顏色
 */
export const fatRateColor = {
  low: '#e0a63a',
  high: '#e04fc4',
};

/**
 * 肌肉率趨勢圖顏色
 */
export const muscleRateColor = {
  low: '#3ae5da',
  high: '#299fc6',
};

/**
 * 休息心率趨勢圖顏色
 */
export const restHrColor = {
  line: '#ababab',
  rest: '#31df93',
  max: '#e23333',
};

export const maleBodyBoundary = {
  fatRate: [17, 21, 50],
  FFMI: [18, 21, 28],
};

export const femaleBodyBoundary = {
  fatRate: [23, 27, 56],
  FFMI: [15, 18, 25],
};

/**
 * 運動報告趨勢圖顏色設定
 */
export const trendChartColor = {
  totalSecond: {
    base: {
      top: 'rgba(106, 162, 203, 1)',
      bottom: 'rgba(39, 181, 190, 1)',
    },
    compare: {
      top: 'rgba(106, 203, 122, 1)',
      bottom: 'rgba(178, 190, 39, 1)',
    },
  },
  benefitTime: {
    base: {
      top: 'rgba(204, 4, 222, 1)',
      bottom: 'rgba(222, 124, 4, 1)',
    },
    compare: {
      top: 'rgba(164, 222, 4, 1)',
      bottom: 'rgba(4, 215, 222, 1)',
    },
  },
  pai: {
    base: {
      top: 'rgba(227, 213, 23, 1)',
      bottom: 'rgba(166, 227, 23, 1)',
    },
    compare: {
      top: 'rgba(27, 133, 209, 1)',
      bottom: 'rgba(91, 27, 209, 1)',
    },
  },
  totalActivities: {
    base: {
      top: 'rgba(4, 222, 95, 1)',
      bottom: 'rgba(4, 222, 207, 1)',
    },
    compare: {
      top: 'rgba(4, 168, 222, 1)',
      bottom: 'rgba(4, 55, 222, 1)',
    },
  },
  calories: {
    base: {
      top: 'rgba(255, 84, 55, 1)',
      bottom: 'rgba(255, 150, 34, 1)',
    },
    compare: {
      top: 'rgba(68, 71, 196, 1)',
      bottom: 'rgba(241, 69, 160, 1)',
    },
  },
  achieveRate: {
    base: {
      top: 'rgba(35, 148, 255, 1)',
      bottom: 'rgba(200, 59, 255, 1)',
    },
    compare: {
      top: 'rgba(96, 198, 80, 1)',
      bottom: 'rgba(45, 147, 195, 1)',
    },
  },
  distance: {
    base: {
      top: 'rgba(195, 201, 20, 1)',
      bottom: 'rgba(201, 144, 20, 1)',
    },
    compare: {
      top: 'rgba(86, 150, 199, 1)',
      bottom: 'rgba(86, 188, 199, 1)',
    },
  },
  personalAchieve: {
    achieve: 'rgba(145, 239, 160, 1)',
    notAchieve: 'rgba(243, 110, 110, 1)',
    nodata: 'rgba(255, 255, 255, 0)',
  },
  complexHrTrend: {
    base: {
      max: 'rgba(208, 184, 218, 1)',
      avg: 'rgba(200, 59, 255, 1)',
    },
    compare: {
      max: 'rgba(140, 190, 209, 1)',
      avg: 'rgba(71, 190, 209, 1)',
    },
  },
  bodyWeightTrend: {
    base: 'rgba(255, 217, 81, 1)',
    compare: 'rgba(46, 113, 242, 1)',
  },
  speedPaceTrend: {
    base: {
      max: 'rgba(206, 224, 83, 1)',
      avg: 'rgba(132, 214, 0, 1)',
    },
    compare: {
      max: 'rgba(137, 119, 186, 1)',
      avg: 'rgba(106, 77, 184, 1)',
    },
  },
  cadenceTrend: {
    base: {
      max: 'rgba(242, 166, 114, 1)',
      avg: 'rgba(245, 99, 0, 1)',
    },
    compare: {
      max: 'rgba(103, 240, 201, 1)',
      avg: 'rgba(0, 245, 176, 1)',
    },
  },
  powerTrend: {
    base: {
      max: 'rgba(189, 242, 179, 1)',
      avg: 'rgba(117, 242, 95, 1)',
    },
    compare: {
      max: 'rgba(247, 200, 143, 1)',
      avg: 'rgba(255, 154, 34, 1)',
    },
  },
  gForceTrend: {
    base: {
      max: 'rgba(52, 113, 235, 1)',
      min: 'rgba(235, 64, 52, 1)',
    },
    compare: {
      max: 'rgba(118, 112, 230, 1)',
      min: 'rgba(212, 118, 227, 1)',
    },
  },
};

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
