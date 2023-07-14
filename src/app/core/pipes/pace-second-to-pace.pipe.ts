import { Pipe, PipeTransform } from '@angular/core';
import { paceSecondTimeFormat } from '../utils';

@Pipe({
  name: 'paceSecondToPace',
  standalone: true,
})
export class PaceSecondToPacePipe implements PipeTransform {
  /**
   * 將配速秒轉為配速(分'秒")
   * @param value 配速秒
   */
  transform(value: number): string {
    return paceSecondTimeFormat(value);
  }
}
