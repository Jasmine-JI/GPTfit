import { ConditionSymbols } from '../enum/sport-target';
import { DateUnit } from '../enum/report';

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