import { Pipe, PipeTransform } from '@angular/core';

/**
 * 將總秒數轉為時:分:秒
 */
@Pipe({name: 'sportTime'})
export class SportTimePipe implements PipeTransform {
  transform(value: string, args: boolean = true): any {
    if (value !== 'N/A') {
      const yVal = +value;
      const costhr = Math.floor(yVal / 3600);
      const costmin = Math.floor(Math.round(yVal - costhr * 60 * 60) / 60);
      const costsecond = Math.round(yVal - costmin * 60);
      const timeHr = ('0' + costhr).slice(-2);
      const timeMin = ('0' + costmin).slice(-2);
      const timeSecond = ('0' + costsecond).slice(-2);

      
      if (args) {
        return `${timeHr}:${timeMin}:${timeSecond}`;
      } else {

        if (costhr === 0 && costmin === 0) {
          return +value;
        } else if (costhr === 0) {
          return `${timeMin}:${timeSecond}`;
        } else {
          return `${costhr}:${timeMin}:${timeSecond}`
        }

      }

    } else {
      return '-:-:-';
    }
    
  }

}