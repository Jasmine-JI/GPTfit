import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, ReplaySubject, throwError } from 'rxjs';
import { map, switchMap, catchError } from 'rxjs/operators';
import { UtilsService } from '@shared/services/utils.service';
import { UserProfileService } from '../../../shared/services/user-profile.service'
import { Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { GroupIdSlicePipe } from '../../../shared/pipes/group-id-slice.pipe';
import { GroupDetailInfo, UserSimpleInfo } from '../models/group-detail';

const { API_SERVER } = environment.url;

/**
 * 串接群組相關api及資料處理和儲存
 * @export
 * @class GroupService
 * @author kidin-1090715
 */
@Injectable()
export class GroupService {
  sideBarMode$ = new ReplaySubject<any>(1); // sidebar展開與否
  userSimpleInfo$ = new ReplaySubject<UserSimpleInfo>(1); // 儲存使用者在該群組的簡易資訊（權限）-kidin-1091103
  groupInfo$ = new BehaviorSubject<any>({}); // 儲存group資訊-kidin-1081210
  allLevelGroupInfo$ = new ReplaySubject<any>(1); // 儲存 同"品牌/企業" group 資訊-kidin-1090604
  groupDetail$ = new ReplaySubject<any>(1);  // 儲存群組基本概要方便各子頁面使用-kidin-1091020
  allLevelGroupData$ = new ReplaySubject<any>(1); // 儲存 同"品牌/企業" group 資訊-kidin-1090716
  groupCommerceInfo$ = new ReplaySubject<any>(1); // 儲存群組經營權限資訊-kidin-1091104
  classMemberList$ = new ReplaySubject<any>(1); // 儲存課程成員清單-kidin-1091116
  comMemberList$ = new ReplaySubject<any>(1); // 儲存企業/分公司/部門群組成員清單-kidin-1091116
  updatedGroupImg$ = new BehaviorSubject<string>('');
  memberList$ = new BehaviorSubject<any>({
    groupId: '',
    groupList: []
  });

  reportCategory$ = new BehaviorSubject<string>('99');
  typeAllData$ = new BehaviorSubject<any>({});
  typeRunData$ = new BehaviorSubject<any>({});
  typeCycleData$ = new BehaviorSubject<any>({});
  typeWeightTrainData$ = new BehaviorSubject<any>({});
  typeSwimData$ = new BehaviorSubject<any>({});
  typeAerobicData$ = new BehaviorSubject<any>({});
  typeRowData$ = new BehaviorSubject<any>({});

  constructor(
    private http: HttpClient,
    private userProfileService: UserProfileService,
    private utils: UtilsService,
    private groupIdSlice: GroupIdSlicePipe
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
  editGroupManage (body: object) {
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
   * 確認使用者在該群組的權限
   * @param currentId {string}-所在頁面的群組ID
   * @author kidin-1090729
   */
  checkAccessRight(currentId: string): Observable<any> {
    return this.userProfileService.getRxUserProfile().pipe(
      map(res => {
        const accessRightSet = new Set(),
              currentGroupAccessRight: number[] = res['systemAccessRight'].filter(_accessRight => _accessRight < 30),
              groupLevel = +this.utils.displayGroupLevel(currentId),
              accessRightList = res['groupAccessRightList'];

        switch (groupLevel) {
          case 30:
            accessRightList.forEach(_list => {
              if (this.isSameGroup(_list.groupId, currentId , 3)) {
                accessRightSet.add(+_list.accessRight);
              }

            });
            break;
          case 40:
            accessRightList.forEach(_list => {
              if (this.isSameGroup(_list.groupId, currentId , 4)) {
                accessRightSet.add(+_list.accessRight);
              }

            });
            break;
          case 50:
          case 60:
            accessRightList.forEach(_list => {
              if (this.isSameGroup(_list.groupId, currentId , 5)) {
                accessRightSet.add(+_list.accessRight);
              }

            });
            break;
        }

        const accessRightArr = Array.from(accessRightSet);
        return currentGroupAccessRight.concat(accessRightArr as number[]).sort((a, b) => a - b);
      })

    );

  }

  /**
   * 取得訂閱的群組圖片編輯時間（待圖床完成後移除）
   * @author kidin-1090715
   */
  getImgUpdatedStatus (): Observable<string> {
    return this.updatedGroupImg$;
  }

  /**
   * 儲存訂閱的群組圖片編輯時間（待圖床完成後移除）
   * @param status {string}
   * @author kidin-1090715
   */
  setImgUpdatedImgStatus (status: string) {
    this.updatedGroupImg$.next(status);
  }

  /**
   * 取得訂閱的群組列表
   * @author kidin-1090715
   */
  getMemberList (): Observable<any> {
    return this.memberList$;
  }

  /**
   * 儲存訂閱的群組列表
   * @param status {any}
   * @author kidin-1090715
   */
  setMemberList (status: any) {
    this.memberList$.next(status);
  }

  /**
   * 儲存訂閱的運動報告類別
   * @param status {string}}
   * @author kidin-1090715
   */
  setReportCategory (status: string) {
    this.reportCategory$.next(status);
  }

  /**
   * 取得訂閱的運動報告類別
   * @author kidin-1090715
   */
  getreportCategory (): Observable<string> {
    return this.reportCategory$;
  }

  /**
   * 取得課程一般成員名單
   * @author kidin-1091116
   */
  getClassMemberList() {
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
   * 取得企業/分公司/部門群組的成員名單（含管理員）
   * @author kidin-1091116
   */
  getcomMemberList() {
    return this.comMemberList$;
  }

  /**
   * 儲存企業/分公司/部門群組的成員名單（含管理員）
   * @param list {Array<any>}
   * @author kidin-1091116
   */
  setcomMemberList(list: Array<any>) {
    this.comMemberList$.next(list);
  }

  /**
   * 儲存訂閱的不同類別運動資料
   * @param dataAll {object}
   * @param dataRun {object}
   * @param dataCycle {object}
   * @param dataWeightTrain {object}
   * @param dataSwim {object}
   * @param dataAerobic {object}
   * @param dataRow {object}
   * @author kidin-1090715
   */
  setTypeAllData (
    dataAll: Object,
    dataRun: Object,
    dataCycle: Object,
    dataWeightTrain: Object,
    dataSwim: Object,
    dataAerobic: Object,
    dataRow: Object
  ) {
    this.typeAllData$.next(dataAll);
    this.typeRunData$.next(dataRun);
    this.typeCycleData$.next(dataCycle);
    this.typeWeightTrainData$.next(dataWeightTrain);
    this.typeSwimData$.next(dataSwim);
    this.typeAerobicData$.next(dataAerobic);
    this.typeRowData$.next(dataRow);
  }

  /**
   * 取得指定類別的運動資料
   * @param type {string}
   * @author kidin-1090715
   */
  getTypeData (type: string) {
    switch (type) {
      case '1':
        return this.typeRunData$;
      case '2':
        return this.typeCycleData$;
      case '3':
        return this.typeWeightTrainData$;
      case '4':
        return this.typeSwimData$;
      case '5':
        return this.typeAerobicData$;
      case '6':
        return this.typeRowData$;
      default:
        return this.typeAllData$;
    }
  }

  /**
   * 取得訂閱的group資訊
   * @author kidin-1081210
   */
  getGroupInfo () {
    return this.groupInfo$;
  }

  /**
   * 儲存group資訊
   * @param status {object}
   * @author kidin-1081210
   */
  saveGroupInfo (status: object) {
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
   * 1103-依權限取得群組內所有群組後並儲存
   * @author kidin-1090716
   */
  saveAllLevelGroupData(
    token: string,
    groupId: string,
    groupLevel: number
  ) {
    const body = {
      token,
      groupId,
      groupLevel,
      infoType: 1,
      avatarType: 3
    };

    this.fetchGroupMemberList(body).pipe(
      catchError(err => throwError(err)),
      map(data => {
        if (data.resultCode === 200) {
          Object.assign(data.info.subGroupInfo, {groupId: groupId});
          return data;
        } else {
          const newData = {
            info: {
              subGroupInfo: null
            }

          };
          return newData;
        }
        
      })
    ).subscribe(res => {
      this.allLevelGroupData$.next(res.info.subGroupInfo);
    });

  }

  /**
   * 訂閱群組內所有群組資訊
   * @author kidin-1090716
   */
  getAllLevelGroupData() {
    return this.allLevelGroupData$;
  }

  /**
   * 取得訂閱的group資訊
   * @author kidin-1081210
   */
  getAllLevelGroupInfo() {
    return this.allLevelGroupInfo$;
  }

  /**
   * 儲存訂閱的group資訊
   * @param status {any}
   * @author kidin-1081210
   */
  saveAllLevelGroupInfo(status: any) {
    this.allLevelGroupInfo$.next(status);
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
   * 取得sidebar 模式供子頁面用
   * @author kidin-1091111
   */
  getRxSideBarMode() {
    return this.sideBarMode$;
  }

  /**
   * 儲存sidebar 模式供子頁面用
   * @param status {'expand' | 'hide' | 'narrow'}-sidebar 模式
   * @author kidin-1091111
   */
  setSideBarMode(status: 'expand' | 'hide' | 'narrow') {
    this.sideBarMode$.next(status);
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
        return userGroupId === `${this.groupIdSlice.transform(currentGroupId, length)}-0-0-0`;
      case 4: // 分店/分公司
        return (
          userGroupId === `${this.groupIdSlice.transform(currentGroupId, length)}-0-0`
          || userGroupId === `${this.groupIdSlice.transform(currentGroupId, 3)}-0-0-0`
        );
      case 5: // 課程/部門
        return (
          userGroupId === `${this.groupIdSlice.transform(currentGroupId, length)}-0`
          || userGroupId === `${this.groupIdSlice.transform(currentGroupId, 3)}-0-0-0`
          || userGroupId === `${this.groupIdSlice.transform(currentGroupId, 4)}-0-0`
        );
    }

  }

}
