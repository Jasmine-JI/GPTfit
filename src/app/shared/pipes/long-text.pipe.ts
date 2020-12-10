import { Pipe, PipeTransform } from '@angular/core';

/**
 * 將過長的文字以'...'表示
 */
@Pipe({name: 'longText'})
export class LongTextPipe implements PipeTransform {
  transform(value: string, args: number): any {
    if (value.length > args) {
      return `${value.slice(0, args)}...`;
    } else {
      return value;
    }
    
  }
}
