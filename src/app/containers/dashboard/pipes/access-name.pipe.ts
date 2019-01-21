import { Pipe, PipeTransform } from '@angular/core';

@Pipe({name: 'accessName'})
export class AccessNamePipe implements PipeTransform {
  transform(value: string, args: string[]): any {
    if (value === '00') {
      return 'Dashboard.Group.System-SuperVisor';
    } else if (value === '10') {
      return 'Dashboard.Group.System-Develop-Admin';
    } else if (value === '20') {
      return 'Dashboard.Group.System-Maintenance-Admin';
    } else if (value === '29') {
      return 'Dashboard.Group.Marketing-Business-Admin';
    } else if (value === '30') {
      return 'Dashboard.Group.BrandAdministrator';
    } else if (value === '40') {
      return 'Dashboard.Group.BranchManager';
    } else if (value === '50') {
      return 'Dashboard.Group.PhysicalFitnessCoach';
    } else if (value === '60') {
      return 'Dashboard.Group.ProfessionalTeacher';
    } else if (value === '80') {
      return 'Dashboard.Group.NormalGroupAdministrator';
    } return 'Dashboard.Group.NormalMember';
  }
}
