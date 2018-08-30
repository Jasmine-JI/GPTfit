import { Pipe, PipeTransform } from '@angular/core';

@Pipe({name: 'sportDate'})
export class SportDatePipe implements PipeTransform {
  transform(value: string, args: string[]): any {
    const dateArr = value.split('');
    return dateArr[0] + dateArr[1] + dateArr[2] + dateArr[3] + '/'
      + dateArr[4] + dateArr[5] + '/' + dateArr[6] + dateArr[7];
  }
}
