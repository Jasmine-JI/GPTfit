import { GroupMemberInfo } from '../models/group';
import { REGEX_GROUP_ID } from '../models/utils-constant';
import { GroupInfo } from './group-info';
import { GroupLevel } from '../enum/professional';
import { MuscleGroup } from '../enum/weight-train';
import { ReportDateType } from '../models/report-condition';

/**
 * 處理api 1103(infoType: 5) response 的 groupMemberInfo
 */
export class AllGroupMember {
  private _belongGroupId: string;
  private _originMemberList: Array<GroupMemberInfo>;
  private _groupListObj: any;
  private _memberListObj: any;

  constructor() {}

  /**
   * 清除清單
   */
  clearMemberList() {
    this._belongGroupId = undefined;
    this._originMemberList = undefined;
    this._groupListObj = undefined;
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
    } = REGEX_GROUP_ID.exec(groupId);
    const idSet = new Set<number>(); // 不重複之成員id，用來取api 2014
    let memberListObj = {}; // 成員清單物件，方便後續產出團體與個人分析
    this._originMemberList.forEach((_list) => {
      const { memberId: _memberId, groupId: _groupId } = _list;
      const {
        groups: { branchId: _branchId, classId: _classId },
      } = REGEX_GROUP_ID.exec(_groupId);
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
   * 取得群組清單陣列
   * （內含各群組成員清單，品牌群組成員清單為該品牌以下（含）所有成員，以此類推）
   * @param groupId {groupId}-群組id
   */
  getGroupList(groupId: string) {
    const groupLevel = GroupInfo.getGroupLevel(groupId);
    const groupListObj = { [groupId]: [] };
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

  /**
   * 取得含運動數據之成員清單
   */
  get memberList() {
    return this._memberListObj;
  }

  /**
   * 將指定的基準數據與比較數據進行比較，確認是否進步
   * @param userId {string}-使用者編號
   * @param dataKey {string}-欲比較的數據
   */
  checkProgressive(userId: string, dataKey: string) {
    const { base, compare } = this.memberList[userId];
    if (base && compare) {
      const baseData = base ? base[dataKey] : 0;
      const compareData = compare ? compare[dataKey] : 0;
      return baseData - compareData;
    }

    return 0;
  }

  /**
   * 取得指定的個人肌群資訊
   * @param userId {number}-使用者編號
   * @param dateType {ReportDateType}-日期類型（基準/比較）
   * @param muscleGroup {MuscleGroup}-欲比較的數據
   */
  getPersonalWeightData(userId: number, dateType: ReportDateType, muscleGroup: MuscleGroup) {
    const userData = this.memberList[userId];
    if (userData) {
      const assignData = userData[dateType];
      if (assignData) {
        const { muscleGroupData } = assignData;
        if (muscleGroupData) {
          const assignGroupData = muscleGroupData[muscleGroup];
          const totalWeight = assignGroupData.reduce((prev, current) => prev + current);
          if (totalWeight > 0) {
            const [weight, reps, sets] = assignGroupData;
            return `${Math.round(weight)}*${Math.round(reps)}*${Math.round(sets)}`;
          }
        }
      }
    }

    return '--';
  }

  /**
   * 將指定肌群的基準數據與比較數據進行比較，確認是否進步
   * @param userId {number}-使用者編號
   * @param muscleGroup {MuscleGroup}-欲比較的數據
   */
  checkWeightTrainProgressive(userId: number, muscleGroup: MuscleGroup) {
    const { base, compare } = this.memberList[userId];
    if (base && compare) {
      const baseMuscleData = base.muscleGroupData;
      const [baseWeight, baseRep, baseSet] = baseMuscleData
        ? base.muscleGroupData[muscleGroup]
        : [0, 0, 0];
      const baseTotalWeight = baseWeight * baseRep * baseSet;
      const compareMuscleData = compare.muscleGroupData;
      const [compareWeight, compareRep, compareSet] = compareMuscleData
        ? compare.muscleGroupData[muscleGroup]
        : [0, 0, 0];
      const compareTotalWeight = compareWeight * compareRep * compareSet;
      return baseTotalWeight - compareTotalWeight;
    }
  }
}
