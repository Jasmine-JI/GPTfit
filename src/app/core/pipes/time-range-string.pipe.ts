import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'timeRangeString',
  standalone: true,
})
export class TimeRangeStringPipe implements PipeTransform {
  /**
   * 將總秒數轉為時:分:秒或時:分
   * @param value 時間（s）
   * @param args.showZeroHour 不足1小時或1分鐘是否仍完整顯示時：分：秒，ex. 00h00m39s
   * @param args.hideSecond 是否隱藏秒
   */
  transform(value: number, args = { showZeroHour: true, hideSecond: false }): string {
    const { showZeroHour, hideSecond } = args;
    const prefix = value < 0 ? '-' : '';
    const yVal = Math.abs(value);
    const costhr = Math.floor(yVal / 3600);
    let costmin = Math.floor(Math.round(yVal - costhr * 60 * 60) / 60);
    const costsecond = Math.round(yVal - costmin * 60 - costhr * 60 * 60);
    if (showZeroHour ?? true) {
      if (hideSecond) {
        // 過30秒進位為1分
        costmin += Math.round(costsecond / 30);
        return `${prefix}${costhr}h${costmin}m`;
      } else {
        return `${prefix}${costhr}h${costmin}m${costsecond}s`;
      }
    } else {
      return `${prefix}${costhr ? costhr + 'h' : ''}${costmin ? costmin + 'm' : ''}${costsecond}s`;
    }
  }
}
