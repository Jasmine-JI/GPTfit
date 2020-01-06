import { Pipe, PipeTransform } from '@angular/core';

@Pipe({name: 'slice'})
export class SlicePipe implements PipeTransform {
  transform(value: string, args: string[]): any {
    const arr = value.split('?');
    return arr[0];
  }
}
