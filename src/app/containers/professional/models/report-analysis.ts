import { GroupLevel, BrandType } from '../../../shared/enum/professional';
import { AnalysisSportsColumn } from '../enum/report-analysis';
import { SportType } from '../../../shared/enum/sports';

/**
 * 報告團體分析/個人分析，群組與欄位設定相關界面
 */
export interface AnalysisOptionInfo {
  reportType: ReportType;
  sportType?: SportType;
  object: AnalysisObject;
  brandType: BrandType;
  currentGroupLevel: GroupLevel;
}

/**
 * 報告團體分析/個人分析，指定的選單相關界面
 */
export interface AnalysisAssignMenu {
  show: boolean;
  position: {
    x: number;
    y: number;
  };
  reportType: ReportType;
  object: AnalysisObject;
  id: string | number;
  nameList: Array<any>;
}

/**
 * 報告類別
 */
export type ReportType = 'sports' | 'lifeTracking' | 'cloudrun';

/**
 * 分析列表的對象（團體/個人）
 */
export type AnalysisObject = 'group' | 'person';

/**
 *
 */
export interface ColumnInfo {
  columnType: AnalysisSportsColumn; // 欄位類別
  selected: boolean;
}
