import { Pipe, PipeTransform } from '@angular/core';
import { countBMI } from '../../core/utils';

@Pipe({ name: 'bmi' })
export class BMIPipe implements PipeTransform {
  constructor() {}

  /**
   * 依公英制轉換身高單位。
   * @param value {Array<number>}-[身高(cm), 體重]
   * @return {number}-BMI
   * @author kidin-1100623
   */
  transform(value: Array<number>): number {
    const [height, weight] = value;
    return countBMI(height, weight);
  }
}
