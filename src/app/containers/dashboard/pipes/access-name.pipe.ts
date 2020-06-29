import { Pipe, PipeTransform } from '@angular/core';

@Pipe({name: 'accessName'})
export class AccessNamePipe implements PipeTransform {
  transform(value: string, args: string[]): any {
    if (+args === 1) {
      if (value === '00') {
        return 'universal_group_highestAuthority';
      } else if (value === '10') {
        return 'universal_group_systemDeveloper';
      } else if (value === '20') {
        return 'universal_group_systemMaintenance';
      } else if (value === '29') {
        return 'universal_group_systemMarketing';
      } else if (value === '30') {
        return 'universal_group_brandAdministrator';
      } else if (value === '40') {
        return 'universal_group_branchAdministrator';
      } else if (value === '50') {
        return 'universal_group_coach';
      } else if (value === '60') {
        return 'universal_group_teacher';
      } else if (value === '80') {
        return 'universal_group_groupAdministrator';
      } return 'universal_group_generalMember';
    } else {
      if (value === '00') {
        return 'universal_group_highestAuthority';
      } else if (value === '10') {
        return 'universal_group_systemDeveloper';
      } else if (value === '20') {
        return 'universal_group_systemMaintenance';
      } else if (value === '29') {
        return 'universal_group_systemMarketing';
      } else if (value === '30') {
        return 'universal_group_companyAdmin';
      } else if (value === '40') {
        return 'universal_group_branchAdmin';
      } else if (value === '50') {
        return 'universal_group_departmentAdmin';
      } else if (value === '60') {
        return 'universal_group_administrator';
      } else if (value === '80') {
        return 'universal_group_groupAdministrator';
      } return 'universal_group_generalMember';
    }
  }
}
