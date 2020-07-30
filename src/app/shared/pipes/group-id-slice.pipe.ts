import { Pipe, PipeTransform } from '@angular/core';

@Pipe({name: 'groupIdSlice'})
export class GroupIdSlicePipe implements PipeTransform {

  /**
 * 取得指定長度的groupid
 * @param groupId {string}
 * @param length {number}
 * @param fillZero {boolean}
 * @author kidin-1090728
 */
  transform(groupId: string, length: number): any {
    const groupIdArr = groupId.split('-');
    groupIdArr.length = length;
    return groupIdArr.join('-');
  }

}
