import { Pipe, PipeTransform } from '@angular/core';
import { pythagorean } from '../utils';

@Pipe({
  name: 'pythagorean',
  standalone: true,
})
export class PythagoreanPipe implements PipeTransform {
  constructor() {}

  /**
   * 畢氏定理
   * @param value {Array<number>}-欲計算的數字
   * @returns 畢氏定理結果
   */
  transform(value: Array<number>): number {
    return pythagorean(value);
  }
}
