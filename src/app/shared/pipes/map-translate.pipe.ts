import { Pipe, PipeTransform } from '@angular/core';

@Pipe({name: 'mapTranslate'})
export class MapTranslatePipe implements PipeTransform {
  transform(value: string, args: string[]): any {
    if (value === '艾菲爾鐵塔路跑') {
      return 'Tour_Eiffel';
    } else if (value === '居庸關長城') {
      return 'Ju-Yong_customs';
    } else if (value === '歐伯維森菲爾德 奧林匹克體育場') {
      return 'Olympiapark_Munchen';
    } else if (value === '帕那辛奈克體育場') {
      return 'Panathenean_Stadium';
    } else if (value === '阿爾卑斯山道賽') {
      return 'Airolo';
    } else if (value === '繞圈') {
      return 'circle';
    } else if (value === '線段') {
      return 'line';
    } else if (value === '萬金石暖身賽') {
      return 'Wanjinshi warm-up';
    }
  }
}
