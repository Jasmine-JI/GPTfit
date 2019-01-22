import { HttpClient, HttpHeaders } from '@angular/common/http';

import { Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';

const { API_SERVER } = environment.url;

@Injectable()
export class GroupService {
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
}
