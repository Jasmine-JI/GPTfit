import { Sex } from '../../containers/dashboard/models/userProfileInfo';

/**
 * 報告頁面可讓使用者篩選的條件
 */
export interface ReportConditionOpt {
  date?: {
    startTimestamp: number;
    endTimestamp: number;
    type: 'sevenDay' | 'thirtyDay' | 'sixMonth' | 'today' | 'thisWeek' | 'thisMonth' | 'thisYear' | 'custom';
  };
  brandType?: null | 1 | 2;
  pageType?: 'sport' | 'lifeTracking' | 'cloudRun' | 'deviceList' | 'file';
  group?: GroupTree;
  sportType?: SportType;
  cloudRun?: {
    mapId: number;
    month: string;  // 例行賽月份
    checkCompletion: boolean;  // 是否檢查過濾未完賽數據（含防弊）
  };
  age?: {
    min: number;
    max: number;
  };
  gender?: Sex;
  deviceType?: Array<string>;
  deviceUseStatus?: 'all' | 'fitpairing' | 'idle';
  keyword?: string;
  hideConfirmBtn: boolean;
}

/**
 * 簡易的群組資訊
 */
export interface GroupSimpleInfo {
  accessRight?: string;
  groupIcon?: string;
  groupId: string;
  groupName: string;
  groupStatus?: string;
}

/**
 * 群組階層
 */
export interface GroupTree {
  brands: null | GroupSimpleInfo;
  branches: null | Array<GroupSimpleInfo>;
  coaches: Array<GroupSimpleInfo>;
  selectGroup: string;  // 只擷取到前面有效片段，ex. '0-0-101-1'
}

/**
 * 運動類別代碼清單
 */
export enum SportCode {
  rest,
  run,
  cycle,
  weightTrain,
  swim,
  aerobic,
  row,
  ball,
  all = 99
}

/**
 * 運動代碼
 */
export type SportType = 
  SportCode.all | SportCode.run | SportCode.cycle | SportCode.weightTrain | SportCode.swim | SportCode.aerobic | SportCode.row | SportCode.ball;