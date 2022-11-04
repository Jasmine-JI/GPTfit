import { Sex } from '../enum/personal';
import { BrandType, GroupLevel } from '../enum/professional';
import { SportType } from '../enum/sports';
import { DateRange } from '../classes/date-range';
import { ReportDateUnit } from '../classes/report-date-unit';

/**
 * 報告頁面可讓使用者篩選的條件
 */
export interface ReportConditionOpt {
  date?: {
    startTimestamp: number;
    endTimestamp: number;
    type:
      | 'sevenDay'
      | 'thirtyDay'
      | 'sixMonth'
      | 'today'
      | 'thisWeek'
      | 'thisMonth'
      | 'thisYear'
      | 'custom';
  };
  brandType?: null | 1 | 2;
  pageType?: 'sport' | 'lifeTracking' | 'cloudRun' | 'deviceList' | 'file';
  group?: GroupTree;
  sportType?: SportType;
  cloudRun?: {
    mapId: number;
    month: string; // 例行賽月份
    checkCompletion: boolean; // 是否檢查過濾未完賽數據（含防弊）
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
  selectGroup: string; // 只擷取到前面有效片段，ex. '0-0-101-1'
}

/**
 * 所屬模組(以container資料夾內的module進行區分)
 */
export type ModuleType =
  | 'professional'
  | 'personal'
  | 'official-activity'
  | 'device-manage'
  | 'admin-manage'
  | 'home';

/**
 * 頁面類別
 */
export type PageType = 'sportsReport' | 'lifeTracking' | 'cloudRun' | 'sportsfile';

/**
 * 條件選擇器所需參數（用於報告或檔案篩選）
 */
export interface ReportCondition {
  moduleType: ModuleType;
  pageType: PageType;
  baseTime: DateRange;
  compareTime?: DateRange | null;
  dateUnit?: ReportDateUnit;
  includeAdmin?: boolean;
  group?: {
    brandType: BrandType;
    currentLevel: GroupLevel;
    focusGroup: {
      id: string | null;
      level: GroupLevel | null;
      name: string | null;
    };
    brand: Array<GroupSimpleInfo> | null;
    branches: Array<GroupSimpleInfo> | null;
    classes: Array<GroupSimpleInfo> | null;
  };
  sportType?: SportType;
  cloudRun?: {
    mapId: number | null;
    month: string | null;
    checkCompletion: boolean | null;
  };
  filter?: {
    age?: {
      min: number | null;
      max: number | null;
    };
    gender: Sex | null;
  };
  needRefreshData: boolean;
}

/**
 * 時間範圍類別
 */
export type DateRangeType =
  | 'today'
  | 'sevenDay'
  | 'thirtyDay'
  | 'sixMonth'
  | 'thisWeek'
  | 'thisMonth'
  | 'thisSeason'
  | 'thisYear'
  | 'lastWeek'
  | 'lastMonth'
  | 'lastSeason'
  | 'lastYear'
  | 'sameRangeLastYear'
  | 'custom'
  | 'none';

/**
 * 報告日期範圍的類別（基準日期/比較日期）
 */
export type ReportDateType = 'base' | 'compare';

/**
 * 快速日期範圍資訊
 */
export interface DateRangeInfo {
  startTime: number | null;
  endTime: number | null;
  type?: DateRangeType;
}
