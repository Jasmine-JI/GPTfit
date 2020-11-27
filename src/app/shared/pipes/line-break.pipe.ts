import { Pipe, PipeTransform } from '@angular/core';

/**
 * 將換行符號\n替換成<br />標籤
 */
@Pipe({name: 'lineBreak'})
export class LineBreakPipe implements PipeTransform {
  transform(value: string, args: string[]): any {
    if (value) {
      return value.replace(new RegExp('\n', 'g'), '<br />');
    }
  }
}
