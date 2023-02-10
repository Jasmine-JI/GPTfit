import { Pipe, PipeTransform } from '@angular/core';
import { groupPlanCodeConvert } from '../utils';

@Pipe({
  name: 'groupCommercePlan',
  standalone: true,
})
export class GroupCommercePlan implements PipeTransform {
  /**
   * 依據不同群組方案類別回傳對應的翻譯鍵
   * @param plan {number}-群組方案類別
   */
  transform(plan: number): string {
    return groupPlanCodeConvert(plan);
  }
}
