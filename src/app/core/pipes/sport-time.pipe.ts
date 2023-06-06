import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'sportTime',
  standalone: true,
})
export class SportTimePipe implements PipeTransform {
  /**
   * 將總秒數轉為時:分:秒或時:分
   * @param value {any}-時間（s）
   * @param args.showZeroHour 不足1小時或1分鐘是否仍完整顯示時：分：秒，ex. 00:00:39
   * @param args.hideSecond 是否隱藏秒
   */
  transform(value: any, args = { showZeroHour: true, hideSecond: false }): string {
    const { showZeroHour, hideSecond } = args;
    if (typeof value === 'number') {
      const prefix = value < 0 ? '-' : '';
      const yVal = Math.abs(value);
      const costhr = Math.floor(yVal / 3600);
      const costmin = Math.floor(Math.round(yVal - costhr * 60 * 60) / 60);
      const costsecond = Math.round(yVal - costmin * 60 - costhr * 60 * 60);
      const timeHr = `${costhr}`.padStart(2, '0');
      const timeSecond = `${costsecond}`.padStart(2, '0');
      let timeMin = `${costmin}`.padStart(2, '0');

      if (showZeroHour === undefined || showZeroHour) {
        if (hideSecond) {
          timeMin = +timeSecond >= 30 ? `${costmin + 1}`.padStart(2, '0') : timeMin;
          return `${prefix}${timeHr}:${timeMin}`;
        } else {
          return `${prefix}${timeHr}:${timeMin}:${timeSecond}`;
        }
      } else {
        if (costhr === 0) {
          return `${prefix}${timeMin}:${timeSecond}`;
        } else {
          return `${prefix}${costhr}:${timeMin}:${timeSecond}`;
        }
      }
    } else {
      return '--';
    }
  }
}
