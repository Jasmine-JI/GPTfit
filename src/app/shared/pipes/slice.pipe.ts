import { Pipe, PipeTransform } from '@angular/core';

/**
 * 將api特定格式的字串依據需求回傳對應的值
 */
@Pipe({name: 'stringSlice'})
export class SlicePipe implements PipeTransform {
  transform(value: string, args: number): any {
    const arr = value.split('?');
    if (args === 0) {
      return arr[args];  // 結果為nickname（或其他名稱）
    } else {
      return arr[args].split('=')[args];  // 結果為user id（或其他id）
    }
    
    
  }
}
