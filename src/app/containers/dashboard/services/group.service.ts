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
  fetchGroupMemberList(body) {
    return this.http.post<any>('/api/v1/center/getGroupMemberList', body);
  }
}
