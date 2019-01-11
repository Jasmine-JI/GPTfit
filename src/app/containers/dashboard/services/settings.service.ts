import { HttpClient } from '@angular/common/http';

import { Injectable } from '@angular/core';


@Injectable()
export class SettingsService {
  constructor(private http: HttpClient) {}
  updateUserProfile(body) {
    return this.http.post<any>('/api/v1/user/updateUserProfile', body);
  }
  updateThirdParty(body) {
    return this.http.post<any>('/api/v1/user/thirdPartyAccess', body);
  }
}
