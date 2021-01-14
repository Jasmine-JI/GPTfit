import { Pipe, PipeTransform } from '@angular/core';

@Pipe({name: 'temperatureSibs'})
export class TemperatureSibsPipe implements PipeTransform {

  /**
   * 若為英制，則將攝氏溫度轉華氏溫度
   * @param value {number}-溫度
   * @param args {number}-公英制
   * @author kidin-1100108
   */
  transform(value: number, args: number): string {
    const unitType = args;

    if (unitType === 0) {
      return `${value.toFixed(1)} °C`;
    } else {
      return `${(value * (9 / 5) + 32).toFixed(1)} °F`;
    }
    
  }

}
