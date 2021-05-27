import { Pipe, PipeTransform } from '@angular/core';

/**
 * 回傳陣列內計數多且不為零的序列
 */
@Pipe({name: 'findPrefer'})
export class FindPreferPipe implements PipeTransform {
  transform(value: Array<any>, args: number): Array<any> {
    const sortArr = value.sort((a, b) => b.count - a.count);
    sortArr.length = args;
    return sortArr;
  }
  
}
