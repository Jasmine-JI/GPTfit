import { Pipe, PipeTransform } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

/**
 * 群組子頁面其頁面標題的翻譯
 */
@Pipe({name: 'groupPageTitle'})
export class GroupPageTitlePipe implements PipeTransform {

  constructor(
    private translate: TranslateService
  ) {}

  transform(value: string, args: string[]): any {

    switch (value) {
      case 'group-introduction':
        return `${this.translate.instant('universal_deviceSetting_adout')}`;
      case 'myclass-report':
        return `${this.translate.instant('universal_userProfile_personal')} ${this.translate.instant('universal_group_classReport')}`;
      case 'class-analysis':
        return `${this.translate.instant('universal_group_group')} ${this.translate.instant('universal_group_classReport')}`;
      case 'sports-report':
        return `${this.translate.instant('universal_group_group')} ${this.translate.instant('universal_activityData_sportReport')}`;
      case 'life-tracking':
        return `${this.translate.instant('universal_group_group')} ${this.translate.instant('universal_lifeTracking_lifeTracking')}`;
      case 'cloudrun-report':
        return `${this.translate.instant('universal_group_group')} cloud run ${this.translate.instant('universal_activityData_report')}`;
      case 'member-list':
        return this.translate.instant('universal_group_member');
      case 'group-architecture':
        return `${this.translate.instant('universal_group_group')} ${this.translate.instant('universal_group_layer')}`;
      case 'commerce-plan':
        return this.translate.instant('universal_group_program');
      case 'admin-list':
        return `${this.translate.instant('universal_group_administrator')}`;
    }

  }

}
