import { ReportCondition, ReportDateType } from '../compo/report-condition.model';
import { TargetConditionMap } from '../api/api-common/sport-target.model';
import { BenefitTimeStartZone } from '../../enums/common';

/**
 * 建立運動報告數據的參數界面
 */
export interface SportsParameter {
  openPrivacy: boolean;
  targetCondition?: TargetConditionMap;
  condition?: ReportCondition;
  data?: Array<any>;
  timeType?: ReportDateType;
  benefitTimeStartZone?: BenefitTimeStartZone;
}
