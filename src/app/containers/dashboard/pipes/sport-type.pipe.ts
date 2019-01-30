import { Pipe, PipeTransform } from '@angular/core';

@Pipe({name: 'sportType'})
export class SportTypePipe implements PipeTransform {
  transform(value: string, args: string[]): any {
    const sportTypes = [
      'Dashboard.SportReport.Run',
      'Dashboard.SportReport.Cycle',
      'Dashboard.SportReport.WeightTraining',
      'Dashboard.SportReport.Swim',
      'Dashboard.SportReport.Aerobic',
      'Dashboard.SportReport.Rowing',
      'SH.No-information'
    ];
    return sportTypes[+value - 1];
  }
}
