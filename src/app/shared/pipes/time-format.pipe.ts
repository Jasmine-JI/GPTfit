import { Pipe, PipeTransform } from '@angular/core';
import dayjs from 'dayjs';

@Pipe({ name: 'timeFormat' })
export class TimeFormatPipe implements PipeTransform {
  /**
   * 使用dayjs將日期或timestamp轉為所需格式
   * @param value {string | number}-timestamp或momentjs可直接使用的時間格式
   * @param args {string}-所需時間格式（格式詳見momentjs官方網站）
   * @return {string}-轉換結果
   * @author kidin
   */
  transform(value: string | number, args: string): string {
    return dayjs(value).format(args);
  }
}
