import { AllGroupMember } from '../all-group-member';
import { GroupInfo } from '../group-info';

/**
 * 處理群組概要數據
 */
export class GroupSportsReportInfo {
  private _groupSportInfo: any = {};

  constructor(groupObj: any, allMemberList: AllGroupMember) {
    this.createGroupInfo(groupObj, allMemberList);
  }

  /**
   * 依成員所屬群組（下階層群組成員亦計入至上層階層群組）計算各群組概要資訊
   * @param groupObj {any}-群組階層
   * @param allMemberList {AllGroupMember}-所有成員資訊（含運動概要數據）
   */
  createGroupInfo(groupObj: any, allMemberList: AllGroupMember) {
    const { memberList } = allMemberList;
    Object.keys(memberList).forEach((_userId: string) => {
      const {
        memberId,
        memberName,
        groupId: _groupId,
        base: _base,
        compare: _compare,
      } = memberList[_userId];

      // 群組成員清單只存基準日期範圍的運動達成人數和隱私權開放狀態
      const { openPrivacy } = _base;
      const targetAchieved = _base.targetAchieved ?? false;
      const _totalActivities = _base.totalActivities ?? 0;

      GroupInfo.getBelongGroup(_groupId).forEach((_list) => {
        const _gId = _list as string;
        const _groupInfo = groupObj[_gId];
        if (_groupInfo) {
          const memberInfo = { memberId, memberName, targetAchieved, openPrivacy };
          const _groupBaseData = groupObj[_gId].base;
          groupObj[_gId].member.push(memberInfo); // 該群組成員清單（含以下階層）

          _groupInfo.totalPeople = (_groupInfo.totalPeople ?? 0) + 1; // 該群組總人數

          _groupBaseData.activityPeople =
            (_groupBaseData.activityPeople ?? 0) + (openPrivacy && _totalActivities ? 1 : 0); // 有數據的人數

          _groupBaseData.targetAchievedPeople =
            (_groupBaseData.targetAchievedPeople ?? 0) + (targetAchieved ? 1 : 0); // 達成目標人數
          if (_compare) {
            const { openPrivacy: _compareOpenPrivacy } = _compare;
            const _compareTargetAchieved = _compare.targetAchieved ?? false;
            const _compareTotalActivities = _compare.totalActivities ?? 0;
            const _groupCompareData = groupObj[_gId].compare;

            _groupCompareData.activityPeople =
              (_groupCompareData.activityPeople ?? 0) +
              (_compareOpenPrivacy && _compareTotalActivities ? 1 : 0); // 有數據的人數

            _groupCompareData.targetAchievedPeople =
              (_groupCompareData.targetAchievedPeople ?? 0) + (_compareTargetAchieved ? 1 : 0); // 達成目標人數
          }

          const excludeKey = [
            'openPrivacy',
            'preferSports',
            'targetAchieved',
            'muscleGroupData',
            'preferMuscleGroup',
            'totalReps',
          ];

          // 將個人基準數據加總至該所屬群組中
          Object.entries(_base).forEach(([_key, _value]) => {
            if (!excludeKey.includes(_key)) {
              const accumulator = groupObj[_gId].base[_key] ?? 0;
              groupObj[_gId].base[_key] = accumulator + _value;
            }
          });

          // 將個人比較數據加總至該所屬群組中(使用底線區隔)
          if (_compare) {
            Object.entries(_compare).forEach(([_key, _value]) => {
              if (!excludeKey.includes(_key)) {
                const accumulator = groupObj[_gId].compare[_key] ?? 0;
                groupObj[_gId].compare[_key] = accumulator + _value;
              }
            });
          }
        }
      });
    });

    this._groupSportInfo = groupObj;
  }

  /**
   * 取得群組概要資訊
   */
  get groupSportInfo() {
    return this._groupSportInfo;
  }

  /**
   * 取得指定群組資訊
   * @param groupId {string}-群組編號
   */
  getAssignGroupInfo(groupId: string, key: string) {
    return this._groupSportInfo[groupId][key];
  }

  /**
   * 將指定的基準數據與比較數據進行比較，確認是否進步
   * @param groupId {string}-群組編號
   * @param dataKey {string}-欲比較的數據
   */
  checkProgressive(groupId: string, dataKey: string) {
    const { base, compare } = this._groupSportInfo[groupId];
    const baseData = base[dataKey] || 0;
    const compareData = compare[dataKey] || 0;
    return baseData - compareData;
  }
}
