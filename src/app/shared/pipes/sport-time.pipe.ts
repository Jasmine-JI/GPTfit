import { Pipe, PipeTransform } from '@angular/core';

/**
 * 將總秒數轉為時:分:秒或時:分
 */
@Pipe({name: 'sportTime'})
export class SportTimePipe implements PipeTransform {
  transform(value: string, args: Array<boolean> = [true, false]): any {
    const [showZeroHour, hideSecond] = args;
    if (value !== 'N/A') {
      const yVal = +value,
            costhr = Math.floor(yVal / 3600),
            costmin = Math.floor(Math.round(yVal - costhr * 60 * 60) / 60),
            costsecond = Math.round(yVal - costmin * 60 - costhr * 60 * 60),
            timeHr = `${costhr}`.padStart(2, '0'),
            timeSecond = `${costsecond}`.padStart(2, '0');
      let timeMin = `${costmin}`.padStart(2, '0');

      if (showZeroHour) {

        if (hideSecond) {
          timeMin = +timeSecond >= 30 ? `${costmin + 1}`.padStart(2, '0') : timeMin;
          return `${timeHr}:${timeMin}`;
        } else {
          return `${timeHr}:${timeMin}:${timeSecond}`;
        }
        
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