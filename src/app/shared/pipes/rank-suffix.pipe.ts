import { Pipe, PipeTransform } from '@angular/core';


@Pipe({name: 'rankSuffix'})
export class RankSuffixPipe implements PipeTransform {

  constructor() {}

  /**
   * 根據排名加上後綴
   * @param value {number}-排名
   * @param args {number}-是否只回傳字尾
   * @returns {string}}-加上後綴之排名
   */
  transform(value: number, args = false): string {
    if (value) {
      switch (value) {
        case 1:
          return args ? 'st' : '1st';
        case 2:
          return args ? 'nd' : '2nd';
        case 3:
          return args ? 'rd' : '3rd';
        default:
          return args ? 'th' : `${value}th`;
      }

    } else {
      return '--';
    }
    
  }

}

