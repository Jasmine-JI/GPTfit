import { DisplayDetailField, FileType } from '../../../enums/api';
import { WeightTrainingInfo } from '../api-common';
import { MuscleCode } from '../../../enums/sports';

export interface Api2103Post {
  token: string; // 登入權杖
  fileId: number; // 運動檔案編號
  displayDetailField?: DisplayDetailField; // 預設lap和point全顯示
  debug?: boolean; // 是否開啟debug模式，debug模式不檢查隱私權（僅29權以上）
}

export interface Api2103Response {
  alaFormatVersionName: string; // AlaCenter新版本運動與生活追蹤資料格式版本
  resultCode: number; // api 回應狀態代碼
  resultMessage: string; // api 回應訊息
  msgCode: number; // api 回應訊息代碼
  apiCode: number; // api 編號
  fileInfo: SportsFileInfo; // 運動檔案資訊
  activityInfoLayer: ActivityInfo; // 運動概要資訊
  activityLapLayer: Array<ActivityLap | Array<any>>; // 運動分段資訊
  activityPointLayer: Array<ActivityPoint | Array<any>>; // 運動點資訊

  // 複合式運動檔案子檔案數據
  info?: Array<{
    fileInfo: SportsFileInfo;
    activityInfoLayer: ActivityInfo;
    activityLapLayer: Array<ActivityLap | Array<any>>;
    activityPointLayer: Array<ActivityPoint | Array<any>>;
  }>;
}

export interface SportsFileInfo {
  author: string; // 此檔案擁有者，格式為 $nickname?userId=$id (有例外)
  brand: string | null; // 檔案建立的課程所屬品牌，格式為 $brandName?groupId=$groupId
  branch: string | null; // 檔案建立的課程所屬分店，格式為 $branchName?groupId=$groupId
  class: string | null; // 檔案建立的課程，格式為 $className?groupId=$groupId
  cloudRunMapId: number | null; // 雲跑檔案地圖編號
  company: string | null; // 公司行號名稱
  complexId: number | null; // 複合式運動檔案編號（棄用）
  countryRegion: string; // 國家區域代號（大寫）
  createFrom: string; // 建立此檔案的應運程式
  creationDate: string; // 檔案建立日期，格式為 YYYY-MM-DDTHH:mm:ss.SSSZ
  creationTimeZone: string; // 檔案建立時區，格式為"±HH:mm"
  creationUnixTimeStamp: string; // 建立檔案時間戳
  dispName: string; // 檔案名稱
  editDate: string; // 檔案編輯時間，格式為 YYYY-MM-DDTHH:mm:ss.SSSZ
  equipmentFwCode: string | null; // 裝置分位代碼
  equipmentFwName: string | null; // 裝置分位名稱
  equipmentHwCode: string | null; // 裝置韌體代碼
  equipmentHwName: string | null; // 裝置韌體名稱
  equipmentSN: Array<string>; // 裝置序號
  exampleFormat: string | null; // 文件規範網址
  fileGroupId: number | null; // 複合式運動檔案編號（棄用）
  fileId: number; // 運動檔案編號
  language: string; // 建立運動檔案使用語系
  location: string | null; // 地理位置，格式為 $locationName?location=$latitude,$longtitude
  matchedPlanId: number | null; //
  note: string | null; // 運動檔案介紹
  photo: string; // 運動檔案代表圖片
  privacy: Array<string | number>; // 運動檔案隱私權
  syncDate: string; // 運動檔案同步日期，格式為 YYYY-MM-DDTHH:mm:ss.SSSZ
  tag: Array<string>; // 運動檔案標籤
  tagman: Array<string>; // tag人物標籤與id，格式為 $nickname?userId=$id
  teacher: string | null; // 教練名稱與id，格式為 $nickname?userId=$id
  type: FileType; // 檔案類別
  uploadRawFileName: string; // 上傳暫存檔名稱
  versionCode: string; // 應用版本號
  versionName: string; // 文件規範版本號
  video: string | null; // 相關影片連結

  authorIcon?: string; // 檔案擁有者的頭像，非api規格需自行，需另外使用 api 1010 取得
  authorLink?: string; // 檔案擁有者個人頁面連結，非api規格需自行，需透過userId產生連結
}

