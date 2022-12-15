import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'relativeDay',
  standalone: true,
})
export class RelativeDayPipe implements PipeTransform {
  /**
   * 將timestamp依據不同天數長度回傳相對天數
   * @param retiveTimeStamp {number}-相隔時間的timestamp
   * @returns {string} 相對天數
   */
  transform(retiveTimeStamp: number): string {
    const relativeDay = retiveTimeStamp / (24 * 60 * 60 * 1000);
    if (relativeDay < 30) {
      return `${Math.round(relativeDay)}天前`;
    } else if (relativeDay >= 30 && relativeDay < 365) {
      return `${Math.round(relativeDay / 30)}個月前`;
    } else {
      return `${Math.round(relativeDay / 365)}年前`;
    }
  }
}
