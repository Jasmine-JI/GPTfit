import { Pipe, PipeTransform } from '@angular/core';

/**
 * 根據區域代碼回傳對應區域中文名稱
 */
@Pipe({name: 'regionCode'})
export class RegionCodePipe implements PipeTransform {
  transform(value: string, args: string[]): any {
    switch (value) {
      case 'TW':
        return '台灣';
      case 'CN':
        return '中國';
      case 'US':
        return '美國';
    }

  }

}
