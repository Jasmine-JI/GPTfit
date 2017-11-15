import { Pipe, PipeTransform } from '@angular/core';

@Pipe({name: 'time'})
export class TimePipe implements PipeTransform {
  transform(_time: string, args: string[]): any {
    if (_time) {
      const idx = _time.indexOf('.');
      return _time.slice(0, idx);
    }
  }
}
