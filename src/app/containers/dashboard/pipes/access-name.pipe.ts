import { Pipe, PipeTransform } from '@angular/core';

@Pipe({name: 'accessName'})
export class AccessNamePipe implements PipeTransform {
  transform(value: string, args: string[]): any {
    if (+args === 1) {
      if (value === '00') {
        return 'Dashboard.Group.highestAuthority';
      } else if (value === '10') {
        return 'Dashboard.Group.systemDeveloper';
      } else if (value === '20') {
        return 'Dashboard.Group.systemMaintenance';
      } else if (value === '29') {
        return 'Dashboard.Group.systemMarketing';
      } else if (value === '30') {
        return 'Dashboard.Group.brandAdministrator';
      } else if (value === '40') {
        return 'Dashboard.Group.branchAdministrator';
      } else if (value === '50') {
        return 'Dashboard.Group.coach';
      } else if (value === '60') {
        return 'Dashboard.Group.teacher';
      } else if (value === '80') {
        return 'Dashboard.Group.groupAdministrator';
      } return 'Dashboard.Group.generalMember';
    } else {
      if (value === '00') {
        return 'Dashboard.Group.highestAuthority';
      } else if (value === '10') {
        return 'Dashboard.Group.systemDeveloper';
      } else if (value === '20') {
        return 'Dashboard.Group.systemMaintenance';
      } else if (value === '29') {
        return 'Dashboard.Group.systemMarketing';
      } else if (value === '30') {
        return 'other.comAdministrator';
      } else if (value === '40') {
        return 'other.subComAdministrator';
      } else if (value === '50') {
        return 'other.departmentAdministrator';
      } else if (value === '60') {
        return 'other.leagueAdministrator';
      } else if (value === '80') {
        return 'Dashboard.Group.groupAdministrator';
      } return 'Dashboard.Group.generalMember';
    }
  }
}
