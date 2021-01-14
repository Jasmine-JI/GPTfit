import { Pipe, PipeTransform } from '@angular/core';

/**
 * 若數值超過1000，則以k顯示，否之則返回原數值
 */
@Pipe({name: 'thousandConversion'})
export class ThousandConversionPipe implements PipeTransform {
  transform(value: number, args: string): string {
    let finalValue: number,
        unit: string;
    // 超過1000以k表示
    if (value >= 1000) {
      finalValue = +(value / 1000).toFixed(2);
      unit = 'k';
    } else {
      finalValue = value;
      unit = '';
    }

    if (args && args.length !== 0) {
      return `${finalValue} ${unit}${args}`;
    } else {
      return `${finalValue}`;
    }

  }

}