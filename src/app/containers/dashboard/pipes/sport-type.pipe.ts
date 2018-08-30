import { Pipe, PipeTransform } from '@angular/core';

@Pipe({name: 'sportType'})
export class SportTypePipe implements PipeTransform {
  transform(value: number, args: string[]): any {
    if (value === 0) {
      return '室內跑步';
    } else if (value === 1) {
      return '跑步';
    } else if (value === 3) {
      return '腳踏車';
    } else {
      return '尚無相關類別';
    }
  }
}
