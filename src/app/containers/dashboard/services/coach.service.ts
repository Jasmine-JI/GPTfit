import { HttpClient } from '@angular/common/http';

import { Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';

const { API_SERVER } = environment.url;

@Injectable()
export class CoachService {
  constructor(private http: HttpClient) {}
  fetchClassRoomList(body) {
    return this.http.post<any>('/api/v1/train/getClassRoomList', body);
  }
  fetchExample(body) {
    return this.http.post<any>(API_SERVER + 'coach/example', body);
  }
  fetchFileName(params) {
    return this.http.get<any>(API_SERVER + 'coach/fileName', { params });
  }
  postFakeData(body) {
    return this.http.post<any>(API_SERVER + 'coach/fakeData', body);
  }
  fetchRaceList(body) {
    return this.http.post<any>('/api/v1/race/getRaceList', body);
  }
  fetchRealTimeData(params) {
    return this.http.get<any>(API_SERVER + 'coach/realTimeData', { params });
  }
  fetchFitPairInfo(body) {
    return this.http.post<any>('/api/v1/device/getFitPairInfo', body);
  }
  postRaceTest(body) {
    return this.http.post<any>('/race_test', body);
  }
}
