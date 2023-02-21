import { Pipe, PipeTransform } from '@angular/core';
import { getSportsTypeKey } from '../utils';

@Pipe({
  name: 'sportType',
  standalone: true,
})
export class SportTypePipe implements PipeTransform {
  /**
   * 根據運動類別回傳對應多國語系的鍵
   * @param value {string | number}-運動類型
   * @return {string}-多國語系的鍵
   */
  transform(value: string | number): string {
    return getSportsTypeKey(value);
  }
}
