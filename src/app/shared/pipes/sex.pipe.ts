import { Pipe, PipeTransform } from '@angular/core';

@Pipe({name: 'sex'})
export class SexPipe implements PipeTransform {
  transform(value: number, args: string[]): any {
    if (value === 0) {
      return 'male';
    } else if (value === 1) {
      return 'female';
    } return '不透露';
  }
}
