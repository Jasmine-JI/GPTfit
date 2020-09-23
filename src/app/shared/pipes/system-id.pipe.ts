import { Pipe, PipeTransform } from '@angular/core';

@Pipe({name: 'systemId'})
export class SystemIdPipe implements PipeTransform {
  transform(value: number, args: string[]): any {
    switch (value) {
      case 1:
        return 'Ios';
      case 2:
        return 'Android';
    }

  }

}
