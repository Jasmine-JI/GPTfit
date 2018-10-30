import { Pipe, PipeTransform } from '@angular/core';

@Pipe({name: 'sportType'})
export class SportTypePipe implements PipeTransform {
  transform(value: string, args: string[]): any {
    const sportTypes = ['跑步', '自行車', '重量訓練', '游泳', '有氧', '划水(雙手,划船)', '尚無相關類別'];
    return sportTypes[+value - 1];
  }
}
