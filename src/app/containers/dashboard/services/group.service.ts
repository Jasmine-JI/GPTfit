import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';

import { Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';

const { API_SERVER } = environment.url;

@Injectable()
export class GroupService {

  groupInfo$ = new BehaviorSubject<any>({}); // 儲存group資訊-kidin-1081210
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

  constructor(private http: HttpClient) {}
  fetchGroupList(body) {
    return this.http.post<any>('/api/v1/center/getGroupList', body);
  }
  fetchGroupListDetail(body) {
    return this.http.post<any>('/api/v1/center/getGroupListDetail', body);
  }

  actionGroup(body) {
    return this.http.post<any>('/api/v1/center/actionGroup', body);
  }
  fetchGroupMemberList(body) {
    return this.http.post<any>('/api/v1/center/getGroupMemberList', body);
  }
  editGroup(body) {
    return this.http.post<any>('/api/v1/center/editGroup', body);
  }

  createGroup(body) {
    return this.http.post<any>('/api/v1/center/createGroup', body);
  }
  updateJoinStatus(body) {
    return this.http.post<any>('/api/v1/center/updateJoinStatus', body);
  }
  changeGroupStatus(body) {
    return this.http.post<any>('/api/v1/center/changeGroupStatus', body);
  }
  editGroupMember(body) {
    return this.http.post<any>('/api/v1/center/editGroupMember', body);
  }
  addGroupMember(body) {
    return this.http.post<any>('/api/v1/center/addGroupMember', body);
  }
  getGroupList() {
    return this.http.get<any>(API_SERVER + 'center/getGroupList');
  }
  searchMember(params) {
    return this.http.get<any>(API_SERVER + 'center/searchMember', { params });
  }
  getInnerAdmin() {
    return this.http.get<any>(API_SERVER + 'center/innerAdmin');
  }
  deleteGroupMember(body) {
    return this.http.post<any>('/api/v1/center/deleteGroupMember', body);
  }
  updateInnerAdmin(body) {
    return this.http.post<any>(API_SERVER + 'center/innerAdmin', body);
  }
  fetchCommerceInfo(body) {
    return this.http.post<any>('/api/v1/center/getCommerceInfo', body);
  }
  fetchUserAvartar(params) {
    return this.http.get<any>(API_SERVER + 'user/userAvartar', { params });
  }

  editGroupManage (body) {
    return this.http.post<any>('/api/v1/center/editCommerceInfo', body);
  }

  getImgUpdatedStatus (): Observable<string> {
    return this.updatedGroupImg$;
  }

  setImgUpdatedImgStatus (status: string) {
    this.updatedGroupImg$.next(status);
  }

  getMemberList (): Observable<any> {
    return this.memberList$;
  }

  setMemberList (status: any) {
    this.memberList$.next(status);
  }

  setReportCategory (status: string) {
    this.reportCategory$.next(status);
  }

  getreportCategory (): Observable<string> {
    return this.reportCategory$;
  }

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

  // 取得group資訊-kidin-1081210
  getGroupInfo () {
    return this.groupInfo$;
  }

  // 儲存group資訊-kidin-1081210
  saveGroupInfo (status: object) {
    this.groupInfo$.next(status);
  }
}
