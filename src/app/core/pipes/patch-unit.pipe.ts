import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'patchUnit',
  standalone: true,
})
export class PatchUnitPipe implements PipeTransform {
  constructor() {}

  /**
   * 將數字加上單位後變為組合字串
   * @param value {number}}-數值
   * @param arg {string}-單位
   */
  transform(value: number, arg: string): string {
    return `${value}${arg}`;
  }
}
