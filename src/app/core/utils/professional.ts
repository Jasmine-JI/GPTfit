import { GroupLevel } from '../../containers/dashboard/models/group-detail';
import { BrandType } from '../enums/professional';

/**
 * 顯示所需的群組id
 * @param _id
 */
export function getPartGroupId(id: string, option?: { start: number; end: number }) {
  const { start, end } = option ?? { start: 0, end: 6 };
  return id.split('-').slice(start, end).join('-');
}

/**
 * 根據群組id取得該群組階層
 * @param _id {string}-group id
 */
export function displayGroupLevel(_id: string): GroupLevel {
  if (_id) {
    const [brand, branch, coach, normal] = _id
      .split('-')
      .splice(2, 4)
      .map((_id) => +_id);
    if (normal > 0) return GroupLevel.normal;
    if (coach > 0) return GroupLevel.class;
    if (branch > 0) return GroupLevel.branch;
    return GroupLevel.brand;
  }

  return GroupLevel.normal;
}

/**
 * 根據群組階層與類別，取得該階層的翻譯鍵名
 * @param level {GroupLevel}-群組階層
 * @param type {BrandType}-群組類別
 */
export function getGroupLevelName(level: GroupLevel, type: BrandType) {
  switch (level) {
    case GroupLevel.brand:
      return getBrandLevelName(type);
    case GroupLevel.branch:
      return getBranchLevelName(type);
    case GroupLevel.class:
      return getClassLevelName(type);
  }
}

/**
 * 根據群組類別取得品牌階層翻譯鍵名
 * @param type {BrandType}-群組類別
 */
export function getBrandLevelName(type: BrandType) {
  switch (type) {
    case BrandType.enterprise:
      return 'universal_group_enterprise';
    case BrandType.school:
      return '學校';
    default:
      return 'universal_group_brand';
  }
}

/**
 * 根據群組類別取得分店階層翻譯鍵名
 * @param type {BrandType}-群組類別
 */
export function getBranchLevelName(type: BrandType) {
  switch (type) {
    case BrandType.enterprise:
      return 'universal_group_companyBranch';
    case BrandType.school:
      return '年級';
    default:
      return 'universal_group_branch';
  }
}

/**
 * 根據群組類別取得課程階層翻譯鍵名
 * @param type {BrandType}-群組類別
 */
export function getClassLevelName(type: BrandType) {
  switch (type) {
    case BrandType.enterprise:
      return 'universal_group_department';
    case BrandType.school:
      return '班級';
    default:
      return 'universal_group_class';
  }
}

/**
 * 取得下一階層的群組階層名稱
 * @param level {GroupLevel}-群組階層
 * @param type {BrandType}-群組類別
 */
export function getNextLayerGroupLevelName(level: GroupLevel, type: BrandType) {
  switch (level) {
    case GroupLevel.brand:
      return getBranchLevelName(type);
    case GroupLevel.branch:
      return getClassLevelName(type);
    default:
      return 'universal_vocabulary_other';
  }
}
