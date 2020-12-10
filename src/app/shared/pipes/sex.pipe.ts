import { Pipe, PipeTransform } from '@angular/core';

/**
 * 根據性別代碼回傳對應的性別
 */
@Pipe({name: 'sex'})
export class SexPipe implements PipeTransform {
  transform(value: number, args: string[] = null): any {
    switch (value) {
      case 0:
        return 'male';
      case 1:
        return 'female';
      default:
        return 'private';
    }

  }

}
