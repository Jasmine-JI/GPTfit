import { Pipe, PipeTransform } from '@angular/core';
import { countPai } from '../utils';

@Pipe({
  name: 'pai',
  standalone: true,
})
export class PaiPipe implements PipeTransform {
  constructor() {}

  /**
   * 根據心率區間秒數與報告選擇時間範圍，計算pai
   * @param value {Array<number>}-心率區間
   * @param args {number}-間隔週數
   * @returns {number}-pai
   */
  transform(value: Array<number>, args: number): number {
    return countPai(value, args);
  }
}
