import { Pipe, PipeTransform } from '@angular/core';

/**
 * 將app id轉成app name
 */
@Pipe({name: 'appId'})
export class AppIdPipe implements PipeTransform {
  transform(value: number, args: string[]): any {
    if (value !== null) {
      switch (value) {
        case 0:
          return 'GPTFit'
        case 1:
          return 'Connect';
        case 2:
          return 'Cloud run';
        case 3:
          return 'Train live';
        case 4:
          return 'Fitness';
      }

    } else {
      return null;
    }

  }

}
