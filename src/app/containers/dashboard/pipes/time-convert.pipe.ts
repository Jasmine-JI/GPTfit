import { Pipe, PipeTransform } from '@angular/core';
import * as moment from 'moment';

@Pipe({name: 'time'})
export class TimeConvertPipe implements PipeTransform {
  transform(time: number, args: string[]): any {
    return moment(time * 1000).format('YYYY-MM-DD HH:mm');
  }
}
