import { Injectable } from '@angular/core';
import { Api11xxService, AuthService } from '../../../core/services';
import { Observable, BehaviorSubject, ReplaySubject, of } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { checkResponse, displayGroupLevel } from '../../../core/utils';
import { AccessRight } from '../../../shared/enum/accessright';
import { GroupAccessrightInfo } from '../../../shared/models/group';
import { GroupJoinStatus, GroupLevel } from '../../../shared/enum/professional';
import { REGEX_GROUP_ID } from '../../../shared/models/utils-constant';
import { GroupInfo } from '../../../shared/classes/group-info';
import { GroupDetailInfo, UserSimpleInfo } from '../../dashboard/models/group-detail';
import { AllGroupMember } from '../../../shared/classes/all-group-member';
import { SportsTarget } from '../../../shared/classes/sports-target';
import { GroupDetail } from '../../../shared/models/group';

@Injectable({
  providedIn: 'root',
})
export class ProfessionalService {
  editMode$ = new ReplaySubject<'edit' | 'create' | 'complete' | 'close'>(1); // 是否進入編輯模式或建立模式
  userSimpleInfo$ = new ReplaySubject<UserSimpleInfo>(1); // 儲存使用者在該群組的簡易資訊（權限）-kidin-1091103
  groupInfo$ = new BehaviorSubject<any>({}); // 儲存group資訊-kidin-1081210
  groupDetail$ = new ReplaySubject<any>(1); // 儲存群組基本概要方便各子頁面使用-kidin-1091020
  allLevelGroupData$ = new ReplaySubject<any>(1); // 儲存 同"品牌/企業" group 資訊-kidin-1090716
  groupCommerceInfo$ = new ReplaySubject<any>(1); // 儲存群組經營權限資訊-kidin-1091104
  classMemberList$ = new BehaviorSubject<any>([]); // 儲存課程成員清單-kidin-1091116
  adminList$ = new ReplaySubject<any>(1);
  normalMemberList$ = new ReplaySubject<any>(1);

  memList$ = new BehaviorSubject<any>({
    // 成員清單
    groupId: '',
    groupList: [],
  });

  newGroupId$ = new ReplaySubject<any>(1); // 創建群組的group id，以上傳圖床。

  /**
   * 目前瀏覽中群組資訊
   */
  currentGroupInfo = new GroupInfo();

  /**
   * 目前瀏覽中群組所有成員清單
   */
  allGroupMemberList = new AllGroupMember();

  /**
   * 使用者所有群組權限
   */
  private _allAccessright: Array<GroupAccessrightInfo>;

  /**
   * 目前所在群組之編號
   */
  private _currentGroupId: string;

  /**
   * 使用者於該群組之權限
   */
  private _groupAccessright$ = new BehaviorSubject(AccessRight.guest);

  constructor(private authService: AuthService, private api11xxService: Api11xxService) {
    this.refreshAllGroupAccessright();
  }

  /**
   * 取得使用者於該群組之權限
   */
  get groupAccessright() {
    return this._groupAccessright$;
  }

  /**
   * 取得是否為該群組之管理員（不含以上權限）
   */
  get isAdmin() {
    if (!this._allAccessright) return false;

    const currentAccessRight = this._allAccessright.filter(
      (_list) => _list.groupId === this._currentGroupId
    );
    if (!currentAccessRight[0]) return false;

    return +currentAccessRight[0].accessRight <= AccessRight.coachAdmin;
  }

  /**
   * 透過api 1113取得使用者所有群組權限值
   */
  refreshAllGroupAccessright() {
    const body = { token: this.authService.token };
    this.api11xxService
      .fetchMemberAccessRight(body)
      .pipe(
        map((res: any) => {
          const result = checkResponse(res, false) ? res.info.groupAccessRight : [];
          this._allAccessright = result.filter(
            (_accessright) => _accessright.joinStatus === GroupJoinStatus.allow
          );
          return result;
        }),
        tap((result) => this.checkGroupAccessright(this._currentGroupId, true))
      )
      .subscribe();
  }

  /**
   * 取得使用者在該群組之權限
   * @param groupId {string}-群組編號
   * @param init {GroupLevel}-是否為取得api 1113後初始化之步驟
   */
  checkGroupAccessright(groupId: string, init = false) {
    if (init || groupId !== this._currentGroupId) {
      const accessright = this.filterGroupAccessright(groupId);
      this._currentGroupId = groupId;
      this._groupAccessright$.next(accessright);
    }
  }

