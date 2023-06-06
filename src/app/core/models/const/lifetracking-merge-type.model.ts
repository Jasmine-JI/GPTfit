// 只取最新值的key
export const lastestTypeKey: Array<string> = [
  'bodyHeight',
  'bodyWeight',
  'muscleRate',
  'fatRate',
  'moistureRate',
  'proteinRate',
  'visceralFat',
  'skeletonRate',
  'basalMetabolicRate',
  'bodyAge',
];

// 需加總再平均的key
export const avgTypeKey: Array<string> = [
  'restHeartRate',
  'avgHeartRate',
  'avgStress',
  'avgOxygenSaturation',
  'avgHeartRateVariability',
];

// 取期間最大值的key
export const maxTypeKey: Array<string> = [
  'maxHeartRate',
  'maxOxygenSaturation',
  'maxHeartRateVariability',
];

// 取期間最小值的key
export const miniTypeKey: Array<string> = ['minOxygenSaturation', 'minHeartRateVariability'];

// 取累計值的key
export const totalTypeKey: Array<string> = [
  'totalFitSecond',
  'totalStep',
  'targetStep',
  'totalDistanceMeters',
  'totalCalories',
  'lifeCalories',
  'activityCalories',
  'elevGain',
  'walkElevGain',
  'walkElevLoss',
  'totalSleepSecond',
  'totalDeepSecond',
  'totalLightSecond',
  'totalStandUpSecond',
  'totalStandUpSecond',
];
