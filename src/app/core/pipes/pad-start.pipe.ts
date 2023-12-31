import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'padStart',
  standalone: true,
})
export class PadStartPipe implements PipeTransform {
  constructor() {}

  /**
   * 將字串用特定字元補足長度
   * @param value {string | number}-字串或數字
   * @param args {{ length: number; filler: string; }}-參數
   */
  transform(value: string | number, args: { length: number; filler: string }): string {
    const { length, filler } = args;
    return value.toString().padStart(length, filler);
  }
}
