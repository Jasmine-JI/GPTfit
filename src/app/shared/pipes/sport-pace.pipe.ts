import { Pipe, PipeTransform } from '@angular/core';

/**
 * 根據運動類型將速度轉成配速
 */
@Pipe({name: 'sportPace'})
export class SportPacePipe implements PipeTransform {
  transform(value: string | number, args: string | number): string | number {
    
    if (+args === 1 || args === 4 || args === 6) {

      // 速度為0則配速一律顯示60'00"
      if (+value === 0) {
        return `60'00"`;
      } else {
        let yVal: number;
        switch (+args) {
          case 1:  // 跑步配速
            yVal = (60 / +value) * 60;
            break;
          case 4:  // 游泳配速
            yVal = (60 / +value) * 60 / 10;
            break;
          case 6:  // 划船配速
            yVal = (60 / +value) * 60 / 2;
            break;
        }

        const costminperkm = Math.floor(yVal / 60),
              costsecondperkm = Math.round(yVal - costminperkm * 60);

        // 配速超過60一律以60計。
        if (costminperkm > 60) {
          return `60'00"`;
        } else {
          const timeMin = ('0' + costminperkm).slice(-2);
          const timeSecond = ('0' + costsecondperkm).slice(-2);
          return `${timeMin}'${timeSecond}"`;
        }

      }

    } else {
      return +value;
    }

  }

}
