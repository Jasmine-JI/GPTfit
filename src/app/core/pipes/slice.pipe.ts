import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'stringSlice',
  standalone: true,
})
export class SlicePipe implements PipeTransform {
  /**
   * 將api特定格式的字串依據需求回傳對應的值
   * @param value {string}-api回覆的特殊字串
   * @param args {0 | 1}-指定位置的值
   * @returns {string}-擷取結果
   */
  transform(value: string, args: number): string {
    const arr = value.split('?');
    if (args === 0) {
      return arr[args]; // 結果為nickname（或其他名稱）
    } else {
      return arr[args].split('=')[args]; // 結果為user id（或其他id）
    }
  }
}
