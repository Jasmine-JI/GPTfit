import { GroupAccessrightInfo } from '../models/group';
import { GroupJoinStatus, GroupLevel } from '../enum/professional';
import { AccessRight } from '../models/accessright';
import { REGEX_GROUP_ID } from '../models/utils-constant';

/**
 * 處理使用者在群組中之權限
 * @author kidin-1110314
 */
export class GroupAccessright {
  /**
   * 使用者所有群組權限
   */
  private _allAccessright: Array<GroupAccessrightInfo>;

  /**
   * 暫存現在所處之群組頁面其id與權限
   */
  private _currentGroupAccessright = {
    id: null,
    accessright: 99
  };

  constructor() {}

  /**
   * 儲存使用者所有群組權限
   * @author kidin-1110314
   */
  set allAccessright(allAccessright: Array<GroupAccessrightInfo>) {
    this._allAccessright = allAccessright.filter(_accessright => _accessright.joinStatus === GroupJoinStatus.allow);
  }

  /**
   * 取得使用者在該群組之權限
   * @param groupId {string}-群組編號
   * @param groupLevel {GroupLevel}-群組階層
   * @author kidin-1110314
   */
  getGroupAccessright(groupId: string, groupLevel: GroupLevel): AccessRight {
    const { id, accessright: oldAccessright } = this._currentGroupAccessright;
    if (groupId === id) {
      return oldAccessright;
    } else {
      const accessright = this.filterGroupAccessright(groupId, groupLevel);
      this._currentGroupAccessright = {
        id: groupId,
        accessright
      };

      return accessright;
    }

  }

  /**
   * 篩選使用者在該群組之權限
   * @param groupId {string}-群組編號
   * @param groupLevel {GroupLevel}-群組階層
   * @author kidin-1110314
   */
  filterGroupAccessright(groupId: string, groupLevel: GroupLevel): AccessRight {
    const { groups: { brandId, branchId, classId } } = REGEX_GROUP_ID.exec(groupId);
    const relateAccessright = this._allAccessright.filter(_accessright => {
      const { groups: { brandId: _brandId, branchId: _branchId, classId: _classId } } = REGEX_GROUP_ID.exec(_accessright.groupId);
      const sameBrand = brandId === _brandId;
      const sameBranch = sameBrand && branchId === _branchId;
      const sameClass = sameBranch && classId === _classId;
      const brandLevel = sameBrand && _branchId === '0';
      const branchLevel = sameBranch && _classId === '0';
      switch (groupLevel) {
        case GroupLevel.brand:
          return brandLevel;
        case GroupLevel.branch:
          return brandLevel || branchLevel;
        case GroupLevel.class:
          return brandLevel || branchLevel || sameClass;
      }

    }).sort((a, b) => +a.accessRight - +b.accessRight);

    return relateAccessright[0] ? +relateAccessright[0].accessRight : 99;
  }

}