import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'thousandConversion' })
export class ThousandConversionPipe implements PipeTransform {
  /**
   * 距離超過1000以k顯示，並四捨五入至第1位
   * @param value {string | number}
   * @param args {string}-單位（不帶或空值則不顯示單位）
   * @return {string}-轉換結果
   * @author kidin
   */
  transform(value: number, args: string): string {
    let finalValue: number, unit: string;
    // 超過1000以k表示
    if (value >= 1000) {
      finalValue = parseFloat((value / 1000).toFixed(1));
      unit = 'k';
    } else {
      finalValue = parseFloat(value.toFixed(1));
      unit = '';
    }

    if (args && args.length !== 0) {
      return `${finalValue} ${unit}${args}`;
    } else {
      return `${finalValue}`;
    }
  }
}
