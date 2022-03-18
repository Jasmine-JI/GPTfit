import { GroupDetail } from '../models/group';
import { REGEX_GROUP_ID } from '../models/utils-constant';
import { GroupLevel, GroupJoinStatus, GroupStatus } from '../enum/professional';
import dayjs from 'dayjs';
import { DateUnit } from '../enum/report';

export class GroupInfo {

  /**
   * api 1102 回傳之info內的資訊
   */
  private _groupDetail: GroupDetail;

  /**
   * api 1115 回傳之info內的資訊
   */
  private _commerceInfo;

  /**
   * api 1103 相關群組列表（infoType: 1）
   */
  private _immediateGroupList;

  /**
   * api 1103 管理員清單（infoType: 2）
   */
  private _adminList;

  /**
   * api 1103 成員清單（infoType: 3）
   */
  private _memberList;

  /**
   * api 1103 所有成員清單（infoType: 5）
   */
  private _allMemberList;


  constructor() {}

  /**
   * 取得目前群組階層
   */
  get groupLevel(): GroupLevel {
    const { groupId } = this._groupDetail;
    return GroupInfo.getGroupLevel(groupId);
  }

  /**
   * 取得群組方案是否到期
   */
  get commerceExpired(): boolean {
    const { commercePlanExpired } = this._commerceInfo;
    const commercePlanTimestamp = dayjs(commercePlanExpired).valueOf();
    const currentTimestamp = dayjs().valueOf();
    return currentTimestamp > commercePlanTimestamp;
  }

  /**
   * 儲存群組詳細資訊
   */
  set groupDetail(groupDetail: GroupDetail) {
    this._groupDetail = groupDetail;
  }

  /**
   * 取得儲存的群組資訊
   */
  get groupDetail() {
    return this._groupDetail;
  }

  /**
   * 儲存群組方案資訊
   */
  set commerceInfo(commerceInfo: any) {
    this._commerceInfo = commerceInfo;
  }

  /**
   * 取得群組方案資訊
   */
  get commerceInfo() {
    return this._commerceInfo;
  }

  /**
   * 儲存相關群組清單
   */
  set immediateGroupList(immediateGroupList: any) {
    this._immediateGroupList = immediateGroupList;
  }

  /**
   * 取得相關群組清單
   */
  get immediateGroupList() {
    return this._immediateGroupList;
  }

  /**
   * 儲存管理員清單
   */
  set adminList(adminList: any) {
    this._adminList = adminList;
  }

  /**
   * 取得管理員清單
   */
  get adminList() {
    return this._adminList;
  }

  /**
   * 儲存一般成員清單
   */
  set memberList(memberList: any) {
    this._memberList = memberList;
  }

  /**
   * 取得一般成員清單
   */
  get memberList() {
    return this._memberList;
  }

  /**
   * 儲存該群組權限範圍內所有成員清單
   */
  set allMemberList(allMemberList: any) {
    this._allMemberList = allMemberList;
  }

  /**
   * 取得該群組權限範圍內所有成員清單
   */
  get allMemberList() {
    return this._allMemberList;
  }

  /**
   * 依群組判斷群組階層
   * @param groupId {string}-群組id
   */
  static getGroupLevel(groupId: string): GroupLevel {
    const { groups: { branchId, classId } } = REGEX_GROUP_ID.exec(groupId);
    if (classId !== '0') return GroupLevel.class;
    if (branchId !== '0') return GroupLevel.branch;
    return GroupLevel.brand;
  }

  /**
   * 取得群組目標
   */
  get sportTarget() {
    const { groupDetail: { target, groupRootInfo }, groupLevel } = this;
    const referenceLevel = target.name;
    if (referenceLevel) {
      const targetReference = +referenceLevel as GroupLevel;
      let referenceIndex: number = -1;
      switch (targetReference) {
        case GroupLevel.brand:
          referenceIndex = 2;
          break;
        case GroupLevel.branch:
          referenceIndex = 3;
          break;
        default:
          return target;
      }

      const referenceTarget = groupRootInfo[referenceIndex].target;
      if (referenceTarget.name) return referenceTarget;
    }

    // 若target皆為空物件，則回傳預設值
    return {
      name: referenceLevel ?? groupLevel,
      cycle: DateUnit.week,
      condition: []
    };

  }

}