import { Pipe, PipeTransform } from '@angular/core';

@Pipe({name: 'groupLevelTranslate'})
export class GroupLevelNamePipe implements PipeTransform {
  transform(value: string, args: string[]): any {
    if (value === '30') {
      return '品牌';
    } else if (value === '40') {
      return '分店';
    } else if (value === '60') {
      return '課程';
    } else {
      return '一般群組';
    }
  }
}
