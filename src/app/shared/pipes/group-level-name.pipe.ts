import { Pipe, PipeTransform } from '@angular/core';

@Pipe({name: 'groupLevelTranslate'})
export class GroupLevelNamePipe implements PipeTransform {
  transform(value: string, args: string[]): any {
    if (value === '30') {
      return 'Dashboard.Group.GroupInfo.Brand';
    } else if (value === '40') {
      return 'Dashboard.Group.GroupInfo.Branch';
    } else if (value === '60') {
      return 'Dashboard.Group.GroupInfo.Class';
    } else {
      return 'Dashboard.Group.SearchGroup.NormalGroup';
    }
  }
}