  /**
   * 篩選使用者在該群組之權限
   * @param groupId {string}-群組編號
   * @param groupLevel {GroupLevel}-群組階層
   * @author kidin-1110314
   */
  filterGroupAccessright(groupId: string): AccessRight {
    if (this._allAccessright && groupId) {
      const {
        groups: { brandId, branchId, classId },
      } = REGEX_GROUP_ID.exec(groupId);
      const groupLevel = GroupInfo.getGroupLevel(groupId);
      const relateAccessright = this._allAccessright
        .filter((_accessright) => {
          const {
            groups: { brandId: _brandId, branchId: _branchId, classId: _classId },
          } = REGEX_GROUP_ID.exec(_accessright.groupId);
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
        })
        .sort((a, b) => +a.accessRight - +b.accessRight);

      return relateAccessright[0] ? +relateAccessright[0].accessRight : AccessRight.guest;
    }

    return AccessRight.guest;
  }

  /**
   * 取得訂閱的成員列表
   */
  getMemList(): Observable<any> {
    return this.memList$;
  }

  /**
   * 儲存訂閱的成員列表
   * @param status {any}
   */
  setMemList(status: any) {
    this.memList$.next(status);
  }

  /**
   * 取得課程一般成員名單
   */
  getRXClassMemberList() {
    return this.classMemberList$;
  }

  /**
   * 儲存課程一般成員名單
   * @param list {Array<any>}
   */
  setClassMemberList(list: Array<any>) {
    this.classMemberList$.next(list);
  }

  /**
   * 取得管理員名單
   */
  getRXAdminList() {
    return this.adminList$;
  }

  /**
   * 儲存管理員名單
   * @param list {Array<any>}
   */
  setAdminList(list: Array<any>) {
    this.adminList$.next(list);
  }

  /**
   * 取得一般成員名單
   */
  getRXNormalMemberList() {
    return this.normalMemberList$;
  }

  /**
   * 儲存一般成員名單
   * @param list {Array<any>}
   */
  setNormalMemberList(list: Array<any>) {
    this.normalMemberList$.next(list);
  }

  /**
   * 取得訂閱的group資訊
   */
  getGroupInfo() {
    return this.groupInfo$;
  }

  /**
   * 儲存group資訊
   * @param status {object}
   */
  saveGroupInfo(status: object) {
    this.groupInfo$.next(status);
  }

  /**
   * 儲存群組概要資訊
   * @param detail {GroupDetailInfo}-api 1102回傳內容
   */
  saveGroupDetail(detail: GroupDetailInfo) {
    this.groupDetail$.next(detail);
  }

  /**
   * 取得群組概要資訊
   */
  getRxGroupDetail() {
    return this.groupDetail$;
  }

  /**
   * 儲存群組概要資訊
   * @param Detail {any}-api 1102回傳內容
   */
  saveCommerceInfo(commerceInfo: any) {
    this.groupCommerceInfo$.next(commerceInfo);
  }

  /**
   * 取得群組概要資訊
   */
  getRxCommerceInfo() {
    return this.groupCommerceInfo$;
  }

  /**
   * 儲存新的群組id
   * @param Detail {string}-新的group id
   */
  saveNewGroupId(id: string) {
    this.newGroupId$.next(id);
  }

  /**
   * 取得新的群組id
   */
  getNewGroupId() {
    return this.newGroupId$;
  }

  /**
   * 依權限取得群組內所有群組後並儲存
   */
  setAllLevelGroupData(childGroupList: any) {
    this.allLevelGroupData$.next(childGroupList);
  }

  /**
   * 訂閱群組內所有群組資訊
   */
  getAllLevelGroupData() {
    return this.allLevelGroupData$;
  }

  /**
   * 取得訂閱的使用者在該群組的簡易資訊
   */
  getUserSimpleInfo() {
    return this.userSimpleInfo$;
  }

  /**
   * 儲存訂閱的使用者在該群組的簡易資訊
   * @param status {UserSimpleInfo}
   */
  saveUserSimpleInfo(status: UserSimpleInfo) {
    this.userSimpleInfo$.next(status);
  }

  /**
   * 取得群組是否進入編輯或建立群組的狀態
   */
  getRxEditMode() {
    return this.editMode$;
  }

  /**
   * 儲存是否進入編輯或建立群組的狀態
   * @param status {boolean}-是否進入編輯或建立群組的狀態
   */
  setEditMode(status: 'edit' | 'create' | 'complete' | 'close') {
    this.editMode$.next(status);
  }

