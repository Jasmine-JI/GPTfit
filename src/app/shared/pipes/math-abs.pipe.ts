import { Pipe, PipeTransform } from '@angular/core';

@Pipe({name: 'mathAbs'})
export class MathAbsPipe implements PipeTransform {
  /**
   * 回傳絕對正值或絕對負值
   * @param value {number}
   * @param args {'plus' | 'minus'}
   * @returns number
   * @author kidin-1100520
   */
  transform(value: number, args: 'plus' | 'minus' = 'plus'): number {
    return args === 'plus' ? Math.abs(value) : -Math.abs(value);
  }

}

