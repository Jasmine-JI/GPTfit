import { Pipe, PipeTransform } from '@angular/core';

@Pipe({name: 'lineBreak'})
export class LineBreakPipe implements PipeTransform {
  transform(value: string, args: string[]): any {
    if (value) {
      return value.replace(new RegExp('\n', 'g'), '<br />');
    }
  }
}
