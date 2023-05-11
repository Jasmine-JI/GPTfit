import { SportType } from '../../../enums/sports/sports-type.enum';

export interface Api2116Post {
  token: string; // 登入權杖
  filterStartTime: string; // 活動開始日期搜尋起始範圍
  filterEndTime: string; // 活動開始日期搜尋結束範圍
  sortType: string; // 1. 日期、2. 活動計時、3. 距離、4. 平均心率、5. 平均速度、6. 累重
  sortDirection: string; // 1. 降冪(新到舊)  2. 升冪
  filter: {
    // 以下條件必帶一項
    type: SportType; // 運動類別，選填
    mapId?: string; // 雲跑地圖編號，選填
    searchWords?: string; // 檔案名稱關鍵字，選填
    targetDeviceType?: Array<number>;
  };
  page: number; // 頁次
  pageCounts: number; // 每頁項目數目

  targetUserId?: number;
}

export interface Api2116Response {
  alaFormatVersionName: string; // AlaCenter新版本運動與生活追蹤資料格式版本
  apiCode: number; // api 編號
  msgCode: number; // api 回應訊息代碼
  resultCode: number; // api 回應狀態代碼
  resultMessage: string; // api 回應訊息
  totalCounts: number; // 符合條件的檔案數目
  info: Array<SportsListItem>;
}

export interface SportsListItem {
  // 檔案相關資訊
  fileInfo: {
    dispName: string; // 檔案名稱
    fileId: number; // 檔案編號
    photo: string; // 檔案代表圖片
  };
  // 活動概要資訊
  activityInfoLayer: {
    avgHeartRateBpm: number | null; // 平均心率
    avgSpeed: number | null; // 平均速度
    calories: number | null; // 卡路里
    maxHeartRateBpm: number | null; // 最大心率
    maxSpeed: number | null; // 最大速度
    startTime: string; // 活動開始時間，格式為 YYYY-MM-DDTHH:mm:ss.SSSZ
    totalDistanceMeters: number | null; // 總距離
    totalSecond: number | null; // 總運動時間
    totalWeightKg?: number | null; // 重訓累重
    totalReps?: number | null; // 重訊總次數
    type: SportType | null; // 運動類別
    subtype: number | null; // 運動副類別
  };
}
