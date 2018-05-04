import { Pipe, PipeTransform } from '@angular/core';
import * as moment from 'moment';

@Pipe({name: 'unixTime'})
export class UnixTimeConvertPipe implements PipeTransform {
  transform(_time: string, args: string[]): any {
    if (_time) {
      return moment(+_time * 1000).format('YYYY-MM-DD HH:mm');
    }
  }
}
