import { Pipe, PipeTransform } from '@angular/core';
import moment from 'moment';

interface DateValue {
  birth: number | string;  // 生日
  birthFormat: string;  // 生日格式
  baseDate: number | string;  // 計算年齡的基準點
  baseFormat: string;  // 基準點格式
}

@Pipe({name: 'countAge'})
export class AgePipe implements PipeTransform {
  /**
   * 根據生日計算年齡
   * @param value {DateValue}-生日與計算基準日
   * @return {number}-年齡
   * @author kidin-1101124
   */
  transform(value: DateValue): number {
    const { birth, birthFormat, baseDate, baseFormat } = value; 
    const birthMoment = birthFormat ? moment(birth, birthFormat) : moment(birth);
    let baseDateMoment: any;
    if (baseDate) {
      baseDateMoment = baseFormat ? moment(baseDate, baseFormat) : moment(baseDate);
    } else {
      baseDateMoment = moment();
    }

    return baseDateMoment.diff(birthMoment, 'year');
  }

}