export interface ActivityInfo {
  ala_zone_point: number | null; //ALA POINT
  atmSensorStatus: string | null; // 氣壓計是否啟用
  avgClimbInclineRatio?: number | null; // 平均坡度
  avgElevGainSpeed?: number | null; // 平均爬升速度
  avgElevLossSpeed?: number | null; // 平均降落速度
  avgHeartRateBpm: number | null; // 平均心率
  avgMoveSpeed: number | null; // 平均移動距離
  avgSpeed?: number | null; // 平均速度
  avgStrideLengthCentimeter?: number | null; // 平均步距
  avgTemp: number | null; // 平均溫度
  calories: number | null; // 卡路里
  complexActivity: null; // (已棄用)
  elevGain?: number | null; // 總爬升高度
  elevLoss?: number | null; // 總降落高度
  gpsSensorStatus: string | null; // gps是否啟用
  gravitySensorStatus: string | null; // 重力計是否啟用
  gyroSensorStatus: string | null; // 陀螺儀是否啟用
  max100mInclineRatio?: number | null; // 最大百米坡度
  maxElev?: number | null; // 最高海拔
  maxElevGainSpeed?: number | null; // 最大爬升速度
  maxElevLossSpeed?: number | null; // 最大降落速度
  maxHeartRateBpm: number | null; // 最大心率
  maxSpeed?: number | null; // 最大速度
  maxTemp: number | null; // 最高溫度
  mets: number | null; // 消耗卡路里倍率
  min100mInclineRatio?: number | null; // 最小百米爬升
  minElev?: number | null; // 最小海拔
  minTemp: number | null; // 最低溫度
  ohrSensorStatus: string | null; // 心率感應器是否啟用
  personalizedActivityIntelligence: number | null; // 本活動所獲得的pai指數
  pluginAntSensorName: Array<string>;
  pluginBluetoothSensorName: Array<string>;
  resolutionMillisecondStatus: string | null; // 毫秒解析啟用狀態
  resolutionSeconds: number | null; // 紀錄間隔秒數
  runAvgCadence?: number | null; // 平均步頻
  runMaxCadence?: number | null; // 最大步頻
  startTime: string; // 活動開始時間，格式為 YYYY-MM-DDTHH:mm:ss.SSSZ
  stepAvgGroundContactTime?: number | null; // (已棄用)
  stepAvgVerticalOscillation?: number | null; // 平均垂直振幅(cm)
  stepVerticalRatio?: number | null; // 平均垂直比例
  subtype: number; // 運動副類別
  tempSensorStatus: string | null; // 溫度計啟用狀態
  totalActivityLapOrSet: number | null; // 總活動圈數
  totalActivitySecond: number | null; // 總活動計時
  totalDistanceMeters?: number | null; // 總距離
  totalElevGainSecond?: number | null; // 爬升總計時
  totalElevLossSecond?: number | null; // 降落總計時
  totalFeedbackEnergy?: number | null; // 總回收電力
  totalHrZone0Second: number | null; // 心率z0區間秒數
  totalHrZone1Second: number | null; // 心率z1區間秒數
  totalHrZone2Second: number | null; // 心率z2區間秒數
  totalHrZone3Second: number | null; // 心率z3區間秒數
  totalHrZone4Second: number | null; // 心率z4區間秒數
  totalHrZone5Second: number | null; // 心率z5區間秒數
  totalLapOrSet: number | null; // 總圈數
  totalPoint: number; // 紀錄總點數
  totalRestLapOrSet: number | null; // 總休息圈數
  totalRestSecond: number | null; // 休息總計時
  totalSecond: number | null; // 總計時
  totalStep?: number | null; // 總步數
  type: string; // 運動類別
  cycleAvgCadence?: number | null; // 平均踏頻
  cycleAvgWatt?: number | null; // 平均騎乘功率
  cycleMaxCadence?: number | null; // 最大踏頻
  cycleMaxWatt?: number | null; // 最大騎乘功率
  cycleWheelDiameter?: number | null; // 輪徑
  estimateFtp?: number | null; // ftp估計值
  totalFtpZone0Second?: number | null; // z0 ftp區間秒數
  totalFtpZone1Second?: number | null; // z1 ftp區間秒數
  totalFtpZone2Second?: number | null; // z2 ftp區間秒數
  totalFtpZone3Second?: number | null; // z3 ftp區間秒數
  totalFtpZone4Second?: number | null; // z4 ftp區間秒數
  totalFtpZone5Second?: number | null; // z5 ftp區間秒數
  totalFtpZone6Second?: number | null; // z6 ftp區間秒數
  totalRevolution?: number | null; // 活動騎乘總踏數
  fileId?: number; // 檔案編號(這邊應該是 api 誤回，請以 fileInfo.fileId 為主)
  totalReps?: number | null; // 總動作次數
  totalWeightKg?: number | null; // 總重
  useViceMuscle?: Array<string | MuscleCode>; // 動作訓練主要肌肉部位
  weightTrainingInfo?: Array<WeightTrainingInfo>; // 動作訓練主要肌肉部位概要資訊
  avgSwolf?: number | null;
  bestSwolf?: number | null;
  poolLengthMeters?: number | null; // 泳池長度
  poolSwimAvgCadence?: number | null; // 平均泳池長度划水數
  swimAvgCadence?: number | null; // 平均划頻
  swimMaxCadence?: number | null; // 最大划頻
  totalStrokes?: number | null; // 總划水數
  equipmentAvgIncline?: number | null; // 器材平均坡度
  equipmentAvgResistanceWeightsKg?: number | null; // 器材平均阻力
  equipmentMaxIncline?: number | null; // 器材最大坡度
  equipmentMaxResistanceWeightsKg?: number | null; // 器材最大阻力
  rowingAvgCadence?: number | null; // 平均槳頻
  rowingAvgWatt?: number | null; // 平均划船功率
  rowingMaxCadence?: number | null; // 最大槳頻
  rowingMaxWatt?: number | null; // 最大划船功率
  totalPulls?: number | null; // 總划槳數
  avgSwingSpeed?: number | null; // 平均揮拍速度
  maxGforceX?: number | null; // 最大x軸加速度
  maxGforceY?: number | null; // 最大y軸加速度
  maxGforceZ?: number | null; // 最大z軸加速度
  maxSwingSpeed?: number | null; // 最大揮拍速度
  miniGforceX?: number | null; // 反向最大x軸加速度
  miniGforceY?: number | null; // 反向最大y軸加速度
  miniGforceZ?: number | null; // 反向最大z軸加速度
  totalBackhandSwingCount?: number | null; // 向左揮拍總次數
  totalForehandSwingCount?: number | null; // 向右揮拍總次數
  totalMinusGforceX?: number | null; // 反向x軸總加速度
  totalMinusGforceY?: number | null; // 反向y軸總加速度
  totalMinusGforceZ?: number | null; // 反向z軸總加速度
  totalPlusGforceX?: number | null; // 正向x軸總加速度
  totalPlusGforceY?: number | null; // 正向y軸總加速度
  totalPlusGforceZ?: number | null; // 正向z軸總加速度
  totalSwingCount?: number | null; // 總揮拍次數
}

