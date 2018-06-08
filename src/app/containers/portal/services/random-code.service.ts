import { HttpClient } from '@angular/common/http';

import { Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';

const { API_SERVER } = environment.url;

@Injectable()
export class RandomCodeService {
  constructor(private http: HttpClient) {}

  getRandomCode() {
    return this.http.post('/api/v1/user/getrandomcode', {});
  }
}
