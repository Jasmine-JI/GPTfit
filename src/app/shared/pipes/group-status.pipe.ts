import { Pipe, PipeTransform } from '@angular/core';

@Pipe({name: 'groupStatus'})
export class GroupStatusPipe implements PipeTransform {
  transform(value: number, args: string[]): any {
    if (value === 1) {
      return 'Dashboard.Group.freeToJoin';
    } else if (value === 2) {
      return 'Dashboard.Group.auditSystem';
    } else if (value === 3) {
      return 'Dashboard.Group.hide';
    } else if (value === 4) {
      return 'Dashboard.Group.disband';
    } else {
      return 'other.loading';
    }
  }
}