export interface ActivityLap {
  dispName: string; // 分段名稱
  feedbackEnergy?: number | null; // 分段回收電力
  lapAvgClimbInclineRatio?: number | null; // 分段平均爬升坡度
  lapAvgHeartRateBpm: number | null; // 分段平均心率
  lapAvgSpeed?: number | null; // 分段平均速度
  lapElevGain?: number | null; // 分段爬升距離
  lapElevGainSpeed?: number | null; // 分段爬升秒數
  lapElevLoss?: number | null; // 分段降落距離
  lapElevLossSpeed?: number | null; // 分段降落速度
  lapIndex: number; // 分段索引虛列
  lapRunAvgCadence?: number | null; // 分段平均步頻
  lapStartSecondPoint: number; // 分段開始點
  lapStartTime?: number | null; // 分段開始時間
  lapTotalDistanceMeters?: number | null; // 分段總距離
  lapTotalSecond: string | null; // 分段總計時
  type: string; // 分段類型
  lapCycleAvgCadence?: number | null; // 分段平均踏頻
  lapCycleAvgWatt?: number | null; // 分段平均騎乘功率
  lapCycleAvgWattLeft?: number | null; // 分段左踏功率
  lapCycleAvgWattRight?: number | null; // 分段右踏功率
  setAvgWeightKg?: number | null; // 平均重量
  setMoveBackAvgDynamicAvgTime?: number | null; // 動作返回平均時間
  setMoveFirstDynamicAvgTime?: number | null; // 動作去程平均時間
  setMoveRepDynamicTimeSide?: number | null;
  setMoveRepetitionsAvgCadence?: number | null; // 動作頻率
  setMoveStopDynamicAvgTime?: number | null; // 動作停留平均時間
  setOneRepMax?: number | null; // 1RM
  setTotalReps?: number | null; // 單一組動作次數
  setTotalWeightKg?: number | null; // 單一組累重
  setWorkOutMuscleMain?: Array<string>; // 主要訓練肌肉部位
  setWorkOutMuscleVice?: Array<string>; // 次要練肌肉部位
  lapSwimAvgCadence?: number | null; // 分段平均划頻
  lapSwimPosture?: string | null; // 分段泳姿
  lapSwolf?: number | null; // 分段swolf
  lapTotalStrokes?: number | null; // 分段總划水數
  lapEquipmentAvgIncline?: number | null; // 分段器材平均坡度
  lapEquipmentAvgResistanceWeightsKg?: number | null; // 分段器材平均阻力
  lapRowingAvgCadence?: number | null; // 分段平均槳頻
  lapRowingAvgWatt?: number | null; // 分段平均功率
  lapTotalPulls?: number | null; // 分段划槳數
  avgSwingSpeed?: number | null; // 平均揮拍速度
  maxGforceX?: number | null; // 正向最大x軸加速度
  maxGforceY?: number | null; // 正向最大y軸加速度
  maxGforceZ?: number | null; // 正向最大z軸加速度
  maxSwingSpeed?: number | null; // 最大揮拍速度
  miniGforceX?: number | null; // 反向最大x軸加速度
  miniGforceY?: number | null; // 反向最大y軸加速度
  miniGforceZ?: number | null; // 反向最大z軸加速度
  totalBackhandSwingCount?: number | null; // 反向揮拍數
  totalForehandSwingCount?: number | null; // 正向揮拍數
  totalMinusGforceX?: number | null; // 反向x軸總加速度
  totalMinusGforceY?: number | null; // 反向y軸總加速度
  totalMinusGforceZ?: number | null; // 反向z軸總加速度
  totalPlusGforceX?: number | null; // 正向x軸總加速度
  totalPlusGforceY?: number | null; // 正向y軸總加速度
  totalPlusGforceZ?: number | null; // 正向z軸總加速度
  totalSwingCount?: number | null; // 總揮拍數
}

