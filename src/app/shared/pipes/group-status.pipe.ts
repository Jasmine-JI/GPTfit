import { Pipe, PipeTransform } from '@angular/core';

@Pipe({name: 'groupStatus'})
export class GroupStatusPipe implements PipeTransform {
  transform(value: number, args: string[]): any {
    if (value === 1) {
      return 'universal_group_freeToJoin';
    } else if (value === 2) {
      return 'universal_group_auditSystem';
    } else if (value === 3) {
      return 'universal_operating_hide';
    } else if (value === 4) {
      return 'universal_operating_disband';
    } else {
      return 'universal_status_loading';
    }
  }
}
