import { Pipe, PipeTransform } from '@angular/core';

@Pipe({name: 'groupStatus'})
export class GroupStatusPipe implements PipeTransform {
  transform(value: string, args: string[]): any {
    if (value === '1') {
      return '自由加入';
    } return '審核制';
  }
}
