import { Pipe, PipeTransform } from '@angular/core';
import { GroupLevel, BrandType } from '../enums/professional';

@Pipe({
  name: 'groupLevelTranslate',
  standalone: true,
})
export class GroupLevelNamePipe implements PipeTransform {
  /**
   * 根據group level回傳多國語系的鍵
   * @param value {string}-group id
   * @param brandType 群組品牌類別
   */
  transform(value: number, brandType: string | number): string {
    const defaultKey = 'universal_group_generalGroup';
    let brandSeriesKey: { [level in GroupLevel]?: string };
    switch (+brandType) {
      case BrandType.brand: {
        brandSeriesKey = {
          [GroupLevel.brand]: 'universal_group_brand',
          [GroupLevel.branch]: 'universal_group_branch',
          [GroupLevel.class]: 'universal_group_class',
        };

        break;
      }
      case BrandType.enterprise: {
        brandSeriesKey = {
          [GroupLevel.brand]: 'universal_group_enterprise',
          [GroupLevel.branch]: 'universal_group_companyBranch',
          [GroupLevel.class]: 'universal_group_department',
        };

        break;
      }
      case BrandType.school: {
        brandSeriesKey = {
          [GroupLevel.brand]: '學校',
          [GroupLevel.branch]: '課別',
          [GroupLevel.class]: '班級',
        };
        break;
      }
      default: {
        brandSeriesKey = {};
        break;
      }
    }

    return brandSeriesKey[value] ?? defaultKey;
  }
}
