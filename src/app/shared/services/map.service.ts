import { HttpClient } from '@angular/common/http';

import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

const { API_SERVER } = environment.url;

@Injectable()
export class MapService {
  constructor(private http: HttpClient) {}
  getMapUrls() {
    return this.http.get(API_SERVER + 'map/mapUrl');
  }
}
