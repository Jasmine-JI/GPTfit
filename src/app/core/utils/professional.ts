import { GroupLevel } from '../../containers/dashboard/models/group-detail';

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
