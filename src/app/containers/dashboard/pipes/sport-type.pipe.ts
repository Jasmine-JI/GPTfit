import { Pipe, PipeTransform } from '@angular/core';

@Pipe({name: 'sportType'})
export class SportTypePipe implements PipeTransform {
  transform(value: string, args: string[]): any {
    const sportTypes = [
      'Dashboard.SportReport.run',
      'Dashboard.SportReport.cycle',
      'Dashboard.SportReport.actionTraining',
      'Dashboard.SportReport.swin',
      'Dashboard.SportReport.aerobic',
      'Dashboard.SportReport.boating',
      'SH.noData'
    ];
    return sportTypes[+value - 1];
  }
}
