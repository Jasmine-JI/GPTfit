import { Pipe, PipeTransform } from '@angular/core';

@Pipe({name: 'sportDate'})
export class SportDatePipe implements PipeTransform {
  transform(value: string, args: any): any {
    const type = args;
    if (type === 'date') {
      console.log('!!!!', value.slice(0, 10));
      return value.slice(5, 10).replace(/-/g, '/');
    } else {
      return value.slice(11, 19);
    }
  }
}
