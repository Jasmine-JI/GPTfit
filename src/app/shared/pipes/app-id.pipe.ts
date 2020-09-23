import { Pipe, PipeTransform } from '@angular/core';

@Pipe({name: 'appId'})
export class AppIdPipe implements PipeTransform {
  transform(value: number, args: string[]): any {
    switch (value) {
      case 1:
        return 'Connect';
      case 2:
        return 'Cloud run';
      case 3:
        return 'Train live';
      case 4:
        return 'Fitness';
    }

  }

}
