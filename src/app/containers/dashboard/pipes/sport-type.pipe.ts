import { Pipe, PipeTransform } from '@angular/core';

@Pipe({name: 'sportType'})
export class SportTypePipe implements PipeTransform {
  transform(value: string, args: string[]): any {
    const sportTypes = [
      'universal_activityData_run',
      'universal_activityData_cycle',
      'universal_activityData_weightTraining',
      'universal_activityData_swin',
      'universal_activityData_aerobic',
      'universal_sportsName_boating',
      'universal_status_noData'
    ];
    return sportTypes[+value - 1];
  }
}
