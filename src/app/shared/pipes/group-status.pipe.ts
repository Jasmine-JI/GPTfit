import { Pipe, PipeTransform } from '@angular/core';

@Pipe({name: 'groupStatus'})
export class GroupStatusPipe implements PipeTransform {
  transform(value: number, args: string[]): any {
    if (value === 1) {
      return 'Dashboard.Group.Free-to-join';
    } else if (value === 2) {
      return 'Dashboard.Group.AuditSystem';
    } else if (value === 3) {
      return 'Dashboard.Group.Hide';
    } else {
      return 'Dashboard.Group.Dismiss';
    }
  }
}
