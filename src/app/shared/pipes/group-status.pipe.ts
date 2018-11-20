import { Pipe, PipeTransform } from '@angular/core';

@Pipe({name: 'groupStatus'})
export class GroupStatusPipe implements PipeTransform {
  transform(value: number, args: string[]): any {
    if (value === 1) {
      return '自由加入';
    } else if (value === 2) {
      return '審核制';
    } else if (value === 3) {
      return '隱藏';
    } else {
      return '解散';
    }
  }
}
