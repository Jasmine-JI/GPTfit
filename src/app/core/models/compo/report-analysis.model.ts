import { GroupLevel, BrandType } from '../../enums/professional';
import { AnalysisSportsColumn } from '../../enums/sports/report-analysis.enum';
import { SportType } from '../../enums/sports';

/**
 * 報告團體分析/個人分析，群組與欄位設定相關界面
 */
export interface AnalysisOptionInfo {
  analysisType: 'normal' | 'weightTrainMenu';
  sportType?: SportType;
  object: AnalysisObject;
  brandType?: BrandType;
  currentGroupLevel?: GroupLevel;
}

/**
 * 報告團體分析/個人分析，指定的選單相關界面
 */
export interface AnalysisAssignMenu {
  show: boolean;
  position: {
    x: number | null;
    y: number | null;
  };
  reportType: ReportType;
  object: AnalysisObject | null;
  id: string | number | null;
  nameList: Array<any>;
}

/**
 * 報告類別
 */
export type ReportType = 'sports' | 'lifeTracking' | 'cloudrun';

/**
 * 分析列表的對象（團體/個人）
 */
export type AnalysisObject = 'group' | 'person' | 'list';

/**
 *
 */
export interface ColumnInfo {
  columnType: AnalysisSportsColumn; // 欄位類別
  selected: boolean;
}
