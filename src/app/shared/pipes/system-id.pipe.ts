import { Pipe, PipeTransform } from '@angular/core';

/**
 * 根據系統類別回傳對應系統名稱
 */
@Pipe({name: 'systemId'})
export class SystemIdPipe implements PipeTransform {
  transform(value: number, args: string[]): any {
    switch (value) {
      case 0:
        return 'Web'
      case 1:
        return 'iOS';
      case 2:
        return 'Android';
    }

  }

}
