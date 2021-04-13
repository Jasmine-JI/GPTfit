import { Pipe, PipeTransform } from '@angular/core';

/**
 * 將總秒數轉為時:分:秒
 */
@Pipe({name: 'sportTime'})
export class SportTimePipe implements PipeTransform {
  transform(value: string, args: boolean = true): any {
    if (value !== 'N/A') {
      const yVal = +value,
            costhr = Math.floor(yVal / 3600),
            costmin = Math.floor(Math.round(yVal - costhr * 60 * 60) / 60),
            costsecond = Math.round(yVal - costmin * 60 - costhr * 60 * 60),
            timeHr = `${costhr}`.padStart(2, '0'),
            timeMin = `${costmin}`.padStart(2, '0'),
            timeSecond = `${costsecond}`.padStart(2, '0');

      if (args) {
        return `${timeHr}:${timeMin}:${timeSecond}`;
      } else {

        if (costhr === 0) {
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