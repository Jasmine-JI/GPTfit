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
  reportType?: 'sport' | 'lifeTracking' | 'cloudRun';
  group?: GroupTree;
  sportType?: SportType;
  cloudRun?: {
    mapId: number;
    month: string;  // 例行賽月份
    checkCompletion: boolean;  // 是否檢查過濾未完賽數據（含防弊）
  };
  hideConfirmBtn: boolean;
}

export interface GroupSimpleInfo {
  accessRight?: string;
  groupIcon?: string;
  groupId: string;
  groupName: string;
  groupStatus?: string;
}

export interface GroupTree {
  brands: null | GroupSimpleInfo;
  branches: null | Array<GroupSimpleInfo>;
  coaches: Array<GroupSimpleInfo>;
  selectGroup: string;  // 只擷取到前面有效片段，ex. '0-0-101-1'
}

export type SportType = 99 | 1 | 2 | 3 | 4 | 5 | 6 | 7;