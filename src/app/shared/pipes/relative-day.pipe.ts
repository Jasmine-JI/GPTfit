import { Pipe, PipeTransform } from '@angular/core';

@Pipe({name: 'relativeDay'})
export class RelativeDayPipe implements PipeTransform {
  transform(retiveTimeStamp: number, args: string[]): any {
    const relativeDay = retiveTimeStamp / (24 * 60 * 60 * 1000);
    if (relativeDay < 30) {
      return `${Math.round(relativeDay)}天前`;
    } else if (relativeDay >= 30 && relativeDay < 365) {
      return `${Math.round(relativeDay / 30)}個月前`;
    } else {
      return `${Math.round(relativeDay / 365)}年前`;
    }

  }

}
