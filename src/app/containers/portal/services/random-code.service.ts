import { HttpClient } from '@angular/common/http';

import { Injectable } from '@angular/core';

@Injectable()
export class RandomCodeService {
  constructor(private http: HttpClient) {}

  getRandomCode() {
    return this.http.post('/api/v1/user/getrandomcode', {});
  }
}
