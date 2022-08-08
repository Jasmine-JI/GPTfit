import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'findPrefer' })
export class FindPreferPipe implements PipeTransform {
  /**
   * 回傳降冪排序後且不為零的陣列，用以找出偏好運動類別或偏好肌群等
   * @param value {Array<any>}-計數物件陣列
   * @param args {number}-回傳的陣列長度
   * @return {Array<number>}-陣列
   * @author kidin
   */
  transform(value: Array<any>, args: number): Array<number> {
    const sortArr = value.sort((a, b) => b.count - a.count);
    sortArr.length = args;
    sortArr.filter((_val) => _val.count > 0);
    return sortArr;
  }
}
