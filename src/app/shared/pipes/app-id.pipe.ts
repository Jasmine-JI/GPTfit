import { Pipe, PipeTransform } from '@angular/core';

@Pipe({name: 'appId'})
export class AppIdPipe implements PipeTransform {

  /**
   * 將app id轉成app name
   * @param value {number}-app id
   * @returns {string}-app name
   * @author kidin
   */
  transform(value: number): string {
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
