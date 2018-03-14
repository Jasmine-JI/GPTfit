import { HttpClient, HttpHeaders } from '@angular/common/http';

import { Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';

const { API_SERVER } = environment.url;

@Injectable()
export class CoachService {
  constructor(private http: HttpClient) {}
  fetchExample(body) {
    return this.http.post<any>(API_SERVER + 'coach/example', body);
  }
  fetchFileName(body) {
    return this.http.post<any>(API_SERVER + 'coach/fileName', body);
  }
  postFakeData(body) {
    return this.http.post<any>(API_SERVER + 'coach/fakeData', body);
  }
}
