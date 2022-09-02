import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'longText' })
export class LongTextPipe implements PipeTransform {
  /**
   * 將過長的文字以'...'表示
   * @param value {string}-待處理的字串
   * @param args {number}-顯示長度
   * @return {string}-處理過後的字串
   * @author kidin
   */
  transform(value: string, args: number): string {
    if (value.length > args) {
      return `${value.slice(0, args)}...`;
    } else {
      return value;
    }
  }
}
