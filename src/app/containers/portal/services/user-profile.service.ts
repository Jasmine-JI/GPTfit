import { HttpClient } from '@angular/common/http';

import { Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';

const { API_SERVER } = environment.url;

@Injectable()
export class UserProfileService {
  constructor(private http: HttpClient) {}

  getUserProfile(params) {
    return this.http.get(API_SERVER + 'user/userProfile', { params });
  }
}
