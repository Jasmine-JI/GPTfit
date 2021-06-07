import { Pipe, PipeTransform } from '@angular/core';
import { GroupService } from '../../containers/dashboard/services/group.service';

@Pipe({name: 'groupIdSlice'})
export class GroupIdSlicePipe implements PipeTransform {

  constructor(
    private groupService: GroupService
  ) {}

  /**
   * 取得指定長度的groupid
   * @param groupId {string}
   * @param length {number}
   * @return {string}-片段群組id
   * @author kidin-1090728
   */
  transform(groupId: string, length: number): string {
    return this.groupService.getPartGroupId(groupId, length);
  }

}
