import { Pipe, PipeTransform } from '@angular/core';

@Pipe({name: 'groupLevelTranslate'})
export class GroupLevelNamePipe implements PipeTransform {
  transform(value: string, args: string[]): any {
    if (+args === 1) {
      if (value === '30') {
        return 'Dashboard.Group.GroupInfo.brand';
      } else if (value === '40') {
        return 'Dashboard.Group.GroupInfo.branch';
      } else if (value === '60') {
        return 'Dashboard.Group.GroupInfo.coachingClass';
      } else {
        return 'Dashboard.Group.SearchGroup.generalGroup';
      }
    } else {
      if (value === '30') {
        return 'other.com';
      } else if (value === '40') {
        return 'other.subCom';
      } else if (value === '60') {
        return 'other.department';
      } else {
        return 'other.Group.SearchGroup.generalGroup';
      }
    }
  }
}
