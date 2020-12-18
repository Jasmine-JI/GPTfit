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
  cloudRunMap?: number;
  hideConfirmBtn: boolean;
}

export interface GroupSimpleInfo {
  accessRight?: string;
  groupIcon?: string;
  groupId: string;
  groupName: string;
  groupStatus?: string;
  selected?: boolean;
}

export interface GroupTree {
  brands: null | GroupSimpleInfo;
  branches: null | Array<GroupSimpleInfo>;
  coaches: Array<GroupSimpleInfo>;
}

export type SportType = 99 | 1 | 2 | 3 | 4 | 5 | 6 | 7;