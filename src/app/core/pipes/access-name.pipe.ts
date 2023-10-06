import { Pipe, PipeTransform } from '@angular/core';
import { AccessRight } from '../../core/enums/common';
import { BrandType } from '../../core/enums/professional';

/**
 * 群組管理員對應群組階層的多國語系的鍵
 */
@Pipe({
  name: 'accessName',
  standalone: true,
})
export class AccessNamePipe implements PipeTransform {
  transform(value: string | number, args: BrandType): any {
    const accessRight = +value;
    if (args === BrandType.brand) {
      switch (accessRight) {
        case AccessRight.god:
          return 'universal_group_systemDeveloper';
        case AccessRight.maintainer:
          return 'universal_group_systemMaintenance';
        case AccessRight.auditor:
          return '系統審核員';
        case AccessRight.deviceManager:
          return '裝置管理員';
        case AccessRight.pusher:
          return '系統推播員';
        case AccessRight.marketing:
          return 'universal_group_systemMarketing';
        case AccessRight.brandAdmin:
          return 'universal_group_brandAdministrator';
        case AccessRight.branchAdmin:
          return 'universal_group_branchAdministrator';
        case AccessRight.coachAdmin:
          return 'universal_group_coach';
        case AccessRight.teacher:
          return 'universal_group_teacher';
        case AccessRight.normalAdmin:
          return 'universal_group_groupAdministrator';
        default:
          return 'universal_group_generalMember';
      }
    } else {
      switch (accessRight) {
        case AccessRight.god:
          return 'universal_group_systemDeveloper';
        case AccessRight.maintainer:
          return 'universal_group_systemMaintenance';
        case AccessRight.auditor:
          return '系統審核員';
        case AccessRight.deviceManager:
          return '裝置管理員';
        case AccessRight.pusher:
          return '系統推播員';
        case AccessRight.marketing:
          return 'universal_group_systemMarketing';
        case AccessRight.brandAdmin:
          return 'universal_group_companyAdmin';
        case AccessRight.branchAdmin:
          return 'universal_group_branchAdmin';
        case AccessRight.coachAdmin:
          return 'universal_group_departmentAdmin';
        case AccessRight.teacher:
          return 'universal_group_administrator';
        case AccessRight.normalAdmin:
          return 'universal_group_groupAdministrator';
        default:
          return 'universal_group_generalMember';
      }
    }
  }
}
