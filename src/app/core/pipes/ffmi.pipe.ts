import { Pipe, PipeTransform } from '@angular/core';
import { countFFMI } from '../utils';

@Pipe({
  name: 'ffmi',
  standalone: true,
})
export class FFMIPipe implements PipeTransform {
  constructor() {}

  /**
   * 依身高、體重、脂肪率，計算FFMI。
   * @param value 身高(cm), 體重, 脂肪率數據
   * @return {number}-FFMI
   */
  transform(value: { height: number; weight: number; fatRate: number }): number {
    const { height, weight, fatRate } = value;
    return countFFMI(height, weight, fatRate) ?? 0;
  }
}
