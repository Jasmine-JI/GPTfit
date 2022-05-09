/**
 * 此檔用來放置跨組件使用之變數其預設值
 */

import { PersonalTarget } from './sport-target';
import { DateUnit } from '../enum/report';


/**
 * 該運動目標預設值
 */
export const SportsTargetDefault: PersonalTarget = {
  name: '',
  cycle: DateUnit.week,
  condition: [
    {
      filedName: 'pai',
      filedValue: 100,
      symbols: 2
    },
    {
      filedName: 'totalTime',
      filedValue: 9000,
      symbols: 2
    }
  ]
};