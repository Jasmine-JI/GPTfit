import { Pipe, PipeTransform } from '@angular/core';

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
