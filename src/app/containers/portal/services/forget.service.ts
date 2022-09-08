import { HttpClient } from '@angular/common/http';

import { Injectable } from '@angular/core';

@Injectable()
export class ForgetService {
  constructor(private http: HttpClient) {}

  forgetPWD(body) {
    return this.http.post('/api/v1/user/forgetPWD', body);
  }
}
