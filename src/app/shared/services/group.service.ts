import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, ReplaySubject, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { UtilsService } from './utils.service';
import { UserService } from '../../core/services/user.service';
import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { GroupDetailInfo, UserSimpleInfo } from '../../containers/dashboard/models/group-detail';
import { GroupInfo } from '../classes/group-info';
import { AllGroupMember } from '../classes/all-group-member';
import { checkResponse } from '../utils/index';
import { AuthService } from '../../core/services/auth.service';
import { Api11xxService } from '../../core/services/api-11xx.service';

const { API_SERVER } = environment.url;

/**
 * 串接群組相關api及資料處理和儲存
 * @export
 * @class GroupService
 * @author kidin-1090715
 */
@Injectable()
export class GroupService {
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

  constructor(
    private http: HttpClient,
    private userService: UserService,
    private utils: UtilsService,
    private authService: AuthService,
    private api11xxService: Api11xxService
  ) {}

  /**
   * 1101-取得群組列表
   * @param body {object}
   * @method post
   * @author kidin-1090715
   */
  fetchGroupList(body: object) {
    return this.http.post<any>('/api/v1/center/getGroupList', body);
  }

  /**
   * 1102-依權限取得群組詳細資料
   * @param body {object}
   * @method post
   * @author kidin-1090715
   */
  fetchGroupListDetail(body: object) {
    return this.http.post<any>('/api/v1/center/getGroupListDetail', body);
  }

  /**
   * 1104-會員加入或退出群組
   * @param body {object}
   * @method post
   * @author kidin-1090715
   */
  actionGroup(body: object) {
    return this.http.post<any>('/api/v1/center/actionGroup', body);
  }

  /**
   * 1103-依權限取得群組內所有成員
   * @param body {object}
   * @method post
   * @author kidin-1090715
   */
  fetchGroupMemberList(body: object) {
    return this.http.post<any>('/api/v1/center/getGroupMemberList', body);
  }

  /**
   * 1105-依權限編輯群組資料
   * @param body {object}
   * @method post
   * @author kidin-1090715
   */
  editGroup(body: object) {
    return this.http.post<any>('/api/v1/center/editGroup', body);
  }

  /**
   * 1109-依權限建立新群組
   * @param body {object}
   * @method post
   * @author kidin-1090715
   */
  createGroup(body: object) {
    return this.http.post<any>('/api/v1/center/createGroup', body);
  }

  /**
   * 1110-更新加入群組狀態
   * @param body {object}
   * @method post
   * @author kidin-1090715
   */
  updateJoinStatus(body: object) {
    return this.http.post<any>('/api/v1/center/updateJoinStatus', body);
  }

  /**
   * 1107-依權限變更群組狀態
   * @param body {object}
   * @method post
   * @author kidin-1090715
   */
  changeGroupStatus(body: object) {
    return this.http.post<any>('/api/v1/center/changeGroupStatus', body);
  }

  /**
   * 1106-依權限編輯群組內會員權限
   * @param body {object}
   * @method post
   * @author kidin-1090715
   */
  editGroupMember(body: object) {
    return this.http.post<any>('/api/v1/center/editGroupMember', body);
  }

  /**
   * 1108-依權限新增群組會員
   * @param body {object}
   * @method post
   * @author kidin-1090715
   */
  addGroupMember(body: object) {
    return this.http.post<any>('/api/v1/center/addGroupMember', body);
  }

  /**
   * nodejs middleware-取得群組清單
   * @method get
   * @author kidin-1090715
   */
  getGroupList() {
    return this.http.get<any>(API_SERVER + 'center/getGroupList');
  }

  /**
   * nodejs middleware-取得群組清單
   * @method post
   * @author kidin-1090715
   */
  searchGroup(body: any) {
    return this.http.post<any>(API_SERVER + 'group/searchGroup', body);
  }

  /**
   * nodejs middleware
   * @method get
   * @author kidin-1090715
   */
  searchMember(params) {
    return this.http.get<any>(API_SERVER + 'center/searchMember', { params });
  }

  /**
   * nodejs middleware
   * @method get
   * @author kidin-1090715
   */
  getInnerAdmin() {
    return this.http.get<any>(API_SERVER + 'center/innerAdmin');
  }

  /**
   * 1114-刪除群組內指定成員
   * @param body {object}
   * @method post
   * @author kidin-1090715
   */
  deleteGroupMember(body: object) {
    return this.http.post<any>('/api/v1/center/deleteGroupMember', body);
  }

  /**
   * nodejs middleware
   * @method post
   * @author kidin-1090715
   */
  updateInnerAdmin(body: object) {
    return this.http.post<any>(API_SERVER + 'center/innerAdmin', body);
  }

  /**
   * 1115-取得經營權限管理資訊
   * @param body {object}
   * @method post
   * @author kidin-1090715
   */
  fetchCommerceInfo(body: object) {
    return this.http.post<any>('/api/v1/center/getCommerceInfo', body);
  }

  /**
   * nodejs middleware
   * @param params
   * @method post
   * @author kidin-1090715
   */
  fetchUserAvartar(body: object) {
    return this.http.post<any>(API_SERVER + 'user/userAvartar', body);
  }

  /**
   * 1116-編輯經營權限管理資訊
   * @param body {object}
   * @method post
   * @author kidin-1090715
   */
  editGroupManage(body: object) {
    return this.http.post<any>('/api/v1/center/editCommerceInfo', body);
  }

  /**
   * 使用nodejs取得群組名稱列表
   * @param body
   * @method post
   * @author kidin-1090923
   */
  getGroupNameList(body: object) {
    return this.http.post<any>(API_SERVER + 'group/getGroupNameList', body);
  }

