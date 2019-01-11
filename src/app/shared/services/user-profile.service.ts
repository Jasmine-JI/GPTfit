import { HttpClient } from '@angular/common/http';

import { Injectable } from '@angular/core';
@Injectable()
export class UserProfileService {
  constructor(private http: HttpClient) {}

  getUserProfile(body) {
    return this.http.post<any>('/api/v1/user/getUserProfile',  body);
  }

}
