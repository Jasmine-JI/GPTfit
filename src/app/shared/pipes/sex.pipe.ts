import { Pipe, PipeTransform } from '@angular/core';


@Pipe({name: 'sex'})
export class SexPipe implements PipeTransform {
  /**
   * 根據性別代碼回傳對應的性別
   * @param value {number}-性別代碼
   * @returns {string}-代碼代表性別名稱
   */
  transform(value: number, arg: 'en' | 'i18n' = 'en'): string {
    switch (value) {
      case 0:
        return arg === 'en' ? 'male' : 'universal_userProfile_male';
      case 1:
        return arg === 'en' ? 'female' : 'universal_userProfile_female';
      default:
        return arg === 'en' ? 'private' : 'universal_uiFitpair_private';
    }

  }

}
