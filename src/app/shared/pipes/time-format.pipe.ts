import { Pipe, PipeTransform } from '@angular/core';
import moment from 'moment';

@Pipe({name: 'timeFormat'})
export class TimeFormatPipe implements PipeTransform {
  transform(value: string, args: string): any {
    return moment(value).format(args);
  }

}