  /**
   * 取得訂閱的成員列表
   * @author kidin-1090715
   */
  getMemList(): Observable<any> {
    return this.memList$;
  }

  /**
   * 儲存訂閱的成員列表
   * @param status {any}
   * @author kidin-1090715
   */
  setMemList(status: any) {
    this.memList$.next(status);
  }

  /**
   * 取得課程一般成員名單
   * @author kidin-1091116
   */
  getRXClassMemberList() {
    return this.classMemberList$;
  }

  /**
   * 儲存課程一般成員名單
   * @param list {Array<any>}
   * @author kidin-1091116
   */
  setClassMemberList(list: Array<any>) {
    this.classMemberList$.next(list);
  }

  /**
   * 取得管理員名單
   * @author kidin-1091116
   */
  getRXAdminList() {
    return this.adminList$;
  }

  /**
   * 儲存管理員名單
   * @param list {Array<any>}
   * @author kidin-1091116
   */
  setAdminList(list: Array<any>) {
    this.adminList$.next(list);
  }

  /**
   * 取得一般成員名單
   * @author kidin-1091116
   */
  getRXNormalMemberList() {
    return this.normalMemberList$;
  }

  /**
   * 儲存一般成員名單
   * @param list {Array<any>}
   * @author kidin-1091116
   */
  setNormalMemberList(list: Array<any>) {
    this.normalMemberList$.next(list);
  }

  /**
   * 取得訂閱的group資訊
   * @author kidin-1081210
   */
  getGroupInfo() {
    return this.groupInfo$;
  }

  /**
   * 儲存group資訊
   * @param status {object}
   * @author kidin-1081210
   */
  saveGroupInfo(status: object) {
    this.groupInfo$.next(status);
  }

  /**
   * 儲存群組概要資訊
   * @param Detail {GroupDetailInfo}-api 1102回傳內容
   * @author kidin-1091020
   */
  saveGroupDetail(detail: GroupDetailInfo) {
    this.groupDetail$.next(detail);
  }

  /**
   * 取得群組概要資訊
   * @author kidin-1091020
   */
  getRxGroupDetail() {
    return this.groupDetail$;
  }

  /**
   * 儲存群組概要資訊
   * @param Detail {any}-api 1102回傳內容
   * @author kidin-1091020
   */
  saveCommerceInfo(commerceInfo: any) {
    this.groupCommerceInfo$.next(commerceInfo);
  }

  /**
   * 取得群組概要資訊
   * @author kidin-1091020
   */
  getRxCommerceInfo() {
    return this.groupCommerceInfo$;
  }

  /**
   * 儲存新的群組id
   * @param Detail {string}-新的group id
   * @author kidin-1091020
   */
  saveNewGroupId(id: string) {
    this.newGroupId$.next(id);
  }

  /**
   * 取得新的群組id
   * @author kidin-1091020
   */
  getNewGroupId() {
    return this.newGroupId$;
  }

  /**
   * 依權限取得群組內所有群組後並儲存
   * @author kidin-1090716
   */
  setAllLevelGroupData(childGroupList: any) {
    this.allLevelGroupData$.next(childGroupList);
  }

  /**
   * 訂閱群組內所有群組資訊
   * @author kidin-1090716
   */
  getAllLevelGroupData() {
    return this.allLevelGroupData$;
  }

  /**
   * 取得訂閱的使用者在該群組的簡易資訊
   * @author kidin-1081210
   */
  getUserSimpleInfo() {
    return this.userSimpleInfo$;
  }

  /**
   * 儲存訂閱的使用者在該群組的簡易資訊
   * @param status {UserSimpleInfo}
   * @author kidin-1081210
   */
  saveUserSimpleInfo(status: UserSimpleInfo) {
    this.userSimpleInfo$.next(status);
  }

  /**
   * 取得群組是否進入編輯或建立群組的狀態
   * @author kidin-1091123
   */
  getRxEditMode() {
    return this.editMode$;
  }

  /**
   * 儲存是否進入編輯或建立群組的狀態
   * @param status {boolean}-是否進入編輯或建立群組的狀態
   * @author kidin-1091123
   */
  setEditMode(status: 'edit' | 'create' | 'complete' | 'close') {
    this.editMode$.next(status);
  }

  /**
   * 比較使用者所屬group是否和所在頁面相同或上層
   * @param userGroupId {string}-使用者所屬group id
   * @param currentGroupId {string}-頁面所在的group id
   * @param length {number}-要比較的id長度
   * @author kidin-1090728
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
    }
  }

  /**
   * 取得所需的群組id片段
   * @param id {string}-group id
   * @param leng (number)-欲取得的群組id片段數目
   * @author kidin-1100308
   */
  getPartGroupId(id: string, leng: number) {
    const arr = id.split('-');
    arr.length = leng;
    return arr.join('-');
  }

  /**
   * 取得完整的group id（補零）
   * @param idArr {Array<string>}
   * @author kidin-1100525
   */
  getCompleteGroupId(idArr: Array<string>) {
    const fillStart = idArr.length;
    idArr.length = 6;
    return idArr.fill('0', fillStart, 6).join('-');
  }

  /**
   * 取得模糊搜尋用group id
   * @param id {string}-group id
   * @author kidin-1100803
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
   * @author kidin-1110314
   */
  getCurrentGroupInfo() {
    return this.currentGroupInfo;
  }

  /**
   * 取得目前所有成員清單
   * @param groupId {string}-群組編號
   * @author kidin-1110317
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

      return this.fetchGroupMemberList(body).pipe(
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
}
