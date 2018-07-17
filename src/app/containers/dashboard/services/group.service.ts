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
  editGroupMember(body) {
    return this.http.post<any>('/api/v1/center/editGroupMember', body);
  }
}