  /**
   * 比較使用者所屬group是否和所在頁面相同或上層
   * @param userGroupId {string}-使用者所屬group id
   * @param currentGroupId {string}-頁面所在的group id
   * @param length {number}-要比較的id長度
   */
  isSameGroup(userGroupId: string, currentGroupId: string, length: number): boolean {
    switch (length) {
      case 3: // 品牌/企業
        return userGroupId === `${this.getPartGroupId(currentGroupId, length)}-0-0-0`;
      case 4: // 分店/分公司
        return (
          userGroupId === `${this.getPartGroupId(currentGroupId, length)}-0-0` ||
          userGroupId === `${this.getPartGroupId(currentGroupId, 3)}-0-0-0`
        );
      case 5: // 課程/部門
        return (
          userGroupId === `${this.getPartGroupId(currentGroupId, length)}-0` ||
          userGroupId === `${this.getPartGroupId(currentGroupId, 3)}-0-0-0` ||
          userGroupId === `${this.getPartGroupId(currentGroupId, 4)}-0-0`
        );
      default:
        return false;
    }
  }

  /**
   * 取得所需的群組id片段
   * @param id {string}-group id
   * @param leng (number)-欲取得的群組id片段數目
   */
  getPartGroupId(id: string, leng: number) {
    const arr = id.split('-');
    arr.length = leng;
    return arr.join('-');
  }

  /**
   * 取得完整的group id（補零）
   * @param idArr {Array<string>}
   */
  getCompleteGroupId(idArr: Array<string>) {
    const fillStart = idArr.length;
    idArr.length = 6;
    return idArr.fill('0', fillStart, 6).join('-');
  }

  /**
   * 取得模糊搜尋用group id
   * @param id {string}-group id
   */
  getBlurryGroupId(id: string) {
    const idArr = id.split('-').map((_id, _idx) => {
      if (_idx <= 1 || +_id !== 0) {
        return _id;
      } else {
        return '*';
      }
    });

    return idArr.join('-');
  }

  /**
   * 取得目前瀏覽的群組資訊
   */
  getCurrentGroupInfo() {
    return this.currentGroupInfo;
  }

  /**
   * 取得目前所有成員清單
   * @param groupId {string}-群組編號
   */
  getAllGroupMemberList(groupId: string) {
    // 確認先前所存之成員清單是否為此群組所屬，若非則重新取得成員清單
    if (groupId !== this.allGroupMemberList.belongGroupId) {
      const body = {
        avatarType: 3,
        groupId,
        groupLevel: GroupInfo.getGroupLevel(groupId),
        infoType: 5,
        token: this.authService.token,
      };

      return this.api11xxService.fetchGroupMemberList(body).pipe(
        map((res) => {
          if (!checkResponse(res)) {
            this.allGroupMemberList.clearMemberList();
          } else {
            const { groupMemberInfo } = res.info;
            this.allGroupMemberList.saveNewMemberList(groupId, groupMemberInfo);
          }

          return this.allGroupMemberList;
        })
      );
    } else {
      return of(this.allGroupMemberList);
    }
  }

  /**
   * 取得運動目標
   * @param groupDetail {GroupDetail}-群組詳細資訊
   */
  getSportsTarget(groupDetail: GroupDetail) {
    const { target, groupId } = groupDetail;
    if (target && Object.keys(target).length > 0) {
      const groupLevel = +displayGroupLevel(groupId);
      const { name } = target;
      if (!name || +name === groupLevel) {
        return new SportsTarget(target);
      } else {
        return new SportsTarget(this.getReferenceTarget(groupDetail, +name));
      }
    } else {
      return new SportsTarget({});
    }
  }

  /**
   * 取得繼承的運動目標
   * @param groupDetail {GroupDetail}-群組詳細資訊
   * @param reference {GroupLevel | string}-繼承目標的群組階層
   */
  getReferenceTarget(groupDetail: GroupDetail, reference: GroupLevel) {
    const referenceLevel = +reference as GroupLevel;
    const { groupRootInfo, target: currentTarget } = groupDetail;
    const [, , brandInfo, branchInfo] = groupRootInfo;

    // 若本身為課程群組且繼承分店的運動目標
    if (referenceLevel === GroupLevel.branch && branchInfo) {
      const { target } = branchInfo;
      // 若分店又繼承品牌的運動目標
      if (+target.name === GroupLevel.brand)
        return this.getReferenceTarget(groupDetail, GroupLevel.brand);
      return target;

      // 若本身為品牌以下的群組且繼承品牌的運動目標
    } else if (referenceLevel === GroupLevel.brand && brandInfo) {
      return brandInfo.target;
    } else {
      return currentTarget;
    }
  }
}
