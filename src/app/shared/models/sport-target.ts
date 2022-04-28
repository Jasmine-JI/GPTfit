import { ConditionSymbols } from '../enum/sport-target';
import { DateUnit } from '../enum/report';

/**
 * 可設定之目標類別或運動報告趨勢圖使用
 */
export type TargetField = 
    'totalActivities'
  | 'totalTime'
  | 'benefitTime'
  | 'pai'
  | 'calories'
  | 'runDistance'
  | 'runAscent'
  | 'cycleDistance'
  | 'cycleAscent'
  | 'swimDistance'
  | 'rowDistance'
  | 'achievementRate'
;

export interface TargetCondition {
  filedName: string;
  symbols: ConditionSymbols;
  filedValue: number;
};

export interface GroupSportTarget {
  name: string;
  cycle: DateUnit;
  condition: Array<TargetCondition>;
}

export interface PersonalTarget {
  cycle: DateUnit;
  condition: Array<TargetCondition>;
}