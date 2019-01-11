import { HttpClient, HttpHeaders } from '@angular/common/http';

import { Injectable } from '@angular/core';


@Injectable()
export class ReportService {
  constructor(private http: HttpClient) {}
  fetchSportSummaryArray(body) {
    return this.http.post<any>('/api/v2/sport/getSportSummaryArray', body);
  }
}
