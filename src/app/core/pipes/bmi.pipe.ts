import { Pipe, PipeTransform } from '@angular/core';
import { countBMI } from '../utils';

@Pipe({
  name: 'bmi',
  standalone: true,
})
export class BMIPipe implements PipeTransform {
  constructor() {}

  /**
   * 依公英制轉換身高單位。
   * @param value {Array<number>}-[身高(cm), 體重]
   * @return {number}-BMI
   */
  transform(value: Array<number>): number {
    const [height, weight] = value;
    return countBMI(height, weight);
  }
}
