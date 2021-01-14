import { Pipe, PipeTransform } from '@angular/core';
import { mi } from '../models/bs-constant';

@Pipe({name: 'sportPaceSibs'})
export class SportPaceSibsPipe implements PipeTransform {

  /**
   * 根據運動類型將速度轉成配速(若為bs英制則公里配速轉英哩配速)
   * @param value {number}-速度
   * @param args {number[]}-[運動類別, 公英制, 是否顯示單位(0. 是, 1. 否)]
   * @author kidin-1100106
   */
  transform(value: number, args: number[]): string | number {
    const type = args[0],
          unitType = args[1];

    let unit: string;
    if (unitType === 0) {
      unit = 'min/km';
    } else {
      unit = 'min/mi';
    }
    

    if (type == 1 || type == 4 || type == 6) {

      // 速度為0則配速一律顯示60'00"
      if (value == 0) {
        return !args[2] || args[2] === 0 ? `60'00" ${unit}` : `60'00"`;
      } else {
        let yVal: number;
        switch (type) {
          case 1:  // 跑步配速
            if (unitType === 0) {
              yVal = (60 / value) * 60;
            } else {
              yVal = (60 / (value / mi)) * 60;
            }
            
            break;
          case 4:  // 游泳配速
            yVal = (60 / value) * 60 / 10;
            unit = 'min/100m';
            break;
          case 6:  // 划船配速
            yVal = (60 / value) * 60 / 2;
            unit = 'min/500m';
            break;
        }

        const costminperkm = Math.floor(yVal / 60),
              costsecondperkm = Math.round(yVal - costminperkm * 60);

        // 配速超過60一律以60計。
        if (costminperkm > 60) {
          return !args[2] || args[2] === 0 ? `60'00" ${unit}` : `60'00"`;
        } else {
          const timeMin = ('0' + costminperkm).slice(-2);
          const timeSecond = ('0' + costsecondperkm).slice(-2);
          return !args[2] || args[2] === 0 ? `${timeMin}'${timeSecond}" ${unit}` : `${timeMin}'${timeSecond}"`;
        }

      }

    } else {
      return value;
    }

  }

}
