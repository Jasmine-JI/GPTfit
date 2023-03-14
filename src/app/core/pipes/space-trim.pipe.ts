import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'spaceTrim',
  standalone: true,
})
export class SpaceTrimPipe implements PipeTransform {
  /**
   * 將前後空格去掉
   * @param str {string}-api回覆的特殊字串
   */
  transform(str: string): string {
    return str.trim();
  }
}
