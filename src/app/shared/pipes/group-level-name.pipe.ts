import { Pipe, PipeTransform } from '@angular/core';

@Pipe({name: 'groupLevelTranslate'})
export class GroupLevelNamePipe implements PipeTransform {
  transform(value: string, args: string[]): any {
    if (+args === 1) {
      if (value === '30') {
        return 'universal_group_brand';
      } else if (value === '40') {
        return 'universal_group_branch';
      } else if (value === '60') {
        return 'universal_group_class';
      } else {
        return 'universal_group_generalGroup';
      }
    } else {
      if (value === '30') {
        return 'universal_group_enterprise';
      } else if (value === '40') {
        return 'universal_group_companyBranch';
      } else if (value === '60') {
        return '';
      } else {
        return 'universal_group_generalGroup';
      }
    }
  }
}
