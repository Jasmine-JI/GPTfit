import { Pipe, PipeTransform } from '@angular/core';

@Pipe({name: 'lineBreak'})
export class LineBreakPipe implements PipeTransform {

  /**
   * 將換行符號\n替換成<br />標籤
   * @param value {string}-待處理的字串
   * @return {string}-處理過後的字串
   * @author kidin
   */
  transform(value: string): string {
    if (value) {
      return value.replace(new RegExp('\n', 'g'), '<br />');
    }
  }
}
