import { Pipe, PipeTransform } from '@angular/core';

@Pipe({name: 'accessName'})
export class AccessNamePipe implements PipeTransform {
  transform(value: string, args: string[]): any {
    if (value === '00') {
      return '神';
    } else if (value === '10') {
      return '系統開發員';
    } else if (value === '20') {
      return '系統維護';
    } else if (value === '29') {
      return '行企人員';
    } else if (value === '30') {
      return '品牌管理員';
    } else if (value === '40') {
      return '品牌分店管理員';
    } else if (value === '50') {
      return '體適能教練';
    } else if (value === '60') {
      return '專業老師';
    } else if (value === '80') {
      return '群組長';
    } return '一般成員';
  }
}
