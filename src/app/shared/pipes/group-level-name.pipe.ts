import { Pipe, PipeTransform } from '@angular/core';

/**
 * 根據group level回傳多國語系的鍵
 */
@Pipe({name: 'groupLevelTranslate'})
export class GroupLevelNamePipe implements PipeTransform {
  transform(value: number, args: string | number): any {
    if (+args === 1) {

      switch (value) {
        case 30:
          return 'universal_group_brand';
        case 40:
          return 'universal_group_branch';
        case 60:
          return 'universal_group_class';
        default:
          return 'universal_group_generalGroup';
      }

    } else {
      switch (value) {
        case 30:
          return 'universal_group_enterprise';
        case 40:
          return 'universal_group_companyBranch';
        case 60:
          return 'universal_group_department';
        default:
          return 'universal_group_generalGroup';
      }

    }

  }

}
