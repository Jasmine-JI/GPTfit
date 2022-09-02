import { DateUnit } from '../../../enums/common';
import { SportTargetSymbols } from '../../../enums/sports';

/**
 * 可設定之目標類別或運動報告趨勢圖使用
 */
export type TargetField =
  | 'totalActivities'
  | 'totalTime'
  | 'benefitTime'
  | 'pai'
  | 'calories'
  | 'avgHeartRate';

/**
 * 運動目標內容
 */
export interface TargetCondition {
  cycle: DateUnit;
  filedName: TargetField;
  symbols: SportTargetSymbols;
  filedValue: number;
}

/**
 * 運動目標
 */
export interface SportTarget {
  name: string | undefined;
  condition: Array<TargetCondition> | undefined;
}

/**
 * 運動目標內容，方便取值與更新而轉換為Map
 */
export type TargetConditionMap = Map<TargetField, { symbols: number; filedValue: number }>;
