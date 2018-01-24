import { Pipe, PipeTransform } from '@angular/core';

@Pipe({name: 'mapTranslate'})
export class MapTranslatePipe implements PipeTransform {
  transform(value: string, args: string[]): any {
    if (value === '艾菲爾鐵塔') {
      return 'Tour_Eiffel';
    } else if (value === '居庸關長城') {
      return 'Ju-Yong_customs';
    } else if (value === '慕尼黑奧林匹克公園') {
      return 'Olympiapark_Munchen';
    } else if (value === '希臘 雅典運動場') {
      return 'Panathenean_Stadium';
    } else if (value === '阿爾卑斯山 艾羅路山路') {
      return 'Airolo';
    } else if (value === '繞圈') {
      return 'circle';
    } else if (value === '線段') {
      return 'line';
    }
  }
}
