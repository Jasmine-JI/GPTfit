import { Pipe, PipeTransform } from '@angular/core';


@Pipe({name: 'sportTime'})
export class SportTimePipe implements PipeTransform {
  /**
   * 將總秒數轉為時:分:秒或時:分
   * @param value {number}-時間（s）
   * @param args {Array<boolean>}-[不足1小時或1分鐘是否仍完整顯示時：分：秒，ex. 00:00:39, 是否隱藏秒]
   * @return {string}-轉換過後的時間字串
   * @author kidin
   */
  transform(value: string, args: Array<boolean> = [true, false]): string {
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