export interface ActivityPoint {
  altimeterRawMeter?: number | null; // 高度計原始資料
  altitudeMeters?: number | null; // 海拔
  distanceMeters?: string | null; // 距離
  elevGainMeters?: number | null; // 爬升距離
  elevGainSpeed?: number | null; // 爬升速度
  elevLossMeters?: number | null; // 降落距離
  elevLossSpeed?: number | null; // 降落速度
  equipmentIncline?: number | null; // 設備坡度
  equipmentResistanceWeightsKg: number | null; // 器材阻力公斤數
  feedbackWatt?: number | null; // 回收電力
  gpsHorizontalAccuracyMeter?: number | null; // gps水平誤差值
  gpsVerticalAccuracyMeter?: number | null; // gps垂直誤差值
  groundContactTime?: number | null; // (已棄用)
  heartRateBpm: number | null; // 心率
  latitudeDegrees?: string | null; // 緯度
  levelOfDifficulty: number | null; // 器材困難等級
  localPressure?: number | null; // 現地氣壓
  longitudeDegrees?: string | null; // 經度
  pointSecond: number; // 活動開始之計時
  runCadence?: number | null; // 步頻
  satellitesSignalStrength?: Array<string>; // 衛星訊號強度
  seaLevelPressure?: number | null; // 海平面氣壓
  speed?: number | null; // 速度
  strideLength?: number | null; // 步距
  temp: number | null; // 氣溫
  verticalOscillation?: number | null; // 活動垂直振幅
  verticalRatio?: number | null; // 活動垂直比例
  cycleCadence?: number | null; // 踏頻
  cycleWatt?: number | null; // 騎乘功率
  cycleWattLeft?: number | null; // 左踏功率
  cycleWattRight?: number | null; // 右踏功率
  moveBackDynamicTime?: number | null; // 動作返回時間
  moveFirstDynamicTime?: number | null; // 動作去程時間
  moveRepSide?: number | null; // 動作分邊
  moveRepetitions?: number | null; // 動作次數
  moveStopDynamicTime?: number | null; // 動作休息時間
  weightKg?: number | null; // 重量
  swimCadence?: number | null; // 划頻
  swimPosture?: string | null; // 泳姿
  rowingCadence?: number | null; // 槳頻
  rowingWatt?: number | null; // 划船功率
  avgSwingSpeed: number | null; // 平均揮拍速度
  gsensorXRawData: number | null; // g sensor x軸數據
  gsensorYRawData: number | null; // g sensor y軸數據
  gsensorZRawData: number | null; // g sensor z軸數據
  gyroXRawData: number | null; // 陀螺儀x軸數據
  gyroYRawData: number | null; // 陀螺儀y軸數據
  gyroZRawData: number | null; // 陀螺儀z軸數據
  maxSwingSpeed: number | null; // 最大揮拍速度
  totalBackhandSwingCount: number | null; // 反向總揮拍次數
  totalForehandSwingCount: number | null; // 正向總揮拍次數
  totalSwingCount: number | null; // 總揮拍次數
}
