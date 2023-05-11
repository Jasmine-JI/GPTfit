export interface Api2102Post {
  token: string; // 登入權杖
  type: number; // 運動類別
  targetUserId?: number; // 目標使用者編號，若為自己則可不帶
  targetDeviceType?: Array<number>; // 搜尋不同系列裝置
  searchWords: string; // 關鍵字，可帶空字串
  filterStartTime: string; // 篩選起始日，格式為 YYYY-MM-DDTHH:mm:ss.SSSZ
  filterEndTime: string; // 篩選結束日，格式為 YYYY-MM-DDTHH:mm:ss.SSSZ
  page: number; // 頁次，從0開始
  pageCounts: number; // 單一頁顯示項目數
}

export interface Api2102Response {
  alaFormatVersionName: string; // AlaCenter新版本運動與生活追蹤資料格式版本
  resultCode: number; // api 回應狀態代碼
  resultMessage: string; // api 回應訊息
  msgCode: number; // api 回應訊息代碼
  apiCode: number; // api 編號
  totalCounts: number; // 符合條件項目總數，分頁用
  info: Array<SportsListInfo>; // 項目概要資訊
}

export interface SportsListInfo {
  activityInfoLayer: SportsListActivityInfo; // 運動概要資訊
  fileInfo: SportsListFileInfo; // 檔案資訊
}

export interface SportsListActivityInfo {
  type: string; // 運動類別
  subtype: number; // 運動副類別
  startTime: string; // 運動開始時間，格式為 YYYY-MM-DDTHH:mm:ss.SSSZ
  avgSpeed: number | null; // 平均速度
  maxSpeed: number | null; // 最大速度
  avgHeartRateBpm: number | null; // 平均心率
  maxHeartRateBpm: number | null; // 最大心率
  totalDistanceMeters: number | null; // 總距離
  totalSecond: number | null; // 總計時
  calories: number | null; // 卡路里
}

export interface SportsListFileInfo {
  fileId: number; // 運動檔案編號
  dispName: string; // 運動檔案名稱
  photo: string; // 運動檔案代表圖
  createFrom: string; // 運動檔案建立應用程式
}
