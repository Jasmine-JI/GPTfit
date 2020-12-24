import { Pipe, PipeTransform } from '@angular/core';
import moment from 'moment';

/**
 * 將unixTime 換成所需日期格式
 */
@Pipe({name: 'unixTime'})
export class UnixTimeConvertPipe implements PipeTransform {
  transform(_time: string, args: string[]): any {
    if (_time) {
      return moment(+_time * 1000).format('YYYY-MM-DD HH:mm');
    }
  }
}
