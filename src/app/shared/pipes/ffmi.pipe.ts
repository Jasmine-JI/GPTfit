import { Pipe, PipeTransform } from '@angular/core';
import { countFFMI } from '../../core/utils';

@Pipe({ name: 'ffmi' })
export class FFMIPipe implements PipeTransform {
  constructor() {}

  /**
   * 依身高、體重、脂肪率，計算FFMI。
   * @param value {Array<number>}-[身高(cm), 體重, 脂肪率]
   * @return {number}-FFMI
   * @author kidin-1100623
   */
  transform(value: Array<number>): number {
    const [height, weight, fatRate] = value;
    return countFFMI(height, weight, fatRate);
  }
}
