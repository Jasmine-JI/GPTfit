import { Pipe, PipeTransform } from '@angular/core';

@Pipe({name: 'sportTime'})
export class SportTimePipe implements PipeTransform {
  transform(value: string, args: string[]): any {
    const yVal = +value;
    const costhr = Math.floor(yVal / 3600);
    const costmin = Math.floor(Math.round(yVal - costhr * 60 * 60) / 60);
    const costsecond = Math.round(yVal - costmin * 60);
    const timeHr = ('0' + costhr).slice(-2);
    const timeMin = ('0' + costmin).slice(-2);
    const timeSecond = ('0' + costsecond).slice(-2);

    return `${timeHr}:${timeMin}:${timeSecond}`;
  }
}
