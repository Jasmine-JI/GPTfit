/**
 * 各運動類別共通所需數據
 */
export const commonData = [
  'avgHeartRateBpm',
  'avgMaxHeartRateBpm',
  'calories',
  'totalActivities',
  'totalHrZone0Second',
  'totalHrZone1Second',
  'totalHrZone2Second',
  'totalHrZone3Second',
  'totalHrZone4Second',
  'totalHrZone5Second',
  'totalSecond'
];

/**
 * 跑步類別所需數據
 */
 export const runData = [
  'avgMaxSpeed',
  'avgRunMaxCadence',
  'avgSpeed',
  'elevGain',
  'runAvgCadence',
  'totalDistanceMeters'
];

/**
 * 騎乘類別所需數據
 */
 export const rideData = [
  'avgCycleMaxCadence',
  'avgCycleMaxWatt',
  'avgMaxSpeed',
  'avgSpeed',
  'cycleAvgCadence',
  'cycleAvgWatt',
  'totalDistanceMeters',
  'totalFtpZone0Second',
  'totalFtpZone1Second',
  'totalFtpZone2Second',
  'totalFtpZone3Second',
  'totalFtpZone4Second',
  'totalFtpZone5Second',
  'totalFtpZone6Second'
];

/**
 * 重訓類別所需數據
 */
 export const weightTrainData = [
  'totalReps',
  'totalWeightKg',
  'totalActivitySecond'
];

/**
 * 游泳類別所需數據
 */
 export const swimData = [
  'avgMaxSpeed',
  'avgSpeed',
  'avgSwimMaxCadence',
  'avgSwolf',
  'bestSwolf',
  'swimAvgCadence',
  'totalDistanceMeters'
];

/**
 * 有氧類別所需數據(目前有氧所需數據同共通類別)
 export const aerobicData = [
];
 */

/**
 * 划船類別所需數據
 */
 export const rowData = [
  'avgMaxSpeed',
  'avgRowingMaxCadence',
  'avgSpeed',
  'rowingAvgCadence',
  'rowingAvgWatt',
  'rowingMaxWatt',
  'totalDistanceMeters'
];

/**
 * 球類類別所需數據
 */
 export const ballData = [
  'avgMaxSpeed',
  'avgSpeed',
  'totalDistanceMeters',
  'totalMinusGforceX',
  'totalMinusGforceY',
  'totalMinusGforceZ',
  'totalPlusGforceX',
  'totalPlusGforceY',
  'totalPlusGforceZ',
  'maxGforceX',
  'maxGforceY',
  'maxGforceZ',
  'miniGforceX',
  'miniGforceY',
  'miniGforceZ'
];

// 個人球類運動所需額外數據
export const personBallData = ballData.concat([
  'totalSwingCount',
  'totalForehandSwingCount',
  'totalBackhandSwingCount',
  'avgSwingSpeed',
  'maxSwingSpeed'
]);

/**
 * PAI加權係數(pai = 該心率區間心率總秒數 * 該區間pai係數)
 */
export const paiCofficient = {
  z0: 0,
  z1: 0.5,
  z2: 1,
  z3: 1.5,
  z4: 2,
  z5: 2.5
}

/**
 * 一天pai指標秒數（即經加權後運動時間等於該指標秒數，則pai為100）
 */
export const dayPaiTarget = 1285;

/**
 * 區間趨勢（上升/下降）
 */
export type Regression = 'up' | 'down';