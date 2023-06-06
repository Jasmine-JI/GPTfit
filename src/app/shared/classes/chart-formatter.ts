import { GroupMemberInfo } from '../../core/models/api/api-11xx';
import { groupIdReg } from '../../core/models/regex';

/**
 * 處理api 1103(infoType: 5) response 的 groupMemberInfo
 */
export class AllGroupMember {
  private _belongGroupId: string;
  private _originMemberList: Array<GroupMemberInfo>;
  private _memberListObj: any;

  constructor() {}

  /**
   * 清除清單
   */
  clearMemberList() {
    this._belongGroupId = undefined;
    this._originMemberList = undefined;
    this._memberListObj = undefined;
  }

  /**
   * 儲存成員清單
   */
  saveNewMemberList(groupId: string, list: Array<GroupMemberInfo>) {
    this._belongGroupId = groupId;
    this._originMemberList = list;
  }

  /**
   * 取得目前清單所屬群組
   */
  get belongGroupId() {
    return this._belongGroupId;
  }

  /**
   * 篩選並取得此群組階層以下（含）不重複的成員id，
   * 同時整理成員清單為一物件方便後續產出團體分析與個人分析
   * @param groupId {groupId}-群組id
   */
  getNoRepeatMemberId(groupId: string): Array<number> {
    const {
      groups: { branchId, classId },
    } = groupIdReg.exec(groupId);
    const idSet = new Set<number>(); // 不重複之成員id，用來取api 2014
    let memberListObj = {}; // 成員清單物件，方便後續產出團體與個人分析
    this._originMemberList.forEach((_list) => {
      const { memberId: _memberId, groupId: _groupId } = _list;
      const {
        groups: { branchId: _branchId, classId: _classId },
      } = groupIdReg.exec(_groupId);
      const isSamgeGroup = groupId === _groupId;
      const isBrandLevel = branchId === '0';
      const branchLevelSameBranch = classId === '0' && branchId === _branchId;

      // 篩選此群組階層以下（含）不重複的成員id
      if (isSamgeGroup || isBrandLevel || branchLevelSameBranch) {
        idSet.add(_list.memberId);

        if (!memberListObj[_memberId]) {
          memberListObj = {
            ...memberListObj,
            [_memberId]: { ..._list, groupId: [_groupId] },
          };
        } else {
          memberListObj[_memberId].groupId.push(_groupId);
        }
      }
    });

    this._memberListObj = memberListObj;
    return Array.from(idSet).sort((a, b) => a - b);
  }

  /**
   * 將含運動數據之成員清單儲存
   * @param userId {number}-使用者編號
   * @param key {string}-物件內資料儲存之鍵名
   * @param data {any}-該使用者運動數據
   */
  savePersonalData(userId: number, key: string, data: any) {
    this._memberListObj[userId] = {
      ...this._memberListObj[userId],
      [key]: data,
    };
  }
}
