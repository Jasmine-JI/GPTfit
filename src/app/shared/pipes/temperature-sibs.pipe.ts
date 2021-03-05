import { Pipe, PipeTransform } from '@angular/core';

@Pipe({name: 'temperatureSibs'})
export class TemperatureSibsPipe implements PipeTransform {

  /**
   * 若為英制，則將攝氏溫度轉華氏溫度
   * @param value {number}-溫度
   * @param args {number[]}-[公英制, 是否顯示單位 0.是 1.否]
   * @author kidin-1100108
   */
  transform(value: number, args: number[]): number | string {
    const checkValue = value ? value : 0,
          unitType = args[0];

    if (unitType === 0) {
      return args[1] === 0 ? `${checkValue.toFixed(1)} °C` : +`${checkValue.toFixed(1)}`;
    } else {
      return args[1] === 0 ? `${(checkValue * (9 / 5) + 32).toFixed(1)} °F` : +`${(checkValue * (9 / 5) + 32).toFixed(1)}`;
    }
    
  }

}
