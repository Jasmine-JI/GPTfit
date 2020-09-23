import { Pipe, PipeTransform } from '@angular/core';

@Pipe({name: 'languageCode'})
export class LanguageCodePipe implements PipeTransform {
  transform(value: string, args: string[]): any {
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
