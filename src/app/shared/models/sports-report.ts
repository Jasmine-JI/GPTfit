/**
 * 運動報告共用模組所需資料（詳細可參考AlaCenter新版本運動與生活追蹤資料格式-V2分析報告呈現）
 */
export interface SportsReportContent {
  reportType: 'my-class' | 'com-report' | 'personal' | 'cloud-run';  // 報告類型
  sportType: number;  // 運動類型
  dateRange: {  // 報告涵蓋日期
    startTimestamp: number; // 起始日期的timestamp
    endTimestamp: number; // 結束日期的timestamp
  };
  image: string;  // 報告顯示頭像
  nameInfo: {  // 報告顯示名稱
    name: string;  // 主名稱
    parentsName?: string;  // 父群組名稱
  }
  sportsInfo: {  // 概要資訊
    numOfData: number;  // 活動總量
    totalTime?: number;  // 總計時
    avgTotalTime?: number; // 平均總計時
    perTime?: number;  // 人均總計時
    totalActiveTime?: number;  // 總活動計時（重訓用）
    avgTotalActiveTime?: number;  // 平均活動總計時（重訓用）
    perActiveTime?: number;  // 人均活動總計時（重訓用）
    totalCalories?: number;  // 總卡路里
    avgCalories?: number;  // 平均卡路里
    perCalories?: number;  // 人均卡路里
    avgHr?: number;  // 平均心率
    perHr?: number;  // 人均心率
    avgMaxHr?: number;  // 平均最大心率
    perMaxHr?: number;  // 人均最大心率
    benefitTime?: number;  // 效益時間
    sportsPreference?: Array<number>;  // 運動指標
    totalDistance?: number;  // 總距離
    avgDistance?: number;  // 平均距離
    perDistance?: number;  // 人均距離
    totalClimb?: number;  // 總爬升
    avgClimb?: number;  // 平均爬升
    perClimb?: number;  // 人均爬升
    totalWeight?: number;  // 總重量
    avgWeight?: number;  // 平均重量
    perWeight?: number;  // 人均重量
    avgKmPace?: string;  // 平均公里配速
    perKmPace?: string;  // 人均公里配速
    avgSpeed?: number;  // 平均速度
    perSpeed?: number;  // 人均速度
    avgHmPace?: number;  // 平均百米配速
    perHmPace?: number;  // 人均百米配速
    avgFiveHmPace?: number;  // 人均五百米配速
    perFiveHmPace?: number;  // 人均五百米配速
    avgRuncadence?: number;  // 平均步頻
    perRuncadence?: number;  // 人均步頻
    avgRidecadence?: number;  // 平均踏頻
    perRidecadence?: number;  // 人均踏頻
    avgSwimcadence?: number;  // 平均划頻
    perSwimcadence?: number;  // 人均划頻
    avgRowcadence?: number;  // 平均槳頻
    perRowcadence?: number;  // 人均槳頻
    avgPower?: number;  // 平均功率
    perPower?: number;  // 人均功率
    cumulativeLeft?: number;  // 累積向左
    cumulativeRight?: number;  // 累積向右
    cumulativeAcceleration?: number;  // 累積加速
    cumulativeImpact?: number;  // 累積撞擊
    cumulativeJump?: number;  // 累積跳躍
    cumulativeLanding?: number;  // 累積落地衝擊
    avgCumulativeLeft?: number;  // 平均累積向左
    avgCumulativeRight?: number;  // 平均累積向右
    avgCumulativeAcceleration?: number;  // 平均累積加速
    avgCumulativeImpact?: number;  // 平均累積撞擊
    avgCumulativeJump?: number;  // 平均累積跳躍
    avgCumulativeLanding?: number;  // 平均累積落地衝擊
    perCumulativeLeft?: number;  // 人均累積向左
    perCumulativeRight?: number;  // 人均累積向右
    perCumulativeAcceleration?: number;  // 人均累積加速
    perCumulativeImpact?: number;  // 人均累積撞擊
    perCumulativeJump?: number;  // 人均累積跳躍
    perCumulativeLanding?: number;  // 人均累積落地衝擊
    numOfPerson?: number;  // 團體人數
  };
  activityAnalysis?: {  // 活動分析
    chartData: {
      numPercentage?: Array<any>;  // 產生數量佔比圖所需數據
      timePercentage?: Array<any>;  // 產生時間佔比圖所需數據
      distribute: Array<{
        avgHr: number;  // 平均心率
        time: number; // 持續時間
      }>
    };
    textData?: Array<{
      type: number;  // 運動類型
      numOfData: number;  // 筆數
      totalTime: number;  // 總計時
    }>;
  };
  hrZone?: {  // 心率區間
    columnChartData: Array<any>;  // 心率區間圖表所需數據
    trendChartData: Array<any>; // 心率趨勢圖表所需數據
    hrZone: Array<number>;  // 心率區間
  };
  thresholdZone?: {  // 功能性閾值
    columnChartData: Array<any>;
    trendChartData: Array<any>;
    description: Array<any>;
  };
  weightTrain?: {  // 重訓
    muscleMap: any;
    trainPart: Array<any>;
    chartData: Array<any>  // 1rm與平均重量圖表所需數據（含組數）
  };
  trendChart?: {  // 趨勢圖表
    nunOfWeekData?: Array<any>;  // 活動筆數
    totalTime?: Array<any>;  // 總計時
    distance?: Array<any>;  // 距離
    speed?: Array<any>;  // 速度
    kmPace?: Array<any>;  // 公里配速
    fiveHmPace?: Array<any>;  // 五百米配速
    hmPace?: Array<any>;  // 百米配速
    ridePower?: Array<any>;  // 騎乘功率
    rowPower?: Array<any>;  // 划船功率
    runcadence?: Array<any>;  // 步頻
    ridecadence?: Array<any>;  // 踏頻
    swimcadence?: Array<any>;  // 划頻
    Rowcadence?: Array<any>;  // 槳頻
    hr?: Array<any>;  // 心率
    calories?: Array<any>;  // 卡路里
    swimBenefit?: Array<any>;  // 游泳效益
    cumulativeX?: Array<any>;  // 累積左右位移
    cumulativeY?: Array<any>;  // 累積加速撞擊
    cumulativeZ?: Array<any>;  // 累積跳躍落地
    maxX?: Array<any>;  // 最大左右位移
    maxY?: Array<any>;  // 最大加速撞擊
    maxZ?: Array<any>;  // 最大跳躍落地
  };
  personnalAnalysis?: Array<{  // 個人分析
    nickname: string; // 暱稱
    numOfData?: number; // 筆數
    totalTime?: number; // 總時間
    totalCalories?: number; // 總卡路里
    activityPreference?: number; // 活動偏好
    totalDistance?: number; // 總距離
    totalWeight?: number; // 總重量
    totalSet?: number; // 總組數
    partPreference?: Array<string>; // 部位偏好
    armMuscleGroup?: string; // 手臂肌群
    chestMuscleGroup?: string; // 胸部肌群
    abdominalMuscleGroup?: string; // 腹部肌群
    legMuscleGroup?: string; // 腿部肌群
    backMuscleGroup?: string; // 背部肌群
    shoulderMuscleGroup?: string; // 肩部肌群
    avgHr?: number; // 平均心率
    maxHr?: number; // 最大心率
    benefitTime?: string; // 效益時間
    pai?: number; // 活動指標
    avgSpeed?: number; // 平均速度
    maxSpeed?: number; // 最大速度
    avgKmPace?: string; // 平均公里配速
    bestKmPace?: string; // 最佳公里配速
    avgFiveHmPace?: string; // 平均五百米配速
    bestFiveHmPace?: string; // 最佳五百米配速
    avgHmPace?: string; // 平均百米配速
    bestHmPace?: string; // 最佳百米配速
    avgRidePower?: number; // 平均騎乘功率
    bestRidePower?: number; // 最佳騎乘功率
    avgRowPower?: number; // 平均划槳功率
    bestRowPower?: number; // 最佳划槳功率
    avgRuncadence?: number; // 平均步頻
    bestRuncadence?: number; // 最佳步頻
    avgRidecadence?: number; // 平均踏頻
    bestRidecadence?: number; // 最佳踏頻
    hrZoneChart?: Array<any>; // 心率區間圖表
    cumulativeLeft?: number;  // 累積向左
    cumulativeRight?: number;  // 累積向右
    cumulativeAcceleration?: number;  // 累積加速
    cumulativeImpact?: number;  // 累積撞擊
    cumulativeJump?: number;  // 累積跳躍
    cumulativeLanding?: number;  // 累積落地衝擊
    maxCumulativeLeft?: number;  // 最大累積向左
    maxCumulativeRight?: number;  // 最大累積向右
    maxCumulativeAcceleration?: number;  // 最大累積加速
    maxCumulativeImpact?: number;  // 最大累積撞擊
    maxCumulativeJump?: number;  // 最大累積跳躍
    maxCumulativeLanding?: number;  // 最大累積落地衝擊
  }>;
  groupAnalysis?: Array<{  // 團體分析
    groupName: string; // 暱稱
    numOfPeople?: number; // 暱稱
    numOfData?: number; // 暱稱
    totalTime?: number; // 暱稱
    totalCalories?: number; // 暱稱
    totalDistance?: number; // 暱稱
    avgHr?: number; // 暱稱
    maxHr?: number; // 暱稱
    benefitTime?: string; // 暱稱
    pai?: number; // 暱稱
    avgSpeed?: number; // 暱稱
    maxSpeed?: number; // 暱稱
    avgKmPace?: string; // 暱稱
    bestKmPace?: string; // 暱稱
    avgFiveHmPace?: string; // 暱稱
    bestFiveHmPace?: string; // 暱稱
    avgHmPace?: string; // 暱稱
    bestHmPace?: string; // 暱稱
    avgRidePower?: number; // 暱稱
    bestRidePower?: number; // 暱稱
    avgRowPower?: number; // 暱稱
    bestRowPower?: number; // 暱稱
    avgRuncadence?: number; // 暱稱
    bestRuncadence?: number; // 暱稱
    avgRidecadence?: number; // 暱稱
    bestRidecadence?: number; // 暱稱
    hrZoneChart?: Array<any>; // 暱稱
    cumulativeLeft?: number;  // 累積向左
    cumulativeRight?: number;  // 累積向右
    cumulativeAcceleration?: number;  // 累積加速
    cumulativeImpact?: number;  // 累積撞擊
    cumulativeJump?: number;  // 累積跳躍
    cumulativeLanding?: number;  // 累積落地衝擊
    maxCumulativeLeft?: number;  // 最大累積向左
    maxCumulativeRight?: number;  // 最大累積向右
    maxCumulativeAcceleration?: number;  // 最大累積加速
    maxCumulativeImpact?: number;  // 最大累積撞擊
    maxCumulativeJump?: number;  // 最大累積跳躍
    maxCumulativeLanding?: number;  // 最大累積落地衝擊
  }>;
}
