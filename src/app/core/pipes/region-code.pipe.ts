import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'regionCode',
  standalone: true,
})
export class RegionCodePipe implements PipeTransform {
  /**
   * 根據區域代碼回傳對應區域中文名稱
   * @param value {string}-區域代碼
   * @returns {string} 區域中文名稱
   */
  transform(value: string): string {
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
