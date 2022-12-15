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
   * @param value {Array<number>}-[身高(cm), 體重, 脂肪率]
   * @return {number}-FFMI
   */
  transform(value: Array<number>): number {
    const [height, weight, fatRate] = value;
    return countFFMI(height, weight, fatRate);
  }
}
