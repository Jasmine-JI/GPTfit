import { Pipe, PipeTransform } from '@angular/core';

@Pipe({name: 'sportPace'})
export class SportPacePipe implements PipeTransform {
  transform(value: string, args: any): any {
    if (+value === 0 && (args === '1' || args === '4' || args === '6')) {
      return `60'00"`;
    }
    let yVal = 60 / +value * 60;
    if (args === '1') { // 跑步配速
      const costminperkm = Math.floor(yVal / 60);
      const costsecondperkm = Math.round(yVal - costminperkm * 60);
      const timeMin = ('0' + costminperkm).slice(-2);
      const timeSecond = ('0' + costsecondperkm).slice(-2);
      return `${timeMin}'${timeSecond}"`;
    } else if (args === '4') {　// 游泳配速
      yVal = (60 / +value) * 60 / 10;
      const costminperkm = Math.floor(yVal / 60);
      const costsecondperkm = Math.round(yVal - costminperkm * 60);
      const timeMin = ('0' + costminperkm).slice(-2);
      const timeSecond = ('0' + costsecondperkm).slice(-2);
      return `${timeMin}'${timeSecond}"`;
    } else if (args === '6') { // 游泳配速
      yVal = (60 / +value) * 60 / 2;
      const costminperkm = Math.floor(yVal / 60);
      const costsecondperkm = Math.round(yVal - costminperkm * 60);
      const timeMin = ('0' + costminperkm).slice(-2);
      const timeSecond = ('0' + costsecondperkm).slice(-2);
      return `${timeMin}'${timeSecond}"`;
    } else {
      return +value;
    }
  }
}
