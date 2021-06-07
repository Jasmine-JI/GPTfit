import { Pipe, PipeTransform } from '@angular/core';
import { mi } from '../models/bs-constant';
import { SportCode } from '../models/report-condition';

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
    switch (type) {
      case SportCode.run:
        if (unitType === 0) {
          unit = 'min/km';
        } else {
          unit = 'min/mi';
        }
        break;
      case SportCode.swim:
        unit = 'min/100m';
        break;
      case SportCode.row:
        unit = 'min/500m';
        break;
    }

    if ([SportCode.run, SportCode.swim, SportCode.row].includes(type)) {

      // 速度為0則配速一律顯示60'00"
      if (value == 0) {
        return !args[2] || args[2] === 0 ? `60'00" ${unit}` : `60'00"`;
      } else {
        let yVal: number;
        switch (type) {
          case SportCode.run:  // 跑步配速
            if (unitType === 0) {
              yVal = (60 / value) * 60;
            } else {
              yVal = (60 / (value / mi)) * 60;
            }
            
            break;
          case SportCode.swim:  // 游泳配速
            yVal = (60 / value) * 60 / 10;
            break;
          case SportCode.row:  // 划船配速
            yVal = (60 / value) * 60 / 2;
            break;
        }

        const costminperkm = Math.floor(yVal / 60),
              costsecondperkm = Math.round(yVal - costminperkm * 60);

        // 配速超過60一律以60計。
        if (costminperkm > 60) {
          return !args[2] || args[2] === 0 ? `60'00" ${unit}` : `60'00"`;
        } else {
          let timeMin = ('0' + costminperkm).slice(-2);
          let timeSecond = ('0' + costsecondperkm).slice(-2);
          // 因應四捨五入
          if (timeSecond === '60') {
            timeSecond = '00';
            timeMin = +timeMin === 60 ? '60' : `${+timeMin + 1}`
          }

          return !args[2] || args[2] === 0 ? `${timeMin}'${timeSecond}" ${unit}` : `${timeMin}'${timeSecond}"`;
        }

      }

    } else {
      return value;
    }

  }

}
