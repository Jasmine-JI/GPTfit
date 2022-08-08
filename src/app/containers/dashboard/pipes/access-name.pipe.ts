import { Pipe, PipeTransform } from '@angular/core';

/**
 * 群組管理員對應群組階層的多國語系的鍵
 */
@Pipe({ name: 'accessName' })
export class AccessNamePipe implements PipeTransform {
  transform(value: string | number, args: 1 | 2): any {
    if (args === 1) {
      switch (+value) {
        case 0:
          return 'universal_group_highestAuthority';
        case 10:
          return 'universal_group_systemDeveloper';
        case 20:
          return 'universal_group_systemMaintenance';
        case 29:
          return 'universal_group_systemMarketing';
        case 30:
          return 'universal_group_brandAdministrator';
        case 40:
          return 'universal_group_branchAdministrator';
        case 50:
          return 'universal_group_coach';
        case 60:
          return 'universal_group_teacher';
        case 80:
          return 'universal_group_groupAdministrator';
        default:
          return 'universal_group_generalMember';
      }
    } else {
      switch (+value) {
        case 0:
          return 'universal_group_highestAuthority';
        case 10:
          return 'universal_group_systemDeveloper';
        case 20:
          return 'universal_group_systemMaintenance';
        case 29:
          return 'universal_group_systemMarketing';
        case 30:
          return 'universal_group_companyAdmin';
        case 40:
          return 'universal_group_branchAdmin';
        case 50:
          return 'universal_group_departmentAdmin';
        case 60:
          return 'universal_group_administrator';
        case 80:
          return 'universal_group_groupAdministrator';
        default:
          return 'universal_group_generalMember';
      }
    }
  }
}
