import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'languageCode' })
export class LanguageCodePipe implements PipeTransform {
  /**
   * 根據區域語系碼回傳相對應語系中文名稱
   * @param value {string}-區域語系碼
   * @returns {string}-語系中文名稱
   * @author kidin
   */
  transform(value: string): string {
    switch (value.toLowerCase()) {
      case 'zh-tw':
        return '繁體中文';
      case 'zh-cn':
        return '簡體中文';
      case 'en-us':
        return '英文';
      case 'es-es':
        return '西班牙語';
      case 'de-de':
        return '德語';
      case 'fr-fr':
        return '法語';
      case 'it-it':
        return '義語';
      case 'pt-pt':
        return '葡萄牙語';
    }
  }
}
